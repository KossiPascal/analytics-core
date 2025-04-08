import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export const FETCH_DASHBOARDS = new InjectionToken<
  (formData: any, isOnline: boolean) => Observable<any[]>
>('FETCH_DASHBOARDS');


