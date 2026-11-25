// Create / edit forms shared by several pages. Each one validates live with the same rules the server enforces.
import { useState } from 'react';
import { BookOpen, GraduationCap, UserRound, UsersRound } from 'lucide-react';
import type { Course, Family, Student, Teacher } from '../domain/types';
import { isValidEmail, isValidIsraeliId, isValidPhone } from '../domain/rules';
import { today } from '../domain/dates';
import { create, update } from '../store/dataSlice';
import { useAction, useAppSelector } from '../store';
import { Field, Modal } from '../components/ui';

type Draft<T extends { id: number }> = Omit<T, 'id'> & { id?: number };

function useDraft<T>(initial: T) {
  const [draft, setDraft] = useState(initial);
  const set = <K extends keyof T>(key: K, value: T[K]) => setDraft(d => ({ ...d, [key]: value }));
  return [draft, set] as const;
}

function Footer({ onClose, saving, label }: { onClose: () => void; saving: boolean; label: string }) {
  return (
    <>
      <button type="submit" form="entity-form" className="btn btn-gold" disabled={saving}>{saving ? 'שומר…' : label}</button>
      <button type="button" className="btn btn-ghost" onClick={onClose}>ביטול</button>
    </>
  );
}

export function StudentForm({ student, onClose, onSaved }: { student?: Student; onClose: () => void; onSaved?: (id?: number) => void }) {
  const families = useAppSelector(s => s.data.families);
  const saving = useAppSelector(s => s.data.saving);
  const run = useAction();
  const [d, set] = useDraft<Draft<Student>>(student ?? {
    firstName: '', idNumber: '', familyId: families[0]?.id ?? 0, gender: 'בת', birthDate: '', startDate: today(),
    lessonsTaken: 0, makeupLessons: 0, status: 'פעיל', finishDate: null, notes: '',
  });
  const idState = d.idNumber.length < 5 ? null : isValidIsraeliId(d.idNumber);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = student
      ? await run(update('students', { ...(d as Student), id: student.id }), 'פרטי התלמיד עודכנו')
      : await run(create('students', d), `${d.firstName} נוסף/ה לבית הספר 🎉`);
    if (ok) { onSaved?.(); onClose(); }
  };

  return (
    <Modal title={student ? `עריכת ${student.firstName}` : 'תלמיד חדש'} icon={<GraduationCap size={18} />} onClose={onClose}
      footer={<Footer onClose={onClose} saving={saving} label={student ? 'שמירת שינויים' : 'הוספת תלמיד'} />}>
      <form id="entity-form" className="form-grid" onSubmit={submit}>
        <Field label="שם פרטי"><input className="input" required value={d.firstName} onChange={e => set('firstName', e.target.value)} /></Field>
        <Field label="משפחה">
          <select className="select" value={d.familyId} onChange={e => set('familyId', Number(e.target.value))}>
            {families.map(f => <option key={f.id} value={f.id}>{f.lastName} · {f.address.split(',').pop()}</option>)}
          </select>
        </Field>
        <Field label="תעודת זהות" error={idState === false ? 'ספרת הביקורת אינה תקינה' : null} ok={idState ? 'מספר תקין ✓' : null} hint="9 ספרות, נבדק לפי ספרת ביקורת">
          <input className={`input num ${idState === false ? 'invalid' : ''}`} inputMode="numeric" maxLength={9} value={d.idNumber}
            onChange={e => set('idNumber', e.target.value.replace(/\D/g, ''))} />
        </Field>
        <Field label="מגדר">
          <select className="select" value={d.gender} onChange={e => set('gender', e.target.value as Student['gender'])}>
            <option value="בת">בת</option><option value="בן">בן</option>
          </select>
        </Field>
        <Field label="תאריך לידה"><input className="input" type="date" required max={today()} value={d.birthDate} onChange={e => set('birthDate', e.target.value)} /></Field>
        <Field label="תאריך הצטרפות"><input className="input" type="date" value={d.startDate} onChange={e => set('startDate', e.target.value)} /></Field>
        <Field label="סטטוס">
          <select className="select" value={d.status} onChange={e => set('status', e.target.value as Student['status'])}>
            <option>פעיל</option><option>מחכה</option><option>גמר</option>
          </select>
        </Field>
        <Field label="שיעורי השלמה"><input className="input num" type="number" min={0} value={d.makeupLessons} onChange={e => set('makeupLessons', Number(e.target.value))} /></Field>
        <Field label="הערות" full><textarea className="textarea" rows={2} maxLength={40} value={d.notes} onChange={e => set('notes', e.target.value)} /></Field>
      </form>
    </Modal>
  );
}

export function FamilyForm({ family, onClose }: { family?: Family; onClose: () => void }) {
  const saving = useAppSelector(s => s.data.saving);
  const run = useAction();
  const [d, set] = useDraft<Draft<Family>>(family ?? { lastName: '', address: '', phone: '', email: '', paymentMethod: 'הוראת קבע' });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = family ? await run(update('families', { ...(d as Family), id: family.id }), 'פרטי המשפחה עודכנו')
      : await run(create('families', d), `משפחת ${d.lastName} נוספה`);
    if (ok) onClose();
  };
  return (
    <Modal title={family ? `משפחת ${family.lastName}` : 'משפחה חדשה'} icon={<UsersRound size={18} />} onClose={onClose}
      footer={<Footer onClose={onClose} saving={saving} label={family ? 'שמירה' : 'הוספת משפחה'} />}>
      <form id="entity-form" className="form-grid" onSubmit={submit}>
        <Field label="שם משפחה"><input className="input" required value={d.lastName} onChange={e => set('lastName', e.target.value)} /></Field>
        <Field label="טלפון" error={d.phone && !isValidPhone(d.phone) ? 'מספר טלפון לא תקין' : null}>
          <input className="input num" dir="ltr" value={d.phone} onChange={e => set('phone', e.target.value)} />
        </Field>
        <Field label="כתובת" full><input className="input" value={d.address} onChange={e => set('address', e.target.value)} /></Field>
        <Field label="מייל" error={!isValidEmail(d.email) ? 'כתובת מייל לא תקינה' : null}>
          <input className="input" dir="ltr" value={d.email} onChange={e => set('email', e.target.value)} />
        </Field>
        <Field label="אמצעי תשלום">
          <select className="select" value={d.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
            <option>הוראת קבע</option><option>כרטיס אשראי</option><option>העברה בנקאית</option><option>מזומן</option>
          </select>
        </Field>
      </form>
    </Modal>
  );
}

