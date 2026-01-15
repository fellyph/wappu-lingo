import { useTranslation } from 'react-i18next';
import { Globe, Package, Hash, Languages } from 'lucide-react';
import type { UseSettingsReturn } from '../types';

interface SettingsScreenProps {
  settings: UseSettingsReturn;
  onLocaleChange: (locale: string) => void;
  onProjectChange: (projectId: string) => void;
  onStringsPerSessionChange: (count: number) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onLocaleChange,
  onProjectChange,
  onStringsPerSessionChange,
}) => {
  const { t } = useTranslation();
  const {
    localeObj,
    project,
    stringsPerSession,
    availableLocales,
    availableProjects,
    uiLanguage,
    setUILanguage,
    availableUILanguages,
  } = settings;

  return (
    <div className="screen animate-fade-in">
      <header className="header-navy">
        <h1>{t('settings.title')}</h1>
      </header>

      <div className="settings-content">
        {/* UI Language Selection */}
        <div className="settings-section">
          <label className="settings-label">
            <Languages size={20} />
            {t('settings.ui_language')}
          </label>
          <select
            value={uiLanguage}
            onChange={(e) => setUILanguage(e.target.value)}
            className="settings-select"
          >
            {availableUILanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Translation Target Language Selection */}
        <div className="settings-section">
          <label className="settings-label">
            <Globe size={20} />
            {t('settings.translation_language')}
          </label>
          <select
            value={localeObj.code}
            onChange={(e) => onLocaleChange(e.target.value)}
            className="settings-select"
          >
            {availableLocales.map((loc) => (
              <option key={loc.code} value={loc.code}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Project Selection */}
        <div className="settings-section">
          <label className="settings-label">
            <Package size={20} />
            {t('settings.project')}
          </label>
          <select
            value={project.id}
            onChange={(e) => onProjectChange(e.target.value)}
            className="settings-select"
          >
            {availableProjects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>

        {/* Strings per Session */}
        <div className="settings-section">
          <label className="settings-label">
            <Hash size={20} />
            {t('settings.strings_per_session')}
          </label>
          <select
            value={stringsPerSession}
            onChange={(e) => onStringsPerSessionChange(parseInt(e.target.value, 10))}
            className="settings-select"
          >
            {[5, 10, 15, 20, 25, 30].map((num) => (
              <option key={num} value={num}>
                {t('settings.strings_count', { count: num })}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
