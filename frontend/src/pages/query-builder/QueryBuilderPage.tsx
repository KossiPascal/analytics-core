/**
 * QueryBuilderPage
 * Page principale du Query Builder avec modèle de données de démonstration
 */

import React, { useCallback } from 'react';
import { QueryBuilder } from './components';
import type { AnalyticsModel, QueryJSON } from './models';

// ============================================================================
// DEMO ANALYTICS MODEL
// ============================================================================

const DEMO_MODEL: AnalyticsModel = {
  tables: [
    {
      id: 'consultations',
      label: 'Consultations',
      description: 'Table des consultations médicales',
    },
    {
      id: 'patients',
      label: 'Patients',
      description: 'Table des patients',
    },
    {
      id: 'health_workers',
      label: 'Agents de santé',
      description: 'Table des agents de santé',
    },
    {
      id: 'facilities',
      label: 'Formations sanitaires',
      description: 'Table des formations sanitaires',
    },
    {
      id: 'regions',
      label: 'Régions',
      description: 'Table des régions',
    },
    {
      id: 'districts',
      label: 'Districts',
      description: 'Table des districts sanitaires',
    },
    {
      id: 'vaccinations',
      label: 'Vaccinations',
      description: 'Table des vaccinations',
    },
    {
      id: 'medications',
      label: 'Médicaments',
      description: 'Table des médicaments',
    },
  ],

  dimensions: [
    // Consultations dimensions
    {
      id: 'consultations.id',
      label: 'ID Consultation',
      table: 'consultations',
      type: 'string',
      groupable: false,
      filterable: true,
    },
    {
      id: 'consultations.visit_date',
      label: 'Date de visite',
      table: 'consultations',
      type: 'date',
      groupable: true,
      filterable: true,
    },
    {
      id: 'consultations.status',
      label: 'Statut',
      table: 'consultations',
      type: 'string',
      groupable: true,
      filterable: true,
    },
    {
      id: 'consultations.diagnosis',
      label: 'Diagnostic',
      table: 'consultations',
      type: 'string',
      groupable: true,
      filterable: true,
    },
    {
      id: 'consultations.consultation_type',
      label: 'Type de consultation',
      table: 'consultations',
      type: 'string',
      groupable: true,
      filterable: true,
    },

    // Patients dimensions
    {
      id: 'patients.id',
      label: 'ID Patient',
      table: 'patients',
      type: 'string',
      groupable: false,
      filterable: true,
    },
    {
      id: 'patients.gender',
      label: 'Genre',
      table: 'patients',
      type: 'string',
      groupable: true,
      filterable: true,
    },
    {
      id: 'patients.age_group',
      label: "Tranche d'âge",
      table: 'patients',
      type: 'string',
      groupable: true,
      filterable: true,
    },
    {
      id: 'patients.birth_date',
      label: 'Date de naissance',
      table: 'patients',
      type: 'date',
      groupable: false,
      filterable: true,
    },
    {
      id: 'patients.registration_date',
      label: "Date d'inscription",
      table: 'patients',
      type: 'date',
      groupable: true,
      filterable: true,
    },

    // Health workers dimensions
    {
      id: 'health_workers.id',
      label: 'ID Agent',
      table: 'health_workers',
      type: 'string',
      groupable: false,
      filterable: true,
    },
    {
      id: 'health_workers.role',
      label: 'Rôle',
      table: 'health_workers',
      type: 'string',
      groupable: true,
      filterable: true,
    },
    {
      id: 'health_workers.specialization',
      label: 'Spécialisation',
      table: 'health_workers',
      type: 'string',
      groupable: true,
      filterable: true,
    },

    // Facilities dimensions
    {
      id: 'facilities.id',
      label: 'ID Formation',
      table: 'facilities',
      type: 'string',
      groupable: false,
      filterable: true,
    },
    {
      id: 'facilities.name',
      label: 'Nom formation',
      table: 'facilities',
      type: 'string',
      groupable: true,
      filterable: true,
    },
    {
      id: 'facilities.type',
      label: 'Type formation',
      table: 'facilities',
      type: 'string',
      groupable: true,
      filterable: true,
    },
    {
      id: 'facilities.level',
      label: 'Niveau',
      table: 'facilities',
      type: 'string',
      groupable: true,
      filterable: true,
    },

    // Regions dimensions
    {
      id: 'regions.id',
      label: 'ID Région',
      table: 'regions',
      type: 'string',
      groupable: false,
      filterable: true,
    },
    {
      id: 'regions.name',
      label: 'Nom région',
      table: 'regions',
      type: 'string',
      groupable: true,
      filterable: true,
    },
    {
      id: 'regions.code',
      label: 'Code région',
      table: 'regions',
      type: 'string',
      groupable: true,
      filterable: true,
    },

    // Districts dimensions
    {
      id: 'districts.id',
      label: 'ID District',
      table: 'districts',
      type: 'string',
      groupable: false,
      filterable: true,
    },
    {
      id: 'districts.name',
      label: 'Nom district',
      table: 'districts',
      type: 'string',
      groupable: true,
      filterable: true,
    },

    // Vaccinations dimensions
    {
      id: 'vaccinations.vaccine_type',
      label: 'Type vaccin',
      table: 'vaccinations',
      type: 'string',
      groupable: true,
      filterable: true,
    },
    {
      id: 'vaccinations.dose_number',
      label: 'Numéro dose',
      table: 'vaccinations',
      type: 'number',
      groupable: true,
      filterable: true,
    },
    {
      id: 'vaccinations.vaccination_date',
      label: 'Date vaccination',
      table: 'vaccinations',
      type: 'date',
      groupable: true,
      filterable: true,
    },

    // Medications dimensions
    {
      id: 'medications.name',
      label: 'Nom médicament',
      table: 'medications',
      type: 'string',
      groupable: true,
      filterable: true,
    },
    {
      id: 'medications.category',
      label: 'Catégorie',
      table: 'medications',
      type: 'string',
      groupable: true,
      filterable: true,
    },
  ],

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
};

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export const QueryBuilderPage: React.FC = () => {
  const handleQueryChange = useCallback((query: QueryJSON) => {
    console.log('[QueryBuilder] Query changed:', query);
  }, []);

  const handleRun = useCallback((query: QueryJSON) => {
    console.log('[QueryBuilder] Running query:', query);
    // Here you would typically send the query to your API
    alert('Query exécutée!\n\n' + JSON.stringify(query, null, 2));
  }, []);

  const handleSave = useCallback((query: QueryJSON, name: string) => {
    console.log('[QueryBuilder] Saving query:', name, query);
    // Here you would typically save the query to your backend
  }, []);

  return (
    <QueryBuilder
      model={DEMO_MODEL}
      onQueryChange={handleQueryChange}
      onRun={handleRun}
      onSave={handleSave}
    />
  );
};

export default QueryBuilderPage;
