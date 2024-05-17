import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ReportsRoutingModule } from './reports-routing.module';
import { ChwRecoMonthlyActivityComponent } from './chw-reco-activity/chw-reco-activity.component';
import { FamilyPlanningComponent } from './family-planning/family-planning.component';
import { MorbidityComponent } from './morbidity/morbidity.component';
import { PcimeComponent } from './pcime/pcime.component';
import { PromotionComponent } from './promotion/promotion.component';
import { HouseholdRecapComponent } from './household-recap/household-recap.component';

@NgModule({
  declarations: [
    ChwRecoMonthlyActivityComponent,
    HouseholdRecapComponent,
    FamilyPlanningComponent,
    MorbidityComponent,
    PcimeComponent,
    PromotionComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ReportsRoutingModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

})
export class ReportsModule { }
