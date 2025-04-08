import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ReportsRoutingModule } from './reports-routing.module';
import { ChwRecoMonthlyActivityReportComponent } from '@kossi-modules/reports-view/reports/chw-reco-activity/chw-reco-activity.component';
import { FamilyPlanningReportComponent } from '@kossi-modules/reports-view/reports/family-planning/family-planning.component';
import { MorbidityReportComponent } from '@kossi-modules/reports-view/reports/morbidity/morbidity.component';
import { PcimneReportComponent } from '@kossi-modules/reports-view/reports/pcimne/pcimne.component';
import { PromotionReportComponent } from '@kossi-modules/reports-view/reports/promotion/promotion.component';
import { HouseholdRecapReportComponent } from '@kossi-modules/reports-view/reports/household-recap/household-recap.component';
import { RecoMegSituationReportComponent } from '@kossi-modules/reports-view/reports/reco-meg-situation/reco-meg-situation.component';
import { ReportsOrgunitsFilterComponent } from '@kossi-components/orgunits-filter/reports-orgunits-filter/reports-orgunits-filter.component';
import { ReportsViewComponent } from './reports-view.component';
import { GoogleLoaderComponent } from '@kossi-components/loading/google-loader/google-loader.component';
import { SharedModule } from '@kossi-src/app/shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { ReportsPaginationTableComponent } from '@kossi-components/pagination-table/reports-pagination/reports-pagination-table.component';
import { RepportsHeaderSelectorComponent } from '@kossi-components/base-header/repports-header/repports-header.component';

@NgModule({
  declarations: [
    ReportsViewComponent,
    ReportsOrgunitsFilterComponent,
    ChwRecoMonthlyActivityReportComponent,
    FamilyPlanningReportComponent,
    MorbidityReportComponent,
    PcimneReportComponent,
    PromotionReportComponent,
    HouseholdRecapReportComponent,
    RecoMegSituationReportComponent,
    RepportsHeaderSelectorComponent,
    ReportsPaginationTableComponent,
    // SampleLoaderComponent,
    // GraduationLoaderComponent,
    // SnakeLoaderComponent,
    GoogleLoaderComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ReportsRoutingModule,
    SharedModule,
    HttpClientModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],

})
export class ReportsModule { }
