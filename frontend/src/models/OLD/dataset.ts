// src/models/dataset.ts
export interface Dataset {
  id: string;
  tenantId: string;
  name: string;
  sql: string;
  columns: DatasetColumn[];
  createdAt?: string;
}

export interface DatasetColumn {
  name: string;
  type: string;
}
