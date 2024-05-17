import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConstanteService } from '../services/constantes.service';
import { UserContextService } from '@kossi-services/user-context.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private userCtx: UserContextService, private cst: ConstanteService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = this.userCtx.token;
        if (token) {
            if (request.url.startsWith(this.cst.backenUrl())) {
                request = request.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }
        }

        return next.handle(request);
    }
}
