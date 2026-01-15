import { LogIn } from 'lucide-react';
import wapuuImage from '../imgs/original_wapuu.png';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => (
  <div className="login-container animate-fade-in">
    <div className="login-card">
      <div className="login-mascot">
        <img src={wapuuImage} alt="Wapuu" />
      </div>
      <h1>Wappu Lingo</h1>
      <p>
        Gamify your WordPress translations and join the community. Login with your Gravatar account
        to start.
      </p>

      <button className="btn-login" onClick={onLogin}>
        <LogIn size={20} style={{ marginRight: 10 }} /> Login with Gravatar
      </button>

      <div className="login-footer">Powered by WordPress.com OAuth</div>
    </div>
  </div>
);

export default LoginScreen;
