/**
 * VisualizationHome - Home page displaying all visualizations in DHIS2 style
 * This is the default page after authentication
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  Filter,
  ChevronDown,
  AlertCircle,
  BarChart3,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { PageWrapper } from '@components/layout/PageWrapper/PageWrapper';
import { Card, CardBody } from '@components/ui/Card/Card';
import { Button } from '@components/ui/Button/Button';
import { GraduationLoader } from '@components/loaders/GraduationLoader/GraduationLoader';
import { VisualizationCard } from '@components/visualizations/VisualizationCard/VisualizationCard';
import { useVisualizations, type VisualizationWithData } from '@/contexts/OLD/useVisualizations';
import { ROUTES } from '@routes/configs';
import styles from './VisualizationHome.module.css';

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'dashboard' | 'report';

function CHTApp() {
  return (
    <iframe
      src="https://kendeya.portal-integratehealth.org/"
      width="100%"
      height="900"
      style={{ border: "none" }}
      title="CHT"
    />
  );
}

export default function VisualizationHome() {
  const navigate = useNavigate();
  const { visualizations, isLoading, error, refresh, deleteVisualization } = useVisualizations();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Filter visualizations
  const filteredVisualizations = useMemo(() => {
    let result = visualizations;

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter((v) => v.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [visualizations, filterType, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: visualizations.length,
      dashboards: visualizations.filter((v) => v.type === 'dashboard').length,
      reports: visualizations.filter((v) => v.type === 'report').length,
    };
  }, [visualizations]);

  const handleCreateVisualization = () => {
    navigate(ROUTES.builder.dashboardBuilder());
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette visualisation ?')) {
      deleteVisualization(id);
    }
  };

  const handleExpand = (visualization: VisualizationWithData) => {
    // Navigate to the appropriate page based on type

      navigate(ROUTES.dashboards.root());

    // if (visualization.type === 'dashboard') {
    //   navigate(ROUTES.dashboards.monthly());
    // } else {
    //   navigate(ROUTES.reports.root());
    // }
  };

  const filterOptions = [
    { value: 'all', label: 'Toutes les visualisations', count: stats.total },
    { value: 'dashboard', label: 'Tableaux de bord', count: stats.dashboards },
    { value: 'report', label: 'Rapports', count: stats.reports },
  ];

  return (
    <PageWrapper
      title="Visualisations"
      subtitle="Bienvenue sur votre tableau de bord de visualisations"
    >
      {/* Header Actions */}
      <Card className={styles.headerCard}>
        <CardBody>
          <div className={styles.headerContent}>
            {/* Left: Stats */}
            <div className={styles.statsSection}>
              <div className={styles.statItem}>
                <LayoutGrid size={20} className={styles.statIcon} />
                <span className={styles.statValue}>{stats.total}</span>
                <span className={styles.statLabel}>Total</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <BarChart3 size={20} className={styles.statIconDashboard} />
                <span className={styles.statValue}>{stats.dashboards}</span>
                <span className={styles.statLabel}>Tableaux de bord</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <FileText size={20} className={styles.statIconReport} />
                <span className={styles.statValue}>{stats.reports}</span>
                <span className={styles.statLabel}>Rapports</span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className={styles.actionsSection}>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateVisualization}
              >
                <Plus size={16} />
                Créer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                title="Actualiser"
              >
                <RefreshCw size={16} />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        {/* Search */}
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher une visualisation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Filter Dropdown */}
        <div className={styles.filterWrapper}>
          <button
            type="button"
            className={styles.filterButton}
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <Filter size={16} />
            <span>
              {filterOptions.find((o) => o.value === filterType)?.label}
            </span>
            <ChevronDown size={16} />
          </button>

          {showFilterDropdown && (
            <motion.div
              className={styles.filterDropdown}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.filterOption} ${filterType === option.value ? styles.filterOptionActive : ''}`}
                  onClick={() => {
                    setFilterType(option.value as FilterType);
                    setShowFilterDropdown(false);
                  }}
                >
                  <span>{option.label}</span>
                  <span className={styles.filterCount}>{option.count}</span>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* View Toggle */}
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={`${styles.viewButton} ${viewMode === 'grid' ? styles.viewButtonActive : ''}`}
            onClick={() => setViewMode('grid')}
            title="Vue grille"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            type="button"
            className={`${styles.viewButton} ${viewMode === 'list' ? styles.viewButtonActive : ''}`}
            onClick={() => setViewMode('list')}
            title="Vue liste"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <GraduationLoader isLoading={isLoading} />

        {error && (
          <div className={styles.errorState}>
            <AlertCircle size={48} />
            <h3>Erreur de chargement</h3>
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={refresh}>
              Réessayer
            </Button>
          </div>
        )}

        {!isLoading && !error && (
          <AnimatePresence mode="wait">
            {/* {filteredVisualizations.length === 0 ? (
              <motion.div
                key="empty"
                className={styles.emptyState}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <LayoutGrid size={64} />
                <h3>Aucune visualisation</h3>
                {searchQuery || filterType !== 'all' ? (
                  <p>
                    Aucune visualisation ne correspond à vos critères de recherche.
                    <br />
                    Essayez de modifier vos filtres.
                  </p>
                ) : (
                  <>
                    <p>
                      Vous n&apos;avez pas encore créé de visualisation.
                      <br />
                      Commencez par créer votre première visualisation.
                    </p>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleCreateVisualization}
                    >
                      <Plus size={18} />
                      Créer une visualisation
                    </Button>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                className={viewMode === 'grid' ? styles.visualizationsGrid : styles.visualizationsList}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredVisualizations.map((viz, index) => (
                  <motion.div
                    key={viz.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <VisualizationCard
                      visualization={viz}
                      onDelete={handleDelete}
                      onExpand={handleExpand}
                      className={viewMode === 'list' ? styles.listCard : undefined}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )} */}

            <CHTApp />

          </AnimatePresence>
        )}
      </div>
    </PageWrapper>
  );
}
