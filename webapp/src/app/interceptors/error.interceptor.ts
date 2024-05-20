import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '@kossi-app/services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private auth: AuthService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const error = next.handle(request).pipe(catchError((err: any) => {
            if ([401, 403].indexOf(err.status) !== -1) {
                this.auth.logout();
            }
            if (err.status === 504) {
                console.error('Gateway Timeout Error:', err);
                return of(null); // Return an observable that emits nothing
            }
            const error = err?.message || err.statusText;
            return throwError(error);
        }));
       return error as Observable<HttpEvent<any>>
    }
}
