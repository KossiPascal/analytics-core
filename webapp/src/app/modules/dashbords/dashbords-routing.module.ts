import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginAccessGuard } from '@kossi-src/app/guards/login-access-guard';
import { RecoPerformanceDashboardComponent } from './reco-performance/reco-performance.component';
import { RecoVaccinationDashboardComponent } from './reco-vaccination/reco-vaccination.component';

const routes: Routes = [
  { path: '', redirectTo: 'reco-performance-dashboard', pathMatch: 'full'},
  {
    path: 'reco-performance-dashboard',
    component: RecoPerformanceDashboardComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'dashboards/reco-performance-dashboard',
      title: 'Performance des Reco',
    },
  },
  {
    path: 'reco-vaccination-dashboard',
    component: RecoVaccinationDashboardComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'dashboards/reco-vaccination-dashboard',
      title: 'Vaccination des enfants',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardsRoutingModule { }
