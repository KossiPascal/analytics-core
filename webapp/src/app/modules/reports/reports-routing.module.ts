import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ChwRecoMonthlyActivityComponent } from './chw-reco-activity/chw-reco-activity.component';
import { FamilyPlanningComponent } from './family-planning/family-planning.component';
import { MorbidityComponent } from './morbidity/morbidity.component';
import { PcimeComponent } from './pcime/pcime.component';
import { PromotionComponent } from './promotion/promotion.component';
import { HouseholdRecapComponent } from './household-recap/household-recap.component';
import { LoginAccessGuard } from '@kossi-src/app/guards/login-access-guard';


const routes: Routes = [
  { path: '', redirectTo: 'pcime', pathMatch: 'full' },
  {
    path: 'family-planning',
    component: FamilyPlanningComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'reports/family-planning',
      title: 'PLANIFICATION FAMILIALE',
    },
  },
  {
    path: 'morbidity',
    component: MorbidityComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'reports/morbidity',
      title: 'MORBIDITÉ PALUDISME',
    },
  },
  {
    path: 'pcimne',
    component: PcimeComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'reports/pcimne',
      title: 'RAPPORT PCIMNE',
    },
  },
  {
    path: 'promotion',
    component: PromotionComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'reports/promotion',
      title: 'PROMOTIONS',
    },
  },
  {
    path: 'chw-reco-activity',
    component: ChwRecoMonthlyActivityComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'reports/chw-reco-activity',
      title: "RAPPORT MENSUEL D'ACTIVITÉ",
    },
  },
  {
    path: 'household-recap',
    component: HouseholdRecapComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'reports/household-recap',
      title: 'TABLEAU RECAPITULATIF DES MENAGES',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportsRoutingModule { }
