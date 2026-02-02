import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Users, CheckSquare, Eye, AlertCircle } from 'lucide-react';
import { PageWrapper } from '@components/layout';
import { GraduationLoader } from '@components/loaders/GraduationLoader/GraduationLoader';
import { VisualizationCard } from '@components/visualizations';
import { useDashboard } from '@/contexts/OLD/useDashboard';
import { useVisualizations } from '@/contexts/OLD/useVisualizations';
import {
  DashboardFilters,
  RecoPerformanceTable,
  ActiveRecoTable,
  TasksStateTable,
} from '@pages/dashboards/components';
import type { DashboardFilterParams } from '@/stores/OLD/dashboard.store';
import styles from './MonthlyDashboard.module.css';

type TabType = 'PERFORMANCES' | 'TASKS_STATE' | 'ACTIVE_RECO' | 'VISUALIZATIONS';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'PERFORMANCES', label: 'PERFORMANCES DES RECOS', icon: <BarChart3 size={18} /> },
  { id: 'TASKS_STATE', label: 'RECOS TÂCHES NON RÉALISÉES', icon: <CheckSquare size={18} /> },
  { id: 'ACTIVE_RECO', label: 'STATUS RECOS ACTIVES', icon: <Users size={18} /> },
  { id: 'VISUALIZATIONS', label: 'VISUALISATIONS', icon: <Eye size={18} /> },
];

export default function MonthlyDashboard() {
  const {
    performanceData,
    activeRecoData,
    tasksStateData,
    status,
    filters,
    activeTab,
    setActiveTab,
    fetchRecoPerformance,
    fetchActiveReco,
    fetchRecoTasksState,
  } = useDashboard();

  // Fetch dashboard visualizations
  const {
    dashboardVisualizations,
    isLoading: isVisualizationsLoading,
    deleteVisualization,
  } = useVisualizations('dashboard');

  const [currentTab, setCurrentTab] = useState<TabType>(activeTab);

  const handleTabChange = (tabId: TabType) => {
    setCurrentTab(tabId);
    setActiveTab(tabId as any);
  };

  const handleFilter = async (filterParams: DashboardFilterParams) => {
    // Fetch data based on current tab
    switch (currentTab) {
      case 'PERFORMANCES':
        await fetchRecoPerformance(filterParams);
        break;
      case 'ACTIVE_RECO':
        await fetchActiveReco(filterParams);
        break;
      case 'TASKS_STATE':
        await fetchRecoTasksState(filterParams);
        break;
    }
  };

  const isCurrentTabLoading = () => {
    switch (currentTab) {
      case 'PERFORMANCES':
        return status.RECOS_PERFORMANCES.isLoading;
      case 'ACTIVE_RECO':
        return status.ACTIVE_RECOS.isLoading;
      case 'TASKS_STATE':
        return status.RECOS_TASKS_STATE.isLoading;
      case 'VISUALIZATIONS':
        return isVisualizationsLoading;
      default:
        return false;
    }
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'PERFORMANCES':
        return (
          <motion.div
            key="performances"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <GraduationLoader isLoading={status.RECOS_PERFORMANCES.isLoading} />
            {!status.RECOS_PERFORMANCES.isLoading && (
              <RecoPerformanceTable
                data={performanceData}
              />
            )}
          </motion.div>
        );
      case 'ACTIVE_RECO':
        return (
          <motion.div
            key="active-reco"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <GraduationLoader isLoading={status.ACTIVE_RECOS.isLoading} />
            {!status.ACTIVE_RECOS.isLoading && (
              <ActiveRecoTable
                data={activeRecoData}
              />
            )}
          </motion.div>
        );
      case 'TASKS_STATE':
        return (
          <motion.div
            key="tasks-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <GraduationLoader isLoading={status.RECOS_TASKS_STATE.isLoading} />
            {!status.RECOS_TASKS_STATE.isLoading && (
              <TasksStateTable
                data={tasksStateData}
              />
            )}
          </motion.div>
        );
      case 'VISUALIZATIONS':
        return (
          <motion.div
            key="visualizations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <GraduationLoader isLoading={isVisualizationsLoading} />
            {!isVisualizationsLoading && (
              <>
                {dashboardVisualizations.length === 0 ? (
                  <div className={styles.emptyState}>
                    <AlertCircle size={48} />
                    <h3>Aucune visualisation</h3>
                    <p>
                      Aucune visualisation de type &quot;tableau de bord&quot; n&apos;a été créée.
                      Créez-en une depuis la page Administration.
                    </p>
                  </div>
                ) : (
                  <div className={styles.visualizationsGrid}>
                    {dashboardVisualizations.map((viz) => (
                      <VisualizationCard
                        key={viz.id}
                        visualization={viz}
                        onDelete={deleteVisualization}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <PageWrapper
      title="Tableau de bord mensuel"
      subtitle="Vue d'ensemble des performances mensuelles des RECO"
    >
      {/* Filters */}
      <DashboardFilters
        onFilter={(val)=>handleFilter(val as any)}
        isLoading={isCurrentTabLoading()}
        // showDateRange={currentTab === 'TASKS_STATE'}
        initialValues={filters || undefined}
      />

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${currentTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.icon}
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