export function TeacherForm({ teacher, onClose }: { teacher?: Teacher; onClose: () => void }) {
  const saving = useAppSelector(s => s.data.saving);
  const run = useAction();
  const [d, set] = useDraft<Draft<Teacher>>(teacher ?? { firstName: '', lastName: '', idNumber: '', phone: '', email: '', active: true, gender: 'בת', notes: '' });
  const idState = d.idNumber.length < 5 ? null : isValidIsraeliId(d.idNumber);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = teacher ? await run(update('teachers', { ...(d as Teacher), id: teacher.id }), 'פרטי המורה עודכנו')
      : await run(create('teachers', d), `${d.firstName} הצטרף/ה לצוות 🎶`);
    if (ok) onClose();
  };
  return (
    <Modal title={teacher ? `עריכת ${teacher.firstName} ${teacher.lastName}` : 'מורה חדש/ה'} icon={<UserRound size={18} />} onClose={onClose}
      footer={<Footer onClose={onClose} saving={saving} label={teacher ? 'שמירה' : 'הוספה לצוות'} />}>
      <form id="entity-form" className="form-grid" onSubmit={submit}>
        <Field label="שם פרטי"><input className="input" required value={d.firstName} onChange={e => set('firstName', e.target.value)} /></Field>
        <Field label="שם משפחה"><input className="input" required value={d.lastName} onChange={e => set('lastName', e.target.value)} /></Field>
        <Field label="תעודת זהות" error={idState === false ? 'ספרת הביקורת אינה תקינה' : null} ok={idState ? 'מספר תקין ✓' : null}>
          <input className="input num" inputMode="numeric" maxLength={9} value={d.idNumber} onChange={e => set('idNumber', e.target.value.replace(/\D/g, ''))} />
        </Field>
        <Field label="טלפון" error={d.phone && !isValidPhone(d.phone) ? 'מספר טלפון לא תקין' : null}>
          <input className="input num" dir="ltr" value={d.phone} onChange={e => set('phone', e.target.value)} />
        </Field>
        <Field label="מייל"><input className="input" dir="ltr" value={d.email} onChange={e => set('email', e.target.value)} /></Field>
        <Field label="מגדר">
          <select className="select" value={d.gender} onChange={e => set('gender', e.target.value as Teacher['gender'])}><option value="בת">אישה</option><option value="בן">גבר</option></select>
        </Field>
        <label className="row full" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={d.active} onChange={e => set('active', e.target.checked)} /> פעיל/ה ומלמד/ת כרגע
        </label>
        <Field label="הערות" full><input className="input" maxLength={30} value={d.notes} onChange={e => set('notes', e.target.value)} /></Field>
      </form>
    </Modal>
  );
}

export function CourseForm({ course, onClose }: { course?: Course; onClose: () => void }) {
  const saving = useAppSelector(s => s.data.saving);
  const run = useAction();
  const [d, set] = useDraft<Draft<Course>>(course ?? { name: '', audience: 'מעורב', price: 280, description: '', durationMinutes: 45, fromAge: 6, toAge: 18 });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = course ? await run(update('courses', { ...(d as Course), id: course.id }), 'הקורס עודכן')
      : await run(create('courses', d), `הקורס "${d.name}" נפתח`);
    if (ok) onClose();
  };
  return (
    <Modal title={course ? `עריכת ${course.name}` : 'קורס חדש'} icon={<BookOpen size={18} />} onClose={onClose}
      footer={<Footer onClose={onClose} saving={saving} label={course ? 'שמירה' : 'פתיחת קורס'} />}>
      <form id="entity-form" className="form-grid" onSubmit={submit}>
        <Field label="שם הקורס"><input className="input" required maxLength={20} value={d.name} onChange={e => set('name', e.target.value)} /></Field>
        <Field label="קהל יעד">
          <select className="select" value={d.audience} onChange={e => set('audience', e.target.value as Course['audience'])}><option>מעורב</option><option>בנות</option><option>בנים</option></select>
        </Field>
        <Field label="מחיר חודשי (₪)"><input className="input num" type="number" min={1} value={d.price} onChange={e => set('price', Number(e.target.value))} /></Field>
        <Field label="משך שיעור (דקות)"><input className="input num" type="number" min={15} step={5} value={d.durationMinutes} onChange={e => set('durationMinutes', Number(e.target.value))} /></Field>
        <Field label="מגיל" error={d.fromAge > d.toAge ? 'טווח גילאים לא תקין' : null}><input className="input num" type="number" min={3} value={d.fromAge} onChange={e => set('fromAge', Number(e.target.value))} /></Field>
        <Field label="עד גיל"><input className="input num" type="number" min={3} value={d.toAge} onChange={e => set('toAge', Number(e.target.value))} /></Field>
        <Field label="תיאור" full><textarea className="textarea" rows={2} value={d.description} onChange={e => set('description', e.target.value)} /></Field>
      </form>
    </Modal>
  );
}
