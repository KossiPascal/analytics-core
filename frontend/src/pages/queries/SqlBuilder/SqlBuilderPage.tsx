/**
 * SqlBuilderPage
 * Page principale du Query Builder avec modèle de données de démonstration
 */

import React, { useCallback, useEffect, useState } from 'react';
import { SqlBuilder } from './components/SqlBuilder';
import type { AnalyticsModel, AttributDef, DatabaseDef, DbConnection, DimensionDef, MetricDef, QueryJSON, TableDef } from './models';
import { } from '@/services/connection.service';
import { connService as API } from '@/services/connection.service';
import { boolean } from 'zod';

// ============================================================================
// DEMO ANALYTICS MODEL
// ============================================================================

const DEMO_MODEL: AnalyticsModel = {
  tables: [],

  dimensions: [],

  metrics: [
    // Consultations metrics
    {
      id: 'consultations.count',
      label: 'Nombre de consultations',
      table: 'consultations',
      defaultAgg: 'count',
      returnType: 'number',
    },
    {
      id: 'consultations.cost',
      label: 'Coût consultation',
      table: 'consultations',
      defaultAgg: 'sum',
      returnType: 'number',
    },
    {
      id: 'consultations.duration_minutes',
      label: 'Durée (minutes)',
      table: 'consultations',
      defaultAgg: 'avg',
      returnType: 'number',
    },

    // Patients metrics
    {
      id: 'patients.count',
      label: 'Nombre de patients',
      table: 'patients',
      defaultAgg: 'count',
      returnType: 'number',
    },
    {
      id: 'patients.age',
      label: 'Âge',
      table: 'patients',
      defaultAgg: 'avg',
      returnType: 'number',
    },

    // Vaccinations metrics
    {
      id: 'vaccinations.count',
      label: 'Nombre de vaccinations',
      table: 'vaccinations',
      defaultAgg: 'count',
      returnType: 'number',
    },
    {
      id: 'vaccinations.doses_administered',
      label: 'Doses administrées',
      table: 'vaccinations',
      defaultAgg: 'sum',
      returnType: 'number',
    },

    // Medications metrics
    {
      id: 'medications.quantity',
      label: 'Quantité médicaments',
      table: 'medications',
      defaultAgg: 'sum',
      returnType: 'number',
    },
    {
      id: 'medications.unit_price',
      label: 'Prix unitaire',
      table: 'medications',
      defaultAgg: 'avg',
      returnType: 'number',
    },

    // Health workers metrics
    {
      id: 'health_workers.count',
      label: "Nombre d'agents",
      table: 'health_workers',
      defaultAgg: 'count',
      returnType: 'number',
    },

    // Facilities metrics
    {
      id: 'facilities.count',
      label: 'Nombre de formations',
      table: 'facilities',
      defaultAgg: 'count',
      returnType: 'number',
    },
    {
      id: 'facilities.capacity',
      label: 'Capacité',
      table: 'facilities',
      defaultAgg: 'sum',
      returnType: 'number',
    },
  ],

  databases: [],
  
  attributs: []
};



// ============================================================================
// PAGE COMPONENT
// ============================================================================

export const SqlBuilderPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isLoadError, setIsLoadError] = useState<boolean>(false);

  const handleQueryChange = useCallback((query: QueryJSON) => {
    console.log('[SqlBuilder] Query changed:', query);
  }, []);

  const handleRun = useCallback((query: QueryJSON) => {
    console.log('[SqlBuilder] Running query:', query);
    // Here you would typically send the query to your API
    alert('Query exécutée!\n\n' + JSON.stringify(query, null, 2));
  }, []);

  const handleSave = useCallback((query: QueryJSON, name: string) => {
    console.log('[SqlBuilder] Saving query:', name, query);
    // Here you would typically save the query to your backend
  }, []);

  const loadDatabases = async () => {
    setLoading(true);
    setIsLoadError(false);
    try {
      const { data } = await API.listWithDetails<DbConnection>();
     
      const connList: DatabaseDef[] = [];
      const TablesList: TableDef[] = [];
      const AttributesList: AttributDef[] = [];
      const DimensionsList: DimensionDef[] = [];
      const MetricsList: MetricDef[] = [];


      for (const db of (data ?? [])) {
        connList.push({
          id: db.id!,
          label: db.name,
          description: db.description,
          type: db.type,
          // icon?: string,
          // color?: string,
        })

        if (db.details && (db.details.tables ?? []).length > 0) {
          for (const table of db.details.tables) {
            TablesList.push({
              id: table.table_name,
              label: table.table_name,
              description: `Table ${table.table_name.toUpperCase()}`,
            })

            if (table.columns && table.columns.length > 0) {
              for (const col of table.columns) {
                AttributesList.push({
                  id: `${table.table_name}.${col.name}`,
                  label: col.name,
                  table: table.table_name,
                  type: col.type as any,
                  description: "",
                  groupable: true,
                  filterable: true,
                  // icon?: string,
                  // defaultAgg?: AggType,
                })
              }
            }
          }
        }
      }

      DEMO_MODEL.databases = connList;
      DEMO_MODEL.tables = TablesList;
      DEMO_MODEL.attributs = AttributesList;

      // DEMO_MODEL.dimensions = DimensionsList;
      // DEMO_MODEL.metrics = MetricsList;
      

    } catch {
      setIsLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadFullModels = async () => {
    await loadDatabases();
  }

  useEffect(() => {
    loadFullModels();
  }, []);

  return (
    <SqlBuilder
      model={DEMO_MODEL}
      onQueryChange={handleQueryChange}
      onRun={handleRun}
      onSave={handleSave}
      onLoadDatabases={loadDatabases}
    />
  );
};

export default SqlBuilderPage;
