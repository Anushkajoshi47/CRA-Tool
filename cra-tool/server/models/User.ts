import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, trim: true, default: '' },
  orgName: { type: String, trim: true, default: '' },   // shown under the logo in the sidebars
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);
