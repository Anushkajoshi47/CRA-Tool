import 'dotenv/config';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import requirementRoutes from './routes/requirements';
import ticketRoutes from './routes/tickets';
import reportRoutes from './routes/reports';
import advisoryRoutes from './routes/advisories';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/vm/tickets',    ticketRoutes);
app.use('/api/vm/reports',    reportRoutes);
app.use('/api/vm/advisories', advisoryRoutes);

app.get('/', (req, res) => res.json({ message: 'CRA Comply API running' }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
