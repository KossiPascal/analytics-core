import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { PageWrapper } from '@components/layout';
import { GraduationLoader } from '@components/loaders/GraduationLoader/GraduationLoader';
import { useDashboard } from '@/contexts/OLD/useDashboard';
import { DashboardFilters, VaccinationTable } from '@pages/dashboards/components';
import type { DashboardFilterParams } from '@/stores/OLD/dashboard.store';
import styles from './RealtimeDashboard.module.css';

type TabType = 'ALL_DONE' | 'PARTIAL_DONE' | 'NOT_DONE';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const TABS: Tab[] = [
  { id: 'ALL_DONE', label: 'Vaccinations complètes', icon: <CheckCircle2 size={18} />, color: '#22c55e' },
  { id: 'PARTIAL_DONE', label: 'Vaccinations partielles', icon: <AlertCircle size={18} />, color: '#f59e0b' },
  { id: 'NOT_DONE', label: 'Non vaccinés', icon: <XCircle size={18} />, color: '#ef4444' },
];

export default function RealtimeDashboard() {
  const {
    vaccinationAllDoneData,
    vaccinationPartialDoneData,
    vaccinationNotDoneData,
    status,
    filters,
    activeRealtimeTab,
    setActiveRealtimeTab,
    fetchAllVaccinationDashboards,
  } = useDashboard();

  const [currentTab, setCurrentTab] = useState<TabType>(activeRealtimeTab);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleTabChange = (tabId: TabType) => {
    setCurrentTab(tabId);
    setActiveRealtimeTab(tabId);
  };

  const handleFilter = async (filterParams: DashboardFilterParams) => {
    // Fetch all vaccination data at once
    await fetchAllVaccinationDashboards(filterParams);
    setLastUpdate(new Date());
  };

  const isAnyLoading =
    status.RECOS_VACCINES_ALL_DONE.isLoading ||
    status.RECOS_VACCINES_PARTIAL_DONE.isLoading ||
    status.RECOS_VACCINES_NOT_DONE.isLoading;

  const getChildCount = (type: TabType): number => {
    const data = type === 'ALL_DONE'
      ? vaccinationAllDoneData
      : type === 'PARTIAL_DONE'
        ? vaccinationPartialDoneData
        : vaccinationNotDoneData;

    return data?.reduce((sum, reco) => {
      return sum + (reco.children_vaccines?.reduce((famSum:any, fam:any) => famSum + (fam.data?.length || 0), 0) || 0);
    }, 0) || 0;
  };

  const formatLastUpdate = (): string => {
    if (!lastUpdate) return '-';
    const diff = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000);
    if (diff < 60) return `il y a ${diff}s`;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
    return lastUpdate.toLocaleTimeString('fr-FR');
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'ALL_DONE':
        return (
          <motion.div
            key="all-done"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <GraduationLoader isLoading={status.RECOS_VACCINES_ALL_DONE.isLoading} />
            {!status.RECOS_VACCINES_ALL_DONE.isLoading && (
              <VaccinationTable
                data={vaccinationAllDoneData}
                type="all_done"
              />
            )}
          </motion.div>
        );
      case 'PARTIAL_DONE':
        return (
          <motion.div
            key="partial-done"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <GraduationLoader isLoading={status.RECOS_VACCINES_PARTIAL_DONE.isLoading} />
            {!status.RECOS_VACCINES_PARTIAL_DONE.isLoading && (
              <VaccinationTable
                data={vaccinationPartialDoneData}
                type="partial_done"
              />
            )}
          </motion.div>
        );
      case 'NOT_DONE':
        return (
          <motion.div
            key="not-done"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <GraduationLoader isLoading={status.RECOS_VACCINES_NOT_DONE.isLoading} />
            {!status.RECOS_VACCINES_NOT_DONE.isLoading && (
              <VaccinationTable
                data={vaccinationNotDoneData}
                type="not_done"
              />
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <PageWrapper
      title="Tableau de bord temps réel"
      subtitle="Suivi des vaccinations des enfants"
    >
      {/* Status Bar */}
      <div className={styles.statusBar}>
        <motion.div
          className={styles.statusIndicator}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Wifi size={16} className={styles.statusIcon} />
          <span>Connecté</span>
        </motion.div>
        <div className={styles.lastUpdate}>
          <Clock size={14} />
          <span>Dernière mise à jour: {formatLastUpdate()}</span>
        </div>
      </div>

      {/* Filters */}
      <DashboardFilters
        onFilter={(val)=>handleFilter(val as any)}
        isLoading={isAnyLoading}
        initialValues={filters || undefined}
      />

      {/* Summary Cards */}
      <div className={styles.summaryCards}>
        {TABS.map((tab) => (
          <div
            key={tab.id}
            className={`${styles.summaryCard} ${currentTab === tab.id ? styles.summaryCardActive : ''}`}
            onClick={() => handleTabChange(tab.id)}
            style={{ borderColor: tab.color }}
          >
            <div className={styles.summaryIcon} style={{ color: tab.color }}>
              {tab.icon}
            </div>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>{tab.label}</span>
              <span className={styles.summaryCount} style={{ color: tab.color }}>
                {getChildCount(tab.id)}
              </span>
            </div>
          </div>
        ))}
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
