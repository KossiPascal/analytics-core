import { Card, CardHeader, CardBody } from '@components/ui';
import { Button } from '@components/ui/Button/Button';
import { Download, CheckCircle } from 'lucide-react';
import type { ReportType } from '@/models/OLD/old/reports.types';
import styles from './ReportTable.module.css';

interface ReportTableProps {
  reportType: ReportType;
  data: any;
  displayValue: (value: number | string | null | undefined) => string;
  isValidated: boolean;
}

const REPORT_CONFIGS: Record<ReportType, { title: string; columns: { key: string; label: string; subColumns?: { key: string; label: string }[] }[] }> = {
  MONTHLY_ACTIVITY: {
    title: "RAPPORT D'ACTIVITÉS RECO",
    columns: [
      { key: 'reco_name', label: 'RECO' },
      { key: 'village_name', label: 'Village' },
      { key: 'total_home_visit', label: 'Visites domicile' },
      { key: 'total_consultation', label: 'Consultations' },
      { key: 'total_followup', label: 'Suivis' },
      { key: 'total_reference', label: 'Références' },
      { key: 'total_death', label: 'Décès' },
      { key: 'total_events', label: 'Événements' },
    ],
  },
  PROMOTION: {
    title: 'RAPPORT PROMOTION SANTÉ',
    columns: [
      { key: 'reco_name', label: 'RECO' },
      { key: 'village_name', label: 'Village' },
      { key: 'individual_talk', label: 'Causeries individuelles' },
      { key: 'group_talk', label: 'Causeries groupées' },
      { key: 'total_women_assisted', label: 'Femmes assistées' },
      { key: 'total_men_assisted', label: 'Hommes assistés' },
      { key: 'total_child_assisted', label: 'Enfants assistés' },
    ],
  },
  FAMILY_PLANNING: {
    title: 'RAPPORT PLANIFICATION FAMILIALE',
    columns: [
      { key: 'reco_name', label: 'RECO' },
      { key: 'village_name', label: 'Village' },
      { key: 'new_users', label: 'Nouvelles utilisatrices' },
      { key: 'old_users', label: 'Anciennes utilisatrices' },
      { key: 'pill_users', label: 'Pilule' },
      { key: 'injection_users', label: 'Injection' },
      { key: 'implant_users', label: 'Implant' },
      { key: 'condom_users', label: 'Préservatif' },
    ],
  },
  MORBIDITY: {
    title: 'RAPPORT MORBIDITÉ',
    columns: [
      { key: 'reco_name', label: 'RECO' },
      { key: 'village_name', label: 'Village' },
      { key: 'malaria_cases', label: 'Paludisme' },
      { key: 'diarrhea_cases', label: 'Diarrhée' },
      { key: 'pneumonia_cases', label: 'Pneumonie' },
      { key: 'malnutrition_cases', label: 'Malnutrition' },
      { key: 'other_cases', label: 'Autres' },
      { key: 'total_cases', label: 'Total' },
    ],
  },
  PCIMNE_NEWBORN: {
    title: 'RAPPORT PCIMNE / NOUVEAU-NÉ',
    columns: [
      { key: 'reco_name', label: 'RECO' },
      { key: 'village_name', label: 'Village' },
      { key: 'newborn_visited', label: 'Nouveau-nés visités' },
      { key: 'children_sick', label: 'Enfants malades' },
      { key: 'children_treated', label: 'Enfants traités' },
      { key: 'children_referred', label: 'Enfants référés' },
      { key: 'deaths', label: 'Décès' },
    ],
  },
  HOUSE_HOLD_RECAP: {
    title: 'RAPPORT RÉCAPITULATIF MÉNAGES',
    columns: [
      { key: 'reco_name', label: 'RECO' },
      { key: 'village_name', label: 'Village' },
      { key: 'total_households', label: 'Total ménages' },
      { key: 'total_members', label: 'Total membres' },
      { key: 'pregnant_women', label: 'Femmes enceintes' },
      { key: 'children_under_5', label: 'Enfants < 5 ans' },
      { key: 'children_vaccinated', label: 'Enfants vaccinés' },
    ],
  },
  RECO_MEG_QUANTITIES: {
    title: 'RAPPORT SITUATION MEG',
    columns: [
      { key: 'reco_name', label: 'RECO' },
      { key: 'village_name', label: 'Village' },
      { key: 'paracetamol', label: 'Paracétamol' },
      { key: 'amoxicillin', label: 'Amoxicilline' },
      { key: 'ors', label: 'SRO' },
      { key: 'zinc', label: 'Zinc' },
      { key: 'act', label: 'ACT' },
      { key: 'tdr', label: 'TDR' },
    ],
  },
};

export function ReportTable({
  reportType,
  data,
  displayValue,
  isValidated,
}: ReportTableProps) {
  const config = REPORT_CONFIGS[reportType];

  const exportToCSV = () => {
    if (!data) return;

    const dataArray = Array.isArray(data) ? data : (data.data || [data]);
    if (dataArray.length === 0) return;

    const headers = config.columns.map((col) => col.label);
    const rows = dataArray.map((row: any) =>
      config.columns.map((col) => row[col.key] ?? '')
    );

    const csvContent = [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${reportType.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (!data) {
    return (
      <div className={styles.emptyState}>
        <h2>Pas de données, appliquer le filtre !</h2>
      </div>
    );
  }

  const dataArray = Array.isArray(data) ? data : (data.data || [data]);

  if (dataArray.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2>Aucune donnée disponible pour ce rapport</h2>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <div className={styles.headerTitle}>
            {config.title}
            {isValidated && (
              <span className={styles.validatedTag}>
                <CheckCircle size={14} />
                Validé
              </span>
            )}
          </div>
        }
        action={
          <Button variant="ghost" size="sm" onClick={exportToCSV} title="Exporter CSV">
            <Download size={16} />
          </Button>
        }
      />
      <CardBody>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>N°</th>
                {config.columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataArray.map((row: any, index: number) => (
                <tr key={row.id || index}>
                  <td>{index + 1}</td>
                  {config.columns.map((col) => (
                    <td key={col.key}>
                      {typeof row[col.key] === 'number'
                        ? displayValue(row[col.key])
                        : row[col.key] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {data.total && (
              <tfoot>
                <tr className={styles.totalRow}>
                  <td colSpan={2}>TOTAUX</td>
                  {config.columns.slice(2).map((col) => (
                    <td key={col.key}>
                      {displayValue(data.total[col.key])}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
