import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react';
import wapuuImage from '../imgs/original_wapuu.png';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { t } = useTranslation();

  return (
    <div className="login-container animate-fade-in">
      <div className="login-card">
        <div className="login-mascot">
          <img src={wapuuImage} alt={t('alt.wapuu')} />
        </div>
        <h1>{t('app.name')}</h1>
        <p>{t('login.tagline')}</p>

        <button className="btn-login" onClick={onLogin}>
          <LogIn size={20} style={{ marginRight: 10 }} /> {t('login.button')}
        </button>

        <div className="login-footer">{t('login.footer')}</div>
      </div>
    </div>
  );
};

export default LoginScreen;
