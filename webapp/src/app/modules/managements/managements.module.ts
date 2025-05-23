import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ManagementsRoutingModule } from './managements-routing.module';
import { ManagementsComponent } from './managements.component';

@NgModule({
  declarations: [
    ManagementsComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ManagementsRoutingModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

})
export class ManagementsModule { }
