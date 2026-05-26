import { Router } from 'express';
import { dbAll, dbGet, dbRun } from '../db';

const router = Router();

function genId(p: string) { return `${p}${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function fmtDock(r: Record<string, unknown>) {
  return { id: r.id, customerId: r.customer_id, material: r.material, length: r.length ?? null, width: r.width ?? null, boatLiftSize: r.boat_lift_size ?? null, boatLiftPosition: r.boat_lift_position ?? null, specialNotes: r.special_notes ?? null, googleMapsUrl: r.google_maps_url ?? null, createdAt: r.created_at };
}

router.get('/', async (req, res) => {
  try {
    const cid = req.query.customerId as string;
    const rows = cid
      ? await dbAll<Record<string, unknown>>('SELECT * FROM docks WHERE customer_id = $cid', { $cid: cid })
      : await dbAll<Record<string, unknown>>('SELECT * FROM docks', {});
    res.json(rows.map(fmtDock));
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await dbGet<Record<string, unknown>>('SELECT * FROM docks WHERE id = $id', { $id: req.params.id });
    if (!row) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(fmtDock(row));
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.post('/', async (req, res) => {
  try {
    const { customerId, material, length, width, boatLiftSize, boatLiftPosition, specialNotes, googleMapsUrl } = req.body;
    if (!customerId) { res.status(400).json({ error: 'customerId required' }); return; }
    const id = genId('dock_');
    await dbRun('INSERT INTO docks (id,customer_id,material,length,width,boat_lift_size,boat_lift_position,special_notes,google_maps_url,created_at) VALUES ($id,$cid,$mat,$len,$wid,$bls,$blp,$sn,$gmu,$ca)', {
      $id: id, $cid: customerId, $mat: material || null, $len: length || null, $wid: width || null, $bls: boatLiftSize || null, $blp: boatLiftPosition || null, $sn: specialNotes || null, $gmu: googleMapsUrl || null, $ca: Date.now()
    });
    const row = await dbGet<Record<string, unknown>>('SELECT * FROM docks WHERE id = $id', { $id: id });
    res.status(201).json(fmtDock(row!));
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const ex = await dbGet<Record<string, unknown>>('SELECT * FROM docks WHERE id = $id', { $id: req.params.id });
    if (!ex) { res.status(404).json({ error: 'Not found' }); return; }
    const { material, length, width, boatLiftSize, boatLiftPosition, specialNotes, googleMapsUrl } = req.body;
    await dbRun('UPDATE docks SET material=COALESCE($mat,material),length=COALESCE($len,length),width=COALESCE($wid,width),boat_lift_size=$bls,boat_lift_position=$blp,special_notes=$sn,google_maps_url=$gmu WHERE id=$id', {
      $id: req.params.id, $mat: material || null, $len: length !== undefined ? length : ex.length, $wid: width !== undefined ? width : ex.width, $bls: boatLiftSize !== undefined ? boatLiftSize : ex.boat_lift_size, $blp: boatLiftPosition !== undefined ? boatLiftPosition : ex.boat_lift_position, $sn: specialNotes !== undefined ? specialNotes : ex.special_notes, $gmu: googleMapsUrl !== undefined ? googleMapsUrl : ex.google_maps_url
    });
    const row = await dbGet<Record<string, unknown>>('SELECT * FROM docks WHERE id = $id', { $id: req.params.id });
    res.json(fmtDock(row!));
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM docks WHERE id = $id', { $id: req.params.id });
    if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

export default router;
