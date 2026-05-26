import { Router } from 'express';
import { dbAll, dbGet, dbRun } from '../db';

const router = Router();

function genId(p: string) { return `${p}${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }

function fmtJob(r: Record<string, unknown>) {
  return { id: r.id, customerId: r.customer_id, dockId: r.dock_id ?? null, type: r.type, scheduledDate: r.scheduled_date, crew: r.crew ?? null, notes: r.notes ?? null, waterwayAccess: r.waterway_access ?? null, previousYearNotes: r.previous_year_notes ?? null, status: r.status, priority: r.priority ?? 'normal', createdAt: r.created_at, completedAt: r.completed_at ?? null };
}
function fmtCust(r: Record<string, unknown> | undefined) {
  if (!r) return null;
  return { id: r.id, name: r.name, phone: r.phone ?? null, email: r.email ?? null, address: r.address, lat: r.lat ?? null, lng: r.lng ?? null, notes: r.notes ?? null, createdAt: r.created_at };
}
function fmtDock(r: Record<string, unknown> | undefined) {
  if (!r) return null;
  return { id: r.id, customerId: r.customer_id, material: r.material, length: r.length ?? null, width: r.width ?? null, boatLiftSize: r.boat_lift_size ?? null, boatLiftPosition: r.boat_lift_position ?? null, specialNotes: r.special_notes ?? null, googleMapsUrl: r.google_maps_url ?? null, createdAt: r.created_at };
}

// GET /api/jobs
router.get('/', async (req, res) => {
  try {
    const { status, type, customerId, search } = req.query as Record<string, string>;
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};
    if (status) { conditions.push('j.status = $status'); params.$status = status; }
    if (type) { conditions.push('j.type = $type'); params.$type = type; }
    if (customerId) { conditions.push('j.customer_id = $cid'); params.$cid = customerId; }
    if (search?.trim()) { conditions.push('(c.name LIKE $s OR c.address LIKE $s OR j.notes LIKE $s)'); params.$s = `%${search.trim()}%`; }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT j.* FROM jobs j LEFT JOIN customers c ON j.customer_id = c.id ${where} ORDER BY j.scheduled_date ASC, j.created_at DESC`;
    const rows = await dbAll<Record<string, unknown>>(sql, params);

    // Fetch related customers + docks
    const cids = [...new Set(rows.map(r => r.customer_id as string).filter(Boolean))];
    const dids = [...new Set(rows.map(r => r.dock_id as string).filter(Boolean))];
    const custMap = new Map<string, Record<string, unknown>>();
    const dockMap = new Map<string, Record<string, unknown>>();
    for (const cid of cids) { const c = await dbGet('SELECT * FROM customers WHERE id = $id', { $id: cid }); if (c) custMap.set(cid, c as Record<string, unknown>); }
    for (const did of dids) { const d = await dbGet('SELECT * FROM docks WHERE id = $id', { $id: did }); if (d) dockMap.set(did, d as Record<string, unknown>); }

    const jobs = rows.map(r => ({ ...fmtJob(r), customer: fmtCust(custMap.get(r.customer_id as string) ?? undefined), dock: r.dock_id ? fmtDock(dockMap.get(r.dock_id as string) ?? undefined) : null }));
    res.json(jobs);
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const row = await dbGet<Record<string, unknown>>('SELECT * FROM jobs WHERE id = $id', { $id: req.params.id });
    if (!row) { res.status(404).json({ error: 'Not found' }); return; }
    const cust = await dbGet('SELECT * FROM customers WHERE id = $cid', { $cid: row.customer_id });
    const dock = row.dock_id ? await dbGet('SELECT * FROM docks WHERE id = $did', { $did: row.dock_id }) : null;
    res.json({ ...fmtJob(row), customer: fmtCust(cust as Record<string, unknown> | undefined), dock: fmtDock(dock as Record<string, unknown> | undefined) });
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

// POST /api/jobs
router.post('/', async (req, res) => {
  try {
    const { customerId, dockId, type, scheduledDate, crew, notes, waterwayAccess, previousYearNotes, status, priority } = req.body;
    if (!customerId) { res.status(400).json({ error: 'customerId required' }); return; }
    if (!type || !['install','remove','service'].includes(type)) { res.status(400).json({ error: 'type must be install, remove, or service' }); return; }
    const cust = await dbGet('SELECT id FROM customers WHERE id = $id', { $id: customerId });
    if (!cust) { res.status(400).json({ error: 'Customer not found' }); return; }
    const id = genId('job_');
    await dbRun('INSERT INTO jobs (id,customer_id,dock_id,type,scheduled_date,crew,notes,waterway_access,previous_year_notes,status,priority,created_at,completed_at) VALUES ($id,$cid,$did,$type,$sd,$crew,$notes,$wa,$pyn,$status,$priority,$ca,NULL)', {
      $id: id, $cid: customerId, $did: dockId || null, $type: type, $sd: scheduledDate || null, $crew: crew || null, $notes: notes || null, $wa: waterwayAccess || null, $pyn: previousYearNotes || null, $status: status || 'pending', $priority: priority || 'normal', $ca: Date.now()
    });
    const newRow = await dbGet<Record<string, unknown>>('SELECT * FROM jobs WHERE id = $id', { $id: id });
    const custRow = await dbGet('SELECT * FROM customers WHERE id = $cid', { $cid: customerId });
    const dockRow = newRow?.dock_id ? await dbGet('SELECT * FROM docks WHERE id = $did', { $did: newRow.dock_id }) : null;
    res.status(201).json({ ...fmtJob(newRow!), customer: fmtCust(custRow as Record<string, unknown> | undefined), dock: fmtDock(dockRow as Record<string, unknown> | undefined) });
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

// PUT /api/jobs/:id
router.put('/:id', async (req, res) => {
  try {
    const ex = await dbGet<Record<string, unknown>>('SELECT * FROM jobs WHERE id = $id', { $id: req.params.id });
    if (!ex) { res.status(404).json({ error: 'Not found' }); return; }
    const { type, scheduledDate, crew, notes, waterwayAccess, previousYearNotes, status, priority, dockId } = req.body;
    await dbRun('UPDATE jobs SET type=COALESCE($type,type),scheduled_date=$sd,crew=$crew,notes=$notes,waterway_access=$wa,previous_year_notes=$pyn,status=COALESCE($status,status),priority=COALESCE($priority,priority),dock_id=$did WHERE id=$id', {
      $id: req.params.id, $type: type || null, $sd: scheduledDate !== undefined ? scheduledDate : ex.scheduled_date, $crew: crew !== undefined ? crew : ex.crew, $notes: notes !== undefined ? notes : ex.notes, $wa: waterwayAccess !== undefined ? waterwayAccess : ex.waterway_access, $pyn: previousYearNotes !== undefined ? previousYearNotes : ex.previous_year_notes, $status: status || null, $priority: priority || null, $did: dockId !== undefined ? dockId : ex.dock_id
    });
    const updated = await dbGet<Record<string, unknown>>('SELECT * FROM jobs WHERE id = $id', { $id: req.params.id });
    const custRow = await dbGet('SELECT * FROM customers WHERE id = $cid', { $cid: updated!.customer_id });
    const dockRow = updated?.dock_id ? await dbGet('SELECT * FROM docks WHERE id = $did', { $did: updated.dock_id }) : null;
    res.json({ ...fmtJob(updated!), customer: fmtCust(custRow as Record<string, unknown> | undefined), dock: fmtDock(dockRow as Record<string, unknown> | undefined) });
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

// DELETE /api/jobs/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM jobs WHERE id = $id', { $id: req.params.id });
    if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

// PATCH /api/jobs/:id/complete
router.patch('/:id/complete', async (req, res) => {
  try {
    const ex = await dbGet('SELECT * FROM jobs WHERE id = $id', { $id: req.params.id });
    if (!ex) { res.status(404).json({ error: 'Not found' }); return; }
    await dbRun("UPDATE jobs SET status='completed',completed_at=$ca WHERE id=$id", { $id: req.params.id, $ca: Date.now() });
    const row = await dbGet<Record<string, unknown>>('SELECT * FROM jobs WHERE id = $id', { $id: req.params.id });
    const custRow = await dbGet('SELECT * FROM customers WHERE id = $cid', { $cid: row!.customer_id });
    const dockRow = row?.dock_id ? await dbGet('SELECT * FROM docks WHERE id = $did', { $did: row.dock_id }) : null;
    res.json({ ...fmtJob(row!), customer: fmtCust(custRow as Record<string, unknown> | undefined), dock: fmtDock(dockRow as Record<string, unknown> | undefined) });
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

export default router;
