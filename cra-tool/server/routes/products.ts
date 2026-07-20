import express from 'express';
import auth from '../middleware/auth';
import Product from '../models/Product';
import Requirement from '../models/Requirement';
import ComplianceItem from '../models/ComplianceItem';
import ComplianceActivity from '../models/ComplianceActivity';
import { logComplianceActivity } from '../services/activityLog';

const router = express.Router();

// Recent compliance activity across the whole team — feeds the CRA dashboard
// so everyone sees who changed what. Registered before '/:id' so "activity"
// is never parsed as a product id.
router.get('/activity/feed', auth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 12, 50);
    const activity = await ComplianceActivity.find().sort({ createdAt: -1 }).limit(limit).lean();
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Products & their compliance data are shared across the whole team — the
// seven regional officers all see and maintain the same product registry.
// `userId` is retained on each product as a "created by" record, but is not
// used to scope access.
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      modelNumber,
      firmwareVersion,
      hasNetworkInterface,
      hasRemoteAccess,
      soldInEU,
      craClass,
      classificationReason,
      supportPeriodYears,
    } = req.body;

    const product = await Product.create({
      userId: req.user.userId,
      name,
      modelNumber,
      firmwareVersion,
      hasNetworkInterface,
      hasRemoteAccess,
      soldInEU,
      craClass: craClass || 'default',
      classificationReason,
      supportPeriodYears: supportPeriodYears || 5,
    });

    const requirements = await Requirement.find({});
    const complianceItems = requirements.map((req) => ({
      productId: product._id,
      requirementId: req._id,
      status: 'not_started',
      notes: '',
      evidenceDescription: '',
    }));

    await ComplianceItem.insertMany(complianceItems);

    await logComplianceActivity(req.user.userId, {
      productId: product._id, productName: product.name,
      action: 'Registered product',
      detail: [product.modelNumber, product.firmwareVersion].filter(Boolean).join(' · ') || undefined,
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const EDITABLE = [
      'name', 'modelNumber', 'firmwareVersion',
      'hasNetworkInterface', 'hasRemoteAccess', 'soldInEU',
      'craClass', 'classificationReason', 'supportPeriodYears',
    ];
    const changed: string[] = [];
    for (const key of EDITABLE) {
      if (req.body[key] !== undefined && req.body[key] !== (product as any)[key]) {
        changed.push(key);
        (product as any)[key] = req.body[key];
      }
    }

    await product.save();

    if (changed.length) {
      await logComplianceActivity(req.user.userId, {
        productId: product._id, productName: product.name,
        action: 'Edited product details',
        detail: `Updated ${changed.join(', ')}`,
      });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await ComplianceItem.deleteMany({ productId: product._id });
    await Product.deleteOne({ _id: product._id });

    await logComplianceActivity(req.user.userId, {
      productId: product._id, productName: product.name,
      action: 'Deleted product',
    });

    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
