import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, Download, Printer, Receipt } from 'lucide-react';
import { useAppSelector } from '../store';
import { familyBills, shekel, SIBLING_DISCOUNT } from '../domain/billing';
import { courseEmoji } from '../domain/display';
import { HEBREW_MONTHS, today } from '../domain/dates';
import { exportCsv } from '../components/DataTable';
import { HBarList } from '../components/charts';
import { SearchBox } from '../components/ui';

export default function Billing() {
  const d = useAppSelector(s => s.data);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const bills = useMemo(() => familyBills(d.families, d.students, d.courses, d.enrollments).filter(b => b.total > 0).sort((a, b) => b.total - a.total), [d]);
  const visible = bills.filter(b => !q.trim() || b.family.lastName.includes(q.trim()));
  const total = bills.reduce((s, b) => s + b.total, 0);
  const discounts = bills.reduce((s, b) => s + b.discount, 0);
  const byMethod = Object.entries(bills.reduce<Record<string, number>>((acc, b) => ({ ...acc, [b.family.paymentMethod]: (acc[b.family.paymentMethod] ?? 0) + b.total }), {}))
    .map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  const month = `${HEBREW_MONTHS[Number(today().slice(5, 7)) - 1]} ${today().slice(0, 4)}`;

  const download = () => exportCsv(`billing-${today().slice(0, 7)}.csv`, ['משפחה', 'אמצעי תשלום', 'ילד/ה', 'קורס', 'סכום', 'הנחת אחים', 'סה״כ למשפחה'],
    bills.flatMap(b => b.lines.map((l, i) => [b.family.lastName, b.family.paymentMethod, l.student.firstName, l.course.name, l.amount, i === 0 ? b.discount : '', i === 0 ? b.total : ''])));

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>גבייה וחיובים · {month}</h1><p>חיוב חודשי לכל משפחה לפי הקורסים של הילדים, כולל {SIBLING_DISCOUNT * 100}% הנחת אחים מהקורס השני ואילך</p></div>
        <div className="row no-print">
          <button className="btn" onClick={() => window.print()}><Printer size={17} />הדפסה</button>
          <button className="btn btn-gold" onClick={download}><Download size={17} />ייצוא ל-Excel</button>
        </div>
      </div>

      <div className="grid cols-3">
        <div className="card kpi"><div className="kpi-label"><span className="kpi-icon"><Receipt size={18} /></span>סה״כ לגבייה החודש</div><div className="kpi-value gold-text">{shekel(total)}</div><div className="kpi-foot">{bills.length} משפחות</div></div>
        <div className="card kpi"><div className="kpi-label">הנחות אחים שניתנו</div><div className="kpi-value">{shekel(discounts)}</div><div className="kpi-foot">{bills.filter(b => b.discount > 0).length} משפחות עם יותר מקורס אחד</div></div>
        <div className="card"><div className="card-title"><h3>לפי אמצעי תשלום</h3></div><HBarList data={byMethod} format={shekel} unit="" /></div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="toolbar no-print"><SearchBox value={q} onChange={setQ} placeholder="חיפוש משפחה" /></div>
        <table className="table">
          <thead><tr><th>משפחה</th><th>אמצעי תשלום</th><th>פריטים</th><th>לפני הנחה</th><th>הנחת אחים</th><th>לתשלום</th><th /></tr></thead>
          <tbody>
            {visible.map(b => (
              <Fragment key={b.family.id}>
                <tr className="clickable" onClick={() => setOpen(open === b.family.id ? null : b.family.id)}>
                  <td><b>משפחת {b.family.lastName}</b></td>
                  <td><span className="badge">{b.family.paymentMethod}</span></td>
                  <td className="num">{b.lines.length}</td>
                  <td className="num muted">{shekel(b.subtotal)}</td>
                  <td className="num" style={{ color: b.discount ? 'var(--good)' : undefined }}>{b.discount ? `−${shekel(b.discount)}` : '—'}</td>
                  <td><b className="num">{shekel(b.total)}</b></td>
                  <td><ChevronDown size={16} style={{ transform: open === b.family.id ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }} /></td>
                </tr>
                {open === b.family.id && (
                  <tr>
                    <td colSpan={7} style={{ background: 'var(--surface-2)' }}>
                      {b.lines.map((l, i) => (
                        <div key={i} className="row" style={{ padding: '4px 0' }}>
                          <span>{courseEmoji(l.course)} {l.student.firstName} · {l.course.name}</span>
                          <span className="spacer" /><span className="num">{shekel(l.amount)}</span>
                        </div>
                      ))}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
