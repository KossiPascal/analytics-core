import { useState } from 'react';
import { Mic, List, RefreshCw } from 'lucide-react';
import { PageWrapper } from '@components/layout/PageWrapper/PageWrapper';
import { Card, CardBody } from '@components/ui/Card/Card';
import { Button } from '@components/ui/Button/Button';
import { MeetingsListTab } from './components/MeetingsListTab';
import { NewMeetingWizard } from './components/NewMeetingWizard';
import styles from './MeetingIntelligence.module.css';
import shared from '@components/ui/styles/shared.module.css';

type TabType = 'list' | 'new';

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'list', label: 'Réunions',          icon: <List size={18} /> },
  { key: 'new',  label: 'Nouvelle Réunion',  icon: <Mic  size={18} /> },
];

export default function MeetingIntelligencePage() {
  const [activeTab,   setActiveTab]   = useState<TabType>('list');
  const [refreshKey,  setRefreshKey]  = useState(0);

  const handleMeetingCreated = () => {
    setRefreshKey((k) => k + 1);
    setActiveTab('list');
  };

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <PageWrapper
      title="Intelligence Réunion"
      subtitle="Transcription automatique + résumé IA + rapport PDF"
      actions={
        <div className={shared.headerActions}>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw size={16} />
          </Button>
        </div>
      }
    >
      <Card>
        <CardBody>
          {/* ── Tabs ── */}
          <div className={styles.tabsContainer}>
            <div className={styles.tabsList}>
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`${styles.tabItem} ${activeTab === tab.key ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab content ── */}
          <div className={styles.tabContent}>
            {activeTab === 'list' && (
              <MeetingsListTab key={refreshKey} refreshKey={refreshKey} />
            )}
            {activeTab === 'new' && (
              <NewMeetingWizard onMeetingCreated={handleMeetingCreated} />
            )}
          </div>
        </CardBody>
      </Card>
    </PageWrapper>
  );
}
