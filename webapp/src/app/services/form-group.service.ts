import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { ReportsData, ReportsFilterData, ReportsHealth } from '@kossi-models/reports-selectors';
import { DashboardsData, DashboardsHealth } from '@kossi-models/dashboards-selectors';

@Injectable({ providedIn: 'root' })
export class FormGroupService {

  private formGroupSource = new BehaviorSubject<FormGroup<any> | null>(null);
  private dhis2FormGroupSource = new BehaviorSubject<FormGroup<any> | null>(null);

  private REPORTS_DATA = new BehaviorSubject<ReportsData | undefined>(undefined);
  private REPORTS_HEADER = new BehaviorSubject<ReportsHealth | any>({});
  private REPORTS_FILTER = new BehaviorSubject<ReportsFilterData | any>({});


  private DASHBOARDS_DATA = new BehaviorSubject<DashboardsData | undefined>(undefined);
  private DASHBOARDS_HEADER = new BehaviorSubject<DashboardsHealth | any>({});



  formGroup$ = this.formGroupSource.asObservable();
  dhis2FormGroup$ = this.dhis2FormGroupSource.asObservable();

  REPORTS_DATA$ = this.REPORTS_DATA.asObservable();
  REPORTS_HEADER$ = this.REPORTS_HEADER.asObservable();
  REPORTS_FILTER$ = this.REPORTS_FILTER.asObservable();

  DASHBOARDS_DATA$ = this.DASHBOARDS_DATA.asObservable();
  DASHBOARDS_HEADER$ = this.DASHBOARDS_HEADER.asObservable();


  setFormGroup(formGroup: FormGroup<any>) {
    this.formGroupSource.next(formGroup);
  }

  setDhis2FormGroup(dhis2FormGroup: FormGroup<any>) {
    this.dhis2FormGroupSource.next(dhis2FormGroup);
  }

  async SET_REPORTS_DATA(dataToSet: ReportsData | undefined) {
    this.REPORTS_DATA.next(dataToSet);
    return;
  }

  async SET_REPORTS_HEADER(dataToSet: ReportsHealth) {
    this.REPORTS_HEADER.next(dataToSet);
    return;
  }

  async SET_REPORTS_FILTER(dataToSet: ReportsFilterData) {
    this.REPORTS_FILTER.next(dataToSet);
    return;
  }


  async SET_DASHBOARDS_DATA(dataToSet: DashboardsData | undefined) {
    this.DASHBOARDS_DATA.next(dataToSet);
    return;
  }

  async SET_DASHBOARDS_HEADER(dataToSet: DashboardsHealth) {
    this.DASHBOARDS_HEADER.next(dataToSet);
    return;
  }
}
