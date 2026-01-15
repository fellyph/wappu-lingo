import { ArrowRight } from 'lucide-react';
import type { SessionStats } from '../types';

interface SummaryScreenProps {
  onDone: () => void;
  sessionStats: SessionStats;
}

const SummaryScreen: React.FC<SummaryScreenProps> = ({ onDone, sessionStats }) => (
  <div className="screen summary-screen animate-fade-in">
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

export default SummaryScreen;
