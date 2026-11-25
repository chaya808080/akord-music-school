import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Brain, ChevronDown, Flame, Lightbulb, TrendingUp } from 'lucide-react';
import { selectDb, selectLookups, useAppSelector } from '../store';
import { insights, utilization, type Insight } from '../domain/smart/insights';
import { riskReport } from '../domain/smart/risk';
import { forecast, type WhatIf } from '../domain/smart/forecast';
import { shekel } from '../domain/billing';
import { courseColor, courseEmoji } from '../domain/display';
import { ColumnChart } from '../components/charts';
import { Avatar, Tabs } from '../components/ui';

const TONE_ICON = { bad: AlertTriangle, warn: AlertTriangle, info: Lightbulb, good: TrendingUp };

export function InsightCard({ insight }: { insight: Insight }) {
  const I = TONE_ICON[insight.tone];
  return (
    <div className={`card insight insight-${insight.tone}`}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <span className={`badge ${insight.tone}`} style={{ padding: 7 }}><I size={16} /></span>
        <div style={{ flex: 1 }}>
          <b>{insight.title}</b>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>{insight.text}</p>
        </div>
      </div>
      {insight.action && <Link to={insight.action.to} className="btn btn-sm" style={{ alignSelf: 'flex-start' }}>{insight.action.label}<ArrowLeft size={14} /></Link>}
    </div>
  );
}

function Slider({ label, value, min, max, step, format, onChange }: { label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <label className="field">
      <span className="row">{label}<span className="spacer" /><b className="num gold-text">{format(value)}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </label>
  );
}

