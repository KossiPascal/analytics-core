import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthsRoutingModule } from './auths-routing.module';
import { LoginComponent } from './login/login.component';
import { ChangeDefaultPasswordComponent } from './change-default-password/change-default-password.component';



@NgModule({
  declarations: [
    LoginComponent,
    ChangeDefaultPasswordComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthsRoutingModule
  ],
schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],

})
export class AuthsModule { }
