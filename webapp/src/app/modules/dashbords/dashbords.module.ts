import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DashboardsRoutingModule } from './dashbords-routing.module';
import { RecoMegDashboardComponent } from './reco-meg-stock/reco-meg-stock.component';
import { SharedModule } from '@kossi-src/app/w_shared/shared.module';
import { RecoPerformanceDashboardComponent } from './reco-performance/reco-performance.component';
import { RecoVaccinationDashboardComponent } from './reco-vaccination/reco-vaccination.component';
import { DashbordsOrgunitSelectorComponent } from '@kossi-selectors/dashbords-orgunit/dashbords-orgunit.component';

@NgModule({
  declarations: [
    RecoPerformanceDashboardComponent,
    RecoVaccinationDashboardComponent,
    RecoMegDashboardComponent,
    DashbordsOrgunitSelectorComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DashboardsRoutingModule,
    SharedModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class DashboardsModule { }

