import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MapsRoutingModule } from './maps-routing.module';
import { SharedModule } from '@kossi-src/app/shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { } from '@kossi-modals/sms/sms.component';
import { RecoMapComponent } from './maps/reco-map/reco-map.component';
import { MapsViewComponent } from './maps-view.component';
import { MapsOrgunitsFilterComponent } from '@kossi-components/orgunits-filter/component/maps-orgunits-filter.component';
import { SnakeLoaderComponent } from '@kossi-components/loading/snake-loader/snake-loader.component';


@NgModule({
  declarations: [
    MapsViewComponent,
    RecoMapComponent,
    MapsOrgunitsFilterComponent,

    // SampleLoaderComponent,
    // GraduationLoaderComponent,
    SnakeLoaderComponent,
    // GoogleLoaderComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MapsRoutingModule,
    SharedModule,
    HttpClientModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],

})
export class MapsModule { }
