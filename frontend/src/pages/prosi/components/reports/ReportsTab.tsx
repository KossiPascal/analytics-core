import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileBarChart2, Plus, Eye, Trash2, RefreshCw, CheckCircle, FileText } from 'lucide-react';
import { reportsApi, projectsApi } from '../../api';
import type { MonthlyReport, Project } from '../../types';
import { MONTHS_FR } from '../../types';
import { Button } from '@components/ui/Button/Button';
import { Badge } from '@components/ui/Badge/Badge';
import { Modal } from '@components/ui/Modal/Modal';
import { Spinner } from '@components/ui/Spinner/Spinner';
import styles from '../../Prosi.module.css';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function ReportsTab() {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenModal, setShowGenModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
  const [genForm, setGenForm] = useState({
    project_id: '',
    year: CURRENT_YEAR,
    month: new Date().getMonth() + 1,
    summary: '',
    overwrite: false,
  });
  const [generating, setGenerating] = useState(false);
  const [filterProject, setFilterProject] = useState('');
  const [filterYear, setFilterYear] = useState<number | ''>('');

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      reportsApi.getAll({ project_id: filterProject || undefined, year: filterYear || undefined }),
      projectsApi.getAll(),
    ]).then(([repRes, projRes]) => {
      if (repRes.status === 'fulfilled' && repRes.value.success)  setReports(repRes.value.data!);
      if (projRes.status === 'fulfilled' && projRes.value.success) setProjects(projRes.value.data!);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterProject, filterYear]);

  const handleGenerate = async () => {
    if (!genForm.project_id) return;
    setGenerating(true);
    const r = await reportsApi.generate({
      project_id: genForm.project_id,
      year: genForm.year,
      month: genForm.month,
      summary: genForm.summary,
      overwrite: genForm.overwrite,
    });
    setGenerating(false);
    if (r.success) { setShowGenModal(false); load(); }
    else alert((r as any).message || 'Erreur lors de la génération');
  };

  const handlePublish = async (report: MonthlyReport) => {
    const r = await reportsApi.update(report.id, { status: 'PUBLISHED' });
    if (r.success) load();
  };

  const handleDelete = async (report: MonthlyReport) => {
    if (!confirm(`Supprimer le rapport "${report.title}" ?`)) return;
    await reportsApi.delete(report.id);
    load();
  };

  const openDetail = (report: MonthlyReport) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className={styles.filterBar}>
        <div className={styles.filterItem}>
          <select className={styles.formSelect} value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
            <option value="">Tous les projets</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className={styles.filterItem}>
          <select className={styles.formSelect} value={filterYear} onChange={(e) => setFilterYear(e.target.value ? parseInt(e.target.value) : '')}>
            <option value="">Toutes années</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <Button size="sm" onClick={() => setShowGenModal(true)}>
          <Plus size={16} /> Générer un rapport
        </Button>
      </div>

      {loading ? (
        <div className={styles.emptyState}><Spinner size="md" /></div>
      ) : reports.length === 0 ? (
        <div className={styles.emptyState}>
          <FileBarChart2 size={40} className={styles.emptyStateIcon} />
          <span className={styles.emptyStateText}>Aucun rapport généré</span>
          <Button size="sm" onClick={() => setShowGenModal(true)}><Plus size={14} /> Générer le premier rapport</Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          <AnimatePresence>
            {reports.map((r, i) => {
              const stats = r.content?.summary_stats;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className={styles.reportCard}
                >
                  <div className={styles.reportCardHeader}>
                    <div>
                      <div className={styles.reportPeriod}>
                        {MONTHS_FR[r.month]} {r.year}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                        {r.project_name}
                      </div>
                    </div>
                    <Badge variant={r.status === 'PUBLISHED' ? 'success' : 'secondary'} size="sm">
                      {r.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
                    </Badge>
                  </div>

                  {r.summary && (
                    <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                      {r.summary}
                    </p>
                  )}

                  {stats && (
                    <div className={styles.reportStats}>
                      <div className={styles.reportStatItem}>
                        <div className={styles.reportStatValue}>{stats.activities_this_month}</div>
                        <div className={styles.reportStatLabel}>Activités</div>
                      </div>
                      <div className={styles.reportStatItem}>
                        <div className={styles.reportStatValue}>{stats.overall_completion_rate}%</div>
                        <div className={styles.reportStatLabel}>Complétude</div>
                      </div>
                      <div className={styles.reportStatItem}>
                        <div className={styles.reportStatValue}>{stats.orcs_total}</div>
                        <div className={styles.reportStatLabel}>ORCs</div>
                      </div>
                    </div>
                  )}

                  <div className={styles.actionsRow} style={{ marginTop: '0.875rem' }}>
                    <Button variant="ghost" size="sm" onClick={() => openDetail(r)} title="Voir le rapport">
                      <Eye size={14} />
                    </Button>
                    {r.status === 'DRAFT' && (
                      <Button variant="ghost" size="sm" onClick={() => handlePublish(r)} title="Publier">
                        <CheckCircle size={14} />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { setGenForm(prev => ({ ...prev, project_id: r.project_id, year: r.year, month: r.month, overwrite: true })); setShowGenModal(true); }} title="Regénérer">
                      <RefreshCw size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(r)} title="Supprimer">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Génération */}
      <Modal
        isOpen={showGenModal}
        onClose={() => setShowGenModal(false)}
        title="Générer un rapport mensuel"
        size="md"
        footer={
          <div className={styles.actionsRow}>
            <Button variant="outline" size="sm" onClick={() => setShowGenModal(false)}>Annuler</Button>
            <Button size="sm" onClick={handleGenerate} disabled={generating || !genForm.project_id}>
              {generating ? <Spinner size="xs" /> : <><FileBarChart2 size={14} /> Générer</>}
            </Button>
          </div>
        }
      >
        <div style={{ padding: '0.5rem 0' }}>
          <div className={styles.formGroup} style={{ marginBottom: '0.875rem' }}>
            <label className={styles.formLabel}>Projet *</label>
            <select
              className={styles.formSelect}
              value={genForm.project_id}
              onChange={(e) => setGenForm((p) => ({ ...p, project_id: e.target.value }))}
            >
              <option value="">— Sélectionner un projet —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Année</label>
              <select
                className={styles.formSelect}
                value={genForm.year}
                onChange={(e) => setGenForm((p) => ({ ...p, year: parseInt(e.target.value) }))}
              >
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Mois</label>
              <select
                className={styles.formSelect}
                value={genForm.month}
                onChange={(e) => setGenForm((p) => ({ ...p, month: parseInt(e.target.value) }))}
              >
                {MONTHS.map((m) => <option key={m} value={m}>{MONTHS_FR[m]}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.formGroup} style={{ marginBottom: '0.875rem' }}>
            <label className={styles.formLabel}>Résumé exécutif (optionnel)</label>
            <textarea
              className={styles.formTextarea}
              value={genForm.summary}
              onChange={(e) => setGenForm((p) => ({ ...p, summary: e.target.value }))}
              placeholder="Contexte, faits saillants du mois..."
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={genForm.overwrite}
              onChange={(e) => setGenForm((p) => ({ ...p, overwrite: e.target.checked }))}
            />
            Remplacer si un rapport existe déjà pour cette période
          </label>
        </div>
      </Modal>

      {/* Modal Détail rapport */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedReport?.title || 'Rapport'}
        size="xl"
        footer={
          <Button variant="outline" size="sm" onClick={() => setShowDetailModal(false)}>Fermer</Button>
        }
      >
        {selectedReport && <ReportDetail report={selectedReport} />}
      </Modal>
    </div>
  );
}

// ─── Composant détail du rapport ────────────────────────────────────────────

function ReportDetail({ report }: { report: MonthlyReport }) {
  const { content } = report;
  if (!content?.summary_stats) return <p style={{ color: '#94a3b8' }}>Aucun contenu disponible.</p>;

  const { summary_stats, activities, orcs } = content;

  return (
    <div style={{ padding: '0.5rem 0' }}>
      {/* En-tête */}
      <div style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>
              {MONTHS_FR[report.month]} {report.year}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{report.project_name}</div>
          </div>
          <Badge variant={report.status === 'PUBLISHED' ? 'success' : 'secondary'}>
            {report.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
          </Badge>
        </div>
        {report.summary && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#475569', lineHeight: 1.6 }}>{report.summary}</p>
        )}
      </div>

      {/* KPIs */}
      <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Activités du mois', value: summary_stats.activities_this_month },
          { label: 'Taux de complétion global', value: `${summary_stats.overall_completion_rate}%` },
          { label: 'Progression moy. du mois', value: `${summary_stats.avg_progress_this_month}%` },
        ].map((k) => (
          <div key={k.label} className={`${styles.statCard} ${styles.info}`}>
            <div className={styles.statLabel}>{k.label}</div>
            <div className={styles.statValue}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ORCs */}
      {orcs.length > 0 && (
        <>
          <div className={styles.sectionTitle}><FileText size={15} /> État des ORCs</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {orcs.map((o) => (
              <div key={o.id} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{o.name}</span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {o.current_value} / {o.target_value ?? '—'} {o.unit}
                    </span>
                    <span style={{ fontWeight: 700, color: '#6366f1' }}>{o.progress_percent}%</span>
                  </div>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={`${styles.progressFill} ${o.progress_percent >= 80 ? styles.done : o.progress_percent >= 50 ? styles.medium : styles.low}`}
                    style={{ width: `${o.progress_percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Activités du mois */}
      {activities.length > 0 && (
        <>
          <div className={styles.sectionTitle}><FileText size={15} /> Activités planifiées</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {activities.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
                <div
                  style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: a.status === 'DONE' ? '#10b981' : a.status === 'IN_PROGRESS' ? '#6366f1' : a.status === 'BLOCKED' ? '#ef4444' : '#94a3b8',
                  }}
                />
                <span style={{ flex: 1, color: '#1e293b', fontWeight: 500 }}>{a.name}</span>
                {a.orc_name && <span style={{ color: '#94a3b8' }}>{a.orc_name}</span>}
                {a.assignee_name && <span style={{ color: '#64748b' }}>{a.assignee_name}</span>}
                <span style={{ fontWeight: 600, minWidth: 40, textAlign: 'right', color: a.progress === 100 ? '#10b981' : '#6366f1' }}>
                  {a.progress}%
                </span>
                {a.due_date && (
                  <span style={{ color: '#94a3b8', minWidth: 70 }}>
                    {new Date(a.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
