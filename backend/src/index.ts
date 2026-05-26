import { initDatabase } from './db';
import app from './server';

const PORT = process.env.PORT || 3001;

async function start() {
  await initDatabase();
  console.log('[DB] Database initialized at', new Date().toISOString());
  app.listen(PORT, () => {
    console.log(`[API] DockMaster Pro running at http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
