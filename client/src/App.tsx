import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAppSelector } from './store';
import Layout, { Toasts } from './components/Layout';
import Landing from './pages/Landing';

// Admin pages are code-split: the public site loads without the management bundle.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const Families = lazy(() => import('./pages/Families'));
const Teachers = lazy(() => import('./pages/Teachers'));
const Courses = lazy(() => import('./pages/Courses'));
const Schedule = lazy(() => import('./pages/Schedule'));
const WaitingList = lazy(() => import('./pages/WaitingList'));
const Absences = lazy(() => import('./pages/Absences'));
const Billing = lazy(() => import('./pages/Billing'));
const Insights = lazy(() => import('./pages/Insights'));

export default function App() {
  const theme = useAppSelector(s => s.ui.theme);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  return (
    // HashRouter: deep links work on static hosting (GitHub Pages) without server rewrites.
    <HashRouter>
      <Suspense fallback={<div className="page" />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:id" element={<StudentProfile />} />
            <Route path="families" element={<Families />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="courses" element={<Courses />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="waiting" element={<WaitingList />} />
            <Route path="absences" element={<Absences />} />
            <Route path="billing" element={<Billing />} />
            <Route path="insights" element={<Insights />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toasts />
    </HashRouter>
  );
}
