import { JSX, useEffect, useRef, useState } from 'react';
import { Button } from '@components/ui/Button/Button';
import { Card, CardBody } from '@components/ui/Card/Card';
import { PageWrapper } from '@components/layout/PageWrapper/PageWrapper';
import { Users, Plus, Shield, ShieldCheck, RefreshCw } from 'lucide-react';
import { AdminEntityCrudModuleRef } from '@/pages/admins/AdminEntityCrudModule';

import shared from '@components/ui/styles/shared.module.css';
import styles from '@pages/admins/AdminPage.module.css';
import { DatasetTab } from './components/datasets/DatasetTab';
import { DatasetFieldTab } from './components/datasets/DatasetFieldTab';
import { DatasetQueryTab } from './components/datasets/DatasetQueryTab';
import { DatasetChartTab } from './components/datasets/DatasetChartTab';


type TabType =
  | "dataset_tab"
  | "field_tab"
  | "query_tab"
  | "chart_tab";


export default function DatasetsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dataset_tab');
  const [activeName, setActiveName] = useState<string | null>(null);
  const crudRef = useRef<AdminEntityCrudModuleRef>(null);

  const handleAddNew = () => {
    crudRef.current?.handleNew();
  };

  const handleActiveTab = (key: TabType = activeTab) => {
    setActiveTab(key);

    switch (key) {
      case 'dataset_tab':
        setActiveName("Ajouter Nouveau Dataset");
        break;
      case 'field_tab':
        setActiveName("Ajouter Nouveau Dataset Field");
        break;
      case 'query_tab':
        setActiveName("Ajouter Nouvelle Dataset Query");
        break;
      case 'chart_tab':
        setActiveName("Ajouter Nouvelle Dataset Chart");
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
    { key: 'dataset_tab', label: 'Main Dataset', icon: <Shield size={18} /> },
    { key: 'field_tab', label: 'Dataset Field', icon: <ShieldCheck size={18} /> },
    { key: 'query_tab', label: 'Dataset Query', icon: <ShieldCheck size={18} /> },
    { key: 'chart_tab', label: 'Dataset Chart', icon: <ShieldCheck size={18} /> },
  ];

  return (
    <PageWrapper
      title="Gestion des datasets"
      subtitle="Datasets/Fields/Queries/Charts"
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
            {activeTab === 'dataset_tab' && <DatasetTab ref={crudRef} />}
            {activeTab === 'field_tab' && <DatasetFieldTab ref={crudRef} />}
            {activeTab === 'query_tab' && <DatasetQueryTab ref={crudRef} />}
            {activeTab === 'chart_tab' && <DatasetChartTab ref={crudRef} />}
          </div>
        </CardBody>
      </Card>
    </PageWrapper>
  );
}
