import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginScreen from '../../components/LoginScreen';

export const LoginPage = () => {
  const { token, login, clientId } = useAuth();

  // Redirect to dashboard if already logged in
  if (token) {
    return <Navigate to="/" replace />;
  }

  return <LoginScreen onLogin={login} isLoading={!clientId} />;
};
