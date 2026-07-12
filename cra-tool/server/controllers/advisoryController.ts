import Advisory from '../models/Advisory';

export const list = async (req, res) => {
  try {
    const filter = req.query.ticketId ? { ticketId: req.query.ticketId } : {};
    const advisories = await Advisory.find(filter).sort({ createdAt: -1 });
    res.json(advisories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const get = async (req, res) => {
  try {
    const advisory = await Advisory.findById(req.params.id);
    if (!advisory) return res.status(404).json({ message: 'Advisory not found' });
    res.json(advisory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const advisory = new Advisory(req.body);
    await advisory.save();
    res.status(201).json(advisory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const { updatedAt, ...allowed } = req.body;
    allowed.updatedAt = new Date();
    const advisory = await Advisory.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true });
    if (!advisory) return res.status(404).json({ message: 'Advisory not found' });
    res.json(advisory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
