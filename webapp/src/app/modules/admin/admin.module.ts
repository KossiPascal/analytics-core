import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';
import { UsersComponent } from './users/users.component';
import { RolesComponent } from './roles/roles.component';
import { DatabasesComponent } from './databases/databases.component';
import { SignatureComponent } from './signature/signature.component';
import { PdfGeneratorComponent } from './pdf-generator/pdf-generator.component';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from '@kossi-src/app/w_shared/shared.module';
import { ApiComponent } from './api-list/api-list.component';
import { TruncateDatabaseComponent } from './truncate_database/truncate_database.component';


@NgModule({
  declarations: [
    UsersComponent,
    RolesComponent,
    DatabasesComponent,
    SignatureComponent,
    PdfGeneratorComponent,
    ApiComponent,
    TruncateDatabaseComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AdminRoutingModule,
    FormsModule,
    SharedModule,
    HttpClientModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

})
export class AdminModule { }
