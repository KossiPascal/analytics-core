import { DimensionItem } from './domain';

export const DEFAULT_DIMENSIONS = {
  dx: [
    { id: 'cases', name: 'Cases' },
    { id: 'deaths', name: 'Deaths' },
    { id: 'recoveries', name: 'Recoveries' },
  ] satisfies DimensionItem[],

  pe: [
    { id: '2024Q1', name: '2024 Q1' },
    { id: '2024Q2', name: '2024 Q2' },
    { id: '2024Q3', name: '2024 Q3' },
  ] satisfies DimensionItem[],

  ou: [
    { id: 'ou_1', name: 'District A' },
    { id: 'ou_2', name: 'District B' },
    { id: 'ou_3', name: 'District C' },
  ] satisfies DimensionItem[],
};
