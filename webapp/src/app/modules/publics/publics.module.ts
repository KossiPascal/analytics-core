import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { PublicsRoutingModule } from './publics-routing.module';
import { KendeyaGuideFormationComponent } from './kendeya-guide-formation/kendeya-guide-formation.component';

@NgModule({
  declarations: [
    KendeyaGuideFormationComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PublicsRoutingModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

})
export class PublicsModule { }