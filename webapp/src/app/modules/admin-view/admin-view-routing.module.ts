import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginAccessGuard } from '@kossi-src/app/guards/login-access-guard';
import { AdminViewComponent } from './admin-view.component';


const routes: Routes = [
  {
    path: '',
    component: AdminViewComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'admin',
      title: 'ADMINISTRATION',
      access: ['_superuser']
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminViewRoutingModule { }
