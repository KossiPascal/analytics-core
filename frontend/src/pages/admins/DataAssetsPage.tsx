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
import { DatasetChartTab } from './components/datasets/DatasetCharts/DatasetChartTab';
import { DatasetFieldTab } from './components/datasets/DatasetFieldTab';
import { DatasetQueryTab } from './components/datasets/DatasetQueries/DatasetQueryTab';
import { DatasetTab } from './components/datasets/DatasetTab';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { Tenant } from '@/models/identity.model';
import { tenantService } from '@/services/identity.service';
import { FaDatabase } from 'react-icons/fa';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type TabType =
  | "types_tab"
  | "datasource_tab"
  | "permissions_tab"
  | "dataset_tab"
  | "field_tab"
  | "query_tab"
  | "chart_tab";


export default function DataAssetsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('chart_tab');
  const [activeName, setActiveName] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenant_id, setTenantId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const crudRef = useRef<AdminEntityCrudModuleRef>(null);

  const { user } = useAuth();

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

  const didLoad = useRef(false);
  const didActiveLoad = useRef(false);

  useEffect(() => {
    if (didActiveLoad.current) return;
    didActiveLoad.current = true;
    handleActiveTab();
  }, []);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    tenantService.all().then(t => {
      setTenants(t || []);
      setTenantId(user?.tenant_id);
      setLoading(false);
    });
  }, []);

  const tabs: { key: TabType; label: string; icon: JSX.Element }[] = [
    { key: 'types_tab', label: 'Types', icon: <Shield size={18} /> },
    { key: 'datasource_tab', label: 'DataSources', icon: <ShieldCheck size={18} /> },
    { key: 'permissions_tab', label: 'Permissions', icon: <ShieldCheck size={18} /> },
    { key: 'dataset_tab', label: 'Main Dataset', icon: <Shield size={18} /> },
    { key: 'field_tab', label: 'Dataset Field', icon: <ShieldCheck size={18} /> },
    { key: 'query_tab', label: 'Dataset Query', icon: <ShieldCheck size={18} /> },
    { key: 'chart_tab', label: 'Dataset Chart', icon: <ShieldCheck size={18} /> },
  ];

  const TenantForm = () => {
    return (
      // <div className="grid grid-cols-1 gap-2 mt-0">
      <FormSelect
        label={`Tenant List`}
        value={tenant_id}
        options={tenants.map((c) => ({ value: c.id, label: c.name }))}
        onChange={(val) => setTenantId(val)}
        placeholder="Sélectionner Tenant"
        leftIcon={<FaDatabase />}
        required={true}
      />
      // </div>
    );
  }

  const centerStyles:any = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center' };

  return (
    <PageWrapper
      title="Gestion des Datasources & Datasets"
      subtitle="Datasets/Fields/Queries/Chart"
      actions={
        <>
          {activeName && (
            <div className={shared.headerActions}>
              <TenantForm />

              <Button variant="ghost" size="sm" onClick={handleAddNew}>
                <Plus size={16} /> {activeName}
                {/* <RefreshCw size={16} className="animate-spin" /> */}
              </Button>
            </div>
          )}
        </>
      }
    >
      {loading ? (
        <div style={centerStyles}>
          <Building2 size={48} />
          <p>Initialisation en cours ...</p>
          <RefreshCw size={24} className="animate-spin" />
        </div>
      ) : tenant_id ? (
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
              {activeTab === 'datasource_tab' && <DataSourceTab ref={crudRef} tenants={tenants} tenant_id={tenant_id} />}
              {activeTab === 'permissions_tab' && <DataSourcePermissionTab ref={crudRef} tenants={tenants} tenant_id={tenant_id} />}
              {activeTab === 'dataset_tab' && <DatasetTab ref={crudRef} tenants={tenants} tenant_id={tenant_id} />}
              {activeTab === 'field_tab' && <DatasetFieldTab ref={crudRef} tenants={tenants} tenant_id={tenant_id} />}
              {activeTab === 'query_tab' && <DatasetQueryTab ref={crudRef} tenants={tenants} tenant_id={tenant_id} />}
              {activeTab === 'chart_tab' && <DatasetChartTab ref={crudRef} tenants={tenants} tenant_id={tenant_id} />}
            </div>
          </CardBody>
        </Card>
      ) : (
        <div style={centerStyles}>
          <Building2 size={48} />
          <p>Aucun tenant selectionné</p>
          <TenantForm />
        </div>
      )}
    </PageWrapper>
  );
}