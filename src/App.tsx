import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Users, ShieldCheck, Settings } from 'lucide-react';
import { useSettings } from './hooks/useSettings';
import { useTranslationSession } from './hooks/useTranslationSession';
import { fetchUserStats } from './services/translations';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';
import TranslationScreen from './components/TranslationScreen';
import SummaryScreen from './components/SummaryScreen';
import SettingsScreen from './components/SettingsScreen';
import ActivityScreen from './components/ActivityScreen';
import type { GravatarProfile } from './types';

const REDIRECT_URI = window.location.origin + '/';

type ScreenType = 'dashboard' | 'translating' | 'summary' | 'settings' | 'activity';

interface Stats {
  translated: number;
  approved: number;
}

const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenType>('dashboard');
  const [stats, setStats] = useState<Stats>({ translated: 0, approved: 0 });
  const [translationValue, setTranslationValue] = useState('');
  const [user, setUser] = useState<GravatarProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('gravatar_token'));
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  // Use new hooks
  const settings = useSettings();
  const session = useTranslationSession();

  const { t } = useTranslation();

  // Fetch config (client ID) from server
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json() as Promise<{ gravatarClientId: string }>)
      .then((data) => {
        setClientId(data.gravatarClientId);
      })
      .catch((err) => {
        console.error('Failed to fetch config:', err);
      });
  }, []);

  // Fetch user stats from the database when user is loaded
  useEffect(() => {
    if (user) {
      const userId = user.hash || user.profile_url?.split('/').pop() || '';
      if (userId) {
        fetchUserStats(userId)
          .then((userStats) => {
            setStats({
              translated: userStats.total,
              approved: userStats.byStatus['approved'] || 0,
            });
          })
          .catch(() => {
            // Keep default stats on error
          });
      }
    }
  }, [user]);

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
    if (!clientId) return;
    const scopes = ['auth', 'gravatar-profile:read'].map((s, i) => `scope[${i}]=${s}`).join('&');
    const authUrl = `https://public-api.wordpress.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&${scopes}`;
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
    return <LoginScreen onLogin={handleLogin} isLoading={!clientId} />;
  }

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" aria-hidden="true" />
        <span className="loading-text">{t('app.loading')}</span>
      </div>
    );
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
            currentProject={settings.project}
            availableProjects={settings.availableProjects}
            onProjectChange={settings.setProject}
          />
        )}
        {screen === 'translating' && (
          <TranslationScreen
            value={translationValue}
            onChange={(e) => setTranslationValue(e.target.value)}
            onTranscription={(text) => setTranslationValue(text)}
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
        {screen === 'activity' && (
          <ActivityScreen
            userId={user?.hash || user?.profile_url?.split('/').pop() || null}
          />
        )}
      </main>

      <nav className="bottom-nav" aria-label={t('nav.main')}>
        <button
          className={screen === 'dashboard' ? 'active' : ''}
          onClick={() => setScreen('dashboard')}
          aria-label={t('nav.home')}
          aria-current={screen === 'dashboard' ? 'page' : undefined}
        >
          <Home size={24} aria-hidden="true" />
        </button>
        <button
          className={screen === 'activity' ? 'active' : ''}
          onClick={() => setScreen('activity')}
          aria-label={t('nav.activity')}
          aria-current={screen === 'activity' ? 'page' : undefined}
        >
          <Users size={24} aria-hidden="true" />
        </button>
        <button
          aria-label={t('nav.badges')}
          disabled
        >
          <ShieldCheck size={24} aria-hidden="true" />
        </button>
        <button
          className={screen === 'settings' ? 'active' : ''}
          onClick={() => setScreen('settings')}
          aria-label={t('nav.settings')}
          aria-current={screen === 'settings' ? 'page' : undefined}
        >
          <Settings size={24} aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
};

export default App;
