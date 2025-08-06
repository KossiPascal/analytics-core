import { CommonModule } from '@angular/common';
import {  CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@kossi-src/app/shared/shared.module';


const routes: Routes = [
  { path: '', redirectTo: 'reports', pathMatch: 'full' },
  { path: 'auths', loadChildren: () => import('./modules/auths/auths.module').then(m => m.AuthsModule)},
  { path: 'reports', loadChildren: () => import('./modules/reports-view/reports.module').then(m => m.ReportsModule)},
  { path: 'managements', loadChildren: () => import('./modules/managements-view/managements.module').then(m => m.ManagementsModule)},
  { path: 'dashboards', loadChildren: () => import('./modules/dashboards-view/dashboards.module').then(m => m.DashboardsModule)},
  { path: 'users', loadChildren: () => import('./modules/users-roles-view/users-roles.module').then(m => m.UsersRolesModule)},
  { path: 'administration', loadChildren: () => import('./modules/admin-view/admin-view.module').then(m => m.AdminViewModule)},
  { path: 'maps', loadChildren: () => import('./modules/maps-view/maps.module').then(m => m.MapsModule)},
  { path: 'documentations', loadChildren: () => import('./modules/publics-view/publics-view.module').then(m => m.PublicsModule)},
  
  // { path: 'charts', loadChildren: () => import('./modules/charts-views/charts-views.module').then(m => m.ChartsViewsModule)},
  // { path: 'xlsform', loadChildren: () => import('./modules/xls-forms/xlsforms.module').then(m => m.XlsformsModule)},
  // { path: 'rendererform', loadChildren: () => import('./modules/renderer/forms-renderer.module').then(m => m.FormRendererModule)},
  { path: 'errors', loadChildren: () => import('./modules/errors/errors.module').then(m => m.ErrorsModule)},
  { path: '**', redirectTo: 'errors/404/Oups%20!%20La%20page%20que%20vous%20recherchez%20n’existe%20pas.', pathMatch: 'full' }
];


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    RouterModule.forRoot(routes, { useHash: false })
  ],
  exports: [RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],

})
export class AppRoutingModule { }
