import { useState } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { PageHeader } from '@components/layout/PageHeader/PageHeader';
// import { useStore } from '@/stores/OLD';
import { useAuth } from "@/contexts/AuthContext";
import styles from './SettingsPage.module.css';

type TabType = 'profile' | 'password';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { user } = useAuth();

  return (
    <div className={styles.container}>
      <PageHeader
        title="Paramètres"
        subtitle="Gérez votre profil et vos préférences"
      />

      <div className={styles.content}>
        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'profile' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            <span>Profil</span>
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'password' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <Lock size={18} />
            <span>Mot de passe</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'profile' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Informations personnelles</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Nom complet</label>
                  <div className={styles.infoValue}>{user?.fullname || '-'}</div>
                </div>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Nom d'utilisateur</label>
                  <div className={styles.infoValue}>{user?.username || '-'}</div>
                </div>
                {/* <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Email</label>
                  <div className={styles.infoValue}>{user?.email || '-'}</div>
                </div>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Téléphone</label>
                  <div className={styles.infoValue}>{user?.phone || '-'}</div>
                </div> */}
              </div>

              <h2 className={styles.sectionTitle}>Rôles et permissions</h2>
              {/* <div className={styles.rolesList}>
                {user?.roles?.map((role, index) => (
                  <div key={index} className={styles.roleItem}>
                    <div className={styles.roleName}>{role.name}</div>
                  </div>
                ))}
              </div> */}
            </div>
          )}

          {activeTab === 'password' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Modifier le mot de passe</h2>
              <form className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="currentPassword" className={styles.label}>
                    Mot de passe actuel
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      id="currentPassword"
                      className={styles.input}
                      placeholder="Entrez votre mot de passe actuel"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      aria-label={showCurrentPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="newPassword" className={styles.label}>
                    Nouveau mot de passe
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
                      className={styles.input}
                      placeholder="Entrez votre nouveau mot de passe"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword" className={styles.label}>
                    Confirmer le mot de passe
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      className={styles.input}
                      placeholder="Confirmez votre nouveau mot de passe"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.buttonPrimary}>
                    Modifier le mot de passe
                  </button>
                </div>
              </form>

              <div className={styles.passwordRequirements}>
                <h3 className={styles.requirementsTitle}>Exigences du mot de passe</h3>
                <ul className={styles.requirementsList}>
                  <li>Au moins 8 caractères</li>
                  <li>Au moins une lettre majuscule</li>
                  <li>Au moins une lettre minuscule</li>
                  <li>Au moins un chiffre</li>
                  <li>Au moins un caractère spécial (!@#$%^&*)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
