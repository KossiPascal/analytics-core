import { useCallback } from 'react';
import { useDashboardStore } from '@stores/OLD/dashboard.store';
import type { DashboardType, DashboardFilterParams } from '@stores/OLD/dashboard.store';
import { DashboardsApi } from '@/services/OLD/old/api.service';
import { useNotification } from '@/contexts/OLD/useNotification';

export function useDashboard() {
  const {
    data,
    status,
    filters,
    activeTab,
    activeRealtimeTab,
    setDashboardData,
    setDashboardStatus,
    setFilters,
    setActiveTab,
    setActiveRealtimeTab,
    clearDashboardData,
    clearAllData,
  } = useDashboardStore();

  const { showSuccess, showError, showWarning } = useNotification();

  // Fetch RECO Performance Dashboard
  const fetchRecoPerformance = useCallback(
    async (filterParams: DashboardFilterParams) => {
      setDashboardStatus('RECOS_PERFORMANCES', { isLoading: true, error: undefined });

      try {
        const response = await DashboardsApi.getRecoPerformance({
          months: filterParams.months,
          year: filterParams.year,
          recos: filterParams.recos,
        });

        if (response?.status === 200 && response?.data) {
          setDashboardData('RECOS_PERFORMANCES', response.data as any);
          setDashboardStatus('RECOS_PERFORMANCES', {
            isLoading: false,
            lastUpdated: new Date(),
          });
          showSuccess('Performances RECO récupérées avec succès');
        } else {
          setDashboardStatus('RECOS_PERFORMANCES', { isLoading: false });
          showWarning('Aucune donnée de performance trouvée');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement';
        setDashboardStatus('RECOS_PERFORMANCES', { isLoading: false, error: errorMessage });
        showError('Erreur lors du chargement des performances RECO');
      }
    },
    [setDashboardData, setDashboardStatus, showSuccess, showError, showWarning]
  );

  // Fetch Active RECO Dashboard
  const fetchActiveReco = useCallback(
    async (filterParams: DashboardFilterParams) => {
      setDashboardStatus('ACTIVE_RECOS', { isLoading: true, error: undefined });

      try {
        const response = await DashboardsApi.getActiveReco({
          year: filterParams.year,
          recos: filterParams.recos,
        });

        if (response?.status === 200 && response?.data) {
          setDashboardData('ACTIVE_RECOS', response.data as any);
          setDashboardStatus('ACTIVE_RECOS', {
            isLoading: false,
            lastUpdated: new Date(),
          });
          showSuccess('RECO actifs récupérés avec succès');
        } else {
          setDashboardStatus('ACTIVE_RECOS', { isLoading: false });
          showWarning('Aucune donnée de RECO actif trouvée');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement';
        setDashboardStatus('ACTIVE_RECOS', { isLoading: false, error: errorMessage });
        showError('Erreur lors du chargement des RECO actifs');
      }
    },
    [setDashboardData, setDashboardStatus, showSuccess, showError, showWarning]
  );

  // Fetch RECO Tasks State Dashboard
  const fetchRecoTasksState = useCallback(
    async (filterParams: DashboardFilterParams) => {
      if (!filterParams.start_date || !filterParams.end_date) {
        showWarning('Veuillez spécifier les dates de début et de fin');
        return;
      }

      setDashboardStatus('RECOS_TASKS_STATE', { isLoading: true, error: undefined });

      try {
        const response = await DashboardsApi.getRecoTasksState({
          start_date: filterParams.start_date,
          end_date: filterParams.end_date,
          recos: filterParams.recos,
        });

        if (response?.status === 200 && response?.data) {
          setDashboardData('RECOS_TASKS_STATE', response.data as any);
          setDashboardStatus('RECOS_TASKS_STATE', {
            isLoading: false,
            lastUpdated: new Date(),
          });
          showSuccess('État des tâches RECO récupéré avec succès');
        } else {
          setDashboardStatus('RECOS_TASKS_STATE', { isLoading: false });
          showWarning('Aucune donnée de tâche trouvée');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement';
        setDashboardStatus('RECOS_TASKS_STATE', { isLoading: false, error: errorMessage });
        showError('Erreur lors du chargement de l\'état des tâches');
      }
    },
    [setDashboardData, setDashboardStatus, showSuccess, showError, showWarning]
  );

  // Fetch Vaccination All Done
  const fetchVaccinationAllDone = useCallback(
    async (filterParams: DashboardFilterParams) => {
      setDashboardStatus('RECOS_VACCINES_ALL_DONE', { isLoading: true, error: undefined });

      try {
        const response = await DashboardsApi.getRecoVaccinationAllDone({
          months: filterParams.months,
          year: filterParams.year,
          recos: filterParams.recos,
        });

        if (response?.status === 200 && response?.data) {
          setDashboardData('RECOS_VACCINES_ALL_DONE', response.data as any);
          setDashboardStatus('RECOS_VACCINES_ALL_DONE', {
            isLoading: false,
            lastUpdated: new Date(),
          });
          showSuccess('Vaccinations complètes récupérées');
        } else {
          setDashboardStatus('RECOS_VACCINES_ALL_DONE', { isLoading: false });
          showWarning('Aucune donnée de vaccination complète trouvée');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement';
        setDashboardStatus('RECOS_VACCINES_ALL_DONE', { isLoading: false, error: errorMessage });
        showError('Erreur lors du chargement des vaccinations complètes');
      }
    },
    [setDashboardData, setDashboardStatus, showSuccess, showError, showWarning]
  );

  // Fetch Vaccination Partial Done
  const fetchVaccinationPartialDone = useCallback(
    async (filterParams: DashboardFilterParams) => {
      setDashboardStatus('RECOS_VACCINES_PARTIAL_DONE', { isLoading: true, error: undefined });

      try {
        const response = await DashboardsApi.getRecoVaccinationPartialDone({
          months: filterParams.months,
          year: filterParams.year,
          recos: filterParams.recos,
        });

        if (response?.status === 200 && response?.data) {
          setDashboardData('RECOS_VACCINES_PARTIAL_DONE', response.data as any);
          setDashboardStatus('RECOS_VACCINES_PARTIAL_DONE', {
            isLoading: false,
            lastUpdated: new Date(),
          });
          showSuccess('Vaccinations partielles récupérées');
        } else {
          setDashboardStatus('RECOS_VACCINES_PARTIAL_DONE', { isLoading: false });
          showWarning('Aucune donnée de vaccination partielle trouvée');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement';
        setDashboardStatus('RECOS_VACCINES_PARTIAL_DONE', { isLoading: false, error: errorMessage });
        showError('Erreur lors du chargement des vaccinations partielles');
      }
    },
    [setDashboardData, setDashboardStatus, showSuccess, showError, showWarning]
  );

  // Fetch Vaccination Not Done
  const fetchVaccinationNotDone = useCallback(
    async (filterParams: DashboardFilterParams) => {
      setDashboardStatus('RECOS_VACCINES_NOT_DONE', { isLoading: true, error: undefined });

      try {
        const response = await DashboardsApi.getRecoVaccinationNotDone({
          months: filterParams.months,
          year: filterParams.year,
          recos: filterParams.recos,
        });

        if (response?.status === 200 && response?.data) {
          setDashboardData('RECOS_VACCINES_NOT_DONE', response.data as any);
          setDashboardStatus('RECOS_VACCINES_NOT_DONE', {
            isLoading: false,
            lastUpdated: new Date(),
          });
          showSuccess('Non vaccinés récupérés');
        } else {
          setDashboardStatus('RECOS_VACCINES_NOT_DONE', { isLoading: false });
          showWarning('Aucune donnée de non vacciné trouvée');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement';
        setDashboardStatus('RECOS_VACCINES_NOT_DONE', { isLoading: false, error: errorMessage });
        showError('Erreur lors du chargement des non vaccinés');
      }
    },
    [setDashboardData, setDashboardStatus, showSuccess, showError, showWarning]
  );

  // Fetch dashboard by type
  const fetchDashboard = useCallback(
    async (type: DashboardType, filterParams: DashboardFilterParams) => {
      setFilters(filterParams);

      switch (type) {
        case 'RECOS_PERFORMANCES':
          return fetchRecoPerformance(filterParams);
        case 'ACTIVE_RECOS':
          return fetchActiveReco(filterParams);
        case 'RECOS_TASKS_STATE':
          return fetchRecoTasksState(filterParams);
        case 'RECOS_VACCINES_ALL_DONE':
          return fetchVaccinationAllDone(filterParams);
        case 'RECOS_VACCINES_PARTIAL_DONE':
          return fetchVaccinationPartialDone(filterParams);
        case 'RECOS_VACCINES_NOT_DONE':
          return fetchVaccinationNotDone(filterParams);
      }
    },
    [
      setFilters,
      fetchRecoPerformance,
      fetchActiveReco,
      fetchRecoTasksState,
      fetchVaccinationAllDone,
      fetchVaccinationPartialDone,
      fetchVaccinationNotDone,
    ]
  );

  // Fetch all monthly dashboards
  const fetchAllMonthlyDashboards = useCallback(
    async (filterParams: DashboardFilterParams) => {
      setFilters(filterParams);
      await Promise.all([
        fetchRecoPerformance(filterParams),
        fetchActiveReco(filterParams),
        fetchRecoTasksState(filterParams),
      ]);
    },
    [setFilters, fetchRecoPerformance, fetchActiveReco, fetchRecoTasksState]
  );

  // Fetch all realtime (vaccination) dashboards
  const fetchAllVaccinationDashboards = useCallback(
    async (filterParams: DashboardFilterParams) => {
      setFilters(filterParams);
      await Promise.all([
        fetchVaccinationAllDone(filterParams),
        fetchVaccinationPartialDone(filterParams),
        fetchVaccinationNotDone(filterParams),
      ]);
    },
    [setFilters, fetchVaccinationAllDone, fetchVaccinationPartialDone, fetchVaccinationNotDone]
  );

  // Vaccine status helper
  const getVaccineStatus = useCallback(
    (vaccinated: boolean, ageValue: number, minAge: number): 'on' | 'off' | 'na' => {
      if (ageValue >= minAge) return vaccinated === true ? 'on' : 'off';
      return 'na';
    },
    []
  );

  // Vaccine display helper
  const getVaccineDisplay = useCallback(
    (vaccinated: boolean, ageValue: number, minAge: number) => {
      const status = getVaccineStatus(vaccinated, ageValue, minAge);
      return {
        className: status === 'on' ? 'vaccine-on' : status === 'off' ? 'vaccine-off' : 'vaccine-na',
        icon: status === 'on' ? '✓' : status === 'off' ? '✗' : 'NA',
        status,
      };
    },
    [getVaccineStatus]
  );

  return {
    // State
    data,
    status,
    filters,
    activeTab,
    activeRealtimeTab,

    // Actions
    fetchDashboard,
    fetchRecoPerformance,
    fetchActiveReco,
    fetchRecoTasksState,
    fetchVaccinationAllDone,
    fetchVaccinationPartialDone,
    fetchVaccinationNotDone,
    fetchAllMonthlyDashboards,
    fetchAllVaccinationDashboards,
    setActiveTab,
    setActiveRealtimeTab,
    setFilters,
    clearDashboardData,
    clearAllData,

    // Helpers
    getVaccineStatus,
    getVaccineDisplay,

    // Computed
    isAnyLoading: Object.values(status).some((s) => s.isLoading),
    performanceData: data.RECOS_PERFORMANCES,
    activeRecoData: data.ACTIVE_RECOS,
    tasksStateData: data.RECOS_TASKS_STATE,
    vaccinationAllDoneData: data.RECOS_VACCINES_ALL_DONE,
    vaccinationPartialDoneData: data.RECOS_VACCINES_PARTIAL_DONE,
    vaccinationNotDoneData: data.RECOS_VACCINES_NOT_DONE,
  };
}
