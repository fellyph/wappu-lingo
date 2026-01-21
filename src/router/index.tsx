import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from './AppLayout';
import PageLoader from '../components/PageLoader';

// Lazy load page components for code splitting
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const TranslatePage = lazy(() =>
  import('./pages/TranslatePage').then((m) => ({ default: m.TranslatePage }))
);
const SummaryPage = lazy(() =>
  import('./pages/SummaryPage').then((m) => ({ default: m.SummaryPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const ActivityPage = lazy(() =>
  import('./pages/ActivityPage').then((m) => ({ default: m.ActivityPage }))
);

// Wrap lazy component with Suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(LoginPage),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: withSuspense(DashboardPage) },
          { path: '/translate', element: withSuspense(TranslatePage) },
          { path: '/summary', element: withSuspense(SummaryPage) },
          { path: '/settings', element: withSuspense(SettingsPage) },
          { path: '/activity', element: withSuspense(ActivityPage) },
        ],
      },
    ],
  },
]);
