import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import './db.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import activityRoutes from './routes/activities.js';
import industryRoutes from './routes/industry.js';
import blueprintRoutes from './routes/blueprints.js';
import planetRoutes from './routes/planets.js';
import dashboardRoutes from './routes/dashboard.js';
import syncRoutes from './routes/sync.js';
import { startSyncScheduler } from './jobs/syncScheduler.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/industry', industryRoutes);
app.use('/api/blueprints', blueprintRoutes);
app.use('/api/planets', planetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sync', syncRoutes);

app.listen(port, () => {
  console.log(`eve-tracker backend listening on http://localhost:${port}`);
  startSyncScheduler();
});
