/**
 * VisualizationManager - Home page displaying all visualizations in DHIS2 style
 * This is the default page after authentication
 */

import { useState, useMemo, useEffect, useRef } from 'react';
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
import styles from './Visualization.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { DatasetChart } from '@/models/dataset.models';
import { Visualization } from '@/models/visualization.model';
import { chartService } from '@/services/dataset.service';
import { visualizationService } from '@/services/visualization.service';
import { Responsive } from "react-grid-layout";
import useMeasure from "react-use-measure";
import { FormInput } from "@/components/forms/FormInput/FormInput";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { VisualizationViewModule } from "./VisualizationUtils";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const STATUS = ["draft", "submitted", "reviewed", "approved", "published", "archived"];

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'dashboard' | 'report';


export default function VisualizationView() {

  const { user } = useAuth();
  const navigate = useNavigate();

  const [tenant_id, setTenantId] = useState<number>();
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [charts, setCharts] = useState<DatasetChart[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilter, setShowFilter] = useState(false);

  const didLoad = useRef(false);

  // ---------------- INIT ----------------
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    setTenantId(user?.tenant_id);
  }, []);

  // ---------------- FETCH ----------------
  const fetchData = async () => {
    if (!tenant_id) return;
    setLoading(true);
    const res = await visualizationService.list(tenant_id);
    setVisualizations(res || []);
    setLoading(false);
  };

  const fetchCharts = async () => {
    if (!tenant_id) return;
    const res = await chartService.list(tenant_id);
    setCharts(res || []);
  };


  const refresh = () => {
    fetchData();
    fetchCharts();
  }

  const refreshView = async (id: number | null) => {
    console.log("👉 refresh...");
    // Make refresh view function
    refresh();
  }

  useEffect(() => {
    if (!tenant_id) return;
    refresh()
  }, [tenant_id]);


  // ---------------- ACTIONS ----------------
  const handleDelete = async (id: number | null) => {
    if (!id) return;

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette visualisation ?')) {
      await visualizationService.remove(id);
      fetchData();
    }
  };

  // ---------------- FILTER ----------------
  const filtered = useMemo(() => {
    let result = visualizations;

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter((v) => v.type === filterType);
    }
    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(v => (
        v.name.toLowerCase().includes(query) ||
        v.description?.toLowerCase().includes(query)
      ) && (statusFilter ? v.status === statusFilter : true));
    }

    return result;
  }, [visualizations, search, statusFilter, filterType]);


  const openView = async (viz: Visualization, charts: DatasetChart[]) => {
    window.open(`/dashboard/${viz.id}`)
  }


  // Stats
  const stats = useMemo(() => {
    return {
      total: visualizations.length,
      dashboards: visualizations.filter((v) => v.type === 'dashboard').length,
      reports: visualizations.filter((v) => v.type === 'report').length,
    };
  }, [visualizations]);

  const handleCreate = () => {
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
    <PageWrapper title="Visualisations"
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
              <Button variant="primary" size="sm" onClick={handleCreate} >
                <Plus size={16} />
                Créer
              </Button>
              <Button variant="outline" size="sm" onClick={refresh} title="Actualiser" >
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterWrapper}>
          <div className={styles.filterButton}>
            <FormSelect
              value={statusFilter}
              options={[{ value: "", label: "All Status" }, ...STATUS.map(s => ({ value: s, label: s }))]}
              onChange={setStatusFilter}
            />
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className={styles.filterWrapper}>
          <button type="button" className={styles.filterButton} onClick={() => setShowFilter(!showFilter)} >
            <Filter size={16} />
            <span>{filterOptions.find((o) => o.value === filterType)?.label}</span>
            <ChevronDown size={16} />
          </button>

          {showFilter && (
            <motion.div
              className={styles.filterDropdown}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {filterOptions.map((option) => (
                <button key={option.value} type="button"
                  className={`${styles.filterOption} ${filterType === option.value ? styles.filterOptionActive : ''}`}
                  onClick={() => {
                    setFilterType(option.value as FilterType);
                    setShowFilter(false);
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
        {/* <div className={styles.viewToggle}> */}
        <button
          type="button"
          // className={`${styles.viewButtonActive}`}
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          title={viewMode === 'grid' ? "Vue grille" : "Vue liste"}
        >
          {viewMode === 'grid' ? <LayoutGrid size={18} /> : <List size={18} />}
        </button>
        {/* </div> */}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <GraduationLoader isLoading={loading} />

        {error && (
          <div className={styles.errorState}>
            <AlertCircle size={48} />
            <h3>Erreur de chargement</h3>
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={refresh}>Réessayer</Button>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-xl" />
            ))}
          </div>
        )}

        {/* EMPTY */}
        {!loading && !filtered.length && (
          <div className="text-center py-20 text-gray-400">
            🚀 No visualization yet. Create your first one!
          </div>
        )}

        {!loading && !error && (
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                className={styles.emptyState}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <LayoutGrid size={64} />
                <h3>Aucune visualisation</h3>
                {search || filterType !== 'all' ? (
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
                      onClick={handleCreate}
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
                {filtered.map((viz, index) => (
                  <motion.div
                    key={viz.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* <VisualizationCard
                      visualization={viz}
                      onDelete={(id) => handleDelete(id)}
                      onExpand={handleExpand}
                      className={viewMode === 'list' ? styles.listCard : undefined}
                    /> */}
                    {/* <VisualizationViewModule visualization={viz} charts={charts} removeView={handleDelete} openView={openView} /> */}

                    <Card key={viz.id} style={{ padding: "5px" }} className="hover:shadow-xl transition-all rounded-2xl">
                      <VisualizationViewModule visualization={viz} charts={charts} refreshView={refreshView} autoRefresh={refreshView} />
                    </Card>

                  </motion.div>
                ))}
              </motion.div>
            )}


          </AnimatePresence>
        )}
      </div>
    </PageWrapper>
  );
}
