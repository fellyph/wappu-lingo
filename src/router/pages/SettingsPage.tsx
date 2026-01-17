import { useSettings } from '../../hooks/useSettings';
import SettingsScreen from '../../components/SettingsScreen';

export const SettingsPage = () => {
  const settings = useSettings();

  return (
    <SettingsScreen
      settings={settings}
      onLocaleChange={settings.setLocale}
      onProjectChange={settings.setProject}
      onStringsPerSessionChange={settings.setStringsPerSession}
    />
  );
};
