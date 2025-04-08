import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { PublicsRoutingModule } from './publics-view-routing.module';
import { KendeyaGuideFormationComponent } from './publics/kendeya-guide-formation/kendeya-guide-formation.component';
import { KendeyaRecoGuideFormationComponent } from './publics/kendeya-reco-guide-formation/kendeya-reco-guide-formation.component';
import { DocumentationComponent } from './publics/documentations/documentation.component';
import { PublicsViewComponent } from './publics-view.component';
import { ApksDownloadComponent } from './publics/apks-download/apks-download.component';

@NgModule({
  declarations: [
    PublicsViewComponent,
    DocumentationComponent,
    KendeyaGuideFormationComponent,
    KendeyaRecoGuideFormationComponent,
    ApksDownloadComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PublicsRoutingModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

})
export class PublicsModule { }
