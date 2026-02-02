import { useEffect } from 'react';
import { PageWrapper } from '@components/layout';
import { Card, CardBody, CardHeader, Button } from '@components/ui';
import { Modal } from '@components/ui/Modal/Modal';
import { UserModal } from './components/UserModal';
import { useUsers } from '@/contexts/OLD/useUsers';
import { UserPlus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import type { User } from '@/models/OLD/old/auth.types';
import styles from './UsersPage.module.css';

export default function UsersPage() {
  const {
    users,
    roles,
    orgUnits,
    status,
    selectedUser,
    isUserModalOpen,
    isDeleteUserModalOpen,
    initializeData,
    fetchUsers,
    saveUser,
    deleteUser,
    openUserModal,
    closeUserModal,
    openDeleteUserModal,
    closeDeleteUserModal,
    getUserRoleNames,
  } = useUsers();

  useEffect(() => {
    initializeData();
  }, []);

  const isLoading = status.users === 'loading';
  const isSaving = status.saving === 'loading';
  const isDeleting = status.deleting === 'loading';

  const handleDelete = async () => {
    if (selectedUser) {
      await deleteUser(selectedUser);
    }
  };

  return (
    <PageWrapper
      title="Gestion des utilisateurs"
      subtitle="Liste et gestion des comptes utilisateurs"
      actions={
        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm" onClick={fetchUsers} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </Button>
          <Button leftIcon={<UserPlus size={18} />} onClick={() => openUserModal(null)}>
            Nouvel utilisateur
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader title="Liste des utilisateurs" />
        <CardBody>
          {isLoading ? (
            <div className={styles.loading}>
              <RefreshCw size={24} className="animate-spin" />
              <p>Chargement...</p>
            </div>
          ) : users.length === 0 ? (
            <div className={styles.emptyState}>
              <UserPlus size={48} />
              <p>Aucun utilisateur</p>
              <Button variant="primary" onClick={() => openUserModal(null)}>
                Créer un utilisateur
              </Button>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nom d'utilisateur</th>
                    <th>Nom complet</th>
                    <th>Email</th>
                    <th>Rôles</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: User) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.fullname || '-'}</td>
                      <td>{user.email || '-'}</td>
                      <td>
                        <span className={styles.rolesBadge}>
                          {getUserRoleNames(user)}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${user.isActive ? styles.badgeSuccess : styles.badgeDanger}`}>
                          {user.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => openUserModal(user)}
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            onClick={() => openDeleteUserModal(user)}
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* User Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={closeUserModal}
        onSave={saveUser}
        user={selectedUser}
        roles={roles}
        orgUnits={orgUnits}
        isLoading={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteUserModalOpen}
        onClose={closeDeleteUserModal}
        title="Confirmer la suppression"
        size="sm"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="outline" size="sm" onClick={closeDeleteUserModal} disabled={isDeleting}>
              Annuler
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} isLoading={isDeleting}>
              <Trash2 size={16} />
              Supprimer
            </Button>
          </div>
        }
      >
        <div className={styles.deleteWarning}>
          <Trash2 size={24} />
          <p>Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{selectedUser?.username}</strong> ?</p>
          <p className={styles.warningText}>Cette action est irréversible.</p>
        </div>
      </Modal>
    </PageWrapper>
  );
}
