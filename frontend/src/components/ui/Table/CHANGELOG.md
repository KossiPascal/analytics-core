# Changelog - Table Component

Toutes les modifications notables de ce composant seront documentées dans ce fichier.

## [2.0.0] - 2026-02-05

### 🎉 Nouvelles Fonctionnalités

#### 1. Recherche
- Barre de recherche intégrée avec filtre en temps réel
- Recherche sur toutes les colonnes par défaut
- Possibilité d'exclure des colonnes de la recherche via `searchable: false`
- Bouton de nettoyage animé
- Placeholder personnalisable

#### 2. Export de données
- Export en format CSV
- Export en format JSON
- Export en format Excel (XML)
- Menu dropdown animé
- Nom de fichier personnalisable
- Sélection des formats disponibles

#### 3. Pagination
- Pagination côté client
- Navigation avec boutons précédent/suivant
- Navigation vers première/dernière page (optionnel)
- Boutons de page numérotés avec ellipses intelligentes
- Indicateur "Page X sur Y"
- Responsive mobile

#### 4. Sélecteur de taille de page
- Dropdown pour choisir le nombre de lignes par page
- Options configurables [10, 25, 50, 100]
- Affichage avec label "Afficher X lignes"
- État actif visible

#### 5. Toolbar personnalisable
- Barre d'outils intégrée
- Section gauche personnalisable
- Section droite personnalisable
- Combine SearchBar et ExportButtons
- Responsive

#### 6. Contrôle des animations
- Option pour désactiver les animations
- Amélioration des performances pour grandes quantités de données
- Mode non-animé pour >1000 lignes

### 🔧 Améliorations

#### Architecture
- Refactorisation en composants modulaires
- Création du dossier `components/` pour les sous-composants
- Création du dossier `utils/` pour les utilitaires
- Meilleure séparation des responsabilités

#### Performance
- Utilisation de `useMemo` pour filtrage, tri et pagination
- Pagination pour limiter le rendu DOM
- Option de désactivation des animations
- Optimisation pour grandes quantités de données

#### Accessibilité
- Labels ARIA sur tous les boutons
- Support complet du clavier
- États visuels clairs
- Contraste de couleurs amélioré

#### Responsive
- Adaptation mobile de la toolbar
- Adaptation mobile de la pagination
- Réduction des espacements sur petit écran
- Meilleure gestion du débordement

### 📦 Nouveaux Composants

#### Components
- `SearchBar.tsx` - Barre de recherche
- `ExportButtons.tsx` - Boutons d'export
- `Pagination.tsx` - Contrôles de pagination
- `PageSizeSelector.tsx` - Sélecteur de taille de page
- `TableToolbar.tsx` - Barre d'outils

#### Utilities
- `utils/exportData.ts` - Fonctions d'export de données
  - `exportToCSV()`
  - `exportToJSON()`
  - `exportToExcel()`

### 📝 Nouvelles Props

#### TableProps
```tsx
// Nouvelles props
features?: {
  search?: boolean;
  export?: boolean;
  pagination?: boolean;
  pageSize?: boolean;
  animate?: boolean;
}
searchPlaceholder?: string;
exportFilename?: string;
exportFormats?: ExportFormat[];
defaultPageSize?: number;
pageSizeOptions?: number[];
showFirstLastButtons?: boolean;
toolbarLeftSection?: ReactNode;
toolbarRightSection?: ReactNode;
```

#### Column
```tsx
// Nouvelle prop
searchable?: boolean;
```

### 📚 Documentation

- `README.md` - Documentation complète avec exemples
- `STRUCTURE.md` - Architecture et structure du projet
- `MIGRATION.md` - Guide de migration depuis v1
- `CHANGELOG.md` - Ce fichier
- `Table.example.tsx` - Exemples d'utilisation

### 🎨 Styles

#### Nouveaux styles (Table.module.css)
- `.container` - Conteneur principal
- `.pageSizeContainer` - Conteneur du sélecteur de taille

#### Nouveaux fichiers CSS
- `components/SearchBar.module.css`
- `components/ExportButtons.module.css`
- `components/Pagination.module.css`
- `components/PageSizeSelector.module.css`
- `components/TableToolbar.module.css`

### ✅ Compatibilité

