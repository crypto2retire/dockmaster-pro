import { initDatabase, dbRun, dbGet } from './db';

function genId(p: string) { return `${p}${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }

async function seed() {
  await initDatabase();
  const existing = await dbGet('SELECT COUNT(*) as c FROM customers', {});
  if ((existing as { c: number }).c > 0) { console.log('DB already seeded.'); return; }

  // Real Oshkosh addresses on Lake Winnebago and Lake Butte des Morts
  const customers = [
    { id: genId('cust_'), name: 'Mark & Linda Bremer', phone: '(920) 555-0142', email: 'mbremer@yahoo.com', address: 'N7913 Lakeshore Dr, Oshkosh, WI 54902', lat: 44.0245, lng: -88.5421, notes: 'Wide shoreline. Easy barge access from north. Repeat customer for 12 years.' },
    { id: genId('cust_'), name: 'Dave Johnson', phone: '(920) 555-0287', email: 'djohnson@gmail.com', address: 'N7727 Lakeshore Dr, Oshkosh, WI 54902', lat: 44.0231, lng: -88.5405, notes: 'Steep drop-off. Needs extra anchoring. Neighbor to the Bremer family.' },
    { id: genId('cust_'), name: 'Sandy & Tom Kowalski', phone: '(920) 555-0394', email: 'tkowalski@outlook.com', address: '5557 Lake Butte des Morts Beach Rd, Oshkosh, WI 54904', lat: 44.0452, lng: -88.6123, notes: 'Shallow approach from south. Use shallow-draft barge. Two PWC lifts needed.' },
    { id: genId('cust_'), name: 'Winnebago Dock LLC', phone: '(920) 555-0461', email: 'admin@winnebagodock.com', address: 'W5346 Lake Butte des Morts Rd, Oshkosh, WI 54904', lat: 44.0489, lng: -88.6078, notes: 'Commercial client. Invoice to LLC. Multiple properties on both lakes.' },
    { id: genId('cust_'), name: 'Jennifer Walsh', phone: '(920) 555-0173', email: 'jwalsh.lake@gmail.com', address: 'W3435 Snells Rd, Oshkosh, WI 54904', lat: 44.0312, lng: -88.5789, notes: 'Narrow channel approach. Watch for low-hanging trees on east side.' },
  ];

  for (const c of customers) {
    await dbRun('INSERT INTO customers (id,name,phone,email,address,lat,lng,notes,created_at) VALUES ($id,$n,$p,$e,$a,$lat,$lng,$notes,$ca)', {
      $id: c.id, $n: c.name, $p: c.phone, $e: c.email, $a: c.address, $lat: c.lat, $lng: c.lng, $notes: c.notes, $ca: Date.now() - Math.floor(Math.random() * 1000000000)
    });
  }
  console.log(`Seeded ${customers.length} customers`);

  // Docks
  const docks = [
    { cid: customers[0].id, material: 'aluminum', length: 32, width: 6, bls: 4000, blp: 'left', sn: 'Main dock replacement. Previous wood dock rotted after 15 years. Customer wants wider walkway (6ft).', gmu: '' },
    { cid: customers[0].id, material: 'wood', length: 12, width: 4, bls: null, blp: null, sn: 'Small swim platform. No lift. Light duty only.', gmu: '' },
    { cid: customers[1].id, material: 'metal', length: 40, width: 8, bls: 6000, blp: 'center', sn: 'Heavy-duty steel dock. Double-wide with two lifts. Full crew needed (4 people). Deep water — 18ft at dock face.', gmu: '' },
    { cid: customers[2].id, material: 'aluminum', length: 24, width: 5, bls: 3500, blp: 'right', sn: 'New install. Customer present for placement verification. Wants dock angled 15 degrees toward channel.', gmu: '' },
    { cid: customers[3].id, material: 'aluminum', length: 48, width: 8, bls: 5000, blp: 'left', sn: 'Commercial grade for marina slip rentals. Heavy traffic expected. Reinforced decking and bumpers.', gmu: '' },
    { cid: customers[4].id, material: 'wood', length: 20, width: 5, bls: 2500, blp: 'end', sn: 'Lift at end of dock. Ice damaged south post last winter — reinforce this year.', gmu: '' },
  ];

  const dockIds: string[] = [];
  for (const d of docks) {
    const id = genId('dock_');
    dockIds.push(id);
    await dbRun('INSERT INTO docks (id,customer_id,material,length,width,boat_lift_size,boat_lift_position,special_notes,google_maps_url,created_at) VALUES ($id,$cid,$mat,$len,$wid,$bls,$blp,$sn,$gmu,$ca)', {
      $id: id, $cid: d.cid, $mat: d.material, $len: d.length, $wid: d.width, $bls: d.bls, $blp: d.blp, $sn: d.sn, $gmu: d.gmu || null, $ca: Date.now() - Math.floor(Math.random() * 800000000)
    });
  }
  console.log(`Seeded ${docks.length} docks`);

  // Jobs
  const now = new Date();
  const d = (o: number) => { const x = new Date(now); x.setDate(x.getDate() + o); return x.toISOString().split('T')[0]; };

  const jobs = [
    { cid: customers[0].id, did: dockIds[0], type: 'install', sd: d(0), crew: 'Mike, Dave, Tom', notes: 'Install 32ft aluminum dock with 4000lb lift on left. Wider 6ft walkway. Bremer property — wide shoreline, easy access.', wa: 'Approach from north channel. Depth 14ft. Wide bay — no obstacles.', pyn: 'Previous wood dock served 15 years. Customer happy with placement.', st: 'pending', pr: 'normal' },
    { cid: customers[1].id, did: dockIds[2], type: 'install', sd: d(0), crew: 'Full crew (4)', notes: 'Heavy-duty 40ft metal dock install. Double boat lift 6000lb center. Extra anchoring needed due to steep drop-off.', wa: 'Deep water approach — 18ft. Steep shoreline. Use extra anchors on barge.', pyn: 'New construction. No previous dock at this location.', st: 'pending', pr: 'normal' },
    { cid: customers[2].id, did: dockIds[3], type: 'install', sd: d(5), crew: 'Mike, Dave', notes: 'Install 24ft aluminum dock with 3500lb lift on right. Customer wants 15-degree angle toward channel.', wa: 'Shallow approach from south. Use shallow-draft barge. Depth 7ft at shore.', pyn: 'First dock for this property. Customer measured placement themselves.', st: 'pending', pr: 'urgent' },
    { cid: customers[3].id, did: dockIds[4], type: 'install', sd: d(7), crew: 'Full crew (4)', notes: 'Commercial 48ft aluminum dock for marina. 5000lb lift left side. Heavy-duty reinforced decking and commercial bumpers.', wa: 'Deep water bay approach. 20ft depth. Easy barge access from west channel.', pyn: 'Previous dock removed last fall. Foundation posts still in place.', st: 'pending', pr: 'normal' },
    { cid: customers[4].id, did: dockIds[5], type: 'service', sd: d(3), crew: 'Dave', notes: 'Annual service — check south post (ice damaged), tighten all bolts, inspect decking for rot.', wa: 'Narrow channel approach from east. Watch for low-hanging trees.', pyn: 'Ice damaged south post last winter. Decking has minor wear. Otherwise good shape.', st: 'pending', pr: 'normal' },
    { cid: customers[0].id, did: dockIds[1], type: 'remove', sd: d(-1), crew: 'Dave', notes: 'Remove old 12ft wood swim platform. Customer replacing with new aluminum next season.', wa: 'Same as main dock — north channel approach.', pyn: 'Platform is rotted. Unsafe for use. Quick removal job.', st: 'pending', pr: 'normal' },
    { cid: customers[1].id, did: null, type: 'remove', sd: d(-3), crew: 'Mike, Dave', notes: 'Remove temporary dock used during construction. Customer wants it gone before summer season.', wa: 'Standard deep water approach from west.', pyn: 'Temp dock served its purpose. Fair condition — can be reused elsewhere.', st: 'pending', pr: 'urgent' },
    { cid: customers[3].id, did: null, type: 'remove', sd: d(-2), crew: 'Mike, Dave, Tom', notes: 'Commercial dock removal for renovation. Sections to be stored on-site for reuse.', wa: 'Same deep water bay approach. West channel.', pyn: 'Dock structure is sound but decking needs replacement. Customer renovating not replacing.', st: 'pending', pr: 'urgent' },
    { cid: customers[2].id, did: null, type: 'service', sd: d(4), crew: 'Dave', notes: 'Check dock alignment — customer reports it shifted slightly during spring thaw. Tighten anchors.', wa: 'Shallow south approach. Same as install.', pyn: 'Dock installed last year. Minor shift reported. Otherwise in good condition.', st: 'pending', pr: 'normal' },
    { cid: customers[4].id, did: null, type: 'install', sd: d(2), crew: 'Mike, Dave', notes: 'Urgent install — customer has family reunion in 2 weeks and needs dock ready. 20ft wood dock with 2500lb end lift.', wa: 'Narrow east channel. Depth 9ft. Mind the trees.', pyn: 'Customer has been waiting since March. Very eager to get dock in.', st: 'pending', pr: 'urgent' },
    { cid: customers[0].id, did: null, type: 'remove', sd: d(-5), crew: 'Mike, Dave', notes: 'Remove main dock for end-of-season storage. Customer stores at their barn on County Rd Y.', wa: 'North channel. Same as install approach.', pyn: 'Dock in excellent condition. Minor bumper wear on port side.', st: 'completed', pr: 'normal' },
  ];

  for (const j of jobs) {
    const id = genId('job_');
    await dbRun('INSERT INTO jobs (id,customer_id,dock_id,type,scheduled_date,crew,notes,waterway_access,previous_year_notes,status,priority,created_at,completed_at) VALUES ($id,$cid,$did,$type,$sd,$crew,$notes,$wa,$pyn,$st,$pr,$ca,$cc)', {
      $id: id, $cid: j.cid, $did: j.did || null, $type: j.type, $sd: j.sd, $crew: j.crew, $notes: j.notes, $wa: j.wa, $pyn: j.pyn, $st: j.st, $pr: j.pr, $ca: Date.now() - Math.floor(Math.random() * 500000000), $cc: j.st === 'completed' ? Date.now() - 86400000 : null
    });
  }
  console.log(`Seeded ${jobs.length} jobs`);
  console.log('Database seeded successfully!');
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
