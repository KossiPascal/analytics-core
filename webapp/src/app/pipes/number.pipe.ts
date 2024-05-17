import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { isNumber, isString } from 'lodash-es';

@Pipe({
  name: 'localizeNumber'
})
@Injectable({
  providedIn: 'root'
})
export class LocalizeNumberPipe implements PipeTransform {
  constructor(
  ) {
  }

  transform(value: any) {
    if (!isNumber(value) && !isString(value)) {
      return value;
    }
    return parseInt(`${value}`);
  }
}
