import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '@components/ui';
import { Button } from '@components/ui/Button/Button';
import { Download, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import type { ActiveRecoDashboard, ActiveRecoUtils } from '@/models/OLD/old/dashboard.types';
import styles from './ActiveRecoTable.module.css';

interface ActiveRecoTableProps {
  data: ActiveRecoDashboard | undefined;
}

const MONTHS = [
  { key: 'jan', label: 'Jan' },
  { key: 'fev', label: 'Fév' },
  { key: 'mar', label: 'Mar' },
  { key: 'avr', label: 'Avr' },
  { key: 'mai', label: 'Mai' },
  { key: 'jui', label: 'Jui' },
  { key: 'jul', label: 'Jul' },
  { key: 'aou', label: 'Aoû' },
  { key: 'sep', label: 'Sep' },
  { key: 'oct', label: 'Oct' },
  { key: 'nov', label: 'Nov' },
  { key: 'dec', label: 'Déc' },
] as const;

function StatusIcon({ status }: { status: boolean | undefined }) {
  if (status === true) {
    return <CheckCircle size={16} className={styles.iconOn} />;
  }
  if (status === false) {
    return <XCircle size={16} className={styles.iconOff} />;
  }
  return <MinusCircle size={16} className={styles.iconNa} />;
}

export function ActiveRecoTable({ data }: ActiveRecoTableProps) {
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set());

  const toggleDistrict = (districtId: string) => {
    setExpandedDistricts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(districtId)) {
        newSet.delete(districtId);
      } else {
        newSet.add(districtId);
      }
      return newSet;
    });
  };

  const exportToCSV = () => {
    if (!data?.record) return;

    const headers = [
      'District', 'RECO', 'Téléphone', 'Village',
      ...MONTHS.flatMap((m) => [`${m.label} Couv`, `${m.label} Sup`, `${m.label} Fonc`]),
    ];

    const rows: string[][] = [];

    data.record.forEach((district) => {
      district.recos?.forEach((reco) => {
        const row = [
          district.name,
          reco.name,
          reco.phone || '',
          reco.village_secteur?.name || '',
        ];
        MONTHS.forEach((month) => {
          const monthData = (reco as any)[month.key] as ActiveRecoUtils | undefined;
          row.push(
            monthData?.cover ? 'Oui' : 'Non',
            monthData?.supervised ? 'Oui' : 'Non',
            monthData?.fonctionnal ? 'Oui' : 'Non'
          );
        });
        rows.push(row);
      });
    });

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reco_actifs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (!data || !data.record || data.record.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2>Pas de données, appliquer le filtre !</h2>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader
        title="STATUS DES RECOS ACTIFS"
        subtitle="Couverture, Supervision et Fonctionnalité par mois"
        action={
          <Button variant="ghost" size="sm" onClick={exportToCSV} title="Exporter CSV">
            <Download size={16} />
          </Button>
        }
      />
      <CardBody>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendColor} style={{ backgroundColor: '#22c55e' }} /> Couverture
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendColor} style={{ backgroundColor: '#3b82f6' }} /> Supervision
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendColor} style={{ backgroundColor: '#f59e0b' }} /> Fonctionnel
          </span>
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.headerRow1}>
                <th rowSpan={2}>District/RECO</th>
                <th rowSpan={2}>Téléphone</th>
                <th rowSpan={2}>Village</th>
                {MONTHS.map((month) => (
                  <th key={month.key} colSpan={3}>
                    {month.label}
                  </th>
                ))}
              </tr>
              <tr className={styles.headerRow2}>
                {MONTHS.map((month) => (
                  <React.Fragment key={month.key}>
                    <th title="Couverture">C</th>
                    <th title="Supervision">S</th>
                    <th title="Fonctionnel">F</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Total Row */}
              {data.total && (
                <tr className={styles.totalRow}>
                  <td colSpan={3} className={styles.totalLabel}>TOTAUX</td>
                  {MONTHS.map((month) => {
                    const monthData = (data.total as any)[month.key];
                    return (
                      <React.Fragment key={month.key}>
                        <td>{monthData?.cover ?? 0}</td>
                        <td>{monthData?.supervised ?? 0}</td>
                        <td>{monthData?.fonctionnal ?? 0}</td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              )}

              {/* District and RECO Rows */}
              {data.record.map((district) => (
                <React.Fragment key={district.id}>
                  <tr
                    className={styles.districtRow}
                    onClick={() => toggleDistrict(district.id)}
                  >
                    <td colSpan={3} className={styles.districtName}>
                      <span className={styles.expandIcon}>
                        {expandedDistricts.has(district.id) ? '▼' : '▶'}
                      </span>
                      {district.name} ({district.recos?.length || 0} RECOs)
                    </td>
                    {MONTHS.map((month) => (
                      <React.Fragment key={month.key}>
                        <td colSpan={3}></td>
                      </React.Fragment>
                    ))}
                  </tr>

                  {expandedDistricts.has(district.id) &&
                    district.recos?.map((reco) => (
                      <tr key={reco.id} className={styles.recoRow}>
                        <td className={styles.recoName}>{reco.name}</td>
                        <td>{reco.phone}</td>
                        <td>{reco.village_secteur?.name}</td>
                        {MONTHS.map((month) => {
                          const monthData = (reco as any)[month.key] as ActiveRecoUtils | undefined;
                          return (
                            <React.Fragment key={month.key}>
                              <td>
                                <StatusIcon status={monthData?.cover} />
                              </td>
                              <td>
                                <StatusIcon status={monthData?.supervised} />
                              </td>
                              <td>
                                <StatusIcon status={monthData?.fonctionnal} />
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
