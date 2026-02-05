# Guide de Migration - Table Component

Ce guide vous aide à migrer de l'ancienne version du composant Table vers la nouvelle version avec fonctionnalités avancées.

## Compatibilité ascendante

✅ **Bonne nouvelle !** Le nouveau composant est 100% rétrocompatible. Tous les codes existants continueront de fonctionner sans modification.

```tsx
// Ceci fonctionne toujours exactement comme avant
<Table
  data={users}
  columns={columns}
  keyExtractor={(user) => user.id}
/>
```

## Nouvelles fonctionnalités optionnelles

Vous pouvez activer progressivement les nouvelles fonctionnalités selon vos besoins.

### 1. Ajouter la recherche

**Avant :**
```tsx
<Table data={users} columns={columns} keyExtractor={(user) => user.id} />
```

**Après :**
```tsx
<Table
  data={users}
  columns={columns}
  keyExtractor={(user) => user.id}
  features={{ search: true }}
  searchPlaceholder="Rechercher..." // optionnel
/>
```

**Note :** Par défaut, toutes les colonnes sont recherchables. Pour exclure une colonne :
```tsx
const columns: Column<User>[] = [
  {
    key: 'id',
    header: 'ID',
    searchable: false, // ← Nouvelle prop
  },
  // ...
];
```

### 2. Ajouter l'export de données

**Avant :**
```tsx
<Table data={users} columns={columns} keyExtractor={(user) => user.id} />
```

**Après :**
```tsx
<Table
  data={users}
  columns={columns}
  keyExtractor={(user) => user.id}
  features={{ export: true }}
  exportFilename="utilisateurs" // optionnel
  exportFormats={['csv', 'excel']} // optionnel
/>
```

### 3. Ajouter la pagination

**Avant :**
```tsx
<Table data={users} columns={columns} keyExtractor={(user) => user.id} />
```

**Après :**
```tsx
<Table
  data={users}
  columns={columns}
  keyExtractor={(user) => user.id}
  features={{
    pagination: true,
    pageSize: true, // Ajoute le sélecteur de taille de page
  }}
  defaultPageSize={25} // optionnel
  pageSizeOptions={[10, 25, 50, 100]} // optionnel
/>
```

### 4. Activer toutes les fonctionnalités

```tsx
<Table
  data={users}
  columns={columns}
  keyExtractor={(user) => user.id}
  features={{
    search: true,
    export: true,
    pagination: true,
    pageSize: true,
    animate: true, // déjà activé par défaut
  }}
/>
```

## Changements de structure CSS

### Avant
```css
.wrapper
  └── .table
      ├── .thead
      └── .tbody
```

### Après
```css
.container
  ├── TableToolbar (si search ou export activé)
  ├── .pageSizeContainer (si pageSize activé)
  ├── .wrapper
  │   └── .table
  │       ├── .thead
  │       └── .tbody
  └── Pagination (si pagination activé)
```

**Impact :** Si vous avez des styles personnalisés ciblant `.wrapper`, ils continueront de fonctionner. Utilisez `.container` pour styler le conteneur global.

## Mise à jour des colonnes

Les colonnes ont une nouvelle prop optionnelle `searchable` :

### Avant
```tsx
const columns: Column<User>[] = [
  {
    key: 'name',
    header: 'Nom',
    sortable: true,
  },
];
```

### Après (identique, mais avec option)
```tsx
const columns: Column<User>[] = [
  {
    key: 'name',
    header: 'Nom',
    sortable: true,
    searchable: true, // ← Nouvelle prop optionnelle (true par défaut)
  },
  {
    key: 'id',
    header: 'ID',
    searchable: false, // Exclure de la recherche
  },
];
```

## Désactiver les animations pour les performances

Si vous avez une table avec beaucoup de données (>1000 lignes) :

**Avant :**
```tsx
<Table data={largeDataset} columns={columns} keyExtractor={(item) => item.id} />
```

**Après :**
```tsx
<Table
  data={largeDataset}
  columns={columns}
  keyExtractor={(item) => item.id}
  features={{
    animate: false, // Désactiver les animations
    pagination: true, // Recommandé pour grandes données
  }}
  defaultPageSize={50}
/>
```

## Utiliser les composants individuellement

Si vous avez besoin de composants spécifiques en dehors de la table :

```tsx
import {
  SearchBar,
  ExportButtons,
  Pagination,
  PageSizeSelector,
} from '@components/ui/Table';

function MyCustomComponent() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div>
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Rechercher..."
      />

      <ExportButtons
        data={myData}
        columns={myColumns}
        filename="export"
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <PageSizeSelector
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        options={[10, 25, 50]}
      />
    </div>
  );
}
```

## Ajouter des boutons personnalisés dans la toolbar

```tsx
<Table
  data={users}
  columns={columns}
  keyExtractor={(user) => user.id}
  features={{ search: true, export: true }}

  // Ajouter des éléments personnalisés
  toolbarLeftSection={
    <button onClick={handleRefresh}>
      Actualiser
    </button>
  }
  toolbarRightSection={
    <button onClick={handleAdd}>
      Ajouter un utilisateur
    </button>
  }
/>
```

## Checklist de migration

Pour migrer une table existante vers la version complète :