- ✅ 100% rétrocompatible avec v1
- ✅ Aucune modification requise pour le code existant
- ✅ Toutes les nouvelles fonctionnalités sont optionnelles
- ✅ Pas de breaking changes

### 🔄 Migration

Voir [MIGRATION.md](./MIGRATION.md) pour un guide complet de migration.

**TL;DR** : Ajoutez simplement la prop `features` pour activer les nouvelles fonctionnalités.

```tsx
// v1 - Fonctionne toujours
<Table data={data} columns={columns} keyExtractor={...} />

// v2 - Avec nouvelles fonctionnalités
<Table
  data={data}
  columns={columns}
  keyExtractor={...}
  features={{ search: true, export: true, pagination: true }}
/>
```

### 📊 Statistiques

- **Nouveaux fichiers** : 17
- **Lignes de code ajoutées** : ~1500
- **Nouveaux composants** : 5
- **Nouvelles fonctionnalités** : 6
- **Formats d'export** : 3

---

## [1.0.0] - Avant 2026-02-05

### Fonctionnalités de base

- Table de base avec colonnes configurables
- Tri de colonnes (sortable)
- Animations avec Framer Motion
- Sélection de lignes
- Sticky header
- État de chargement
- Message vide personnalisable
- Callback onRowClick
- Rendu personnalisé de colonnes
- Alignement de colonnes (left, center, right)
- Largeur de colonnes personnalisable
- Styles avec CSS Modules
- Responsive

### Composants

- `Table.tsx` - Composant principal
- `Table.module.css` - Styles
- `index.ts` - Exports

### Props

```tsx
interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T, index: number) => void;
  isRowClickable?: boolean;
  selectedRowKey?: string | number | null;
  className?: string;
  stickyHeader?: boolean;
}

interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (item: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}
```

---

## Roadmap

### Version 2.1.0 (Future)
- [ ] Filtre avancé par colonne
- [ ] Groupement de lignes
- [ ] Colonnes redimensionnables
- [ ] Colonnes réorganisables (drag & drop)
- [ ] Mode édition inline
- [ ] Sélection multiple de lignes
- [ ] Actions en lot
- [ ] Export PDF
- [ ] Sauvegarde de l'état (local storage)
- [ ] Colonnes fixées (freeze columns)

### Version 2.2.0 (Future)
- [ ] Pagination côté serveur
- [ ] Tri côté serveur
- [ ] Recherche côté serveur
- [ ] Chargement infini (infinite scroll)
- [ ] Mode virtuel pour très grandes données
- [ ] Templates de colonnes prédéfinis
- [ ] Thèmes prédéfinis
- [ ] Mode compact/confortable/spacieux

### Considérations
- Support de TypeScript strict
- Tests unitaires (Jest + React Testing Library)
- Tests e2e (Playwright)
- Storybook pour la documentation interactive
- Amélioration continue de la performance
- Support de i18n pour les labels

---

## Notes de version

### Comment activer les fonctionnalités

Toutes les nouvelles fonctionnalités sont **opt-in** via la prop `features` :

```tsx
<Table
  data={data}
  columns={columns}
  keyExtractor={...}
  features={{
    search: true,      // Active la recherche
    export: true,      // Active l'export
    pagination: true,  // Active la pagination
    pageSize: true,    // Active le sélecteur de taille
    animate: true,     // Active les animations (par défaut)
  }}
/>
```

### Meilleures pratiques

1. **Pour petites données (<100 lignes)** : Utiliser toutes les fonctionnalités
2. **Pour données moyennes (100-1000 lignes)** : Activer pagination
3. **Pour grandes données (>1000 lignes)** : Désactiver animations + pagination obligatoire
4. **Pour export** : Toujours tester avec vos données réelles
5. **Pour recherche** : Exclure les colonnes non pertinentes avec `searchable: false`

### Breaking Changes

Aucun ! La version 2.0.0 est 100% compatible avec la version 1.0.0.

### Dépendances

Aucune nouvelle dépendance ajoutée. Le composant utilise les mêmes dépendances que la v1 :
- `react`
- `framer-motion`
- `lucide-react`

---

## Support

Pour toute question, problème ou suggestion :
1. Consultez la [documentation](./README.md)
2. Regardez les [exemples](./Table.example.tsx)
3. Lisez le [guide de migration](./MIGRATION.md)

## Licence

Ce composant fait partie du projet analytics-core.
