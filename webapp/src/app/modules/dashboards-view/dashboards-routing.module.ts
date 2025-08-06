import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginAccessGuard } from '@kossi-src/app/guards/login-access-guard';
import { DashboardsMonthlyViewComponent } from './monthly/dashboards-monthly-view.component';
import { DashboardsRealtimeViewComponent } from './realtime/dashboards-realtime-view.component';


const routes: Routes = [
  { path: '', redirectTo: 'monthly', pathMatch: 'full' },
  {
    path: 'monthly',
    component: DashboardsMonthlyViewComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'dashboards/monthly',
      title: 'TABLEAUX DE BORD MENSUEL',
      access: ['can_view_dashboards']
    },
  },
  {
    path: 'realtime',
    component: DashboardsRealtimeViewComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'dashboards/realtime',
      title: 'TABLEAUX DE BORD ANNUEL',
      access: ['can_view_dashboards']
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardsRoutingModule { }
