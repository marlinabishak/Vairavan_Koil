import { Link } from 'react-router-dom';
import RequestsInbox from '../components/RequestsInbox.jsx';
import { useAuth } from '../context/AuthContext';
import SubpageLayout from '../components/SubpageLayout';

export default function RequestsPage() {
  const { user } = useAuth();

  return (
    <SubpageLayout activePage="requests">
      <div className="max-w-6xl mx-auto">
        <RequestsInbox showEmptyMessage={true} />
      </div>
    </SubpageLayout>
  );
}
