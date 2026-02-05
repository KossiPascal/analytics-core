# Table Component - DataTable Avancé

Un composant de table réutilisable avec des fonctionnalités avancées incluant la recherche, le tri, la pagination, l'export de données, et les animations.

## Fonctionnalités

- ✅ **Recherche** : Barre de recherche pour filtrer les données
- ✅ **Tri de colonnes** : Tri ascendant/descendant sur les colonnes
- ✅ **Pagination** : Navigation entre les pages de données
- ✅ **Sélection de taille de page** : Choisir le nombre de lignes par page
- ✅ **Export de données** : Télécharger les données en CSV, JSON ou Excel
- ✅ **Animations** : Animations fluides avec Framer Motion (activable/désactivable)
- ✅ **Responsive** : S'adapte aux différentes tailles d'écran
- ✅ **Sticky Header** : En-tête fixe lors du défilement
- ✅ **Sélection de ligne** : Support de sélection et mise en surbrillance

## Utilisation de base

```tsx
import { Table, type Column } from '@components/ui/Table';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const columns: Column<User>[] = [
  {
    key: 'id',
    header: 'ID',
    sortable: true,
    width: 80,
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
    render: (user) => (
      <span className={styles.badge}>{user.role}</span>
    ),
  },
];

function UsersTable() {
  const users: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    // ...
  ];

  return (
    <Table
      data={users}
      columns={columns}
      keyExtractor={(user) => user.id}
    />
  );
}
```

## Table avec toutes les fonctionnalités activées

```tsx
<Table
  data={users}
  columns={columns}
  keyExtractor={(user) => user.id}

  // Activer les fonctionnalités
  features={{
    search: true,
    export: true,
    pagination: true,
    pageSize: true,
    animate: true,
  }}

  // Configuration de la recherche
  searchPlaceholder="Rechercher un utilisateur..."

  // Configuration de l'export
  exportFilename="utilisateurs"
  exportFormats={['csv', 'excel', 'json']}

  // Configuration de la pagination
  defaultPageSize={10}
  pageSizeOptions={[10, 25, 50, 100]}
  showFirstLastButtons={true}

  // Autres options
  stickyHeader={true}
  isRowClickable={true}
  onRowClick={(user) => console.log('Clicked:', user)}
  emptyMessage="Aucun utilisateur trouvé"
/>
```

## Props

### TableProps<T>

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `data` | `T[]` | **requis** | Données à afficher |
| `columns` | `Column<T>[]` | **requis** | Configuration des colonnes |
| `keyExtractor` | `(item: T, index: number) => string \| number` | **requis** | Fonction pour extraire une clé unique |
| `isLoading` | `boolean` | `false` | Affiche un indicateur de chargement |
| `emptyMessage` | `string` | `"Aucune donnée disponible"` | Message affiché quand il n'y a pas de données |
| `onRowClick` | `(item: T, index: number) => void` | - | Callback appelé lors du clic sur une ligne |
| `isRowClickable` | `boolean` | `false` | Rend les lignes cliquables |
| `selectedRowKey` | `string \| number \| null` | - | Clé de la ligne sélectionnée |
| `className` | `string` | - | Classes CSS personnalisées |
| `stickyHeader` | `boolean` | `false` | Fixe l'en-tête lors du défilement |

### Fonctionnalités avancées

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `features` | `TableFeatures` | `{}` | Active/désactive les fonctionnalités |
| `searchPlaceholder` | `string` | `"Rechercher..."` | Placeholder de la barre de recherche |
| `exportFilename` | `string` | `"export"` | Nom du fichier lors de l'export |
| `exportFormats` | `ExportFormat[]` | `['csv', 'json', 'excel']` | Formats d'export disponibles |
| `defaultPageSize` | `number` | `10` | Nombre de lignes par page par défaut |
| `pageSizeOptions` | `number[]` | `[10, 25, 50, 100]` | Options de taille de page |
| `showFirstLastButtons` | `boolean` | `true` | Affiche les boutons première/dernière page |
| `toolbarLeftSection` | `ReactNode` | - | Contenu personnalisé à gauche de la toolbar |
| `toolbarRightSection` | `ReactNode` | - | Contenu personnalisé à droite de la toolbar |

### TableFeatures

```tsx
interface TableFeatures {
  search?: boolean;      // Active la recherche
  export?: boolean;      // Active l'export
  pagination?: boolean;  // Active la pagination
  pageSize?: boolean;    // Active le sélecteur de taille de page
  animate?: boolean;     // Active les animations
}
```

