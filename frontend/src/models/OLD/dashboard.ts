import { Chart } from "./chart";

export interface DashboardChart extends Omit<Chart, "name"> {
  position?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  name?: string;
}

// export interface DashboardChart extends Chart {
//   position?: {
//     x: number;
//     y: number;
//     w: number;
//     h: number;
//   };
//   name: string; // obligatoire
// }

export interface Dashboard {
  id: string;
  tenantId: string;
  name: string;
  layout?: any; // layout JSON pour grid
  charts: DashboardChart[];
  createdAt?: string;
}
