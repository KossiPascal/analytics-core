import { CUSTOM_ELEMENTS_SCHEMA, NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from './w_shared/shared.module';
import { TopNavigationComponent } from './components/top-navigation/top-nav.component';
import { SideNavigationComponent } from './components/side-navigation/side-nav.component';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { JwtInterceptor } from './interceptors/jwt.interceptor';
import { TokenInterceptor } from './interceptors/token.interceptor';
import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MatDateFormats, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ModalLayoutComponent } from './components/modal-layout/modal-layout.component';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { StoreModule } from '@ngrx/store';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  TranslateModule,
  TranslateLoader,
  MissingTranslationHandler,
  MissingTranslationHandlerParams,
  TranslateCompiler,
} from '@ngx-translate/core';
import { TranslateMessageFormatCompilerProvider } from './providers/translate-messageformat-compiler.provider';
import { ConstanteService } from './services/constantes.service';
import { LogoutConfirmComponent } from './modals/logout/logout-confirm.component';
import { ReloadingComponent } from './modals/reloading/reloading.component';
import { SessionExpiredComponent } from '@kossi-modals/session-expired/session-expired.component';
import { SnackbarComponent } from '@kossi-components/snackbar/snackbar.component';
import { SpinnerComponent } from '@kossi-components/spinner/spinner-component';
import { LoaderComponent } from '@kossi-components/loader/loader-component';
import { MobileDetectionComponent } from '@kossi-components/mobile-detection/mobile-detection.component';
import { SyncForOfflineConfirmComponent } from '@kossi-modals/sync-for-offline/sync-for-offline.component';
import { FixModalLayoutComponent } from '@kossi-components/fix-modal-layout/fix-modal-layout.component';
import { RolesCrudComponent } from '@kossi-modals/roles-crud/roles-crud.component';
import { DeleteRemoveConfirmComponent } from '@kossi-modals/delete-remove/delete-remove-confirm.component';

MAT_MOMENT_DATE_FORMATS.parse = {
  dateInput: { month: 'short', year: 'numeric', day: 'numeric', date: 'long' },
}

MAT_MOMENT_DATE_FORMATS.display.dateInput = 'short';
MAT_MOMENT_DATE_FORMATS.display.dateA11yLabel = 'long';
MAT_MOMENT_DATE_FORMATS.display.monthYearA11yLabel = 'long';

export const APP_DATE_FORMATS: MatDateFormats = MAT_MOMENT_DATE_FORMATS;

export class MissingTranslationHandlerLog implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams) {
    return params.key;
  }
}
export function HttpLoaderFactory(httpClient: HttpClient, cst:ConstanteService) {
  return new TranslateHttpLoader(
    httpClient,
    // constante.backenUrl()+'/assets/i18n/',
    '-lang.json'
  );
}

@NgModule({
  declarations: [
    AppComponent,
    TopNavigationComponent,
    SideNavigationComponent,
    ModalLayoutComponent,
    FixModalLayoutComponent,
    LogoutConfirmComponent,
    ReloadingComponent,
    SessionExpiredComponent,
    SnackbarComponent,
    SpinnerComponent,
    LoaderComponent,
    MobileDetectionComponent,
    SyncForOfflineConfirmComponent,
    RolesCrudComponent,
    DeleteRemoveConfirmComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    SharedModule,
    MatSnackBarModule,
    ModalModule.forRoot(),
    StoreModule.forRoot({}),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:3'
    }),


    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: MissingTranslationHandlerLog
      },
      compiler: {
        provide: TranslateCompiler,
        useClass: TranslateMessageFormatCompilerProvider,
      },
    }),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
