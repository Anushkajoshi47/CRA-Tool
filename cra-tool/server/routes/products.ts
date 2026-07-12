import express from 'express';
import auth from '../middleware/auth';
import Product from '../models/Product';
import Requirement from '../models/Requirement';
import ComplianceItem from '../models/ComplianceItem';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user.userId });
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

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const EDITABLE = [
      'name', 'modelNumber', 'firmwareVersion',
      'hasNetworkInterface', 'hasRemoteAccess', 'soldInEU',
      'craClass', 'classificationReason', 'supportPeriodYears',
    ];
    for (const key of EDITABLE) {
      if (req.body[key] !== undefined) (product as any)[key] = req.body[key];
    }

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await ComplianceItem.deleteMany({ productId: product._id });
    await Product.deleteOne({ _id: product._id });

    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
