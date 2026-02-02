import { useCallback } from 'react';
import { useReportsStore } from '@stores/OLD/reports.store';
import type { FilterParams } from '@stores/OLD/reports.store';
import { ReportsApi } from '@/services/OLD/old/api.service';
import type { ReportType } from '@/models/OLD/old/reports.types';
import { useNotification } from '@/contexts/OLD/useNotification';

export function useReports() {
  const {
    data,
    status,
    filters,
    activeTab,
    hideZeroValues,
    setReportData,
    setReportStatus,
    setFilters,
    setActiveTab,
    setHideZeroValues,
    clearReportData,
  } = useReportsStore();

  const { showSuccess, showError, showWarning } = useNotification();

  // Fetch report based on type
  const fetchReport = useCallback(
    async (reportType: ReportType, filterParams: FilterParams) => {
      setReportStatus(reportType, { isLoading: true, error: undefined });

      try {
        let response;

        // const apiParams = {
        //   start_date: filterParams.start_date,
        //   end_date: filterParams.end_date,
        //   recos: filterParams.recos,
        // };

        const apiParams = {
            months: [],
            year: 2026,
            recos: [],
            sync: false
        }

        switch (reportType) {
          case 'MONTHLY_ACTIVITY':
            response = await ReportsApi.getChwsRecoReports(apiParams);
            break;
          case 'FAMILY_PLANNING':
            response = await ReportsApi.getFamilyPlanningReports(apiParams);
            break;
          case 'HOUSE_HOLD_RECAP':
            response = await ReportsApi.getHouseholdRecapReports(apiParams);
            break;
          case 'MORBIDITY':
            response = await ReportsApi.getMorbidityReports(apiParams);
            break;
          case 'PCIMNE_NEWBORN':
            response = await ReportsApi.getPcimneNewbornReports(apiParams);
            break;
          case 'PROMOTION':
            response = await ReportsApi.getPromotionReports(apiParams);
            break;
          case 'RECO_MEG_QUANTITIES':
            response = await ReportsApi.getRecoMegSituationReports(apiParams);
            break;
        }

        if (response?.data) {
          const responseData = response as { data: unknown; is_validate?: boolean; already_on_dhis2?: boolean };
          setReportData(reportType, responseData.data as any);
          setReportStatus(reportType, {
            isLoading: false,
            isValidated: responseData.is_validate ?? false,
            isOnDhis2: responseData.already_on_dhis2 ?? false,
          });
          showSuccess(`${reportType} recupere avec succes`);
        } else {
          setReportStatus(reportType, { isLoading: false });
          showWarning(`Aucune donnee trouvee pour ${reportType}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement';
        setReportStatus(reportType, { isLoading: false, error: errorMessage });
        showError(`Erreur lors du chargement du ${reportType}`);
      }
    },
    [setReportData, setReportStatus, showSuccess, showError, showWarning]
  );

  // Fetch all reports
  const fetchAllReports = useCallback(
    async (filterParams: FilterParams) => {
      setFilters(filterParams);

      const reportTypes: ReportType[] = [
        'MONTHLY_ACTIVITY',
        'FAMILY_PLANNING',
        'HOUSE_HOLD_RECAP',
        'MORBIDITY',
        'PCIMNE_NEWBORN',
        'PROMOTION',
        'RECO_MEG_QUANTITIES',
      ];

      await Promise.all(reportTypes.map((type) => fetchReport(type, filterParams)));
    },
    [fetchReport, setFilters]
  );

  // Validate report
  const validateReport = useCallback(
    async (reportType: ReportType) => {
      if (!filters) {
        showWarning('Veuillez d\'abord appliquer les filtres');
        return;
      }

      setReportStatus(reportType, { isValidating: true });

      try {
        let response;
        const params = { ...filters };

        // For household recap, include data IDs
        if (reportType === 'HOUSE_HOLD_RECAP' && data.HOUSE_HOLD_RECAP) {
          (params as any).dataIds = data.HOUSE_HOLD_RECAP.map((h) => h.id);
        }

        // const apiParams = {
        //   start_date: params.start_date,
        //   end_date: params.end_date,
        //   recos: params.recos,
        //   dataIds: (params as any).dataIds,
        // };

        const apiParams = {
            months: [],
            year: 2026,
            recos: [],
            dataIds:[]
        }

        switch (reportType) {
          case 'MONTHLY_ACTIVITY':
            response = await ReportsApi.validateChwsRecoReports(apiParams);
            break;
          case 'FAMILY_PLANNING':
            response = await ReportsApi.validateFamilyPlanningReports(apiParams);
            break;
          case 'HOUSE_HOLD_RECAP':
            response = await ReportsApi.validateHouseholdRecapReports(apiParams);
            break;
          case 'MORBIDITY':
            response = await ReportsApi.validateMorbidityReports(apiParams);
            break;
          case 'PCIMNE_NEWBORN':
            response = await ReportsApi.validatePcimneNewbornReports(apiParams);
            break;
          case 'PROMOTION':
            response = await ReportsApi.validatePromotionReports(apiParams);
            break;
          case 'RECO_MEG_QUANTITIES':
            response = await ReportsApi.validateRecoMegSituationReports(apiParams);
            break;
        }

        if (response?.status === 200) {
          setReportStatus(reportType, { isValidating: false, isValidated: true });
          showSuccess(`${reportType} valide avec succes`);
          // Refresh the report data
          await fetchReport(reportType, filters);
        } else {
          setReportStatus(reportType, { isValidating: false });
          showWarning(`Impossible de valider ${reportType}`);
        }
      } catch (error) {
        setReportStatus(reportType, { isValidating: false });
        showError(`Erreur lors de la validation du ${reportType}`);
      }
    },
    [filters, data, setReportStatus, fetchReport, showSuccess, showWarning, showError]
  );

  // Cancel validation
  const cancelValidation = useCallback(
    async (reportType: ReportType) => {
      if (!filters) {
        showWarning('Veuillez d\'abord appliquer les filtres');
        return;
      }

      setReportStatus(reportType, { isCancellingValidation: true });

      try {
        let response;
        const params = { ...filters };

        if (reportType === 'HOUSE_HOLD_RECAP' && data.HOUSE_HOLD_RECAP) {
          (params as any).dataIds = data.HOUSE_HOLD_RECAP.map((h) => h.id);
        }

        // const cancelApiParams = {
        //   start_date: params.start_date,
        //   end_date: params.end_date,
        //   recos: params.recos,
        //   dataIds: (params as any).dataIds,
        // };

        const cancelApiParams = {
            months: [],
            year: 2026,
            recos: [],
            dataIds:[]
        }

        switch (reportType) {
          case 'MONTHLY_ACTIVITY':
            response = await ReportsApi.cancelValidateChwsRecoReports(cancelApiParams);
            break;
          case 'FAMILY_PLANNING':
            response = await ReportsApi.cancelValidateFamilyPlanningReports(cancelApiParams);
            break;
          case 'HOUSE_HOLD_RECAP':
            response = await ReportsApi.cancelValidateHouseholdRecapReports(cancelApiParams);
            break;
          case 'MORBIDITY':
            response = await ReportsApi.cancelValidateMorbidityReports(cancelApiParams);
            break;
          case 'PCIMNE_NEWBORN':
            response = await ReportsApi.cancelValidatePcimneNewbornReports(cancelApiParams);
            break;
          case 'PROMOTION':
            response = await ReportsApi.cancelValidatePromotionReports(cancelApiParams);
            break;
          case 'RECO_MEG_QUANTITIES':
            response = await ReportsApi.cancelValidateRecoMegSituationReports(cancelApiParams);
            break;
        }

        if (response?.status === 200) {
          setReportStatus(reportType, { isCancellingValidation: false, isValidated: false });
          showSuccess(`Validation du ${reportType} annulee`);
          await fetchReport(reportType, filters);
        } else {
          setReportStatus(reportType, { isCancellingValidation: false });
          showWarning(`Impossible d'annuler la validation de ${reportType}`);
        }
      } catch (error) {
        setReportStatus(reportType, { isCancellingValidation: false });
        showError(`Erreur lors de l'annulation de la validation`);
      }
    },
    [filters, data, setReportStatus, fetchReport, showSuccess, showWarning, showError]
  );

  // Display value with hideZero option
  const displayValue = useCallback(
    (value: number | string | null | undefined): string => {
      if (value === null || value === undefined) return '-';
      if (hideZeroValues && (value === 0 || value === '0')) return '';
      return String(value);
    },
    [hideZeroValues]
  );

  return {
    // State
    data,
    status,
    filters,
    activeTab,
    hideZeroValues,

    // Actions
    fetchReport,
    fetchAllReports,
    validateReport,
    cancelValidation,
    setActiveTab,
    setFilters,
    setHideZeroValues,
    clearReportData,
    displayValue,

    // Computed
    isAnyLoading: Object.values(status).some((s) => s.isLoading),
    isAllValidated: Object.values(status).every((s) => s.isValidated),
  };
}
