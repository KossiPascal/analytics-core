import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { KendeyaGuideFormationComponent } from './kendeya-guide-formation/kendeya-guide-formation.component';

const routes: Routes = [
  { path: '', redirectTo: 'kendeya-guide-formation', pathMatch: 'full' },
  {
    path: 'kendeya-guide-formation',
    component: KendeyaGuideFormationComponent,
    // canActivate: [],
    data: {
      href: 'publics/kendeya-guide-formation',
      title: 'Kendeya Guide Formation',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PublicsRoutingModule { }
