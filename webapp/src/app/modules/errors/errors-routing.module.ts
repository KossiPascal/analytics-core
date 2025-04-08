import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Error404Component } from './404/404.component';
import { Error500Component } from './500/500.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';


const routes: Routes = [
  { path: '', redirectTo: '404', pathMatch: 'full' },
  {
    path: '404',
    component: Error404Component,
    canActivate: [],
    data: {
      href: 'errors/404',
      title: 'Error 404',
      access: ['_public']
    },
  },
  {
    path: '500',
    component: Error500Component,
    canActivate: [],
    data: {
      href: 'errors/500',
      title: 'Error 500',
      access: ['_public']
    },
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent,
    canActivate: [],
    data: {
      href: 'errors/unauthorized',
      title: 'Unauthorized',
      access: ['_public']
    },
  },


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ErrorsRoutingModule { }
