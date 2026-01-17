import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from './AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TranslatePage } from './pages/TranslatePage';
import { SummaryPage } from './pages/SummaryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ActivityPage } from './pages/ActivityPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/translate', element: <TranslatePage /> },
          { path: '/summary', element: <SummaryPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/activity', element: <ActivityPage /> },
        ],
      },
    ],
  },
]);
