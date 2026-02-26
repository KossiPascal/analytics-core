import { JSX, useEffect, useRef, useState } from 'react';
import { Button } from '@components/ui/Button/Button';
import { Card, CardBody } from '@components/ui/Card/Card';
import { PageWrapper } from '@components/layout/PageWrapper/PageWrapper';
import { Users, Plus, Shield, ShieldCheck, RefreshCw } from 'lucide-react';
import { AdminEntityCrudModuleRef } from '@/pages/admins/AdminEntityCrudModule';

import shared from '@components/ui/styles/shared.module.css';
import styles from '@pages/admins/AdminPage.module.css';
import { DataSourceTab } from './components/datasources/DataSourceTab';
import { DataSourceTypeTab } from './components/datasources/DataSourceTypeTab';
import { DataSourcePermissionTab } from './components/datasources/DataSourcePermissionTab';

type TabType =
  | "types_tab"
  | "datasource_tab"
  | "permissions_tab";


export default function DataSourcesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('types_tab');
  const [activeName, setActiveName] = useState<string | null>(null);
  const crudRef = useRef<AdminEntityCrudModuleRef>(null);

  const handleAddNew = () => {
    crudRef.current?.handleNew();
  };

  const handleActiveTab = (key: TabType = activeTab) => {
    setActiveTab(key);

    switch (key) {
      case 'types_tab':
        setActiveName("Ajouter Nouveau Type");
        break;
      case 'datasource_tab':
        setActiveName("Ajouter Nouveau Datasource");
        break;
      case 'permissions_tab':
        setActiveName("Ajouter Nouvelle permissions");
        break;
      default:
        setActiveName(null);
        break;
    }
  };

  useEffect(() => {
    handleActiveTab();
  }, []);

  const tabs: { key: TabType; label: string; icon: JSX.Element }[] = [
    { key: 'types_tab', label: 'Types', icon: <Shield size={18} /> },
    { key: 'datasource_tab', label: 'DataSources', icon: <ShieldCheck size={18} /> },
    { key: 'permissions_tab', label: 'Permissions', icon: <ShieldCheck size={18} /> },
  ];

  return (
    <PageWrapper
      title="Gestion des utilisateurs"
      subtitle="Utilisateurs, rôles et permissions"
      actions={
        <>
          {activeName && (<div className={shared.headerActions}>
            <Button variant="ghost" size="sm" onClick={handleAddNew}>
              <Plus size={16} /> {activeName}
              {/* <RefreshCw size={16} className="animate-spin" /> */}
            </Button>
          </div>)}
        </>
      }
    >
      <Card>
        <CardBody>
          {/* Tabs */}
          <div className={styles.tabsContainer}>
            <div className={styles.tabsList}>
              {tabs.map((tab) => (
                <button key={tab.key}
                  className={`${styles.tabItem} ${activeTab === tab.key ? styles.active : ''}`}
                  onClick={() => handleActiveTab(tab.key)}
                >
                  <span>{tab.icon} {tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === 'types_tab' && <DataSourceTypeTab ref={crudRef} />}
            {activeTab === 'datasource_tab' && <DataSourceTab ref={crudRef} />}
            {activeTab === 'permissions_tab' && <DataSourcePermissionTab ref={crudRef} />}
          </div>
        </CardBody>
      </Card>
    </PageWrapper>
  );
}
