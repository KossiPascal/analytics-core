import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { UsersRolesRoutingModule } from './users-roles-routing.module';
import { UsersRolesViewComponent } from './users-roles-view.component';
import { SharedModule } from '@kossi-src/app/shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { RolesComponent } from './users-roles/roles/roles.component';
import { UsersComponent } from './users-roles/users/users.component';

@NgModule({
  declarations: [
    UsersRolesViewComponent,
    UsersComponent,
    RolesComponent,

  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UsersRolesRoutingModule,
    SharedModule,
    HttpClientModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],

})
export class UsersRolesModule { }
