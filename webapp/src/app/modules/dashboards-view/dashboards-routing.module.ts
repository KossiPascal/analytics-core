import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardsViewComponent } from './dashboards-view.component';
import { LoginAccessGuard } from '@kossi-src/app/guards/login-access-guard';


const routes: Routes = [
  // { path: '', redirectTo: 'reports-view', pathMatch: 'full' },
  {
    path: '',
    component: DashboardsViewComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'dashboards',
      title: 'TABLEAUX DE BORD',
      access: ['can_view_dashboards']
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardsRoutingModule { }
