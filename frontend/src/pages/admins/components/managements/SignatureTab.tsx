import { useState, useRef, useEffect } from 'react';
import { PenTool, Save, Trash2, Upload, Download, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@components/ui/Card/Card';
import { Button } from '@components/ui/Button/Button';
import { useNotification } from '@/contexts/OLD/useNotification';
import { AdminApi } from '@/services/OLD/old/api.service';
import { FormField } from '@/components/forms/FormField/FormField';
import { FormInput } from '@/components/forms/FormInput/FormInput';

import styles from '@pages/admins/AdminPage.module.css';

interface SignatureData {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: string;
}

export function SignatureTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [savedSignatures, setSavedSignatures] = useState<SignatureData[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);

  const { showSuccess, showError, showWarning } = useNotification();

  useEffect(() => {
    loadSignatures();
    initCanvas();
  }, []);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const loadSignatures = async () => {
    setIsLoading(true);
    try {
      const response = await AdminApi.getSignatures();
      if (response?.status === 200) {
        setSavedSignatures((response.data as SignatureData[]) || []);
      }
    } catch (error) {
      console.error('Error loading signatures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = async () => {
    if (!signatureName.trim()) {
      showWarning('Veuillez entrer un nom pour la signature');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const response = await AdminApi.saveSignature({
        name: signatureName,
        dataUrl,
      });

      if (response?.status === 200) {
        showSuccess('Signature enregistrée avec succès');
        setSignatureName('');
        clearCanvas();
        loadSignatures();
      } else {
        showError('Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      showError('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSignature = async (id: string) => {
    try {
      const response = await AdminApi.deleteSignature(id);
      if (response?.status === 200) {
        showSuccess('Signature supprimée');
        loadSignatures();
      } else {
        showError('Erreur lors de la suppression');
      }
    } catch (error) {
      showError('Erreur lors de la suppression');
    }
  };

  const downloadSignature = (signature: SignatureData) => {
    const link = document.createElement('a');
    link.href = signature.dataUrl;
    link.download = `${signature.name}.png`;
    link.click();
  };

  const loadSignatureToCanvas = (signature: SignatureData) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = signature.dataUrl;
    setSignatureName(signature.name);
  };

  return (
    <Card>
      <CardHeader
        title={
          <div className={styles.cardTitle}>
            <PenTool size={20} />
            Gestion des signatures
          </div>
        }
      />
      <CardBody>
        <div className={`${styles.grid} ${styles.grid2}`}>
          {/* Drawing Area */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
              Dessiner une signature
            </h4>

            <div
              style={{
                border: '2px dashed #e2e8f0',
                borderRadius: '0.5rem',
                padding: '1rem',
                backgroundColor: '#f8fafc',
              }}
            >
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  height: '200px',
                  backgroundColor: 'white',
                  borderRadius: '0.375rem',
                  cursor: 'crosshair',
                  touchAction: 'none',
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>

            {/* Drawing Options */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
              <div style={{ flex: '0 0 auto' }}>
                <FormField label="Couleur">
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    style={{ width: '40px', height: '32px', cursor: 'pointer' }}
                  />
                </FormField>
              </div>
              <div style={{ flex: 1 }}>
                <FormField label={`Épaisseur (${strokeWidth}px)`}>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </FormField>
              </div>
            </div>

            {/* Save Form */}
            <div style={{ marginTop: '1rem' }}>
              <FormInput
                label="Nom de la signature"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Ex: Signature Dr. Diallo"
              />
              <div className={styles.buttonGroup}>
                <Button variant="outline" onClick={clearCanvas}>
                  <Trash2 size={16} />
                  Effacer
                </Button>
                <Button variant="primary" onClick={saveSignature} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Saved Signatures */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
              Signatures enregistrées
            </h4>

            {isLoading ? (
              <div className={styles.loading}>
                <RefreshCw size={24} className="animate-spin" />
              </div>
            ) : savedSignatures.length === 0 ? (
              <div className={styles.emptyState}>
                <PenTool size={48} />
                <p>Aucune signature enregistrée</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {savedSignatures.map((signature) => (
                  <div
                    key={signature.id}
                    className={styles.card}
                    style={{ marginBottom: 0, padding: '0.75rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={signature.dataUrl}
                        alt={signature.name}
                        style={{
                          width: '80px',
                          height: '40px',
                          objectFit: 'contain',
                          backgroundColor: 'white',
                          borderRadius: '0.25rem',
                          border: '1px solid #e2e8f0',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 500, marginBottom: '0.125rem' }}>{signature.name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {new Date(signature.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className={styles.actionsCell}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => loadSignatureToCanvas(signature)}
                          title="Charger"
                        >
                          <Upload size={16} />
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={() => downloadSignature(signature)}
                          title="Télécharger"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => deleteSignature(signature.id)}
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
