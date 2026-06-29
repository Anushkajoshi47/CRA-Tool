const express = require('express');
const auth = require('../middleware/auth');
const Requirement = require('../models/Requirement');
const ComplianceItem = require('../models/ComplianceItem');
const Product = require('../models/Product');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const requirements = await Requirement.find({}).sort({ sortOrder: 1 });
    res.json(requirements);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:productId', auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.productId, userId: req.user.userId });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const allReqs = await Requirement.find({}).sort({ sortOrder: 1 }).lean();

    // Auto-backfill missing compliance items
    const existingItems = await ComplianceItem.find({ productId: product._id }).lean();
    const existingReqIds = new Set(existingItems.map(i => i.requirementId.toString()));
    const missing = allReqs.filter(r => !existingReqIds.has(r._id.toString()));
    if (missing.length > 0) {
      await ComplianceItem.insertMany(missing.map(r => ({
        productId: product._id, requirementId: r._id,
        status: 'not_started', notes: '', evidenceDescription: '',
      })));
    }

    const items = await ComplianceItem.find({ productId: product._id }).lean();
    const statusMap = {};
    items.forEach(i => { statusMap[i.requirementId.toString()] = i; });

    // Return flat objects: requirement fields + compliance status fields
    const result = allReqs.map(r => {
      const ci = statusMap[r._id.toString()] || {};
      return {
        itemId:              ci._id,
        reqId:               r._id,
        title:               r.title,
        articleRef:          r.articleRef,
        pillar:              r.pillar,
        plainEnglish:        r.plainEnglish,
        legalText:           r.legalText,
        urgent:              r.urgent,
        evidenceRequired:    r.evidenceRequired,
        sortOrder:           r.sortOrder,
        status:              ci.status  || 'not_started',
        notes:               ci.notes   || '',
        evidenceDescription: ci.evidenceDescription || '',
        updatedAt:           ci.updatedAt,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.patch('/item/:itemId', auth, async (req, res) => {
  try {
    const { status, notes, evidenceDescription } = req.body;

    const item = await ComplianceItem.findById(req.params.itemId).populate('productId');
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (item.productId.userId.toString() !== req.user.userId)
      return res.status(403).json({ message: 'Forbidden' });

    if (status !== undefined) item.status = status;
    if (notes !== undefined) item.notes = notes;
    if (evidenceDescription !== undefined) item.evidenceDescription = evidenceDescription;
    item.updatedAt = new Date();

    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
