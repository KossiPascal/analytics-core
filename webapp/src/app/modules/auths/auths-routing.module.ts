import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { LogoutAccessGuard } from '@kossi-src/app/guards/logout-access-guard';


const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent,
    // canActivate: [LogoutAccessGuard],
    data: {
      href: 'auths/login',
      title: 'User login',
    },
  },
  {
    path: 'auths/register',
    component: RegisterComponent,
    canActivate: [LogoutAccessGuard],
    data: {
      href: 'auths/register',
      title: 'User registration',
    },
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthsRoutingModule { }
