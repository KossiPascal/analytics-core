import { useState } from 'react';
import { Button } from '@components/ui/Button/Button';
import { RefreshCw } from 'lucide-react';
import { syncApi } from '../../api';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';

interface Props {
  onSyncComplete: () => void;
}

export function SyncPanel({ onSyncComplete }: Props) {
  const [syncingOrg, setSyncingOrg] = useState(false);

  const handleSyncOrg = async () => {
    setSyncingOrg(true);
    try {
      const res = await syncApi.syncOrgUnits();
      if (res.success && res.data) {
        const d = res.data;
        if (d.error) {
          toast.error(d.error);
        } else {
          toast.success(`Sync OK: ${d.created || 0} crees, ${d.updated || 0} mis a jour`);
          onSyncComplete();
        }
      } else {
        toast.error(res.message || 'Erreur de synchronisation');
      }
    } catch {
      toast.error('Erreur de synchronisation');
    } finally {
      setSyncingOrg(false);
    }
  };

  return (
    <div className={shared.headerActions}>
      <Button variant="outline" size="sm" onClick={handleSyncOrg} isLoading={syncingOrg} leftIcon={<RefreshCw size={14} />}>
        Sync Org Units
      </Button>
    </div>
  );
}
