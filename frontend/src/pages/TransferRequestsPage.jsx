import { useAuth } from '../context/AuthContext';
import SubpageLayout from '../components/SubpageLayout';
import TransferRequestsInbox from '../components/TransferRequestsInbox';

export default function TransferRequestsPage() {
  const { user } = useAuth();

  return (
    <SubpageLayout activePage="transfer-requests">
      <div className="max-w-6xl mx-auto">
        <TransferRequestsInbox showEmptyMessage={true} />
      </div>
    </SubpageLayout>
  );
}
