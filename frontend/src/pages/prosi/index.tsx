import { useState } from 'react';
import { PageWrapper } from '@components/layout/PageWrapper/PageWrapper';
import { Card, CardBody } from '@components/ui/Card/Card';
import { Button } from '@components/ui/Button/Button';
import {
  LayoutDashboard, FolderKanban, Target, ListChecks,
  FileBarChart2, RefreshCw, ClipboardList,
} from 'lucide-react';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { ProjectsTab } from './components/projects/ProjectsTab';
import { ORCsTab } from './components/orcs/ORCsTab';
import { ActivitiesTab } from './components/activities/ActivitiesTab';
import { ReportsTab } from './components/reports/ReportsTab';
import { EmployeeObjectivesTab } from './components/objectives/EmployeeObjectivesTab';
import styles from './Prosi.module.css';
import shared from '@components/ui/styles/shared.module.css';

type TabType = 'dashboard' | 'projects' | 'orcs' | 'activities' | 'objectives' | 'reports';

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard',  label: 'Tableau de bord',    icon: <LayoutDashboard size={18} /> },
  { key: 'projects',   label: 'Projets',             icon: <FolderKanban size={18} /> },
  { key: 'orcs',       label: 'ORCs',                icon: <Target size={18} /> },
  { key: 'activities', label: 'Activités',           icon: <ListChecks size={18} /> },
  { key: 'objectives', label: 'Objectifs employés',  icon: <ClipboardList size={18} /> },
  { key: 'reports',    label: 'Rapports',            icon: <FileBarChart2 size={18} /> },
];

export default function ProsiPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

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
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === 'dashboard'  && <DashboardTab          key={refreshKey} onNavigate={(t) => setActiveTab(t as TabType)} />}
            {activeTab === 'projects'   && <ProjectsTab           key={refreshKey} />}
            {activeTab === 'orcs'       && <ORCsTab               key={refreshKey} />}
            {activeTab === 'activities' && <ActivitiesTab         key={refreshKey} />}
            {activeTab === 'objectives' && <EmployeeObjectivesTab key={refreshKey} />}
            {activeTab === 'reports'    && <ReportsTab            key={refreshKey} />}
          </div>
        </CardBody>
      </Card>
    </PageWrapper>
  );
}
