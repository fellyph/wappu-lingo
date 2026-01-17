import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { useTranslationSessionContext } from '../../context/TranslationSessionContext';
import { fetchUserStats } from '../../services/translations';
import Dashboard from '../../components/Dashboard';

interface Stats {
  translated: number;
  approved: number;
}

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const settings = useSettings();
  const session = useTranslationSessionContext();
  const [stats, setStats] = useState<Stats>({ translated: 0, approved: 0 });

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

  const handleStart = async () => {
    await session.startSession({
      projectSlug: settings.project.slug,
      projectName: settings.project.name,
      localeSlug: settings.locale,
      sampleSize: settings.stringsPerSession,
      userId: user?.hash || user?.profile_url?.split('/').pop() || 'anonymous',
      userEmail: user?.email || null,
    });
    navigate('/translate');
  };

  return (
    <Dashboard
      stats={stats}
      onStart={handleStart}
      user={user}
      onLogout={logout}
      isSessionLoading={session.isLoading}
      currentProject={settings.project}
      availableProjects={settings.availableProjects}
      onProjectChange={settings.setProject}
    />
  );
};
