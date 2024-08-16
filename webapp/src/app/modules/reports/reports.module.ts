import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ReportsRoutingModule } from './reports-routing.module';
import { ChwRecoMonthlyActivityComponent } from './chw-reco-activity/chw-reco-activity.component';
import { FamilyPlanningComponent } from './family-planning/family-planning.component';
import { MorbidityComponent } from './morbidity/morbidity.component';
import { PcimeComponent } from './pcime/pcime.component';
import { PromotionComponent } from './promotion/promotion.component';
import { HouseholdRecapComponent } from './household-recap/household-recap.component';
import { SharedModule } from '@kossi-src/app/w_shared/shared.module';
import { RepportsOrgunitSelectorComponent } from '@kossi-selectors/repports-orgunit/repports-orgunit.component';
import { RepportsHeaderSelectorComponent } from '@kossi-selectors/repports-header/repports-header.component';
import { RecoMegSituationComponent } from './reco-meg-situation/reco-meg-situationcomponent';

@NgModule({
  declarations: [
    ChwRecoMonthlyActivityComponent,
    HouseholdRecapComponent,
    FamilyPlanningComponent,
    MorbidityComponent,
    PcimeComponent,
    PromotionComponent,
    RepportsOrgunitSelectorComponent,
    RepportsHeaderSelectorComponent,
    RecoMegSituationComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ReportsRoutingModule,
    SharedModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],

})
export class ReportsModule { }
