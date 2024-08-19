import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from './w_shared/shared.module';


const routes: Routes = [
  { path: '', redirectTo: 'dashboards', pathMatch: 'full' },
  { path: 'reports', loadChildren: () => import('./modules/reports/reports.module').then(m => m.ReportsModule)},
  { path: 'manages', loadChildren: () => import('./modules/manages/manages.module').then(m => m.ManagesModule)},
  { path: 'dashboards', loadChildren: () => import('./modules/dashbords/dashbords.module').then(m => m.DashboardsModule)},
  { path: 'auths', loadChildren: () => import('./modules/auths/auths.module').then(m => m.AuthsModule)},
  { path: 'admin', loadChildren: () => import('./modules/admin/admin.module').then(m => m.AdminModule)},
  { path: 'publics', loadChildren: () => import('./modules/publics/publics.module').then(m => m.PublicsModule)},
  { path: 'errors', loadChildren: () => import('./modules/errors/errors.module').then(m => m.ErrorsModule)},
  { path: '**', redirectTo: 'errors' },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    RouterModule.forRoot(routes, { useHash: false })
    // RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
