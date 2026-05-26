import { Router } from 'express';
import { dbAll, dbGet, dbRun } from '../db';

const router = Router();

function genId(p: string) { return `${p}${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }

function fmtCustomer(r: Record<string, unknown>) {
  return { id: r.id, name: r.name, phone: r.phone ?? null, email: r.email ?? null, address: r.address, lat: r.lat ?? null, lng: r.lng ?? null, notes: r.notes ?? null, createdAt: r.created_at };
}
function fmtDock(r: Record<string, unknown>) {
  return { id: r.id, customerId: r.customer_id, material: r.material, length: r.length ?? null, width: r.width ?? null, boatLiftSize: r.boat_lift_size ?? null, boatLiftPosition: r.boat_lift_position ?? null, specialNotes: r.special_notes ?? null, googleMapsUrl: r.google_maps_url ?? null, createdAt: r.created_at };
}
function fmtJob(r: Record<string, unknown>) {
  return { id: r.id, customerId: r.customer_id, dockId: r.dock_id ?? null, type: r.type, scheduledDate: r.scheduled_date, crew: r.crew ?? null, notes: r.notes ?? null, waterwayAccess: r.waterway_access ?? null, previousYearNotes: r.previous_year_notes ?? null, status: r.status, priority: r.priority ?? 'normal', createdAt: r.created_at, completedAt: r.completed_at ?? null };
}

// GET /api/customers
router.get('/', async (req, res) => {
  try {
    const search = req.query.search as string;
    const params: Record<string, unknown> = {};
    let sql = 'SELECT * FROM customers';
    if (search?.trim()) {
      sql += ' WHERE name LIKE $s OR address LIKE $s OR phone LIKE $s';
      params.$s = `%${search.trim()}%`;
    }
    sql += ' ORDER BY name';
    const rows = await dbAll<Record<string, unknown>>(sql, params);
    res.json(rows.map(fmtCustomer));
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const c = await dbGet<Record<string, unknown>>('SELECT * FROM customers WHERE id = $id', { $id: req.params.id });
    if (!c) { res.status(404).json({ error: 'Not found' }); return; }
    const docks = await dbAll<Record<string, unknown>>('SELECT * FROM docks WHERE customer_id = $id ORDER BY created_at DESC', { $id: req.params.id });
    const jobs = await dbAll<Record<string, unknown>>('SELECT * FROM jobs WHERE customer_id = $id ORDER BY scheduled_date DESC', { $id: req.params.id });
    res.json({ ...fmtCustomer(c), docks: docks.map(fmtDock), jobs: jobs.map(fmtJob) });
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

// POST /api/customers
router.post('/', async (req, res) => {
  try {
    const { name, address, phone, email, lat, lng, notes } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: 'Name required' }); return; }
    if (!address?.trim()) { res.status(400).json({ error: 'Address required' }); return; }
    const id = genId('cust_');
    await dbRun('INSERT INTO customers (id,name,phone,email,address,lat,lng,notes,created_at) VALUES ($id,$name,$phone,$email,$address,$lat,$lng,$notes,$ca)', {
      $id: id, $name: name.trim(), $phone: phone || null, $email: email || null, $address: address.trim(), $lat: lat || null, $lng: lng || null, $notes: notes || null, $ca: Date.now()
    });
    const row = await dbGet<Record<string, unknown>>('SELECT * FROM customers WHERE id = $id', { $id: id });
    res.status(201).json(fmtCustomer(row!));
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

// PUT /api/customers/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, address, phone, email, lat, lng, notes } = req.body;
    const existing = await dbGet<Record<string, unknown>>('SELECT * FROM customers WHERE id = $id', { $id: req.params.id });
    if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
    await dbRun('UPDATE customers SET name = COALESCE($name,name), address = COALESCE($address,address), phone = $phone, email = $email, lat = $lat, lng = $lng, notes = $notes WHERE id = $id', {
      $id: req.params.id, $name: name || null, $address: address || null, $phone: phone !== undefined ? phone : existing.phone, $email: email !== undefined ? email : existing.email, $lat: lat !== undefined ? lat : existing.lat, $lng: lng !== undefined ? lng : existing.lng, $notes: notes !== undefined ? notes : existing.notes
    });
    const row = await dbGet<Record<string, unknown>>('SELECT * FROM customers WHERE id = $id', { $id: req.params.id });
    res.json(fmtCustomer(row!));
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM customers WHERE id = $id', { $id: req.params.id });
    if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

export default router;
