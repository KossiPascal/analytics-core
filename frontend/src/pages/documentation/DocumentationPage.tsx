import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Book,
  Download,
  FileText,
  GraduationCap,
  Users,
  Smartphone,
  ChevronRight,
  BookOpen,
  Video,
  HelpCircle,
} from 'lucide-react';
import { PageWrapper } from '@components/layout';
import { Card, CardBody } from '@components/ui';
import { Button } from '@components/ui/Button/Button';
import { useNotification } from '@/contexts/OLD/useNotification';
import styles from './DocumentationPage.module.css';

type TabType = 'guides' | 'apks' | 'training' | 'help';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'guides', label: 'Guides', icon: <Book size={18} /> },
  { id: 'apks', label: 'Applications', icon: <Smartphone size={18} /> },
  { id: 'training', label: 'Formations', icon: <GraduationCap size={18} /> },
  { id: 'help', label: 'Aide', icon: <HelpCircle size={18} /> },
];

interface Guide {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  downloadUrl?: string;
  externalUrl?: string;
}

const GUIDES: Guide[] = [
  {
    id: 'user-guide',
    title: "Guide d'utilisation",
    description: "Guide complet d'utilisation de la plateforme Kendeya Analytics",
    icon: <BookOpen size={24} />,
    downloadUrl: '/assets/docs/user-guide.pdf',
  },
  {
    id: 'reco-guide',
    title: 'Guide RECO',
    description: 'Documentation spécifique pour les Relais Communautaires',
    icon: <Users size={24} />,
    downloadUrl: '/assets/docs/reco-guide.pdf',
  },
  {
    id: 'admin-guide',
    title: 'Guide Administrateur',
    description: "Documentation pour les administrateurs du système",
    icon: <FileText size={24} />,
    downloadUrl: '/assets/docs/admin-guide.pdf',
  },
];

interface AppDownload {
  id: string;
  name: string;
  description: string;
  version: string;
  isProd: boolean;
  size: string;
}

const APPS: AppDownload[] = [
  {
    id: 'kendeya-prod',
    name: 'Kendeya CHT',
    description: 'Application de production pour la collecte de données',
    version: '2.5.1',
    isProd: true,
    size: '45 MB',
  },
  {
    id: 'kendeya-dev',
    name: 'Kendeya CHT (Dev)',
    description: 'Version de développement pour les tests',
    version: '2.5.1-dev',
    isProd: false,
    size: '48 MB',
  },
];

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  topics: string[];
  imageUrl?: string;
}

const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'kendeya-formation',
    title: 'Formation Kendeya Analytics',
    description: 'Formation complète sur l\'utilisation de la plateforme Kendeya Analytics',
    duration: '4 heures',
    topics: [
      'Navigation dans le tableau de bord',
      'Génération de rapports',
      'Analyse des données',
      'Export des données',
    ],
  },
  {
    id: 'reco-formation',
    title: 'Formation RECO',
    description: 'Formation destinée aux Relais Communautaires pour la collecte mobile',
    duration: '6 heures',
    topics: [
      'Utilisation de l\'application mobile',
      'Collecte des données terrain',
      'Suivi des patients',
      'Synchronisation des données',
    ],
  },
];

