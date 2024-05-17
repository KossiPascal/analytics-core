import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeHtmlPipe } from 'src/app/pipes/safe-html.pipe';
import { BootstrapTranslatePipe } from '../pipes/bootstrap-translate.pipe';
import { LocalizeNumberPipe } from '../pipes/number.pipe';
import { PhonePipe } from '../pipes/phone.pipe';



@NgModule({
  declarations: [
    SafeHtmlPipe,
    BootstrapTranslatePipe,
    LocalizeNumberPipe,
    PhonePipe,
  ],
  imports: [
    CommonModule
  ],
  exports: [
    SafeHtmlPipe,
    BootstrapTranslatePipe,
    LocalizeNumberPipe,
    PhonePipe,
  ]
})
export class SharedModule { }
