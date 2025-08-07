import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginAccessGuard } from '@kossi-src/app/guards/login-access-guard';
import { MapsViewComponent } from './maps-view.component';


const routes: Routes = [
  {
    path: '',
    component: MapsViewComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'maps',
      title: 'RECO MAPS',
      access: ['can_view_maps']
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MapsRoutingModule { }
