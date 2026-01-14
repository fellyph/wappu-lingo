import { Globe, Package, Hash } from 'lucide-react';

const SettingsScreen = ({
  settings,
  onLocaleChange,
  onProjectChange,
  onStringsPerSessionChange,
}) => {
  const { localeObj, project, stringsPerSession, availableLocales, availableProjects } = settings;

  return (
    <div className="screen animate-fade-in">
      <header className="header-navy">
        <h1>Settings</h1>
      </header>

      <div className="settings-content">
        {/* Locale Selection */}
        <div className="settings-section">
          <label className="settings-label">
            <Globe size={20} />
            Translation Language
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
            Project
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
            Strings per Session
          </label>
          <select
            value={stringsPerSession}
            onChange={(e) => onStringsPerSessionChange(parseInt(e.target.value, 10))}
            className="settings-select"
          >
            {[5, 10, 15, 20, 25, 30].map((num) => (
              <option key={num} value={num}>
                {num} strings
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
