import React, { useCallback, useState } from 'react';
import { Database } from 'lucide-react';
import type { ChartTypeOption, ChartVariant } from '../types';
import styles from './BuilderSidebar.module.css';
import { ChartStructureFilter } from '@/models/dataset.models';
import { Button } from '@/components/ui/Button/Button';

interface BuilderSidebarProps {
  chartType: ChartVariant;
  chartTypes: ChartTypeOption[];
  filters: ChartStructureFilter[]
  onFilterChange: (filters: ChartStructureFilter[]) => void;
  toogleChartTypeModal: () => void;
}


export const BuilderSidebar: React.FC<BuilderSidebarProps> = ({ filters, chartType, chartTypes, onFilterChange, toogleChartTypeModal }) => {
  const [addFilter, setAddFilter] = useState<boolean>(false);


  const currentType = chartTypes.find((t) => t.id === chartType);
  const isTableChart = chartType === 'table';




  return (
    <div className={styles.sidebar}>
      <div className={styles.section}>

        <Button className={styles.typeChangeBtn} onClick={toogleChartTypeModal}>
          {currentType?.icon}
          {currentType?.name ?? chartType}
        </Button>

        <br />

        <div className={styles.sectionTitle}>
          <Database size={18} />
          Filtrer les données
        </div>

        {filters?.map((f, i) => {
          return (
            <>
              <p>{f.field_id}</p>
              <p>{f.field_type}</p>
            </>
          );
        })}

        <Button onClick={() => setAddFilter(true)}>
          Ajouter Filtre
        </Button>

        {/* <DimensionSelector
          title="Mat views"
          icon={<Database size={16} />}
          items={dataElements}
          selectedItems={selectedDataElements}
          onSelectionChange={handleMatViewSelectionChange}
          searchPlaceholder="Rechercher une mat view..."
          singleSelect
        />

        <DimensionSelector
          title="Périodes"
          icon={<Calendar size={16} />}
          items={periods}
          selectedItems={selectedPeriods}
          onSelectionChange={onPeriodsChange}
          searchPlaceholder="Rechercher une période..."
        />

        <DimensionSelector
          title="Unités d'organisation"
          icon={<Building2 size={16} />}
          items={orgUnits}
          selectedItems={selectedOrgUnits}
          onSelectionChange={onOrgUnitsChange}
          searchPlaceholder="Rechercher une unité..."
        /> */}
      </div>
    </div>
  );
};
