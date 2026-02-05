# Structure du composant Table

```
Table/
├── README.md                           # Documentation complète
├── STRUCTURE.md                        # Ce fichier - Structure du projet
├── CHANGELOG.md                        # Historique des modifications
├── MIGRATION.md                        # Guide de migration
├── Table.tsx                          # Composant principal
├── Table.module.css                   # Styles principaux
├── Table.example.tsx                  # Exemples d'utilisation
├── index.ts                           # Exports publics
│
├── components/                        # Sous-composants
│   ├── index.ts                       # Exports des composants
│   │
│   ├── SearchBar/                     # Barre de recherche
│   │   ├── SearchBar.tsx
│   │   ├── SearchBar.module.css
│   │   └── index.ts
│   │
│   ├── ExportButtons/                 # Boutons d'export (CSV, JSON, Excel)
│   │   ├── ExportButtons.tsx
│   │   ├── ExportButtons.module.css
│   │   └── index.ts
│   │
│   ├── Pagination/                    # Contrôles de pagination
│   │   ├── Pagination.tsx
│   │   ├── Pagination.module.css
│   │   └── index.ts
│   │
│   ├── PageSizeSelector/              # Sélecteur de taille de page
│   │   ├── PageSizeSelector.tsx
│   │   ├── PageSizeSelector.module.css
│   │   └── index.ts
│   │
│   └── TableToolbar/                  # Barre d'outils (contient SearchBar + ExportButtons)
│       ├── TableToolbar.tsx
│       ├── TableToolbar.module.css
│       └── index.ts
│
└── utils/                             # Utilitaires
    └── exportData.ts                  # Fonctions d'export de données
```

## Description des fichiers

### Fichiers principaux

- **Table.tsx** : Composant principal qui orchestre toutes les fonctionnalités
- **Table.module.css** : Styles partagés et styles de base
- **index.ts** : Point d'entrée, exporte tous les éléments publics
- **README.md** : Documentation complète avec exemples
- **Table.example.tsx** : Exemples d'utilisation concrets

### Composants (`components/`)

#### SearchBar
Barre de recherche avec :
- Icône de recherche
- Bouton de nettoyage animé
- Support du placeholder personnalisé

#### ExportButtons
Menu dropdown pour l'export avec :
- Support CSV, JSON, Excel
- Menu animé
- Formats configurables

#### Pagination
Contrôles de pagination avec :
- Navigation première/dernière page (optionnel)
- Navigation précédent/suivant
- Boutons de page numérotés
- Ellipses intelligentes pour beaucoup de pages

#### PageSizeSelector
Sélecteur de taille de page avec :
- Menu dropdown
- Options configurables
- État actif visible

#### TableToolbar
Barre d'outils qui combine :
- SearchBar (si activée)
- ExportButtons (si activé)
- Sections personnalisables (gauche/droite)

### Utilitaires (`utils/`)

#### exportData.ts
Fonctions d'export :
- `exportToCSV()` : Export en CSV avec gestion des virgules et guillemets
- `exportToJSON()` : Export en JSON formaté
- `exportToExcel()` : Export en XML Excel (format .xls)

## Flux de données

```
Table Component
    ↓
    ├─→ Filtrage par recherche (si activé)
    ↓
    ├─→ Tri des colonnes
    ↓
    ├─→ Pagination (si activée)
    ↓
    └─→ Rendu des données
```

## Fonctionnalités activables/désactivables

Toutes les fonctionnalités sont optionnelles via la prop `features` :

```tsx
features={{
  search: true,      // Barre de recherche
  export: true,      // Boutons d'export
  pagination: true,  // Pagination
  pageSize: true,    // Sélecteur de taille de page
  animate: true,     // Animations
}}
```

## Architecture des styles

### Styles partagés (Table.module.css)
- `.container` : Conteneur principal
- `.wrapper` : Wrapper de la table avec overflow
- `.table`, `.thead`, `.tbody` : Styles de base
- `.th`, `.td` : Styles des cellules
- `.loading` : Indicateur de chargement

### Styles spécifiques (components/*.module.css)
Chaque composant a ses propres styles dans son fichier `.module.css` pour :
- Encapsulation
- Réutilisabilité
- Maintenabilité

## Variables CSS utilisées

Le composant utilise les variables CSS du design system :

### Couleurs
- `--bg-card`, `--bg-secondary`, `--bg-tertiary`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--border-color`
- `--primary`, `--primary-light`

### Espacements
- `--spacing-1` à `--spacing-10`

### Bordures
- `--radius-sm`, `--radius-md`, `--radius-lg`

### Ombres
- `--shadow-sm`, `--shadow-lg`

### Transitions
- `--transition-fast`

### Typographie
- `--font-size-xs`, `--font-size-sm`, `--font-size-base`
- `--font-weight-medium`, `--font-weight-semibold`

## Dépendances

### Externes
- `react` : Framework
- `framer-motion` : Animations
- `lucide-react` : Icônes

### Internes
- `@utils/cn` : Utility pour combiner les classes CSS
- `@animations/index` : Variantes d'animation

## Performance

### Optimisations
1. **useMemo** pour les données filtrées, triées et paginées
2. **AnimatePresence** pour des animations fluides
3. Option de désactivation des animations pour grandes quantités de données
4. Pagination pour limiter le nombre de lignes rendues

### Recommandations
- Désactiver les animations pour >1000 lignes
- Utiliser la pagination pour grandes quantités de données
- Définir une taille de page appropriée (25-100)

## Accessibilité

- Navigation au clavier
- Labels ARIA appropriés
- États visuels clairs
- Boutons avec `aria-label`
- Contraste conforme WCAG

## Extensibilité

Le composant est conçu pour être extensible :

1. **Nouveaux formats d'export** : Ajouter dans `utils/exportData.ts`
2. **Nouveaux composants toolbar** : Utiliser `toolbarLeftSection` / `toolbarRightSection`
3. **Styles personnalisés** : Utiliser la prop `className` ou surcharger les variables CSS
4. **Rendu personnalisé** : Utiliser `column.render()`

## Exemples d'utilisation

Voir `Table.example.tsx` pour des exemples complets incluant :
- Table basique
- Table avec recherche
- Table complète avec toutes les fonctionnalités
- Table avec toolbar personnalisée
- Table optimisée pour grandes quantités de données
