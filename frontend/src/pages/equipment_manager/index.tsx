import { useState } from 'react';
import { PageWrapper } from '@components/layout/PageWrapper/PageWrapper';
import { Card, CardBody } from '@components/ui/Card/Card';
import { Button } from '@components/ui/Button/Button';
import {
  LayoutDashboard, MapPin, Users, UserCheck, Smartphone, Ticket, Building2, RefreshCw,
} from 'lucide-react';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { LocationsTab } from './components/locations/LocationsTab';
import { AscsTab } from './components/ascs/AscsTab';
import { SupervisorsTab } from './components/supervisors/SupervisorsTab';
import { EquipmentTab } from './components/equipment/EquipmentTab';
import { TicketsTab } from './components/tickets/TicketsTab';
import { EmployeesTab } from './components/employees/EmployeesTab';
import styles from './EquipmentManager.module.css';
import shared from '@components/ui/styles/shared.module.css';

type TabType = 'dashboard' | 'locations' | 'ascs' | 'supervisors' | 'equipment' | 'tickets' | 'employees';

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { key: 'locations', label: 'Localisations', icon: <MapPin size={18} /> },
  { key: 'ascs', label: 'ASCs', icon: <Users size={18} /> },
  { key: 'supervisors', label: 'Superviseurs', icon: <UserCheck size={18} /> },
  { key: 'equipment', label: 'Equipements', icon: <Smartphone size={18} /> },
  { key: 'tickets', label: 'Tickets', icon: <Ticket size={18} /> },
  { key: 'employees', label: 'Employes', icon: <Building2 size={18} /> },
];

export default function EquipmentManagerPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <PageWrapper
      title="Gestion des Equipements"
      subtitle="ASCs, equipements, tickets de reparation et employes"
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
            {activeTab === 'dashboard' && <DashboardTab key={refreshKey} />}
            {activeTab === 'locations' && <LocationsTab key={refreshKey} />}
            {activeTab === 'ascs' && <AscsTab key={refreshKey} />}
            {activeTab === 'supervisors' && <SupervisorsTab key={refreshKey} />}
            {activeTab === 'equipment' && <EquipmentTab key={refreshKey} />}
            {activeTab === 'tickets' && <TicketsTab key={refreshKey} />}
            {activeTab === 'employees' && <EmployeesTab key={refreshKey} />}
          </div>
        </CardBody>
      </Card>
    </PageWrapper>
  );
}
