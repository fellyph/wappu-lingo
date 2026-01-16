import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react';
import wapuuImage from '../imgs/original_wapuu.png';

interface LoginScreenProps {
  onLogin: () => void;
  isLoading?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isLoading = false }) => {
  const { t } = useTranslation();

  return (
    <div className="login-container animate-fade-in">
      <div className="login-card">
        <div className="login-mascot">
          <img src={wapuuImage} alt={t('alt.wapuu')} />
        </div>
        <h1>{t('app.name')}</h1>
        <p>{t('login.tagline')}</p>

        <button className="btn-login" onClick={onLogin} disabled={isLoading}>
          <LogIn size={20} style={{ marginRight: 10 }} /> {isLoading ? t('app.loading') : t('login.button')}
        </button>

        <div className="login-footer">{t('login.footer')}</div>
      </div>
    </div>
  );
};

export default LoginScreen;
