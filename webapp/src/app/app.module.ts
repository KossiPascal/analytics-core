import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TokenExpiredInterceptor } from './interceptors/token.interceptor';
import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MatDateFormats, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { StoreModule } from '@ngrx/store';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ConstanteService } from './services/constantes.service';
import { NavbarComponent } from '@kossi-components/navbar/navbar.component';
import { FixModalLayoutComponent } from '@kossi-selectors/fix-modal-layout/fix-modal-layout.component';
import { ModalLayoutComponent } from '@kossi-selectors/modal-layout/modal-layout.component';
import { LogoutConfirmComponent } from '@kossi-modals/logout/logout-confirm.component';
import { ReloadingComponent } from '@kossi-modals/reloading/reloading.component';
import { SessionExpiredComponent } from '@kossi-modals/session-expired/session-expired.component';
import { SyncForOfflineConfirmComponent } from '@kossi-modals/sync-for-offline/sync-for-offline.component';
import { DeviceDetectionComponent } from '@kossi-selectors/device-detection/device-detection.component';
import { SnackbarComponent } from '@kossi-selectors/snackbar/snackbar.component';
import { SharedModule } from '@kossi-src/app/shared/shared.module';
import { SendDhis2ModalComponent } from '@kossi-modals/send-dhis2-modal/send-dhis2-modal.component';
import { SpinnerComponent } from '@kossi-components/spinner/spinner-component';
import { ModalService } from '@kossi-services/modal.service';
import { CreateUpdateDeleteShowUserComponent } from '@kossi-modules/users-roles-view/users-roles/users/create-update-delete-show/create-update-delete-show.component';
import { CreateUpdateDeleteShowRoleComponent } from '@kossi-modules/users-roles-view/users-roles/roles/create-update-delete/create-update-delete.component';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { CanvasJSAngularStockChartsModule } from '@canvasjs/angular-stockcharts';
import { LocalSyncIndicatorComponent } from '@kossi-components/sync-indicator/sync-indicator.component';
import { SmsComponent } from '@kossi-modals/sms/sms.component';
import { UserProfileComponent } from '@kossi-modals/user-profile/user-profile.component';
// import {
//   TranslateModule,
//   TranslateLoader,
//   MissingTranslationHandler,
//   MissingTranslationHandlerParams,
//   TranslateCompiler,
// } from '@ngx-translate/core';
// import { environment } from '@kossi-environments/environment';

MAT_MOMENT_DATE_FORMATS.parse = {
  dateInput: { month: 'short', year: 'numeric', day: 'numeric', date: 'long' },
}

MAT_MOMENT_DATE_FORMATS.display.dateInput = 'short';
MAT_MOMENT_DATE_FORMATS.display.dateA11yLabel = 'long';
MAT_MOMENT_DATE_FORMATS.display.monthYearA11yLabel = 'long';

export const APP_DATE_FORMATS: MatDateFormats = MAT_MOMENT_DATE_FORMATS;

export function HttpLoaderFactory(httpClient: HttpClient, cst:ConstanteService) {
  return new TranslateHttpLoader(
    httpClient,
    cst.backenUrl()+'/assets/i18n/',
    '-lang.json'
  );
}

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    ModalLayoutComponent,
    FixModalLayoutComponent,
    LogoutConfirmComponent,
    ReloadingComponent,
    SessionExpiredComponent,
    SnackbarComponent,
    DeviceDetectionComponent,
    SyncForOfflineConfirmComponent,
    SendDhis2ModalComponent,
    SpinnerComponent,
    LocalSyncIndicatorComponent,
    SmsComponent,
    UserProfileComponent,

    CreateUpdateDeleteShowUserComponent,
    CreateUpdateDeleteShowRoleComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    FormsModule,
    BaseChartDirective,
    MatSnackBarModule,
    SharedModule,
    CanvasJSAngularStockChartsModule,
    ModalModule.forRoot(),
    StoreModule.forRoot({}),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: TokenExpiredInterceptor, multi: true },
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS },
    provideCharts(withDefaultRegisterables()),
    ModalService,
    // provideCharts(withDefaultRegisterables()),
  ],
  bootstrap: [AppComponent]

})
export class AppModule { }
