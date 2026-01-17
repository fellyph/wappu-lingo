import { Navigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const { token, isLoading } = useAuth();
  const { t } = useTranslation();

  // Show loading while verifying token
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" aria-hidden="true" />
        <span className="loading-text">{t('app.loading')}</span>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Render nested routes
  return <Outlet />;
};
