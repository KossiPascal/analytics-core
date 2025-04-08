import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginAccessGuard } from '@kossi-src/app/guards/login-access-guard';
import { ManagementsComponent } from './managements.component';


const routes: Routes = [
  {
    path: '',
    component: ManagementsComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'manages',
      title: 'Sync Steply',
      access: ['can_manage_data']
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManagementsRoutingModule { }
