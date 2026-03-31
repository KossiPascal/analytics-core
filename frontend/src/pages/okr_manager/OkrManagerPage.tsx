import { useState } from 'react';
import { PageWrapper } from '@components/layout/PageWrapper/PageWrapper';
import { Card, CardBody } from '@components/ui/Card/Card';
import { Button } from '@components/ui/Button/Button';
import { LayoutDashboard, FolderKanban, Target, ListChecks, FileBarChart2, RefreshCw, ClipboardList } from 'lucide-react';

// import { AnalyticsWorkspace } from './workspaces/AnalyticsWorkspace';
// import { OkrWorkspace } from './workspaces/OkrWorkspace';
// import { ProgramWorkspace } from './workspaces/ProgramWorkspace';
// import { ProjectWorkspace } from './workspaces/ProjectWorkspace';
// import { StrategyWorkspace } from './workspaces/StrategyWorkspace';

import { lazy, Suspense } from 'react';

const StrategyWorkspace = lazy(() => import('./workspaces/StrategyWorkspace'));
const ProgramWorkspace = lazy(() => import('./workspaces/ProgramWorkspace'));
const ProjectWorkspace = lazy(() => import('./workspaces/ProjectWorkspace'));
const OkrWorkspace = lazy(() => import('./workspaces/OkrWorkspace'));
const AnalyticsWorkspace = lazy(() => import('./workspaces/AnalyticsWorkspace'));

import shared from '@components/ui/styles/shared.module.css';
import styles from './OkrManagerPage.module.css';

type TabType =
  | "StrategyWorkspace"
  | "ProgramWorkspace"
  | "ProjectWorkspace"
  | "OkrWorkspace"
  | "AnalyticsWorkspace";

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'StrategyWorkspace', label: 'Strategy', icon: <LayoutDashboard size={18} /> },
  { key: 'ProgramWorkspace', label: 'Programs', icon: <FolderKanban size={18} /> },
  { key: 'ProjectWorkspace', label: 'Projects', icon: <Target size={18} /> },
  { key: 'OkrWorkspace', label: 'OKR', icon: <ListChecks size={18} /> },
  { key: 'AnalyticsWorkspace', label: 'Analytics', icon: <ClipboardList size={18} /> },
];

export default function OkrManagerPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    return (new URLSearchParams(window.location.search).get('tab') as TabType) || 'StrategyWorkspace';
  });

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    window.history.replaceState({}, '', `?${params.toString()}`);
  };

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <PageWrapper
      title="Projets & ORCs"
      subtitle="Gestion de projets, objectifs de résultats clés, activités et rapports"
      actions={
        <div className={shared.headerActions}>
          <Button variant="ghost" size="sm" onClick={handleRefresh} title="Rafraîchir">
            <RefreshCw size={16} />
          </Button>
        </div>
      }
    >
      <Card>
        <CardBody>
          {/* Tabs */}
          <div className={styles.tabsContainer}>
            <div className={styles.tabsList}>
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`${styles.tabItem} ${activeTab === tab.key ? styles.active : ''}`}
                  onClick={() => handleTabChange(tab.key)}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
         <Suspense fallback={<div>Loading...</div>}>
            {activeTab === 'StrategyWorkspace' && <StrategyWorkspace key={refreshKey} />}
            {activeTab === 'ProgramWorkspace' && <ProgramWorkspace key={refreshKey} />}
            {activeTab === 'ProjectWorkspace' && <ProjectWorkspace key={refreshKey} />}
            {activeTab === 'OkrWorkspace' && <OkrWorkspace key={refreshKey} />}
            {activeTab === 'AnalyticsWorkspace' && <AnalyticsWorkspace key={refreshKey} />}
          </Suspense>
        </CardBody>
      </Card>
    </PageWrapper>
  );
}




// const ProjectWorkspace = lazy(() => import('./workspaces/ProjectWorkspace'));



