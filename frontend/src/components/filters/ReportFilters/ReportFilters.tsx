import { useState, useCallback } from 'react';
import { OrgUnitsFilter, type OrgUnitSelection, type FilterFormData } from '../OrgUnitsFilter';
import { Filter, RefreshCw } from 'lucide-react';
import styles from './ReportFilters.module.css';

export interface ReportFilterValues {
  start_date: string;
  end_date: string;
  recos: string[];
  orgUnitSelection: OrgUnitSelection;
}

interface ReportFiltersProps {
  onFilter: (filters: ReportFilterValues) => void;
  onSync?: () => void;
  showSyncButton?: boolean;
  isSyncing?: boolean;
  isLoading?: boolean;
  className?: string;
}

// Format date for display (DD/MM/YYYY)
function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function ReportFilters({
  onFilter,
  onSync,
  showSyncButton = false,
  isSyncing = false,
  isLoading = false,
  className = '',
}: ReportFiltersProps) {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [recos, setRecos] = useState<string[]>([]);
  const [orgUnitSelection, setOrgUnitSelection] = useState<OrgUnitSelection>({
    country: [],
    region: [],
    prefecture: [],
    commune: [],
    hospital: [],
    district_quartier: [],
    chws: [],
    village_secteur: [],
    recos: [],
    all_recos_ids: [],
    selected_recos_ids: [],
  });

  const handleOrgUnitsFilterChange = useCallback((formData: FilterFormData) => {
    if (formData.org_units) {
      setOrgUnitSelection(formData.org_units);
      setRecos(formData.org_units.selected_recos_ids);
    }
    setStartDate(formData.start_date);
    setEndDate(formData.end_date);
  }, []);

  const handleFilter = () => {
    onFilter({
      start_date: startDate,
      end_date: endDate,
      recos,
      orgUnitSelection,
    });
  };

  const canFilter = startDate && endDate && recos.length > 0;

  return (
    <>
      <div className={`${styles.container} ${className}`}>
        <div className={styles.filterInfo}>
          <p className={styles.filterText}>
            {canFilter ? (
              <>
                <strong>{recos.length}</strong> RECO(s) selectionne(s) |
                Du: <strong>{formatDateDisplay(startDate)}</strong> au <strong>{formatDateDisplay(endDate)}</strong>
              </>
            ) : (
              'Aucun filtre applique - Cliquez sur "Filtrer" pour commencer'
            )}
          </p>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.filterButton}
            onClick={() => setIsFilterModalOpen(true)}
          >
            <Filter size={18} />
            Filtrer
          </button>

          <button
            className={styles.applyButton}
            onClick={handleFilter}
            disabled={!canFilter || isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                Chargement...
              </>
            ) : (
              <>
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
                </svg>
                Appliquer
              </>
            )}
          </button>

          {showSyncButton && onSync && (
            <button
              className={styles.syncButton}
              onClick={onSync}
              disabled={isSyncing || isLoading}
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={18} className={styles.spinning} />
                  Synchronisation...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Synchroniser
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <OrgUnitsFilter
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onChange={handleOrgUnitsFilterChange}
        showDateSelection={true}
      />
    </>
  );
}

export default ReportFilters;
