import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card/Card';
import { OrgUnitsFilter, type FilterFormData } from '@/components/filters/OrgUnitsFilter/OrgUnitsFilter';
import { Button } from '@/components/ui/Button/Button';
import { Search, RefreshCw, X, Filter } from 'lucide-react';
import styles from './DashboardFilters.module.css';

interface FilterValues {
  start_date: string;
  end_date: string;
  recos: string[];
}

interface DashboardFiltersProps {
  onFilter: (filters: FilterValues) => void;
  isLoading?: boolean;
  initialValues?: Partial<FilterValues>;
}

// Format date for display (DD/MM/YYYY)
function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function DashboardFilters({
  onFilter,
  isLoading = false,
  initialValues,
}: DashboardFiltersProps) {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedRecos, setSelectedRecos] = useState<string[]>(initialValues?.recos || []);
  const [startDate, setStartDate] = useState<string>(initialValues?.start_date || '');
  const [endDate, setEndDate] = useState<string>(initialValues?.end_date || '');

  const handleOrgUnitsFilterChange = (formData: FilterFormData) => {
    if (formData.org_units) {
      setSelectedRecos(formData.org_units.selected_recos_ids);
    }
    setStartDate(formData.start_date);
    setEndDate(formData.end_date);
  };

  const handleFilter = () => {
    if (selectedRecos.length === 0) {
      return;
    }

    const filters: FilterValues = {
      start_date: startDate,
      end_date: endDate,
      recos: selectedRecos,
    };

    onFilter(filters);
  };

  const handleReset = () => {
    setSelectedRecos([]);
    setStartDate('');
    setEndDate('');
  };

  return (
    <>
      <Card className={styles.filterCard}>
        <CardBody>
          <div className={styles.filtersContainer}>
            <div className={styles.filterInfo}>
              <p className={styles.filterText}>
                {selectedRecos.length > 0 ? (
                  <>
                    <strong>{selectedRecos.length}</strong> RECO(s) selectionne(s) |
                    Du: <strong>{formatDateDisplay(startDate)}</strong> au <strong>{formatDateDisplay(endDate)}</strong>
                  </>
                ) : (
                  'Aucun filtre applique'
                )}
              </p>
            </div>

            <div className={styles.filterActions}>
              <Button
                variant="outline"
                onClick={() => setIsFilterModalOpen(true)}
                className={styles.filterButton}
              >
                <Filter size={16} />
                Filtrer
              </Button>

              <Button
                variant="primary"
                onClick={handleFilter}
                disabled={isLoading || selectedRecos.length === 0}
                className={styles.applyButton}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className={styles.spinning} />
                    Chargement...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Appliquer
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
                className={styles.resetButton}
              >
                <X size={16} />
                Reinitialiser
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <OrgUnitsFilter
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onChange={handleOrgUnitsFilterChange}
        showDateSelection={true}
      />
    </>
  );
}
