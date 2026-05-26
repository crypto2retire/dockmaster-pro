import express from 'express';
import cors from 'cors';
import path from 'path';
import customerRoutes from './routes/customers';
import dockRoutes from './routes/docks';
import jobRoutes from './routes/jobs';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/customers', customerRoutes);
app.use('/api/docks', dockRoutes);
app.use('/api/jobs', jobRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: 'connected' });
});

// Serve static frontend from frontend/dist/
const staticPath = path.resolve(process.cwd(), 'frontend', 'dist');
app.use(express.static(staticPath));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