- [ ] Identifier les besoins en fonctionnalités
- [ ] Ajouter la prop `features` avec les fonctionnalités souhaitées
- [ ] Tester la recherche sur vos colonnes
- [ ] Vérifier que l'export fonctionne correctement
- [ ] Ajuster la taille de page par défaut si nécessaire
- [ ] Tester les performances (désactiver animations si nécessaire)
- [ ] Vérifier les styles personnalisés existants
- [ ] Tester l'accessibilité (navigation clavier, lecteurs d'écran)
- [ ] Vérifier la responsivité sur mobile

## Exemples de migration complets

### Exemple 1 : Table simple → Table avec recherche et export

**Avant :**
```tsx
function UsersTable() {
  const { data: users } = useUsers();

  return (
    <Table
      data={users}
      columns={userColumns}
      keyExtractor={(user) => user.id}
      onRowClick={handleUserClick}
      isRowClickable
    />
  );
}
```

**Après :**
```tsx
function UsersTable() {
  const { data: users } = useUsers();

  return (
    <Table
      data={users}
      columns={userColumns}
      keyExtractor={(user) => user.id}
      onRowClick={handleUserClick}
      isRowClickable

      // Nouvelles fonctionnalités
      features={{
        search: true,
        export: true,
      }}
      searchPlaceholder="Rechercher un utilisateur..."
      exportFilename="utilisateurs"
    />
  );
}
```

### Exemple 2 : Pagination manuelle → Pagination intégrée

**Avant :**
```tsx
function ProductsTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const { data: products } = useProducts({ page, pageSize });

  return (
    <>
      <Table
        data={products.items}
        columns={productColumns}
        keyExtractor={(product) => product.id}
      />

      <CustomPagination
        page={page}
        totalPages={products.totalPages}
        onPageChange={setPage}
      />
    </>
  );
}
```

**Après :**
```tsx
function ProductsTable() {
  // Plus besoin de gérer la pagination manuellement !
  const { data: products } = useProducts(); // Récupérer toutes les données

  return (
    <Table
      data={products}
      columns={productColumns}
      keyExtractor={(product) => product.id}

      // La pagination est gérée automatiquement
      features={{
        pagination: true,
        pageSize: true,
      }}
      defaultPageSize={25}
    />
  );
}
```

**Note :** Pour la pagination côté serveur, continuez à utiliser votre approche actuelle.

### Exemple 3 : Grande table → Table optimisée

**Avant :**
```tsx
function LargeDataTable() {
  const { data } = useLargeDataset(); // 5000+ lignes

  return (
    <Table
      data={data}
      columns={columns}
      keyExtractor={(item) => item.id}
    />
  );
}
```

**Après :**
```tsx
function LargeDataTable() {
  const { data } = useLargeDataset(); // 5000+ lignes

  return (
    <Table
      data={data}
      columns={columns}
      keyExtractor={(item) => item.id}

      // Optimisations pour grandes données
      features={{
        search: true,
        pagination: true,
        pageSize: true,
        animate: false, // Désactiver animations
      }}
      defaultPageSize={100}
      pageSizeOptions={[50, 100, 250, 500]}
    />
  );
}
```

## Questions fréquentes

### Q : Mes styles personnalisés vont-ils casser ?
**R :** Non, tous les styles existants continueront de fonctionner. La structure de base de la table reste identique.

### Q : Dois-je migrer immédiatement ?
**R :** Non, le composant est rétrocompatible. Vous pouvez migrer progressivement selon vos besoins.

### Q : Comment désactiver l'animation uniquement sur certaines tables ?
**R :** Utilisez la prop `features={{ animate: false }}` sur les tables spécifiques.

### Q : Puis-je utiliser ma propre fonction d'export ?
**R :** Oui, n'activez pas `features.export` et ajoutez votre propre bouton dans `toolbarRightSection`.

### Q : La recherche est-elle sensible à la casse ?
**R :** Non, la recherche est insensible à la casse par défaut.

### Q : Puis-je personnaliser les formats d'export ?
**R :** Oui, utilisez la prop `exportFormats={['csv', 'json']}` pour choisir les formats disponibles.

### Q : Comment faire une pagination côté serveur ?
**R :** Continuez à gérer la pagination manuellement comme avant. La pagination intégrée est pour la pagination côté client uniquement.

## Support

Pour toute question ou problème :
1. Consultez le README.md pour la documentation complète
2. Regardez les exemples dans Table.example.tsx
3. Vérifiez la structure dans STRUCTURE.md

## Changelog

### Version 2.0.0 (Nouvelle version)
- ✨ Ajout de la recherche
- ✨ Ajout de l'export (CSV, JSON, Excel)
- ✨ Ajout de la pagination
- ✨ Ajout du sélecteur de taille de page
- ✨ Ajout de la toolbar avec sections personnalisables
- ✨ Option pour désactiver les animations
- 🔧 Nouvelle prop `features` pour activer/désactiver les fonctionnalités
- 🔧 Nouvelle prop `searchable` sur les colonnes
- ♻️ Refactorisation en sous-composants réutilisables
- 📚 Documentation complète et exemples

### Version 1.0.0 (Ancienne version)
- ✅ Table de base
- ✅ Tri de colonnes
- ✅ Animations
- ✅ Sélection de lignes
- ✅ Sticky header