export default function Insights() {
  const db = useAppSelector(selectDb);
  const { family } = useAppSelector(selectLookups);
  const [whatIf, setWhatIf] = useState<WhatIf>({ priceChange: 0, waitingConversion: 0.5, churnReduction: 0 });
  const [metric, setMetric] = useState<'revenue' | 'students'>('revenue');
  const [open, setOpen] = useState<number | null>(null);

  const all = useMemo(() => insights(db), [db]);
  const risks = useMemo(() => riskReport(db).filter(r => r.level !== 'נמוך'), [db]);
  const f = useMemo(() => forecast(db, whatIf), [db, whatIf]);
  const heat = useMemo(() => utilization(db), [db]);
  const demand = db.courses.map(c => ({
    c, enrolled: db.enrollments.filter(e => e.courseId === c.id).length, waiting: db.waitingList.filter(w => w.courseId === c.id).length,
    teachers: db.teacherCourses.filter(t => t.courseId === c.id && db.teachers.find(x => x.id === t.teacherId)?.active).length,
  })).sort((a, b) => b.waiting - a.waiting || b.enrolled - a.enrolled);
  const maxHeat = Math.max(0.01, ...heat.grid.flat());

  if (db.students.length === 0) return <div className="page" />;
  const delta = f.revenueEnd - f.revenueNow;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1><Brain size={28} style={{ verticalAlign: -4, color: 'var(--gold)' }} /> תובנות <span className="gold-text">חכמות</span></h1>
          <p>ניתוח אוטומטי של הנתונים: תובנות לפעולה, חיזוי נשירה, תחזית צמיחה וניצולת משאבים. מחושב מחדש בכל שינוי.</p>
        </div>
      </div>

      <div className="grid cols-3">
        {all.slice(0, 6).map((i, k) => <InsightCard key={k} insight={i} />)}
      </div>

      <div className="grid cols-3" style={{ marginTop: 18 }}>
        <div className="card span-2">
          <div className="card-title">
            <h3><TrendingUp size={17} style={{ verticalAlign: -3 }} /> תחזית ל-6 החודשים הבאים</h3>
            <Tabs value={metric} onChange={setMetric} options={[{ value: 'revenue', label: 'הכנסה' }, { value: 'students', label: 'תלמידים' }]} />
          </div>
          <ColumnChart
            data={f.points.map(p => ({ label: p.label, value: metric === 'revenue' ? p.revenue : p.students, projected: p.projected, detail: p.label }))}
            format={metric === 'revenue' ? (v => (v >= 1000 ? `₪${(v / 1000).toFixed(1)}K` : shekel(v))) : String}
            unit={metric === 'revenue' ? '' : 'תלמידים'} height={240} />
          <p className="faint" style={{ fontSize: 12, margin: '10px 0 0' }}>
            רגרסיה לינארית על עקומת התלמידים הפעילים ב-12 החודשים האחרונים (R² = {f.r2.toFixed(2)}), מגמה של {f.growthPerMonth >= 0 ? '+' : ''}{f.growthPerMonth.toFixed(1)} תלמידים בחודש.
          </p>
        </div>
        <div className="card">
          <div className="card-title"><h3>סימולטור "מה אם"</h3></div>
          <div className="stack" style={{ gap: 18 }}>
            <Slider label="שינוי מחיר" value={whatIf.priceChange} min={-0.2} max={0.3} step={0.01} format={v => `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`} onChange={v => setWhatIf({ ...whatIf, priceChange: v })} />
            <Slider label="קליטה מרשימת ההמתנה" value={whatIf.waitingConversion} min={0} max={1} step={0.1} format={v => `${Math.round(v * 100)}%`} onChange={v => setWhatIf({ ...whatIf, waitingConversion: v })} />
            <Slider label="הפחתת נשירה" value={whatIf.churnReduction} min={0} max={1} step={0.1} format={v => `${Math.round(v * 100)}%`} onChange={v => setWhatIf({ ...whatIf, churnReduction: v })} />
          </div>
          <div className="divider" />
          <div className="stat-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div><b className="num">{shekel(f.revenueNow)}</b><span>הכנסה היום</span></div>
            <div><b className="num gold-text">{shekel(f.revenueEnd)}</b><span>בעוד חצי שנה</span></div>
          </div>
          <div className={`alert ${delta >= 0 ? 'good' : 'bad'}`} style={{ marginTop: 12 }}>
            <TrendingUp size={16} />{delta >= 0 ? 'צמיחה' : 'ירידה'} של {shekel(Math.abs(delta))} בחודש ({f.revenueNow ? Math.round((delta / f.revenueNow) * 100) : 0}%)
          </div>
        </div>
      </div>

      <div className="grid cols-3" style={{ marginTop: 18 }}>
        <div className="card span-2" id="risk">
          <div className="card-title"><h3><Flame size={17} style={{ verticalAlign: -3 }} /> חיזוי נשירה</h3><span className="badge bad">{risks.length} בסיכון</span></div>
          <p className="faint" style={{ marginTop: -6, fontSize: 13 }}>מודל משוקלל: ביטולים, ירידה בנוכחות, היעדרויות, שיעורי השלמה, וותק ושיבוץ. לחצו על תלמיד/ה לפירוט.</p>
          {risks.length === 0 && <div className="alert good">אין תלמידים בסיכון משמעותי 🎉</div>}
          {risks.map(r => (
            <div key={r.student.id} className="risk-row">
              <button className="risk-head" onClick={() => setOpen(open === r.student.id ? null : r.student.id)}>
                <Avatar name={`${r.student.firstName} ${family.get(r.student.familyId)?.lastName ?? ''}`} id={r.student.id} />
                <b style={{ minWidth: 130, textAlign: 'start' }}>{r.student.firstName} {family.get(r.student.familyId)?.lastName}</b>
                <div className="risk-meter"><div style={{ width: `${r.score}%`, background: r.level === 'גבוה' ? 'var(--bad)' : 'var(--warn)' }} /></div>
                <b className="num" style={{ width: 34 }}>{r.score}</b>
                <span className={`badge ${r.level === 'גבוה' ? 'bad' : 'warn'}`}>{r.level}</span>
                <ChevronDown size={16} style={{ transform: open === r.student.id ? 'rotate(180deg)' : undefined }} />
              </button>
              {open === r.student.id && (
                <div className="risk-body">
                  {r.factors.map(f => <div key={f.label} className="row"><span className="badge">+{f.points}</span>{f.label}</div>)}
                  <div className="row" style={{ marginTop: 8 }}>
                    <span className="alert info" style={{ padding: '6px 10px' }}><Lightbulb size={14} />פעולה מומלצת: {r.action}</span>
                    <Link to={`/app/students/${r.student.id}`} className="btn btn-sm">לכרטיס התלמיד</Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title"><h3>ביקוש מול היצע</h3></div>
          {demand.map(({ c, enrolled, waiting, teachers }) => (
            <div key={c.id} className="list-item">
              <span className="instrument" style={{ '--course': courseColor(c.id), width: 34, height: 34, fontSize: 17, borderRadius: 10 } as React.CSSProperties}>{courseEmoji(c)}</span>
              <div style={{ flex: 1 }}>
                <b>{c.name}</b>
                <div className="faint num" style={{ fontSize: 12 }}>{enrolled} תלמידים · {teachers} מורים · {teachers ? (enrolled / teachers).toFixed(1) : '—'} לתלמיד/מורה</div>
              </div>
              {waiting > 0 ? <span className="badge bad">{waiting} ממתינים</span> : <span className="badge good">מאוזן</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-title"><h3>מפת חום: ניצולת מורים לפי יום ושעה</h3><span className="faint" style={{ fontSize: 12 }}>ממוצע 4 השבועות האחרונים</span></div>
        <div className="heatmap" style={{ gridTemplateColumns: `70px repeat(${heat.hours.length}, 1fr)` }}>
          <span />
          {heat.hours.map(h => <span key={h} className="faint num heat-label">{h}</span>)}
          {heat.grid.map((row, d) => (
            <Fragment key={d}>
              <span className="muted heat-label">{heat.days[d]}</span>
              {row.map((v, h) => (
                <div key={`${d}-${h}`} className="heat-cell" title={`יום ${heat.days[d]} ${heat.hours[h]}: ${Math.round(v * 100)}% מהמורים מלמדים`}
                  style={{ background: `color-mix(in srgb, var(--gold) ${Math.round((v / maxHeat) * 85)}%, var(--surface-2))` }}>
                  <span className="num">{Math.round(v * 100)}%</span>
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
