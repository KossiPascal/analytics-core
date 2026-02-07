import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Calendar,
  Pill,
  Baby,
  Heart,
  Home,
  Package,
  CheckCircle,
  XCircle,
  Send,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { PageWrapper } from '@components/layout/PageWrapper/PageWrapper';
import { Card, CardBody } from '@components/ui/Card/Card';
import { Button } from '@components/ui/Button/Button';
import { GraduationLoader } from '@components/loaders/GraduationLoader/GraduationLoader';
import { VisualizationCard } from '@components/visualizations/VisualizationCard/VisualizationCard';
import { useReports } from '@/contexts/OLD/useReports';
import { useVisualizations } from '@/contexts/OLD/useVisualizations';
import { ReportFilters } from '@/components/filters/ReportFilters/ReportFilters';
import { ReportTable } from './components/ReportTable';
import type { ReportType } from '@/models/OLD/old/reports.types';
import type { FilterParams } from '@/stores/OLD/reports.store';
import styles from './ReportsPage.module.css';

type TabType = ReportType | 'VISUALIZATIONS';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const TABS: Tab[] = [
  { id: 'MONTHLY_ACTIVITY', label: "Rapport d'activités", icon: <Activity size={18} />, color: '#3b82f6' },
  { id: 'PROMOTION', label: 'Rapport Promotions', icon: <Heart size={18} />, color: '#ec4899' },
  { id: 'FAMILY_PLANNING', label: 'Rapport PF', icon: <Calendar size={18} />, color: '#8b5cf6' },
  { id: 'MORBIDITY', label: 'Rapport Morbidité', icon: <Pill size={18} />, color: '#ef4444' },
  { id: 'PCIMNE_NEWBORN', label: 'Rapport PCIMNE', icon: <Baby size={18} />, color: '#f59e0b' },
  { id: 'HOUSE_HOLD_RECAP', label: 'Rapport Ménages', icon: <Home size={18} />, color: '#22c55e' },
  { id: 'RECO_MEG_QUANTITIES', label: 'Rapport MEGs', icon: <Package size={18} />, color: '#06b6d4' },
  { id: 'VISUALIZATIONS', label: 'Visualisations', icon: <Eye size={18} />, color: '#6366f1' },
];

export default function ReportsPage() {
  const {
    data,
    status,
    filters,
    activeTab,
    hideZeroValues,
    fetchReport,
    validateReport,
    cancelValidation,
    setActiveTab,
    setHideZeroValues,
    displayValue,
  } = useReports();

  // Fetch report visualizations
  const {
    reportVisualizations,
    isLoading: isVisualizationsLoading,
    deleteVisualization,
  } = useVisualizations('report');

  const [currentTab, setCurrentTab] = useState<TabType>(activeTab);

  const isReportTab = (tab: TabType): tab is ReportType => tab !== 'VISUALIZATIONS';

  const handleTabChange = (tabId: TabType) => {
    setCurrentTab(tabId);
    if (isReportTab(tabId)) {
      setActiveTab(tabId);
    }
  };

  const handleFilter = async (filterParams: FilterParams) => {
    if (isReportTab(currentTab)) {
      await fetchReport(currentTab, filterParams);
    }
  };

  const handleValidate = async () => {
    if (isReportTab(currentTab)) {
      await validateReport(currentTab);
    }
  };

  const handleCancelValidation = async () => {
    if (isReportTab(currentTab)) {
      await cancelValidation(currentTab);
    }
  };

  const currentStatus = isReportTab(currentTab) ? status[currentTab] : null;
  const currentData = isReportTab(currentTab) ? data[currentTab] : null;

  const renderTabContent = () => {
    if (currentTab === 'VISUALIZATIONS') {
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
              {reportVisualizations.length === 0 ? (
                <div className={styles.emptyState}>
                  <AlertCircle size={48} />
                  <h3>Aucune visualisation</h3>
                  <p>
                    Aucune visualisation de type &quot;rapport&quot; n&apos;a été créée.
                    Créez-en une depuis la page Administration.
                  </p>
                </div>
              ) : (
                <div className={styles.visualizationsGrid}>
                  {reportVisualizations.map((viz) => (
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
    }

    return (
      <motion.div
        key={currentTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <GraduationLoader isLoading={currentStatus?.isLoading || false} />
        {!currentStatus?.isLoading && (
          <ReportTable
            reportType={currentTab as ReportType}
            data={currentData}
            displayValue={displayValue}
            isValidated={currentStatus?.isValidated || false}
          />
        )}
      </motion.div>
    );
  };

  return (
    <PageWrapper
      title="Rapports"
      subtitle="Consultez et exportez les différents rapports de l'application"
    >
      {/* Filters - Only for report tabs */}
      {isReportTab(currentTab) && (
        <ReportFilters
          onFilter={(val)=>handleFilter(val as any)}
          isLoading={currentStatus?.isLoading || false}
        />
      )}

      {/* Actions Bar - Only for report tabs */}
      {isReportTab(currentTab) && currentStatus && (
        <Card className={styles.actionsBar}>
          <CardBody>
            <div className={styles.actions}>
              <div className={styles.actionsLeft}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={hideZeroValues}
                    onChange={(e) => setHideZeroValues(e.target.checked)}
                  />
                  <span>Masquer les valeurs nulles</span>
                </label>
              </div>
              <div className={styles.actionsRight}>
                {currentStatus.isValidated ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelValidation}
                    disabled={currentStatus.isCancellingValidation}
                  >
                    <XCircle size={16} />
                    {currentStatus.isCancellingValidation ? 'Annulation...' : 'Annuler validation'}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleValidate}
                    disabled={currentStatus.isValidating || !currentData}
                  >
                    <CheckCircle size={16} />
                    {currentStatus.isValidating ? 'Validation...' : 'Valider'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!currentStatus.isValidated}
                  title={currentStatus.isValidated ? 'Envoyer au DHIS2' : 'Validez d\'abord le rapport'}
                >
                  <Send size={16} />
                  Envoyer DHIS2
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${currentTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => handleTabChange(tab.id)}
              style={{ '--tab-color': tab.color } as React.CSSProperties}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
              {isReportTab(tab.id) && status[tab.id].isValidated && (
                <span className={styles.validatedBadge}>
                  <CheckCircle size={12} />
                </span>
              )}
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
