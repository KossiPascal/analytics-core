import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DashboardsRoutingModule } from './dashboards-routing.module';
import { GraduationLoaderComponent } from '@kossi-components/loading/graduation-loader/graduation-loader.component';
import { SharedModule } from '@kossi-src/app/shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { RecoPerformanceDashboardComponent } from '@kossi-modules/dashboards-view/monthly/dashbords/reco-performance/reco-performance.component';
import { DashboardsPaginationTableComponent } from '@kossi-components/pagination-table/dashboards-pagination/dashboards-pagination-table.component';
import { RecoVaccinationAllDoneDashboardComponent } from './realtime/dashbords/reco-vaccination/reco-vaccination-all-done.component';
import { RecoVaccinationNotDoneDashboardComponent } from './realtime/dashbords/reco-vaccination/reco-vaccination-not-done.component';
import { RecoVaccinationPartialDoneDashboardComponent } from './realtime/dashbords/reco-vaccination/reco-vaccination-partial-done.component';
import { DashboardsHeaderSelectorComponent } from '@kossi-components/base-header/dashboards-header/dashboards-header.component';
import { RecoTasksStateComponent } from './monthly/dashbords/reco-tasks-state/reco-tasks-state.component';
import { DashboardsOrgunitsRealtimeFilterComponent } from '@kossi-components/orgunits-filter/component/dashboards-orgunits-realtime-filter.component';
import { DashboardsOrgunitsMonthlyFilterComponent } from '@kossi-components/orgunits-filter/component/dashboards-orgunits-monthly-filter.component';
import { DashboardsMonthlyViewComponent } from './monthly/dashboards-monthly-view.component';
import { DashboardsRealtimeViewComponent } from './realtime/dashboards-realtime-view.component';
import { RecoActiveComponent } from './monthly/dashbords/reco-active/reco-active.component';


@NgModule({
  declarations: [
    GraduationLoaderComponent,
    DashboardsPaginationTableComponent,
    DashboardsHeaderSelectorComponent,

    DashboardsOrgunitsMonthlyFilterComponent,
    DashboardsMonthlyViewComponent,
    RecoPerformanceDashboardComponent,
    RecoTasksStateComponent,
    RecoActiveComponent,

    DashboardsOrgunitsRealtimeFilterComponent,
    DashboardsRealtimeViewComponent,
    RecoVaccinationPartialDoneDashboardComponent,
    RecoVaccinationAllDoneDashboardComponent,
    RecoVaccinationNotDoneDashboardComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DashboardsRoutingModule,
    SharedModule,
    HttpClientModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],

})
export class DashboardsModule { }
