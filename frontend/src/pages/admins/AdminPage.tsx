import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  Plug,
  Database,
  Trash2,
  FileText,
  PenTool,
  AlertTriangle,
  BarChart3,
  Building2,
} from 'lucide-react';
import { PageWrapper } from '@components/layout';
import { ApiAccessTab } from '@/pages/admins/components/ApiAccessTab';
import { DatabaseConnectionTab } from '@/pages/admins/components/DatabaseConnectionTab';
import { DatabaseActionsTab } from '@/pages/admins/components/DatabaseActionsTab';
import { DeleteCouchdbTab } from '@/pages/admins/components/DeleteCouchdbTab';
import { OrganizationsTab } from '@/pages/admins/components/OrganizationsTab';
import { PdfGeneratorTab } from '@/pages/admins/components/PdfGeneratorTab';
import { SignatureTab } from '@/pages/admins/components/SignatureTab';
import { TruncateDatabaseTab } from '@/pages/admins/components/TruncateDatabaseTab';
import { VisualizationsTab } from '@/pages/admins/components/VisualizationsTab';
import styles from './AdminPage.module.css';

type AdminTabType =
  | 'ORGANIZATIONS'
  | 'API_ACCESS'
  | 'DB_CONNECTION'
  | 'DATABASE'
  | 'DELETE_COUCHDB'
  | 'VISUALIZATIONS'
  | 'PDF_GENERATOR'
  | 'SIGNATURE'
  | 'TRUNCATE_DATABASE';

interface Tab {
  id: AdminTabType;
  label: string;
  icon: React.ReactNode;
  color: string;
  danger?: boolean;
}

const TABS: Tab[] = [
  { id: 'ORGANIZATIONS', label: 'Organisations', icon: <Building2 size={18} />, color: '#8b5cf6' },
  { id: 'API_ACCESS', label: "API d'accès", icon: <Key size={18} />, color: '#3b82f6' },
  { id: 'DB_CONNECTION', label: 'Connexion BD', icon: <Plug size={18} />, color: '#0ea5e9' },
  { id: 'DATABASE', label: 'Base de données', icon: <Database size={18} />, color: '#22c55e' },
  { id: 'DELETE_COUCHDB', label: 'Supprimer CouchDB', icon: <Trash2 size={18} />, color: '#f59e0b', danger: true },
  { id: 'VISUALIZATIONS', label: 'Visualisations', icon: <BarChart3 size={18} />, color: '#14b8a6' },
  { id: 'PDF_GENERATOR', label: 'Générateur PDF', icon: <FileText size={18} />, color: '#8b5cf6' },
  { id: 'SIGNATURE', label: 'Signature', icon: <PenTool size={18} />, color: '#06b6d4' },
  { id: 'TRUNCATE_DATABASE', label: 'Tronquer BD', icon: <AlertTriangle size={18} />, color: '#ef4444', danger: true },
];

export default function AdminPage() {
  const [currentTab, setCurrentTab] = useState<AdminTabType>('ORGANIZATIONS');

  const handleTabChange = (tabId: AdminTabType) => {
    setCurrentTab(tabId);
  };

  const renderTabContent = () => {
    const content = (() => {
      switch (currentTab) {
        case 'ORGANIZATIONS':
          return <OrganizationsTab />;
        case 'API_ACCESS':
          return <ApiAccessTab />;
        case 'DB_CONNECTION':
          return <DatabaseConnectionTab />;
        case 'DATABASE':
          return <DatabaseActionsTab />;
        case 'DELETE_COUCHDB':
          return <DeleteCouchdbTab />;
        case 'VISUALIZATIONS':
          return <VisualizationsTab />;
        case 'PDF_GENERATOR':
          return <PdfGeneratorTab />;
        case 'SIGNATURE':
          return <SignatureTab />;
        case 'TRUNCATE_DATABASE':
          return <TruncateDatabaseTab />;
        default:
          return null;
      }
    })();

    return (
      <motion.div
        key={currentTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        {content}
      </motion.div>
    );
  };

  return (
    <PageWrapper
      title="Administration"
      subtitle="Configuration et maintenance du système"
    >
      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${currentTab === tab.id ? styles.tabActive : ''} ${tab.danger ? styles.tabDanger : ''}`}
              onClick={() => handleTabChange(tab.id)}
              style={{ '--tab-color': tab.color } as React.CSSProperties}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        <AnimatePresence mode="wait">
          {renderTabContent()}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
