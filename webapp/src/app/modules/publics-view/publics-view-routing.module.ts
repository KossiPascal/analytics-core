import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PublicsViewComponent } from './publics-view.component';

const routes: Routes = [
  {
    path: '',
    component: PublicsViewComponent,
    // canActivate: [],
    data: {
      href: 'publics',
      title: 'VUES PUBLICS',
      access: ['_public']
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PublicsRoutingModule { }
