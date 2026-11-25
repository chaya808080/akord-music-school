import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useAction, useAppSelector } from '../store';
import { remove } from '../store/dataSlice';
import { familyBills, shekel } from '../domain/billing';
import type { Family } from '../domain/types';
import { DataTable, type Column } from '../components/DataTable';
import { Avatar, SearchBox, StatusBadge, useConfirm } from '../components/ui';
import { FamilyForm } from './forms';

export default function Families() {
  const d = useAppSelector(s => s.data);
  const run = useAction();
  const [confirm, dialog] = useConfirm();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Family | 'new' | null>(null);
  const totals = useMemo(() => new Map(familyBills(d.families, d.students, d.courses, d.enrollments).map(b => [b.family.id, b.total])), [d]);

  const rows = d.families.filter(f => !q.trim() || `${f.lastName} ${f.address} ${f.phone}`.includes(q.trim()));
  const columns: Column<Family>[] = [
    { key: 'name', header: 'משפחה', sort: f => f.lastName, render: f => <div className="person"><Avatar name={f.lastName} id={f.id + 4} /><div><b>משפחת {f.lastName}</b><small>{f.address}</small></div></div> },
    {
      key: 'kids', header: 'ילדים', sort: f => d.students.filter(s => s.familyId === f.id).length,
      render: f => <div className="row wrap" style={{ gap: 6 }}>{d.students.filter(s => s.familyId === f.id).map(s => (
        <Link key={s.id} to={`/app/students/${s.id}`} className="chip" onClick={e => e.stopPropagation()}>{s.firstName}<StatusBadge status={s.status} /></Link>
      ))}</div>,
    },
    { key: 'phone', header: 'טלפון', render: f => <span className="ltr num">{f.phone}</span> },
    { key: 'pay', header: 'אמצעי תשלום', sort: f => f.paymentMethod, render: f => <span className="badge">{f.paymentMethod}</span> },
    { key: 'total', header: 'חיוב חודשי', sort: f => totals.get(f.id) ?? 0, render: f => <b className="num">{shekel(totals.get(f.id) ?? 0)}</b> },
    {
      key: 'actions', header: '', render: f => (
        <div className="row" onClick={e => e.stopPropagation()}>
          <button className="btn btn-ghost icon-btn" onClick={() => setEditing(f)} aria-label="עריכה"><Pencil size={15} /></button>
          <button className="btn btn-ghost icon-btn btn-danger" aria-label="מחיקה" onClick={async () => {
            if (await confirm(`למחוק את משפחת ${f.lastName}?`)) await run(remove('families', f.id), 'המשפחה נמחקה');
          }}><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>משפחות</h1><p>{d.families.length} משפחות · פרטי קשר, ילדים ואמצעי תשלום</p></div>
        <button className="btn btn-gold" onClick={() => setEditing('new')}><Plus size={17} />משפחה חדשה</button>
      </div>
      <div className="card">
        <div className="toolbar"><SearchBox value={q} onChange={setQ} placeholder="חיפוש לפי שם, עיר או טלפון" /></div>
        <DataTable rows={rows} columns={columns} initialSort={{ key: 'name', dir: 1 }} />
      </div>
      {editing && <FamilyForm family={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {dialog}
    </div>
  );
}
