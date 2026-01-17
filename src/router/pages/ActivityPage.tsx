import { useAuth } from '../../context/AuthContext';
import ActivityScreen from '../../components/ActivityScreen';

export const ActivityPage = () => {
  const { user } = useAuth();

  const userId = user?.hash || user?.profile_url?.split('/').pop() || null;

  return <ActivityScreen userId={userId} />;
};
