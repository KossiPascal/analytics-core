import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { KendeyaGuideFormationComponent } from './kendeya-guide-formation/kendeya-guide-formation.component';
import { KendeyaRecoGuideFormationComponent } from './kendeya-reco-guide-formation/kendeya-reco-guide-formation.component';

const routes: Routes = [
  { path: '', redirectTo: 'kendeya-reco-guide-formation', pathMatch: 'full' },
  {
    path: 'kendeya-reco-guide-formation',
    component: KendeyaRecoGuideFormationComponent,
    // canActivate: [],
    data: {
      href: 'publics/kendeya-reco-guide-formation',
      title: 'Kendeya Guide Formation',
    },
  },
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
