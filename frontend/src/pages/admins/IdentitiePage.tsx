import { JSX, useEffect, useRef, useState } from 'react';
import { PageWrapper } from '@components/layout/PageWrapper/PageWrapper';
import { Card, CardBody } from '@components/ui/Card/Card';
import { Button } from '@components/ui/Button/Button';
import { UsersTab } from '@pages/admins/components/identities/UsersTab';
import { RolesTab } from '@pages/admins/components/identities/RolesTab';
import { PermissionsTab } from '@pages/admins/components/identities/PermissionsTab';
import { TenantsTab } from '@pages/admins/components/identities/TenantsTab';
import { Users, Shield, ShieldCheck, Plus } from 'lucide-react';
import { RolesPermissionsTab } from '@pages/admins/components/identities/RolesPermissionsTab';
import { UsersLogsTab } from '@pages/admins/components/identities/UsersLogsTab';
import { UsersRolesTab } from '@pages/admins/components/identities/UsersRolesTab';
import { OrgunitsTab } from '@pages/admins/components/identities/OrgunitsTab';
import { AdminEntityCrudModuleRef } from '@/pages/admins/AdminEntityCrudModule';
import { UserFormModal } from '@pages/admins/components/identities/UserFormModal';
import { HostLinkssTab } from './components/identities/HostLinkssTab';

import shared from '@components/ui/styles/shared.module.css';
import styles from '@pages/admins/AdminPage.module.css';

type TabType =
  | "tenants_tab"
  | "host_links_tab"
  | "orgunits_tab"
  | "users_tab"
  | "roles_tab"
  | "permissions_tab"
  | "users_logs_tab"
  | "roles_permissions_tab"
  | "users_roles_tab";



export default function IdentitiesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('tenants_tab');
  const [activeName, setActiveName] = useState<string | null>(null);
  const crudRef = useRef<AdminEntityCrudModuleRef>(null);

  // UserFormModal pour la création directe depuis le bouton "+"
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [usersRefreshKey, setUsersRefreshKey] = useState(0);


  const handleAddNew = () => {
    if (activeTab === 'users_tab') {
      setUserFormOpen(true);
    } else {
      crudRef.current?.handleNew();
    }
  };

  const handleActiveTab = (key: TabType = activeTab) => {
    setActiveTab(key);

    switch (key) {
      case 'tenants_tab':
        setActiveName("Ajouter Nouveau Tenant");
        break;
      case 'host_links_tab':
        setActiveName("Ajouter Nouvelle Source Tenant");
        break;
      case 'users_tab':
        setActiveName("Ajouter Nouveau User");
        break;
      case 'roles_tab':
        setActiveName("Ajouter Nouveau Role");
        break;
      case 'permissions_tab':
        setActiveName("Ajouter Nouvelle Permission");
        break;
      case 'orgunits_tab':
        setActiveName("Ajouter Nouvelle Orgunit");
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
    { key: 'tenants_tab', label: 'Tenants', icon: <Users size={18} /> },
    { key: 'host_links_tab', label: 'HostLinkss', icon: <Users size={18} /> },
    { key: 'permissions_tab', label: 'Permissions', icon: <ShieldCheck size={18} /> },
    { key: 'roles_tab', label: 'Rôles', icon: <Shield size={18} /> },
    { key: 'orgunits_tab', label: 'Orgunits', icon: <ShieldCheck size={18} /> },
    { key: 'users_tab', label: 'Utilisateurs', icon: <Users size={18} /> },
    { key: 'users_logs_tab', label: 'Users Logs', icon: <ShieldCheck size={18} /> },
    { key: 'users_roles_tab', label: 'Users Roles', icon: <ShieldCheck size={18} /> },
    { key: 'roles_permissions_tab', label: 'Roles Permissions', icon: <ShieldCheck size={18} /> },
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
            {activeTab === 'tenants_tab' && <TenantsTab ref={crudRef} />}
            {activeTab === 'host_links_tab' && <HostLinkssTab ref={crudRef} />}
            {activeTab === 'users_tab' && <UsersTab ref={crudRef} key={usersRefreshKey} />}
            {activeTab === 'roles_tab' && <RolesTab ref={crudRef} />}
            {activeTab === 'permissions_tab' && <PermissionsTab ref={crudRef} />}
            {activeTab === 'orgunits_tab' && <OrgunitsTab ref={crudRef} />}

            {activeTab === 'users_logs_tab' && <UsersLogsTab />}
            {activeTab === 'roles_permissions_tab' && <RolesPermissionsTab />}
            {activeTab === 'users_roles_tab' && <UsersRolesTab />}

            {/* <FormMultiSelectDualPanel
              items={[{ id: '1', name: 'string1' },{ id: '2', name: 'string2' },{ id: '3', name: 'string3' }]}
              selectedItems={[]}
              onChange={(selected: MultiSelectItem[]) => { console.log(selected) }}
              leftTitle={'leftTitle'}
              rightTitle={'rightTitle'}
              searchable={true}
            />

            <FormCascadeTree
              nodes={[{ id: '1', name: 'string', parentId: null, children: [{ id: '2', name: 'string', parentId: null, children: [] }, { id: '3', name: 'string', parentId: null, children: [{ id: '4', name: 'string', parentId: null, children: [] }, { id: '5', name: 'string', parentId: null, children: [] }, { id: '6', name: 'string', parentId: null, children: [] }] }] }]}
              selectedIds={[]}
              onChange={(selectedIds: string[]) => { console.log(selectedIds) }}
            /> */}

          </div>
        </CardBody>
      </Card>
      <UserFormModal
        isOpen={userFormOpen}
        onClose={() => setUserFormOpen(false)}
        onCreated={() => { setUserFormOpen(false); setUsersRefreshKey((k) => k + 1); }}
      />
    </PageWrapper>
  );
}
