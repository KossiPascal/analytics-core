import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminViewRoutingModule } from './admin-view-routing.module';
import { DatabasesComponent } from './databases/databases.component';
import { SignatureComponent } from './signature/signature.component';
import { PdfGeneratorComponent } from './pdf-generator/pdf-generator.component';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from '@kossi-src/app/shared/shared.module';
import { ApiComponent } from './api-list/api-list.component';
import { TruncateDatabaseComponent } from './truncate_database/truncate_database.component';
import { DeleteCouchdbDataComponent } from './delete_couchdb_data/delete_couchdb_data.component';
import { AdminViewComponent } from './admin-view.component';


@NgModule({
  declarations: [
    AdminViewComponent,
    ApiComponent,
    DatabasesComponent,
    DeleteCouchdbDataComponent,
    PdfGeneratorComponent,
    SignatureComponent,
    TruncateDatabaseComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AdminViewRoutingModule,
    FormsModule,
    SharedModule,
    HttpClientModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

})
export class AdminViewModule { }