### Column<T>

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `key` | `string` | **requis** | Clé de la colonne (correspond à une propriété de T) |
| `header` | `ReactNode` | **requis** | Contenu de l'en-tête |
| `render` | `(item: T, index: number) => ReactNode` | - | Fonction de rendu personnalisée |
| `sortable` | `boolean` | `false` | Active le tri sur cette colonne |
| `searchable` | `boolean` | `true` | Inclut cette colonne dans la recherche |
| `width` | `string \| number` | - | Largeur de la colonne |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Alignement du contenu |

## Exemples

### Table simple sans fonctionnalités avancées

```tsx
<Table
  data={users}
  columns={columns}
  keyExtractor={(user) => user.id}
/>
```

### Table avec recherche et tri uniquement

```tsx
<Table
  data={users}
  columns={columns}
  keyExtractor={(user) => user.id}
  features={{
    search: true,
  }}
/>
```

### Table avec pagination et export

```tsx
<Table
  data={users}
  columns={columns}
  keyExtractor={(user) => user.id}
  features={{
    pagination: true,
    pageSize: true,
    export: true,
  }}
  defaultPageSize={25}
  exportFilename="mes-donnees"
  exportFormats={['csv', 'excel']}
/>
```

### Table sans animations (meilleures performances)

```tsx
<Table
  data={largeDataset}
  columns={columns}
  keyExtractor={(item) => item.id}
  features={{
    animate: false,
    pagination: true,
  }}
  defaultPageSize={100}
/>
```

### Table avec toolbar personnalisée

```tsx
<Table
  data={users}
  columns={columns}
  keyExtractor={(user) => user.id}
  features={{
    search: true,
    export: true,
  }}
  toolbarLeftSection={
    <button onClick={handleRefresh}>
      <RefreshIcon /> Actualiser
    </button>
  }
  toolbarRightSection={
    <button onClick={handleAdd}>
      <PlusIcon /> Ajouter
    </button>
  }
/>
```

### Colonnes avec rendu personnalisé

```tsx
const columns: Column<User>[] = [
  {
    key: 'avatar',
    header: 'Avatar',
    render: (user) => (
      <img src={user.avatarUrl} alt={user.name} className={styles.avatar} />
    ),
    searchable: false,
  },
  {
    key: 'status',
    header: 'Statut',
    sortable: true,
    render: (user) => (
      <Badge color={user.isActive ? 'green' : 'red'}>
        {user.isActive ? 'Actif' : 'Inactif'}
      </Badge>
    ),
  },
  {
    key: 'actions',
    header: 'Actions',
    align: 'right',
    render: (user) => (
      <div className={styles.actions}>
        <button onClick={() => handleEdit(user)}>Éditer</button>
        <button onClick={() => handleDelete(user)}>Supprimer</button>
      </div>
    ),
    searchable: false,
  },
];
```

## Composants individuels

Vous pouvez également utiliser les composants individuels séparément :

```tsx
import {
  SearchBar,
  ExportButtons,
  Pagination,
  PageSizeSelector,
  TableToolbar,
} from '@components/ui/Table';

// SearchBar
<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Rechercher..."
/>

// ExportButtons
<ExportButtons
  data={data}
  columns={columns}
  filename="export"
  formats={['csv', 'json', 'excel']}
/>

// Pagination
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  showFirstLast={true}
/>

// PageSizeSelector
<PageSizeSelector
  pageSize={pageSize}
  onPageSizeChange={setPageSize}
  options={[10, 25, 50, 100]}
/>
```

## Performance

Pour de grandes quantités de données (>1000 lignes), il est recommandé de :

1. Activer la pagination : `features={{ pagination: true }}`
2. Désactiver les animations : `features={{ animate: false }}`
3. Utiliser une taille de page raisonnable : `defaultPageSize={50}`

## Accessibilité

Le composant Table est conçu avec l'accessibilité en tête :

- Navigation au clavier supportée
- Labels ARIA appropriés
- Indicateurs visuels clairs pour les états (tri, sélection, etc.)
- Contraste de couleurs conforme aux normes WCAG

## Styles personnalisés

Vous pouvez personnaliser les styles en utilisant les variables CSS ou en ajoutant vos propres classes :

```tsx
<Table
  className="my-custom-table"
  data={data}
  columns={columns}
  keyExtractor={(item) => item.id}
/>
```

Les variables CSS utilisées :
- `--bg-card` : Couleur de fond de la table
- `--bg-secondary` : Couleur de fond secondaire
- `--bg-tertiary` : Couleur de fond tertiaire
- `--text-primary` : Couleur du texte principal
- `--text-secondary` : Couleur du texte secondaire
- `--text-muted` : Couleur du texte atténué
- `--border-color` : Couleur des bordures
- `--primary` : Couleur primaire
- `--primary-light` : Couleur primaire claire
- `--radius-*` : Rayons de bordure
- `--spacing-*` : Espacements
- `--shadow-*` : Ombres
