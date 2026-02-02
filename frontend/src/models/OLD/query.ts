// src/models/query.ts
export interface Query {
  id: string;
  tenantId: string;
  datasetId: string;
  queryJson: any; // format JSON pour builder UI
  compiledSql: string;
  createdAt?: string;
}
