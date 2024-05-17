import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthsRoutingModule } from './auths-routing.module';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { DeleteCouchdbDataComponent } from '@kossi-modules/admin/delete_couchdb_data/delete_couchdb_data.component';



@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    DeleteCouchdbDataComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthsRoutingModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

})
export class AuthsModule { }
