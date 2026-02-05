/**
 * Exemple d'utilisation du composant Table avec toutes ses fonctionnalités
 */

import { Table, type Column } from './Table';

// Interface de données exemple
interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'User' | 'Editor';
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
}

// Données exemple
const sampleUsers: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Admin',
    status: 'active',
    lastLogin: '2024-01-15',
    createdAt: '2023-01-10',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'User',
    status: 'active',
    lastLogin: '2024-01-14',
    createdAt: '2023-03-22',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    role: 'Editor',
    status: 'inactive',
    lastLogin: '2023-12-20',
    createdAt: '2023-05-15',
  },
  {
    id: 4,
    name: 'Alice Williams',
    email: 'alice.williams@example.com',
    role: 'User',
    status: 'active',
    lastLogin: '2024-01-16',
    createdAt: '2023-07-08',
  },
  {
    id: 5,
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    role: 'Editor',
    status: 'active',
    lastLogin: '2024-01-13',
    createdAt: '2023-09-30',
  },
];

// Configuration des colonnes
const columns: Column<User>[] = [
  {
    key: 'id',
    header: 'ID',
    sortable: true,
    width: 80,
    align: 'center',
    searchable: false,
  },
  {
    key: 'name',
    header: 'Nom',
    sortable: true,
    searchable: true,
  },
  {
    key: 'email',
    header: 'Email',
    sortable: true,
    searchable: true,
  },
  {
    key: 'role',
    header: 'Rôle',
    sortable: true,
    render: (user) => {
      const colors = {
        Admin: '#ef4444',
        Editor: '#f59e0b',
        User: '#3b82f6',
      };
      return (
        <span
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor: `${colors[user.role]}20`,
            color: colors[user.role],
          }}
        >
          {user.role}
        </span>
      );
    },
  },
  {
    key: 'status',
    header: 'Statut',
    sortable: true,
    align: 'center',
    render: (user) => {
      const isActive = user.status === 'active';
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor: isActive ? '#10b98120' : '#6b728020',
            color: isActive ? '#10b981' : '#6b7280',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isActive ? '#10b981' : '#6b7280',
            }}
          />
          {isActive ? 'Actif' : 'Inactif'}
        </span>
      );
    },
  },
  {
    key: 'lastLogin',
    header: 'Dernière connexion',
    sortable: true,
    render: (user) => new Date(user.lastLogin).toLocaleDateString('fr-FR'),
  },
];

// Exemple 1: Table basique
export function BasicTableExample() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Table Basique</h2>
      <Table data={sampleUsers} columns={columns} keyExtractor={(user) => user.id} />
    </div>
  );
}

// Exemple 2: Table avec recherche uniquement
export function SearchTableExample() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Table avec Recherche</h2>
      <Table
        data={sampleUsers}
        columns={columns}
        keyExtractor={(user) => user.id}
        features={{
          search: true,
        }}
        searchPlaceholder="Rechercher par nom ou email..."
      />
    </div>
  );
}

// Exemple 3: Table avec toutes les fonctionnalités
export function FullFeaturedTableExample() {
  const handleRowClick = (user: User) => {
    console.log('Clicked user:', user);
    alert(`Vous avez cliqué sur ${user.name}`);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Table avec Toutes les Fonctionnalités</h2>
      <Table
        data={sampleUsers}
        columns={columns}
        keyExtractor={(user) => user.id}
        features={{
          search: true,
          export: true,
          pagination: true,
          pageSize: true,
          animate: true,
        }}
        searchPlaceholder="Rechercher un utilisateur..."
        exportFilename="utilisateurs"
        exportFormats={['csv', 'excel', 'json']}
        defaultPageSize={3}
        pageSizeOptions={[3, 5, 10, 25]}
        showFirstLastButtons={true}
        stickyHeader={true}
        isRowClickable={true}
        onRowClick={handleRowClick}
        emptyMessage="Aucun utilisateur trouvé"
      />
    </div>
  );
}

// Exemple 4: Table avec toolbar personnalisée
export function CustomToolbarTableExample() {
  const handleRefresh = () => {
    alert('Actualisation des données...');
  };

  const handleAdd = () => {
    alert('Ajouter un nouvel utilisateur...');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Table avec Toolbar Personnalisée</h2>
      <Table
        data={sampleUsers}
        columns={columns}
        keyExtractor={(user) => user.id}
        features={{
          search: true,
          export: true,
          pagination: true,
        }}
        toolbarLeftSection={
          <button
            onClick={handleRefresh}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              cursor: 'pointer',
            }}
          >
            🔄 Actualiser
          </button>
        }
        toolbarRightSection={
          <button
            onClick={handleAdd}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            + Ajouter
          </button>
        }
      />
    </div>
  );
}

// Exemple 5: Table pour grandes quantités de données (optimisée)
export function OptimizedTableExample() {
  // Générer beaucoup de données
  const largeDataset: User[] = Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: ['Admin', 'User', 'Editor'][i % 3] as User['role'],
    status: i % 2 === 0 ? 'active' : 'inactive',
    lastLogin: new Date(2024, 0, Math.floor(Math.random() * 30) + 1).toISOString(),
    createdAt: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
  }));

  return (
    <div style={{ padding: '20px' }}>
      <h2>Table Optimisée (1000 lignes)</h2>
      <Table
        data={largeDataset}
        columns={columns}
        keyExtractor={(user) => user.id}
        features={{
          search: true,
          export: true,
          pagination: true,
          pageSize: true,
          animate: false, // Désactivé pour de meilleures performances
        }}
        defaultPageSize={50}
        pageSizeOptions={[25, 50, 100, 250]}
      />
    </div>
  );
}

// Exemple complet avec tous les exemples
export function AllExamples() {
  return (
    <div>
      <BasicTableExample />
      <hr style={{ margin: '40px 0' }} />
      <SearchTableExample />
      <hr style={{ margin: '40px 0' }} />
      <FullFeaturedTableExample />
      <hr style={{ margin: '40px 0' }} />
      <CustomToolbarTableExample />
      <hr style={{ margin: '40px 0' }} />
      <OptimizedTableExample />
    </div>
  );
}
