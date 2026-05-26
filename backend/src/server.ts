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

// Geocoding proxy endpoint
app.get('/api/geocode', async (req, res) => {
  const address = req.query.address as string;
  if (!address) {
    return res.status(400).json({ error: 'Address required' });
  }
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'DockMasterPro/2.0 (dockmaster@example.com)'
        }
      }
    );
    
    if (!response.ok) {
      return res.status(502).json({ error: 'Geocoding service error' });
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    const result = data[0];
    res.json({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Geocoding failed' });
  }
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
