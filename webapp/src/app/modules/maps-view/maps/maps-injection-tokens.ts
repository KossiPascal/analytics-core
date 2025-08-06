import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export const MAPS_UTILS = new InjectionToken<(map:any) => void>('MAPS_UTILS');

export const FETCH_MAPS = new InjectionToken<(formData: any, isOnline: boolean) => Observable<any[]>>('FETCH_MAPS');

export const ON_MAPS_INIT = new InjectionToken<() => Promise<void>>('ON_MAPS_INIT');

export const AFTER_FETCHED_MAPS = new InjectionToken<(data:any) => Promise<void>>('AFTER_FETCHED_MAPS');


