import { JSX, useEffect, useRef, useState } from 'react';
import { Button } from '@components/ui/Button/Button';
import { Card, CardBody } from '@components/ui/Card/Card';
import { Modal } from '@components/ui/Modal/Modal';
import { PageWrapper } from '@components/layout/PageWrapper/PageWrapper';
import { Plus, ShieldCheck, RefreshCw, Code } from 'lucide-react';
import { AdminEntityCrudModuleRef } from '@/pages/admins/AdminEntityCrudModule';
import { DatasetChartTab } from './components/datasets/DatasetCharts/DatasetChartTab';
import { DatasetFieldTab } from './components/datasets/DatasetFieldTab';
import { DatasetQueryTab } from './components/datasets/DatasetQueries/DatasetQueryTab';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { Tenant } from '@/models/identity.model';
import { tenantService } from '@/services/identity.service';
import { FaDatabase } from 'react-icons/fa';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Dataset } from '@/models/dataset.models';
import { datasetService } from '@/services/dataset.service';

import shared from '@components/ui/styles/shared.module.css';
import styles from '@pages/admins/AdminPage.module.css';
import QueryBuilderPage from './components/datasets/QueryBuilder/QueryBuilderPage';

type TabType =
  | "field_tab"
  | "query_tab"
  | "chart_tab";


export default function DataVisualisationPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenant_id, setTenantId] = useState<number | undefined>(undefined);

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [dataset_id, setDatasetId] = useState<number | undefined>();

  const [activeTab, setActiveTab] = useState<TabType>('chart_tab');
  const [activeName, setActiveName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);

  const crudRef = useRef<AdminEntityCrudModuleRef>(null);

  const { user } = useAuth();

  const handleAddNew = () => {
    crudRef.current?.handleNew();
  };

  const handleActiveTab = (key: TabType = activeTab) => {
    setActiveTab(key);

    switch (key) {
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
    tenantService.list().then(t => {
      setTenants(t || []);
      setTenantId(user?.tenant_id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!tenant_id) return;
    datasetService.list(tenant_id).then(d => setDatasets(d || []));
  }, [tenant_id]);

  const tabs: { key: TabType; label: string; icon: JSX.Element }[] = [
    { key: 'field_tab', label: 'Dataset Field', icon: <ShieldCheck size={18} /> },
    { key: 'query_tab', label: 'Dataset Query', icon: <ShieldCheck size={18} /> },
    { key: 'chart_tab', label: 'Dataset Chart', icon: <ShieldCheck size={18} /> },
  ];

  // <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}><div>
  // <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}></div>

  const TenantForm = () => (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <FormSelect
          label={`Tenant List`}
          value={tenant_id}
          options={tenants.map((c) => ({ value: c.id, label: c.name }))}
          onChange={(val) => setTenantId(val)}
          placeholder="Sélectionner Tenant"
          leftIcon={<FaDatabase />}
          required={true}
        />

        <FormSelect
          label={`Dataset List`}
          value={dataset_id}
          options={datasets.map((c) => ({ value: c.id, label: c.name }))}
          onChange={(value) => setDatasetId(value)}
          placeholder="Sélectionner Dataset"
          leftIcon={<FaDatabase />}
          required={true}
        />

        {/* <FormSelect
          label={`Dataset List`}
          value={options.dataset_id}
          options={datasets.map((c) => ({ value: c.id, label: c.name }))}
          onChange={(value) => setOptions({ ...options, dataset_id: value, query_id: undefined })}
          placeholder="Sélectionner Dataset"
          leftIcon={<FaDatabase />}
          required={true}
        />


        <FormSelect
          label={`Dataset List`}
          value={dataset_id}
          options={datasets.map((c) => ({ value: c.id, label: c.name }))}
          onChange={(value) => setDatasetId(value)}
          placeholder="Sélectionner Dataset"
          leftIcon={<FaDatabase />}
          required={true}
        /> */}
      </div>
    </>
  );

  const centerStyles: any = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center' };

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
              </Button>

              {activeTab === 'query_tab' && (
                <Button variant="outline" size="sm" onClick={() => setShowQueryBuilder(true)}>
                  <Code size={16} /> Query Builder
                </Button>
              )}
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
              {(activeTab === 'field_tab' && dataset_id) && <DatasetFieldTab ref={crudRef} tenants={tenants} tenant_id={tenant_id} datasets={datasets} dataset_id={dataset_id} />}
              {(activeTab === 'query_tab' && dataset_id) && <DatasetQueryTab ref={crudRef} tenants={tenants} tenant_id={tenant_id} datasets={datasets} dataset_id={dataset_id} />}
              {(activeTab === 'chart_tab' && dataset_id) && <DatasetChartTab ref={crudRef} tenants={tenants} tenant_id={tenant_id} datasets={datasets} dataset_id={dataset_id} />}
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

      {/* QUERY BUILDER MODAL */}
      <Modal
        isOpen={showQueryBuilder}
        onClose={() => setShowQueryBuilder(false)}
        title="Query Builder"
        size="full"
      >
        <QueryBuilderPage embedded />
      </Modal>
    </PageWrapper>
  );
}
