import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ErrorsRoutingModule } from './errors-routing.module';
import { Error404Component } from './404/404.component';
import { Error500Component } from './500/500.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

@NgModule({
  declarations: [
    Error404Component,
    Error500Component,
    UnauthorizedComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ErrorsRoutingModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

})
export class ErrorsModule { }
