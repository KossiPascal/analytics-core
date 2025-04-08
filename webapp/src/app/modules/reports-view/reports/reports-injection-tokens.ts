import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export const FETCH_REPORTS = new InjectionToken<
  (formData: any, isOnline: boolean) => Observable<any[]>
>('FETCH_REPORTS');

export const VALIDATE_REPORT = new InjectionToken<
  (formData: any) => Observable<any>
>('VALIDATE_REPORT');

export const CANCEL_VALIDATION_REPORT = new InjectionToken<
  (formData: any) => Observable<any>
>('CANCEL_VALIDATION_REPORT');

export const SEND_REPORT_TO_DHIS2 = new InjectionToken<
  (formData: any) => Observable<any>
>('SEND_REPORT_TO_DHIS2');



