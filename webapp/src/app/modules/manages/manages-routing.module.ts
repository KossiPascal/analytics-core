import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SyncToDhis2Component } from './sync-to-dhis2/sync-to-dhis2.component';
import { LoginAccessGuard } from '@kossi-src/app/guards/login-access-guard';
import { SyncCalculateAllDataComponent } from './sync-calculate-all-data/sync-calculate-all-data.component';


const routes: Routes = [
  { path: '', redirectTo: 'sync-calculate-all-data', pathMatch: 'full' },
  {
    path: 'sync-to-dhis2',
    component: SyncToDhis2Component,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'manages/sync-to-dhis2',
      title: 'Sync To Dhis2',
    },
  },
  {
    path: 'sync-calculate-all-data',
    component: SyncCalculateAllDataComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'manages/sync-calculate-all-data',
      title: 'Sync Steply',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManagesRoutingModule { }
