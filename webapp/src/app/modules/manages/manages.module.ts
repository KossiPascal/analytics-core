import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ManagesRoutingModule } from './manages-routing.module';
import { SyncToDhis2Component } from './sync-to-dhis2/sync-to-dhis2.component';
import { SyncCalculateAllDataComponent } from './sync-calculate-all-data/sync-calculate-all-data.component';

@NgModule({
  declarations: [
    SyncToDhis2Component,
    SyncCalculateAllDataComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ManagesRoutingModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

})
export class ManagesModule { }
