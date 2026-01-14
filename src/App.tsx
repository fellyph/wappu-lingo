import { useState, useEffect } from 'react';
import {
  Home,
  Users,
  ShieldCheck,
  Settings,
  Check,
  ArrowRight,
  LogIn,
  SkipForward,
  Loader,
} from 'lucide-react';
import { useSettings } from './hooks/useSettings';
import { useTranslationSession } from './hooks/useTranslationSession';
import SettingsScreen from './components/SettingsScreen';
import type { GravatarProfile, TranslationString, Locale, Project, SessionStats } from './types';
import wapuuImage from './imgs/original_wapuu.png';

const CLIENT_ID = import.meta.env.VITE_GRAVATAR_CLIENT_ID || '1'; // Placeholder
const REDIRECT_URI = window.location.origin + '/';

type ScreenType = 'dashboard' | 'translating' | 'summary' | 'settings';

interface Stats {
  translated: number;
  approved: number;
}

const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenType>('dashboard');
  const [stats, setStats] = useState<Stats>({ translated: 256, approved: 180 });
  const [translationValue, setTranslationValue] = useState('');
  const [user, setUser] = useState<GravatarProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('gravatar_token'));
  const [isLoading, setIsLoading] = useState(false);

  // Use new hooks
  const settings = useSettings();
  const session = useTranslationSession();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        setToken(accessToken);
        localStorage.setItem('gravatar_token', accessToken);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (token && !user) {
      setIsLoading(true);
      fetch('https://api.gravatar.com/v3/me/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json() as Promise<GravatarProfile>)
        .then((data) => {
          if (data.error) {
            localStorage.removeItem('gravatar_token');
            setToken(null);
          } else {
            setUser(data);
          }
        })
        .catch(() => setToken(null))
        .finally(() => setIsLoading(false));
    }
  }, [token, user]);

  const handleLogin = () => {
    const scopes = ['auth', 'gravatar-profile:read'].map((s, i) => `scope[${i}]=${s}`).join('&');
    const authUrl = `https://public-api.wordpress.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&${scopes}`;
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    localStorage.removeItem('gravatar_token');
    setToken(null);
    setUser(null);
  };

  const handleStart = async () => {
    setScreen('translating');
    await session.startSession({
      projectSlug: settings.project.slug,
      projectName: settings.project.name,
      localeSlug: settings.locale,
      sampleSize: settings.stringsPerSession,
      userId: user?.hash || user?.profile_url?.split('/').pop() || 'anonymous',
      userEmail: user?.email || null,
    });
  };

  const handleSubmit = () => {
    session.submitTranslation(translationValue);
    setTranslationValue('');
    setStats((prev) => ({ ...prev, translated: prev.translated + 1 }));

    // Check if session is complete
    if (session.currentIndex + 1 >= session.strings.length) {
      setScreen('summary');
    }
  };

  const handleSkip = () => {
    session.skipString();
    setTranslationValue('');

    if (session.currentIndex + 1 >= session.strings.length) {
      setScreen('summary');
    }
  };

  const handleBackToHome = () => {
    setTranslationValue('');
    session.resetSession();
    setScreen('dashboard');
  };

  if (!token && !isLoading) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (isLoading) {
    return <div className="loading-screen">Loading Wapuu...</div>;
  }

  return (
    <div className="app-container">
      <main className="content-scroll">
        {screen === 'dashboard' && (
          <Dashboard
            stats={stats}
            onStart={handleStart}
            user={user}
            onLogout={handleLogout}
            isSessionLoading={session.isLoading}
          />
        )}
        {screen === 'translating' && (
          <TranslationScreen
            value={translationValue}
            onChange={(e) => setTranslationValue(e.target.value)}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            currentString={session.currentString}
            progressPercent={session.progressPercent}
            locale={settings.localeObj}
            project={settings.project}
            isLoading={session.isLoading}
            error={session.error}
            onBack={() => setScreen('dashboard')}
          />
        )}
        {screen === 'summary' && (
          <SummaryScreen onDone={handleBackToHome} sessionStats={session.sessionStats} />
        )}
        {screen === 'settings' && (
          <SettingsScreen
            settings={settings}
            onLocaleChange={settings.setLocale}
            onProjectChange={settings.setProject}
            onStringsPerSessionChange={settings.setStringsPerSession}
          />
        )}
      </main>

      <nav className="bottom-nav">
        <button
          className={screen === 'dashboard' ? 'active' : ''}
          onClick={() => setScreen('dashboard')}
        >
          <Home size={24} />
        </button>
        <button>
          <Users size={24} />
        </button>
        <button>
          <ShieldCheck size={24} />
        </button>
        <button
          className={screen === 'settings' ? 'active' : ''}
          onClick={() => setScreen('settings')}
        >
          <Settings size={24} />
        </button>
      </nav>
    </div>
  );
};

/* --- Sub-Components --- */

