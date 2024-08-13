import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeHtmlPipe } from 'src/app/pipes/safe-html.pipe';
import { LocalizeNumberPipe } from '../pipes/number.pipe';
import { PhonePipe } from '../pipes/phone.pipe';


@NgModule({
  declarations: [
    SafeHtmlPipe,
    LocalizeNumberPipe,
    PhonePipe,
  ],
  imports: [
    CommonModule
  ],
  exports: [
    SafeHtmlPipe,
    LocalizeNumberPipe,
    PhonePipe,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class SharedModule { }
