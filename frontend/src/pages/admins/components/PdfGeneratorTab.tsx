import { useState } from 'react';
import { FileText, Download, Eye, Settings, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@components/ui/Card/Card';
import { Button } from '@components/ui/Button/Button';
import { useNotification } from '@/contexts/OLD/useNotification';
import { AdminApi } from '@/services/OLD/old/api.service';
import { FormCheckbox } from '@/components/forms/FormCheckbox/FormCheckbox';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import styles from '@pages/admins/AdminPage.module.css';

interface PdfTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
}

const PDF_TEMPLATES: PdfTemplate[] = [
  {
    id: 'monthly-report',
    name: 'Rapport mensuel',
    description: "Génère un rapport mensuel d'activités",
    type: 'report',
  },
  {
    id: 'vaccination-report',
    name: 'Rapport vaccination',
    description: 'Génère un rapport de suivi vaccinal',
    type: 'report',
  },
  {
    id: 'household-summary',
    name: 'Récapitulatif ménages',
    description: 'Génère un récapitulatif des ménages',
    type: 'summary',
  },
  {
    id: 'reco-performance',
    name: 'Performance RECO',
    description: 'Génère un rapport de performance des RECO',
    type: 'performance',
  },
];

export function PdfGeneratorTab() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  // Config options
  const [config, setConfig] = useState({
    includeCharts: true,
    includeTables: true,
    pageOrientation: 'portrait' as 'portrait' | 'landscape',
    paperSize: 'A4',
  });

  const { showSuccess, showError, showWarning } = useNotification();

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      showWarning('Veuillez sélectionner un modèle');
      return;
    }

    setIsGenerating(true);
    setGeneratedPdfUrl(null);

    try {
      const response = await AdminApi.generatePdf({
        templateId: selectedTemplate,
        config,
      });

      if (response?.status === 200 && response.data) {
        const data = response.data as { url?: string };
        if (data.url) {
          setGeneratedPdfUrl(data.url);
          showSuccess('PDF généré avec succès');
        }
      } else {
        showError('Erreur lors de la génération du PDF');
      }
    } catch (error) {
      showError('Erreur lors de la génération du PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedPdfUrl) {
      const link = document.createElement('a');
      link.href = generatedPdfUrl;
      link.download = `${selectedTemplate}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
    }
  };

  const handlePreview = () => {
    if (generatedPdfUrl) {
      window.open(generatedPdfUrl, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader
        title={
          <div className={styles.cardTitle}>
            <FileText size={20} />
            Générateur de PDF
          </div>
        }
      />
      <CardBody>
        <div className={styles.form}>
          {/* Template Selection */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Modèle de document</label>
            <div className={`${styles.grid} ${styles.grid2}`}>
              {PDF_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className={styles.card}
                  style={{
                    marginBottom: 0,
                    cursor: 'pointer',
                    border: selectedTemplate === template.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    backgroundColor: selectedTemplate === template.id ? '#eff6ff' : 'white',
                  }}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <FileText
                      size={24}
                      style={{ color: selectedTemplate === template.id ? '#3b82f6' : '#64748b' }}
                    />
                    <div>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                        {template.name}
                      </h4>
                      <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration */}
          <div className={styles.card} style={{ marginBottom: 0 }}>
            <div className={styles.cardHeader} style={{ marginBottom: '1rem' }}>
              <h4 className={styles.cardTitle} style={{ fontSize: '1rem' }}>
                <Settings size={18} />
                Configuration
              </h4>
            </div>

            <div className={`${styles.grid} ${styles.grid2}`}>
              <FormSelect
                label="Orientation"
                value={config.pageOrientation}
                options={[
                  { value: 'portrait', label: 'Portrait' },
                  { value: 'landscape', label: 'Paysage' },
                ]}
                onChange={(value) =>
                  setConfig({ ...config, pageOrientation: value as 'portrait' | 'landscape' })
                }
              />

              <FormSelect
                label="Taille du papier"
                value={config.paperSize}
                options={[
                  { value: 'A4', label: 'A4' },
                  { value: 'A3', label: 'A3' },
                  { value: 'Letter', label: 'Letter' },
                  { value: 'Legal', label: 'Legal' },
                ]}
                onChange={(value) => setConfig({ ...config, paperSize: value })}
              />
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem' }}>
              <FormCheckbox
                label="Inclure les graphiques"
                checked={config.includeCharts}
                onChange={(e) => setConfig({ ...config, includeCharts: e.target.checked })}
              />

              <FormCheckbox
                label="Inclure les tableaux"
                checked={config.includeTables}
                onChange={(e) => setConfig({ ...config, includeTables: e.target.checked })}
              />
            </div>
          </div>

          {/* Actions */}
          <div className={styles.buttonGroup}>
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={isGenerating || !selectedTemplate}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <FileText size={16} />
                  Générer le PDF
                </>
              )}
            </Button>

            {generatedPdfUrl && (
              <>
                <Button variant="outline" onClick={handlePreview}>
                  <Eye size={16} />
                  Aperçu
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download size={16} />
                  Télécharger
                </Button>
              </>
            )}
          </div>

          {/* Preview Section */}
          {generatedPdfUrl && (
            <div
              className={styles.card}
              style={{
                marginTop: '1rem',
                marginBottom: 0,
                padding: 0,
                overflow: 'hidden',
              }}
            >
              <iframe
                src={generatedPdfUrl}
                style={{ width: '100%', height: '500px', border: 'none' }}
                title="Aperçu PDF"
              />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
