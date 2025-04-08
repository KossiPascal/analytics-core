import { Component, Input, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ReportsFilterData, ReportsHealth } from '@kossi-models/reports-selectors';
import { FormGroupService } from '@kossi-services/form-group.service';
import { ModalService } from '@kossi-services/modal.service';
import { notNull, toArray } from '@kossi-shared/functions';
import { Subject, takeUntil } from 'rxjs';

@Component({
  standalone: false,
  selector: 'send-dhis2-modal',
  templateUrl: './send-dhis2-modal.component.html'
})
export class SendDhis2ModalComponent implements OnDestroy {


  dhis2Form!: FormGroup<any>;

  @Input() REPPORT_NAME!: string;


  REPORTS_HEADER: ReportsHealth = {
    ON_FETCHING: {},
    IS_VALIDATED: {},
    IS_ON_DHIS2: {},
    ON_VALIDATION: {},
    ON_CANCEL_VALIDATION: {},
    ON_DHIS2_SENDING: {},
    ON_DHIS2_SENDING_ERROR: {},
  };
  
    REPORTS_FILTER: ReportsFilterData = {
      RECOS_NEEDED: [],
      RECOS_SELECTED: [],
      SEND_DHIS2_ORGUNITS: [],
    };

  ON_DHIS2_SENDING!: boolean;

  ON_DHIS2_SENDING_ERROR: any;

  private destroy$ = new Subject<void>();

  // constructor(private userCtx: UserContextService, private snackbar: SnackbarService, private fGroup: FormGroupService) {

  constructor(private mService: ModalService, private fGroup: FormGroupService) {
    this.fGroup.REPORTS_HEADER$.pipe(takeUntil(this.destroy$)).subscribe(dataSaved => {
      if (dataSaved) {
        Object.entries(this.REPORTS_HEADER).forEach(([key, value]) => {
          (this.REPORTS_HEADER as any)[key] = dataSaved[key] ?? (Array.isArray(value) ? [] : {});
        });
      }
    });

    this.fGroup.REPORTS_FILTER$.pipe(takeUntil(this.destroy$)).subscribe(dataSaved => {
      if (dataSaved) {
        Object.keys(this.REPORTS_FILTER).forEach(key => {
          (this.REPORTS_FILTER as any)[key] = dataSaved[key] ?? [];
        });
      }
    });
    this.dhis2Form = this.CreateFormGroup();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  CreateFormGroup(): FormGroup {
    return new FormGroup({
      dhis2_orgunits: new FormControl([], [Validators.required]),
      dhis2_username: new FormControl('', [Validators.required]),
      dhis2_password: new FormControl('', [Validators.required])
    });
  }

  selectedOrgUnitsLength() {
    const value = this.dhis2Form.value.dhis2_orgunits;
    return notNull(value) ? value.length : 0;
  }

  isAllOrgUnitsChecked() {
    const value = this.dhis2Form.value.dhis2_orgunits;
    return notNull(value) && value.length > 0 && value.length === this.ORG_UNIT.length;
  }

  selectAllOrgUnits(event: Event) {
    const checkbox = document.getElementById('all-dhis2_orgunits') as HTMLInputElement;
    if (checkbox) {
      const field = 'dhis2_orgunits';
      const values = checkbox.checked ? this.ORG_UNIT.map(r => r.id) : []

      if (!this.dhis2Form.controls[field]) {
        this.dhis2Form.addControl(field, new FormControl([]));
      }
      this.dhis2Form.controls[field].setValue(Array.isArray(values) ? values : [values]);
    }
  }

  sendDataToDhis2(event?: Event) {
    if (event) event.preventDefault();
    const ORG_UNIT = this.ORG_UNIT.filter(r => r.id && toArray(this.dhis2Form.value.dhis2_orgunits).includes(r.id))
    this.dhis2Form.value.dhis2_orgunits = ORG_UNIT;
    this.mService.close({ dhis2Form: this.dhis2Form, submited: true });
  }


  close() {
    this.mService.close();
  }

  get ORG_UNIT() {
    return this.REPORTS_FILTER.SEND_DHIS2_ORGUNITS;
  }

}
