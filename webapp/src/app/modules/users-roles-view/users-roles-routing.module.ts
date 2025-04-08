import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UsersRolesViewComponent } from './users-roles-view.component';
import { LoginAccessGuard } from '@kossi-src/app/guards/login-access-guard';


const routes: Routes = [
  // { path: '', redirectTo: 'reports-view', pathMatch: 'full' },
  {
    path: '',
    component: UsersRolesViewComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'users',
      title: 'USERS-ROLES',
      access: ['can_view_users']
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UsersRolesRoutingModule { }
