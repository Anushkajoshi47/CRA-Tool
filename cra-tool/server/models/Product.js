const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  modelNumber: { type: String, required: true, trim: true },
  firmwareVersion: { type: String, trim: true },
  hasNetworkInterface: { type: Boolean, default: false },
  hasRemoteAccess: { type: Boolean, default: false },
  soldInEU: { type: Boolean, default: true },
  craClass: { type: String, default: 'default' },
  classificationReason: { type: String },
  supportPeriodYears: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);
