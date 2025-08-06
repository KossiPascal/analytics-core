import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ManagementsRoutingModule } from './managements-routing.module';
import { ManagementsComponent } from './managements.component';
import { RebuildSqlViewsComponent } from './managements/rebuild-sql-views/rebuild-sql-views.component';

@NgModule({
  declarations: [
    ManagementsComponent,
    RebuildSqlViewsComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ManagementsRoutingModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

})
export class ManagementsModule { }