interface DashboardProps {
  stats: Stats;
  onStart: () => Promise<void>;
  user: GravatarProfile | null;
  onLogout: () => void;
  isSessionLoading: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({
  stats,
  onStart,
  user,
  onLogout,
  isSessionLoading,
}) => (
  <div className="screen animate-fade-in">
    <header className="header-navy">
      <div className="header-top">
        <h1>WordPress Translator</h1>
        <div className="user-avatar" onClick={onLogout} title="Click to Logout">
          <img
            src={user?.avatar_url || wapuuImage}
            alt={user?.display_name || 'User'}
          />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Translated:</span>
          <span className="stat-value">{stats.translated}</span>
        </div>
        <div className="stat-item">
          <div className="icon-wp-small">
            <img src={wapuuImage} alt="WP" />
          </div>
          <div className="stat-stack">
            <span className="stat-label">Approved:</span>
            <span className="stat-value">{stats.approved}</span>
          </div>
        </div>
      </div>
    </header>

    <div className="dashboard-content">
      <div className="welcome-text">
        Welcome back, <strong>{user?.display_name || 'Translator'}</strong>!
      </div>
      <button className="btn-primary" onClick={onStart} disabled={isSessionLoading}>
        {isSessionLoading ? 'Loading...' : 'Start Translating!'}
      </button>

      <div className="mascot-container animate-bounce">
        <img src={wapuuImage} alt="Happy Wapuu" />
      </div>
    </div>
  </div>
);

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

interface TranslationScreenProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onSkip: () => void;
  currentString: TranslationString | null;
  progressPercent: number;
  locale: Locale;
  project: Project;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
}

const TranslationScreen: React.FC<TranslationScreenProps> = ({
  value,
  onChange,
  onSubmit,
  onSkip,
  currentString,
  progressPercent,
  locale,
  project,
  isLoading,
  error,
  onBack,
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="screen animate-fade-in loading-container">
        <Loader className="animate-spin" size={48} />
        <p>Loading strings...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="screen animate-fade-in error-container">
        <p className="error-message">{error}</p>
        <button className="btn-outline" onClick={onBack}>
          Go Back
        </button>
      </div>
    );
  }

  // No strings available
  if (!currentString) {
    return (
      <div className="screen animate-fade-in empty-container">
        <div className="mascot-container">
          <img src={wapuuImage} alt="Wapuu" />
        </div>
        <p className="empty-message">No untranslated strings found for {locale.name}.</p>
        <p className="empty-submessage">
          Try selecting a different project or language in Settings.
        </p>
        <button className="btn-outline" onClick={onBack}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="screen animate-fade-in">
      <header className="header-minimal">
        <h2>Translate to: {locale.name}</h2>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      <div className="content">
        <div className="card">
          <div className="card-header">
            <span className="card-label">Original String:</span>
            <span className="badge">
              {currentString.priority === 'high' ? 'Priority' : 'Normal'}
            </span>
          </div>

          <div className="string-display">{currentString.singular}</div>

          {currentString.context && <p className="context">Context: {currentString.context}</p>}

          <p className="source">
            Source: {project.name}
            {currentString.references?.length > 0 && (
              <span className="reference"> ({currentString.references[0]})</span>
            )}
          </p>

          <div className="input-group">
            <label>Your Translation:</label>
            <input type="text" placeholder="Translate here..." value={value} onChange={onChange} />
          </div>

          <div className="button-row">
            <button className="btn-secondary" onClick={onSkip}>
              Skip <SkipForward size={18} />
            </button>
            <button className="btn-success" onClick={onSubmit} disabled={!value.trim()}>
              Submit <Check size={20} />
            </button>
          </div>

          <div className="mascot-peek">
            <img src={wapuuImage} alt="Wapuu peaking" />
          </div>
        </div>
      </div>
    </div>
  );
};

interface SummaryScreenProps {
  onDone: () => void;
  sessionStats: SessionStats;
}

const SummaryScreen: React.FC<SummaryScreenProps> = ({ onDone, sessionStats }) => (
  <div
    className="screen animate-fade-in"
    style={{ background: 'var(--color-navy)', minHeight: '100%', padding: '24px' }}
  >
    <div className="summary-card">
      <h2 className="summary-title">Session Summary</h2>

      <div className="weekly-stats-card">
        <p className="stats-header">This Session:</p>
        <div className="session-stats-grid">
          <div className="session-stat">
            <span className="session-stat-value">{sessionStats?.completed || 0}</span>
            <span className="session-stat-label">Translated</span>
          </div>
          <div className="session-stat">
            <span className="session-stat-value">{sessionStats?.skipped || 0}</span>
            <span className="session-stat-label">Skipped</span>
          </div>
          <div className="session-stat">
            <span className="session-stat-value">{sessionStats?.total || 0}</span>
            <span className="session-stat-label">Total</span>
          </div>
        </div>
      </div>

      <p className="message">
        {sessionStats?.completed > 0
          ? 'Great job! Your translations will help WordPress users worldwide.'
          : 'No worries! Come back anytime to contribute.'}
      </p>

      <button className="btn-outline" onClick={onDone}>
        Back to Dashboard <ArrowRight size={20} style={{ marginLeft: 8 }} />
      </button>
    </div>
  </div>
);

export default App;
