import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@components/ui';
import { Button } from '@components/ui/Button/Button';
import { Target, Download, Eye, EyeOff } from 'lucide-react';
import type { RecoPerformanceDashboard } from '@/types/dashboard.types';
import { PerformanceChartModal } from './PerformanceChartModal';
import styles from './RecoPerformanceTable.module.css';

interface RecoPerformanceTableProps {
  data: RecoPerformanceDashboard | undefined;
}

export function RecoPerformanceTable({ data }: RecoPerformanceTableProps) {
  const [hideZeros, setHideZeros] = useState(false);
  const [selectedReco, setSelectedReco] = useState<{ id: string; name: string } | null>(null);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);

  const displayValue = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '-';
    if (hideZeros && value === 0) return '';
    return String(value);
  };

  const handleShowChart = (recoId: string, recoName: string) => {
    setSelectedReco({ id: recoId, name: recoName });
    setIsChartModalOpen(true);
  };

  const exportToCSV = () => {
    if (!data?.performances) return;

    const headers = [
      'N°', 'Nom', 'Téléphone', 'Village',
      'Ménages', 'Patients',
      'Adulte Cons', 'Adulte Suivi', 'Adulte Total',
      'PF Cons', 'PF Suivi', 'PF Total',
      'Nouveau-né Cons', 'Nouveau-né Suivi', 'Nouveau-né Total',
      'Enfant Cons', 'Enfant Suivi', 'Enfant Total',
      'Enceinte Cons', 'Enceinte Suivi', 'Enceinte Total',
      'Total Cons', 'Total Suivi', 'Total Total',
      'Référence', 'Accouchement', 'Événement', 'Promotion', 'Décès', 'Toutes Actions'
    ];

    const rows = data.performances.map((d, i) => [
      i + 1,
      d.reco?.name || '',
      d.reco?.phone || '',
      d.village_secteur?.name || '',
      d.family_count,
      d.patient_count,
      d.adult_data_count?.consultation,
      d.adult_data_count?.followup,
      d.adult_data_count?.total,
      d.family_planning_data_count?.consultation,
      d.family_planning_data_count?.followup,
      d.family_planning_data_count?.total,
      d.newborn_data_count?.consultation,
      d.newborn_data_count?.followup,
      d.newborn_data_count?.total,
      d.pcimne_data_count?.consultation,
      d.pcimne_data_count?.followup,
      d.pcimne_data_count?.total,
      d.pregnant_data_count?.consultation,
      d.pregnant_data_count?.followup,
      d.pregnant_data_count?.total,
      d.all_consultation_followup_count?.consultation,
      d.all_consultation_followup_count?.followup,
      d.all_consultation_followup_count?.total,
      d.referal_data_count,
      d.delivery_data_count,
      d.events_data_count,
      d.promotional_data_count,
      d.death_data_count,
      d.all_actions_count
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `performances_reco_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (!data || !data.performances || data.performances.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2>Pas de données, appliquer le filtre !</h2>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader
          title="PERFORMANCES DES RECOS"
          action={
            <div className={styles.headerActions}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHideZeros(!hideZeros)}
                title={hideZeros ? 'Afficher les zéros' : 'Masquer les zéros'}
              >
                {hideZeros ? <Eye size={16} /> : <EyeOff size={16} />}
              </Button>
              <Button variant="ghost" size="sm" onClick={exportToCSV} title="Exporter CSV">
                <Download size={16} />
              </Button>
            </div>
          }
        />
        <CardBody>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.headerRow1}>
                  <th colSpan={4}>RECO</th>
                  <th rowSpan={2}>MÉNAGES</th>
                  <th rowSpan={2}>PATIENTS</th>
                  <th colSpan={3}>ADULTE</th>
                  <th colSpan={3}>PF</th>
                  <th colSpan={3}>NOUVEAU NÉ</th>
                  <th colSpan={3}>ENFANT</th>
                  <th colSpan={3}>ENCEINTE</th>
                  <th colSpan={3}>TOUTE CONSULTATION</th>
                  <th rowSpan={2}>RÉFÉRENCE</th>
                  <th rowSpan={2}>ACCOUCHEMENT</th>
                  <th rowSpan={2}>ÉVÉNEMENT</th>
                  <th rowSpan={2}>PROMOTION</th>
                  <th rowSpan={2}>DÉCÈS</th>
                  <th rowSpan={2}>TOUTES ACTIONS</th>
                </tr>
                <tr className={styles.headerRow2}>
                  <th>N°</th>
                  <th>Nom</th>
                  <th>Téléphone</th>
                  <th>Village</th>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <React.Fragment key={i}>
                      <th>Cons</th>
                      <th>Suivi</th>
                      <th>Total</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Total Row */}
                {data.total && (
                  <tr className={styles.totalRow}>
                    <td colSpan={4} className={styles.totalLabel}>LES TOTAUX</td>
                    <td>{displayValue(data.total.family_count)}</td>
                    <td>{displayValue(data.total.patient_count)}</td>
                    <td>{displayValue(data.total.adult_data_count?.consultation)}</td>
                    <td>{displayValue(data.total.adult_data_count?.followup)}</td>
                    <td>{displayValue(data.total.adult_data_count?.total)}</td>
                    <td>{displayValue(data.total.family_planning_data_count?.consultation)}</td>
                    <td>{displayValue(data.total.family_planning_data_count?.followup)}</td>
                    <td>{displayValue(data.total.family_planning_data_count?.total)}</td>
                    <td>{displayValue(data.total.newborn_data_count?.consultation)}</td>
                    <td>{displayValue(data.total.newborn_data_count?.followup)}</td>
                    <td>{displayValue(data.total.newborn_data_count?.total)}</td>
                    <td>{displayValue(data.total.pcimne_data_count?.consultation)}</td>
                    <td>{displayValue(data.total.pcimne_data_count?.followup)}</td>
                    <td>{displayValue(data.total.pcimne_data_count?.total)}</td>
                    <td>{displayValue(data.total.pregnant_data_count?.consultation)}</td>
                    <td>{displayValue(data.total.pregnant_data_count?.followup)}</td>
                    <td>{displayValue(data.total.pregnant_data_count?.total)}</td>
                    <td>{displayValue(data.total.all_consultation_followup_count?.consultation)}</td>
                    <td>{displayValue(data.total.all_consultation_followup_count?.followup)}</td>
                    <td>{displayValue(data.total.all_consultation_followup_count?.total)}</td>
                    <td>{displayValue(data.total.referal_data_count)}</td>
                    <td>{displayValue(data.total.delivery_data_count)}</td>
                    <td>{displayValue(data.total.events_data_count)}</td>
                    <td>{displayValue(data.total.promotional_data_count)}</td>
                    <td>{displayValue(data.total.death_data_count)}</td>
                    <td>{displayValue(data.total.all_actions_count)}</td>
                  </tr>
                )}

                {/* Data Rows */}
                {data.performances.map((d: any, i: number) => (
                  <tr key={d.id || i}>
                    <td>{i + 1}</td>
                    <td className={styles.nameCell}>
                      {d.reco?.name}
                      <button
                        className={styles.chartButton}
                        onClick={() => handleShowChart(d.reco?.id, d.reco?.name)}
                        title="Voir le graphique"
                      >
                        <Target size={14} />
                      </button>
                    </td>
                    <td>{d.reco?.phone}</td>
                    <td>{d.village_secteur?.name}</td>
                    <td>{displayValue(d.family_count)}</td>
                    <td>{displayValue(d.patient_count)}</td>
                    <td>{displayValue(d.adult_data_count?.consultation)}</td>
                    <td>{displayValue(d.adult_data_count?.followup)}</td>
                    <td>{displayValue(d.adult_data_count?.total)}</td>
                    <td>{displayValue(d.family_planning_data_count?.consultation)}</td>
                    <td>{displayValue(d.family_planning_data_count?.followup)}</td>
                    <td>{displayValue(d.family_planning_data_count?.total)}</td>
                    <td>{displayValue(d.newborn_data_count?.consultation)}</td>
                    <td>{displayValue(d.newborn_data_count?.followup)}</td>
                    <td>{displayValue(d.newborn_data_count?.total)}</td>
                    <td>{displayValue(d.pcimne_data_count?.consultation)}</td>
                    <td>{displayValue(d.pcimne_data_count?.followup)}</td>
                    <td>{displayValue(d.pcimne_data_count?.total)}</td>
                    <td>{displayValue(d.pregnant_data_count?.consultation)}</td>
                    <td>{displayValue(d.pregnant_data_count?.followup)}</td>
                    <td>{displayValue(d.pregnant_data_count?.total)}</td>
                    <td>{displayValue(d.all_consultation_followup_count?.consultation)}</td>
                    <td>{displayValue(d.all_consultation_followup_count?.followup)}</td>
                    <td>{displayValue(d.all_consultation_followup_count?.total)}</td>
                    <td>{displayValue(d.referal_data_count)}</td>
                    <td>{displayValue(d.delivery_data_count)}</td>
                    <td>{displayValue(d.events_data_count)}</td>
                    <td>{displayValue(d.promotional_data_count)}</td>
                    <td>{displayValue(d.death_data_count)}</td>
                    <td>{displayValue(d.all_actions_count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {selectedReco && data.yearDatas && (
        <PerformanceChartModal
          isOpen={isChartModalOpen}
          onClose={() => setIsChartModalOpen(false)}
          recoName={selectedReco.name}
          chartData={data.yearDatas[selectedReco.id]}
        />
      )}
    </>
  );
}

// Add React import for Fragment
import React from 'react';
