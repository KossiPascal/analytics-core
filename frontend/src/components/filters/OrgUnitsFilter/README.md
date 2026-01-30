# OrgUnitsFilter Component

Composant React pour filtrer les unités organisationnelles avec sélection en cascade et filtrage par période.

## Caractéristiques

- **Sélection en cascade**: Les sélections se propagent automatiquement aux niveaux inférieurs
- **Sélection multiple**: Checkbox "Tout sélectionner" pour chaque niveau
- **Compteur de sélection**: Affiche le nombre d'éléments sélectionnés
- **Filtrage par période**: Sélection d'année et de mois (simple ou multiple)
- **Modal responsive**: Interface modale avec animations
- **Intégration utilisateur**: Charge automatiquement les unités organisationnelles de l'utilisateur connecté

## Utilisation

```tsx
import { useState } from 'react';
import { OrgUnitsFilter, type FilterFormData } from '@/components/filters/OrgUnitsFilter';

function MyComponent() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleFilterChange = (formData: FilterFormData) => {
    console.log('Selected filters:', formData);
    console.log('Year:', formData.year);
    console.log('Months:', formData.months);
    console.log('Org units:', formData.org_units);
  };

  return (
    <>
      <button onClick={() => setIsFilterOpen(true)}>
        🔍 Filtrer
      </button>

      <OrgUnitsFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onChange={handleFilterChange}
        showRecoLevel={true}
        showMonthsSelection={true}
        showYearsSelection={true}
        showMultipleSelectionMonth={true}
      />
    </>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `false` | Contrôle l'ouverture du modal |
| `onClose` | `() => void` | - | Callback appelé lors de la fermeture du modal |
| `onChange` | `(formData: FilterFormData) => void` | - | Callback appelé lors de la soumission du formulaire |
| `showRecoLevel` | `boolean` | `true` | Afficher le niveau RECO |
| `showMonthsSelection` | `boolean` | `true` | Afficher la sélection de mois |
| `showYearsSelection` | `boolean` | `true` | Afficher la sélection d'années |
| `showMultipleSelectionMonth` | `boolean` | `true` | Permettre la sélection multiple de mois |
| `className` | `string` | `''` | Classes CSS personnalisées |

## Types

### FilterFormData

```typescript
interface FilterFormData {
  year: number;
  months: string[];
  country?: string[];
  region?: string[];
  prefecture?: string[];
  commune?: string[];
  hospital?: string[];
  district_quartier?: string[];
  village_secteur?: string[];
  recos?: string[];
  org_units?: OrgUnitSelection;
}
```

### OrgUnitSelection

```typescript
interface OrgUnitSelection {
  country: CountryMap[];
  region: RegionsMap[];
  prefecture: PrefecturesMap[];
  commune: CommunesMap[];
  hospital: HospitalsMap[];
  district_quartier: DistrictQuartiersMap[];
  chws: ChwsMap[];
  village_secteur: VillageSecteursMap[];
  recos: RecosMap[];
  all_recos_ids: string[];
  selected_recos_ids: string[];
}
```

## Fonctionnement

1. **Chargement initial**: Les unités organisationnelles sont chargées depuis `user.countries`, `user.regions`, etc.
2. **Sélection en cascade**: Quand un pays est sélectionné, seules les régions de ce pays sont affichées
3. **Auto-sélection**: Par défaut, tous les éléments disponibles à chaque niveau sont sélectionnés
4. **Checkbox "Tout"**: Permet de sélectionner/désélectionner tous les éléments d'un niveau
5. **Soumission**: Le formulaire renvoie les données complètes via `onChange`

## Différences avec la version Angular

Cette implémentation React reproduit fidèlement la logique de la version Angular:

- ✅ Même structure de données
- ✅ Même logique de cascade
- ✅ Même comportement de sélection
- ✅ Même interface utilisateur
- ✅ Support des mêmes cas d'usage

### Adaptations React

- Utilise `useState` et `useCallback` au lieu de `FormGroup` Angular
- Utilise `useAuth()` au lieu de `UserContextService`
- Gestion d'état avec hooks React au lieu de RxJS Observables
- CSS Modules au lieu de fichiers CSS globaux
