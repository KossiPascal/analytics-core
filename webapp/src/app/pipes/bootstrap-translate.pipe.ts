import { Injectable, Pipe, PipeTransform } from '@angular/core';

const bootstrapTranslator = require('../../assets/js/translator');

@Pipe({
  name: 'bootstrapTranslate'
})
@Injectable({
  providedIn: 'root'
})
export class BootstrapTranslatePipe implements PipeTransform {

  constructor() { }

  transform(key:string, args?:Record<string, any>) {
    return bootstrapTranslator.translate(key, args);
  }
}
