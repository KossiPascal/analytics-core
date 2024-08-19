import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthsRoutingModule } from './auths-routing.module';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { DeleteCouchdbDataComponent } from '@kossi-modules/admin/delete_couchdb_data/delete_couchdb_data.component';
import { PublicUtilsComponent } from '@kossi-components/public-utils/public-utils-component';



@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    DeleteCouchdbDataComponent,
    PublicUtilsComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthsRoutingModule
  ],
schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],

})
export class AuthsModule { }
