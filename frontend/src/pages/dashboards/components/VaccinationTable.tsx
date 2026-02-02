import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@components/ui';
import { Button } from '@components/ui/Button/Button';
import { Download, Phone, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';
import type { RecoVaccinationDashboardDbOutput } from '@/models/OLD/old/dashboard.types';
import styles from './VaccinationTable.module.css';

interface VaccinationTableProps {
  data: RecoVaccinationDashboardDbOutput[] | undefined;
  type: 'all_done' | 'partial_done' | 'not_done';
  isLoading?: boolean;
}

const VACCINES = [
  { key: 'vaccine_BCG', label: 'BCG', ageKey: 'child_age_in_days', minAge: 0 },
  { key: 'vaccine_VPO_0', label: 'VPO0', ageKey: 'child_age_in_days', minAge: 0 },
  { key: 'vaccine_PENTA_1', label: 'PENTA1', ageKey: 'child_age_in_days', minAge: 42 },
  { key: 'vaccine_VPO_1', label: 'VPO1', ageKey: 'child_age_in_days', minAge: 42 },
  { key: 'vaccine_PENTA_2', label: 'PENTA2', ageKey: 'child_age_in_days', minAge: 70 },
  { key: 'vaccine_VPO_2', label: 'VPO2', ageKey: 'child_age_in_days', minAge: 70 },
  { key: 'vaccine_PENTA_3', label: 'PENTA3', ageKey: 'child_age_in_days', minAge: 98 },
  { key: 'vaccine_VPO_3', label: 'VPO3', ageKey: 'child_age_in_days', minAge: 98 },
  { key: 'vaccine_VPI_1', label: 'VPI1', ageKey: 'child_age_in_days', minAge: 98 },
  { key: 'vaccine_VAR_1', label: 'VAR1', ageKey: 'child_age_in_months', minAge: 9 },
  { key: 'vaccine_VAA', label: 'VAA', ageKey: 'child_age_in_months', minAge: 9 },
  { key: 'vaccine_VPI_2', label: 'VPI2', ageKey: 'child_age_in_months', minAge: 9 },
  { key: 'vaccine_MEN_A', label: 'MENA', ageKey: 'child_age_in_months', minAge: 15 },
  { key: 'vaccine_VAR_2', label: 'VAR2', ageKey: 'child_age_in_months', minAge: 15 },
] as const;

function getVaccineStatus(vaccinated: boolean, ageValue: number, minAge: number): 'on' | 'off' | 'na' {
  if (ageValue >= minAge) return vaccinated === true ? 'on' : 'off';
  return 'na';
}

function VaccineCell({ vaccinated, ageValue, minAge }: { vaccinated: boolean; ageValue: number; minAge: number }) {
  const status = getVaccineStatus(vaccinated, ageValue, minAge);

  return (
    <td className={styles[`vaccine${status.charAt(0).toUpperCase()}${status.slice(1)}`]}>
      {status === 'on' ? '✓' : status === 'off' ? '✗' : 'NA'}
    </td>
  );
}

export function VaccinationTable({ data, type }: VaccinationTableProps) {
  const [expandedRecos, setExpandedRecos] = useState<Set<string>>(new Set());
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());

  const toggleReco = (recoId: string) => {
    setExpandedRecos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recoId)) {
        newSet.delete(recoId);
      } else {
        newSet.add(recoId);
      }
      return newSet;
    });
  };

  const toggleFamily = (familyKey: string) => {
    setExpandedFamilies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(familyKey)) {
        newSet.delete(familyKey);
      } else {
        newSet.add(familyKey);
      }
      return newSet;
    });
  };

  const getTitle = () => {
    switch (type) {
      case 'all_done':
        return 'Vaccinations complètes';
      case 'partial_done':
        return 'Vaccinations partielles';
      case 'not_done':
        return 'Non vaccinés';
    }
  };

  const getSubtitle = () => {
    const totalChildren = data?.reduce((sum, reco) => {
      return sum + (reco.children_vaccines?.reduce((famSum, fam) => famSum + (fam.data?.length || 0), 0) || 0);
    }, 0) || 0;
    return `${totalChildren} enfant(s)`;
  };

  const exportToCSV = () => {
    if (!data) return;

    const headers = [
      'RECO', 'Village', 'Famille', 'Enfant', 'Code', 'Sexe', 'Âge',
      'Tél Parent', 'Tél RECO',
      ...VACCINES.map(v => v.label)
    ];

    const rows: string[][] = [];

    data.forEach((reco) => {
      reco.children_vaccines?.forEach((family) => {
        family.data?.forEach((child) => {
          const row = [
            reco.reco?.name || '',
            reco.village_secteur?.name || '',
            family.family_fullname || family.family_name || '',
            child.child_name || '',
            child.child_code || '',
            child.child_sex || '',
            child.child_age_str || '',
            child.parent_phone || '',
            child.reco_phone || '',
            ...VACCINES.map(v => {
              const vaccinated = (child as any)[v.key];
              const ageValue = (child as any)[v.ageKey];
              const status = getVaccineStatus(vaccinated, ageValue, v.minAge);
              return status === 'on' ? 'Oui' : status === 'off' ? 'Non' : 'NA';
            })
          ];
          rows.push(row);
        });
      });
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vaccinations_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (!data || data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2>Pas de données, appliquer le filtre !</h2>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader
        title={getTitle()}
        subtitle={getSubtitle()}
        action={
          <Button variant="ghost" size="sm" onClick={exportToCSV} title="Exporter CSV">
            <Download size={16} />
          </Button>
        }
      />
      <CardBody>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.legendColor} ${styles.vaccineOn}`}>✓</span> Vacciné
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendColor} ${styles.vaccineOff}`}>✗</span> Non vacciné
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendColor} ${styles.vaccineNa}`}>NA</span> Non applicable
          </span>
        </div>

        <div className={styles.vaccinationList}>
          {data.map((reco) => {
            const isRecoExpanded = expandedRecos.has(reco.id);
            const childCount = reco.children_vaccines?.reduce((sum, fam) => sum + (fam.data?.length || 0), 0) || 0;

            return (
              <div key={reco.id} className={styles.recoSection}>
                <div className={styles.recoHeader} onClick={() => toggleReco(reco.id)}>
                  <div className={styles.recoInfo}>
                    {isRecoExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <span className={styles.recoName}>{reco.reco?.name}</span>
                    <span className={styles.recoVillage}>{reco.village_secteur?.name}</span>
                  </div>
                  <span className={styles.childCount}>{childCount} enfant(s)</span>
                </div>

                {isRecoExpanded && reco.children_vaccines && (
                  <div className={styles.familiesContainer}>
                    {reco.children_vaccines.map((family) => {
                      const familyKey = `${reco.id}-${family.family_id}`;
                      const isFamilyExpanded = expandedFamilies.has(familyKey);

                      return (
                        <div key={familyKey} className={styles.familySection}>
                          <div className={styles.familyHeader} onClick={() => toggleFamily(familyKey)}>
                            <div className={styles.familyInfo}>
                              {isFamilyExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <span className={styles.familyName}>
                                {family.family_fullname || family.family_name}
                              </span>
                              <span className={styles.familyCode}>{family.family_code}</span>
                            </div>
                            <span className={styles.familyChildCount}>{family.data?.length || 0} enfant(s)</span>
                          </div>

                          {isFamilyExpanded && family.data && family.data.length > 0 && (
                            <div className={styles.tableResponsive}>
                              <table className={styles.table}>
                                <thead>
                                  <tr>
                                    <th>Enfant</th>
                                    <th>Sexe</th>
                                    <th>Âge</th>
                                    <th>Tél Parent</th>
                                    {VACCINES.map(v => (
                                      <th key={v.key} title={v.label}>{v.label}</th>
                                    ))}
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {family.data.map((child, idx) => (
                                    <tr key={`${familyKey}-${child.child_id || idx}`}>
                                      <td className={styles.childName}>{child.child_name}</td>
                                      <td>{child.child_sex}</td>
                                      <td>{child.child_age_str}</td>
                                      <td>{child.parent_phone || '-'}</td>
                                      {VACCINES.map(v => (
                                        <VaccineCell
                                          key={v.key}
                                          vaccinated={(child as any)[v.key]}
                                          ageValue={(child as any)[v.ageKey]}
                                          minAge={v.minAge}
                                        />
                                      ))}
                                      <td className={styles.actions}>
                                        {child.parent_phone && (
                                          <>
                                            <a
                                              href={`tel:${child.parent_phone}`}
                                              className={styles.actionBtn}
                                              title="Appeler"
                                            >
                                              <Phone size={14} />
                                            </a>
                                            <a
                                              href={`sms:${child.parent_phone}`}
                                              className={styles.actionBtn}
                                              title="SMS"
                                            >
                                              <MessageSquare size={14} />
                                            </a>
                                          </>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