export default function DocumentationPage() {
  const [currentTab, setCurrentTab] = useState<TabType>('guides');
  const { showSuccess, showInfo } = useNotification();

  const handleDownload = (name: string, url?: string) => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      showSuccess(`Téléchargement de "${name}" démarré`);
    } else {
      showInfo('Téléchargement non disponible');
    }
  };

  const handleDownloadAPK = (isProd: boolean) => {
    const baseUrl = '/api/apk/download';
    const url = isProd ? `${baseUrl}?prod=true` : `${baseUrl}?prod=false`;
    window.open(url, '_blank');
    showSuccess('Téléchargement de l\'APK démarré');
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'guides':
        return (
          <div className={styles.gridCards}>
            {GUIDES.map((guide) => (
              <Card key={guide.id} className={styles.guideCard}>
                <CardBody>
                  <div className={styles.guideIcon}>{guide.icon}</div>
                  <h3 className={styles.guideTitle}>{guide.title}</h3>
                  <p className={styles.guideDescription}>{guide.description}</p>
                  <Button
                    variant="primary"
                    onClick={() => handleDownload(guide.title, guide.downloadUrl)}
                    className={styles.downloadBtn}
                  >
                    <Download size={16} />
                    Télécharger PDF
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        );

      case 'apks':
        return (
          <div className={styles.apksContainer}>
            <div className={styles.apksInfo}>
              <Smartphone size={48} />
              <h3>Applications mobiles</h3>
              <p>
                Téléchargez l'application Kendeya CHT pour Android.
                L'application permet aux agents de santé communautaire de collecter
                et synchroniser les données sur le terrain.
              </p>
            </div>

            <div className={styles.apksList}>
              {APPS.map((app) => (
                <div key={app.id} className={`${styles.apkCard} ${app.isProd ? styles.apkProd : styles.apkDev}`}>
                  <div className={styles.apkInfo}>
                    <div className={styles.apkHeader}>
                      <Smartphone size={32} />
                      <div>
                        <h4>{app.name}</h4>
                        <span className={styles.apkVersion}>v{app.version}</span>
                      </div>
                    </div>
                    <p>{app.description}</p>
                    <div className={styles.apkMeta}>
                      <span>Taille: {app.size}</span>
                      <span>Android 6.0+</span>
                    </div>
                  </div>
                  <Button
                    variant={app.isProd ? 'primary' : 'outline'}
                    onClick={() => handleDownloadAPK(app.isProd)}
                  >
                    <Download size={16} />
                    Télécharger APK
                  </Button>
                </div>
              ))}
            </div>

            <div className={styles.apksNote}>
              <HelpCircle size={20} />
              <p>
                <strong>Note:</strong> Assurez-vous d'autoriser l'installation d'applications
                provenant de sources inconnues dans les paramètres de votre appareil Android.
              </p>
            </div>
          </div>
        );

      case 'training':
        return (
          <div className={styles.trainingContainer}>
            {TRAINING_MODULES.map((module) => (
              <Card key={module.id} className={styles.trainingCard}>
                <CardBody>
                  <div className={styles.trainingHeader}>
                    <GraduationCap size={32} />
                    <div>
                      <h3>{module.title}</h3>
                      <span className={styles.trainingDuration}>
                        <Video size={14} />
                        Durée: {module.duration}
                      </span>
                    </div>
                  </div>
                  <p className={styles.trainingDescription}>{module.description}</p>
                  <div className={styles.trainingTopics}>
                    <h4>Sujets couverts:</h4>
                    <ul>
                      {module.topics.map((topic, index) => (
                        <li key={index}>
                          <ChevronRight size={14} />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.trainingActions}>
                    <Button variant="primary">
                      <BookOpen size={16} />
                      Accéder à la formation
                    </Button>
                    <Button variant="outline">
                      <Download size={16} />
                      Supports PDF
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        );

      case 'help':
        return (
          <div className={styles.helpContainer}>
            <Card>
              <CardBody>
                <div className={styles.helpSection}>
                  <h3>Questions fréquentes</h3>
                  <div className={styles.faqList}>
                    <details className={styles.faqItem}>
                      <summary>Comment se connecter à l'application ?</summary>
                      <p>
                        Utilisez vos identifiants fournis par votre administrateur.
                        En cas de problème, contactez le support technique.
                      </p>
                    </details>
                    <details className={styles.faqItem}>
                      <summary>Comment synchroniser les données hors ligne ?</summary>
                      <p>
                        L'application synchronise automatiquement lorsqu'une connexion Internet
                        est disponible. Vous pouvez également forcer la synchronisation depuis
                        le menu paramètres.
                      </p>
                    </details>
                    <details className={styles.faqItem}>
                      <summary>Comment générer un rapport ?</summary>
                      <p>
                        Accédez à la section Rapports, sélectionnez le type de rapport souhaité,
                        configurez les filtres (période, zone géographique) puis cliquez sur Générer.
                      </p>
                    </details>
                    <details className={styles.faqItem}>
                      <summary>Comment exporter des données ?</summary>
                      <p>
                        Dans chaque tableau de données, vous trouverez un bouton d'export (CSV ou Excel).
                        Cliquez dessus pour télécharger les données affichées.
                      </p>
                    </details>
                  </div>
                </div>

                <div className={styles.helpSection}>
                  <h3>Contact support</h3>
                  <div className={styles.contactInfo}>
                    <p>
                      <strong>Email:</strong> support@integratehealth.org
                    </p>
                    <p>
                      <strong>Téléphone:</strong> +224 XX XX XX XX
                    </p>
                    <p>
                      <strong>Horaires:</strong> Lundi - Vendredi, 8h - 17h
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageWrapper
      title="Documentation"
      subtitle="Guides, formations et ressources d'aide"
    >
      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${currentTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setCurrentTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
