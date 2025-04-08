import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReportsViewComponent } from './reports-view.component';
import { LoginAccessGuard } from '@kossi-src/app/guards/login-access-guard';


const routes: Routes = [
  // { path: '', redirectTo: 'reports-view', pathMatch: 'full' },
  {
    path: '',
    component: ReportsViewComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'reports',
      title: 'RAPPORTS',
      access: ['can_view_reports']
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportsRoutingModule { }
