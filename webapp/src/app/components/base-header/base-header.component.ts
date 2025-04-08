import { Component, Input, Output, EventEmitter, Attribute, ChangeDetectionStrategy, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ReportsFilterData, ReportsHealth } from '@kossi-models/reports-selectors';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { FormGroupService } from '@kossi-services/form-group.service';
import { Subject, takeUntil } from 'rxjs';
import { ModalService } from '@kossi-services/modal.service';
import { SendDhis2ModalComponent } from '@kossi-modals/send-dhis2-modal/send-dhis2-modal.component';
import { ExportDataComponent } from '@kossi-components/export-data/export-data.component';
import { ConstanteService } from '@kossi-services/constantes.service';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { User } from '@kossi-models/user-role';

@Component({
  standalone: false,
  selector: 'base-header-selector',
  template: ``,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BAseHeaderSelectorComponent<T> extends ExportDataComponent<any> implements OnChanges, OnDestroy {

  private stateChange!: any;
  @Input() CHANGE_STATE: any;
  private destroy$ = new Subject<void>();

  USER!:User|null

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

  @Attribute('id') id: any;
  @Input() REPPORT_NAME!: string;
  @Input() HIDE_ZERO_ID!: string;
  @Input() override TABLE_ID!: string;
  @Input() SHOW_EXPORT_TABLE_BTN: boolean = true;

  override title: string = "Rapport des Données Filtrées";
  override logoUrl: string = '';

  @Output() onValidateData: EventEmitter<any> = new EventEmitter();
  @Output() onCancelDataValidated: EventEmitter<any> = new EventEmitter();
  @Output() onSendDataToDhis2 = new EventEmitter<FormGroup>();
  @Output() onHideZero = new EventEmitter<string>();


  constructor(
    protected mService: ModalService, 
    protected cst: ConstanteService,
    userCtx: UserContextService, 
    snackbar: SnackbarService, 
    fGroup: FormGroupService,
    conn: ConnectivityService
  ) {
    super(
      fGroup,
      conn,
      snackbar,
      userCtx,
    );
    this.initializeComponent();
    
    this.logoUrl = this.cst.APP_LOGO;
    
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
  }

  private async initializeComponent() {
    this.USER = await this.userCtx.currentUser();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['CHANGE_STATE']) {
      this.stateChange = changes['CHANGE_STATE'].currentValue;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async hideZero(event: Event) {
    event.preventDefault();
    if (this.onHideZero) {
      this.onHideZero.emit(this.HIDE_ZERO_ID);
    }
  }

  async validateData(event: Event) {
    event.preventDefault();
    if (this.onValidateData) {
      this.onValidateData.emit();
    }
  }

  async cancelValidation(event: Event) {
    event.preventDefault();
    if (this.onCancelDataValidated) {
      this.onCancelDataValidated.emit();
    }
  }

  async sendDataToDhis2(sendToDhis2Form: FormGroup | undefined) {
    if (this.onSendDataToDhis2 && sendToDhis2Form) {
      this.onSendDataToDhis2.emit(sendToDhis2Form);
    }
  }

  openSendDataToDhis2Modal() {
    const RECOS_NEEDED = this.REPORTS_FILTER.RECOS_NEEDED ?? 0;
    const RECOS_SELECTED = this.REPORTS_FILTER.RECOS_SELECTED ?? 0;
    if (RECOS_SELECTED.length > 0 && RECOS_NEEDED.length != RECOS_SELECTED.length) {
      this.snackbar.show({ msg: 'Pour envoyer les données au DHIS2, il faut selectionner tous RECO', color: 'warning', position: 'TOP' });
    } else {
      if (this.ORG_UNIT) {
        this.mService.open(SendDhis2ModalComponent, { data: { REPPORT_NAME: this.REPPORT_NAME } }).subscribe((result?: { dhis2Form?: FormGroup, submited?: boolean }) => {
          if (result && result.submited) {
            // console.log("Données reçues depuis la modal :", result);
            if (result.dhis2Form) {
              this.sendDataToDhis2(result.dhis2Form);
            } else {
              this.snackbar.show({ msg: 'DHIS2_ORGUNIT est vide, impossible d\'envoyer les données', color: 'warning', position: 'TOP' });
            }
          }
        });
      }
    }
  }

  SET_REPORTS_HEADER() {
    this.fGroup.SET_REPORTS_HEADER(this.REPORTS_HEADER);
    this.CHANGE_STATE = new Date();
  }


  get ORG_UNIT() {
    return this.REPORTS_FILTER.SEND_DHIS2_ORGUNITS;
  }

  get IS_ON_DHIS2(): boolean {
    const dt = this.REPORTS_HEADER?.IS_ON_DHIS2 as any;
    return dt && dt[this.REPPORT_NAME] == true;
  }

  get IS_VALIDATED() {
    const dt = this.REPORTS_HEADER?.IS_VALIDATED as any;
    return dt && dt[this.REPPORT_NAME] == true;
  }

  get ON_DHIS2_SENDING() {
    const dt = this.REPORTS_HEADER?.ON_DHIS2_SENDING as any;
    return dt && dt[this.REPPORT_NAME] == true;
  }

  get ON_VALIDATION() {
    const dt = this.REPORTS_HEADER?.ON_VALIDATION as any;
    return dt && dt[this.REPPORT_NAME] == true;
  }

  get ON_CANCEL_VALIDATION() {
    const dt = this.REPORTS_HEADER?.ON_CANCEL_VALIDATION as any;
    return dt && dt[this.REPPORT_NAME] == true;
  }

}
