import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import { selectLookups, useAppSelector } from '../store';
import type { Student, StudentStatus } from '../domain/types';
import { courseColor, courseEmoji, studentAge } from '../domain/display';
import { formatDate } from '../domain/dates';
import { DataTable, exportCsv, type Column } from '../components/DataTable';
import { Avatar, Empty, SearchBox, StatusBadge, Tabs } from '../components/ui';
import { StudentForm } from './forms';

type Filter = 'all' | StudentStatus;

export default function Students() {
  const students = useAppSelector(s => s.data.students);
  const enrollments = useAppSelector(s => s.data.enrollments);
  const { family, course } = useAppSelector(selectLookups);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const showForm = params.get('new') === '1';

  const coursesOf = useMemo(() => {
    const map = new Map<number, number[]>();
    enrollments.forEach(e => map.set(e.studentId, [...(map.get(e.studentId) ?? []), e.courseId]));
    return map;
  }, [enrollments]);

  const rows = students.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false;
    const text = `${s.firstName} ${family.get(s.familyId)?.lastName ?? ''} ${s.idNumber} ${(coursesOf.get(s.id) ?? []).map(c => course.get(c)?.name).join(' ')}`;
    return !q.trim() || text.includes(q.trim());
  });

  const columns: Column<Student>[] = [
    {
      key: 'name', header: 'תלמיד/ה', sort: s => s.firstName,
      render: s => (
        <div className="person">
          <Avatar name={`${s.firstName} ${family.get(s.familyId)?.lastName ?? ''}`} id={s.id} />
          <div><b>{s.firstName} {family.get(s.familyId)?.lastName}</b><small className="num">ת.ז {s.idNumber}</small></div>
        </div>
      ),
    },
    { key: 'age', header: 'גיל', sort: s => studentAge(s), render: s => <span className="num">{studentAge(s)}</span> },
    {
      key: 'courses', header: 'קורסים',
      render: s => (
        <div className="row wrap" style={{ gap: 6 }}>
          {(coursesOf.get(s.id) ?? []).map(id => (
            <span key={id} className="chip"><i className="swatch" style={{ background: courseColor(id) }} />{courseEmoji(course.get(id))} {course.get(id)?.name}</span>
          ))}
          {!coursesOf.get(s.id)?.length && <span className="faint">—</span>}
        </div>
      ),
    },
    { key: 'lessons', header: 'שיעורים', sort: s => s.lessonsTaken, render: s => <span className="num">{s.lessonsTaken}</span> },
    { key: 'start', header: 'הצטרפות', sort: s => s.startDate, render: s => <span className="num muted">{formatDate(s.startDate)}</span> },
    { key: 'status', header: 'סטטוס', sort: s => s.status, render: s => <StatusBadge status={s.status} /> },
  ];

  const count = (st: StudentStatus) => students.filter(s => s.status === st).length;
  const download = () => exportCsv('students.csv', ['שם', 'משפחה', 'ת.ז', 'גיל', 'קורסים', 'סטטוס', 'הצטרפות'],
    rows.map(s => [s.firstName, family.get(s.familyId)?.lastName ?? '', s.idNumber, studentAge(s),
      (coursesOf.get(s.id) ?? []).map(c => course.get(c)?.name).join(' / '), s.status, s.startDate]));

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>תלמידים</h1><p>{students.length} תלמידים רשומים · לחיצה על שורה פותחת את כרטיס התלמיד</p></div>
        <div className="row">
          <button className="btn" onClick={download}><Download size={17} />ייצוא ל-Excel</button>
          <button className="btn btn-gold" onClick={() => setParams({ new: '1' })}><Plus size={17} />תלמיד חדש</button>
        </div>
      </div>
      <div className="card">
        <div className="toolbar">
          <SearchBox value={q} onChange={setQ} placeholder="חיפוש לפי שם, ת.ז או קורס" />
          <span className="spacer" />
          <Tabs<Filter> value={filter} onChange={setFilter} options={[
            { value: 'all', label: 'הכול', count: students.length },
            { value: 'פעיל', label: 'פעילים', count: count('פעיל') },
            { value: 'מחכה', label: 'ממתינים', count: count('מחכה') },
            { value: 'גמר', label: 'סיימו', count: count('גמר') },
          ]} />
        </div>
        {rows.length ? (
          <DataTable rows={rows} columns={columns} onRowClick={s => navigate(`/app/students/${s.id}`)} initialSort={{ key: 'name', dir: 1 }} />
        ) : <Empty title="לא נמצאו תלמידים" text="נסו לשנות את החיפוש או את הסינון" />}
      </div>
      {showForm && <StudentForm onClose={() => setParams({})} />}
    </div>
  );
}
