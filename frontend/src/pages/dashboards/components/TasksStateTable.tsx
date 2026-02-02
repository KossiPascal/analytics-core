import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@components/ui';
import { Button } from '@components/ui/Button/Button';
import { Download, ChevronDown, ChevronRight, AlertCircle, User, Users } from 'lucide-react';
import type { RecoTasksStateDashboard } from '@/models/OLD/old/dashboard.types';
import styles from './TasksStateTable.module.css';

interface TasksStateTableProps {
  data: RecoTasksStateDashboard[] | undefined;
}

export function TasksStateTable({ data }: TasksStateTableProps) {
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

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  const getTaskCount = (reco: RecoTasksStateDashboard): number => {
    return reco.families?.reduce((total, family) => {
      return total + (family.patients?.reduce((patientTotal, patient) => {
        return patientTotal + (patient.data?.length || 0);
      }, 0) || 0);
    }, 0) || 0;
  };

  const exportToCSV = () => {
    if (!data) return;

    const headers = [
      'RECO', 'Village', 'Famille', 'Patient', 'Tâche', 'Date Début', 'Date Échéance', 'Source'
    ];

    const rows: string[][] = [];

    data.forEach((reco) => {
      reco.families?.forEach((family) => {
        family.patients?.forEach((patient) => {
          patient.data?.forEach((task) => {
            rows.push([
              reco.name,
              reco.village_secteur?.name || '',
              family.name || '',
              patient.name || '',
              task.label || task.title || '',
              formatDate(task.start_date),
              formatDate(task.due_date),
              task.source || '',
            ]);
          });
        });
      });
    });

    const csvContent = [headers.join(','), ...rows.map((row) => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `taches_reco_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (!data || data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2>Pas de données, appliquer le filtre !</h2>
      </div>
    );
  }

  const totalTasks = data.reduce((sum, reco) => sum + getTaskCount(reco), 0);

  return (
    <Card>
      <CardHeader
        title="TÂCHES NON RÉALISÉES DES RECOS"
        subtitle={`${totalTasks} tâche(s) en retard`}
        action={
          <Button variant="ghost" size="sm" onClick={exportToCSV} title="Exporter CSV">
            <Download size={16} />
          </Button>
        }
      />
      <CardBody>
        <div className={styles.tasksList}>
          {data.map((reco) => {
            const taskCount = getTaskCount(reco);
            const isExpanded = expandedRecos.has(reco.id);

            return (
              <div key={reco.id} className={styles.recoSection}>
                <div
                  className={styles.recoHeader}
                  onClick={() => toggleReco(reco.id)}
                >
                  <div className={styles.recoInfo}>
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <User size={18} className={styles.recoIcon} />
                    <span className={styles.recoName}>{reco.name}</span>
                    <span className={styles.recoPhone}>{reco.phone}</span>
                    <span className={styles.recoVillage}>{reco.village_secteur?.name}</span>
                  </div>
                  <div className={styles.taskBadge}>
                    <AlertCircle size={14} />
                    {taskCount} tâche(s)
                  </div>
                </div>

                {isExpanded && reco.families && (
                  <div className={styles.familiesContainer}>
                    {reco.families.map((family) => {
                      const familyKey = `${reco.id}-${family.id}`;
                      const isFamilyExpanded = expandedFamilies.has(familyKey);
                      const familyTaskCount = family.patients?.reduce((sum, p) => sum + (p.data?.length || 0), 0) || 0;

                      return (
                        <div key={familyKey} className={styles.familySection}>
                          <div
                            className={styles.familyHeader}
                            onClick={() => toggleFamily(familyKey)}
                          >
                            <div className={styles.familyInfo}>
                              {isFamilyExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <Users size={16} className={styles.familyIcon} />
                              <span className={styles.familyName}>
                                {family.name || family.given_name}
                              </span>
                              <span className={styles.familyCode}>{family.code}</span>
                            </div>
                            <span className={styles.familyTaskCount}>
                              {familyTaskCount} tâche(s)
                            </span>
                          </div>

                          {isFamilyExpanded && family.patients && (
                            <div className={styles.patientsContainer}>
                              {family.patients.map((patient) => (
                                <div key={`${familyKey}-${patient.id}`} className={styles.patientSection}>
                                  <div className={styles.patientHeader}>
                                    <span className={styles.patientName}>{patient.name}</span>
                                    <span className={styles.patientCode}>{patient.code}</span>
                                  </div>

                                  {patient.data && patient.data.length > 0 && (
                                    <div className={styles.tasksTable}>
                                      <table className={styles.table}>
                                        <thead>
                                          <tr>
                                            <th>Tâche</th>
                                            <th>Date début</th>
                                            <th>Date échéance</th>
                                            <th>Source</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {patient.data.map((task, taskIdx) => (
                                            <tr key={taskIdx}>
                                              <td>{task.label || task.title}</td>
                                              <td>{formatDate(task.start_date)}</td>
                                              <td className={styles.dueDate}>
                                                {formatDate(task.due_date)}
                                              </td>
                                              <td>{task.source}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              ))}
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
