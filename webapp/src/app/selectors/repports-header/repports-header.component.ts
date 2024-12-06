import { Component, Input, Output, EventEmitter, Attribute, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ReportsHealth } from '@kossi-models/selectors';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';

@Component({
  selector: 'repports-header-selector',
  templateUrl: './repports-header.component.html',
  styleUrls: ['./repports-header.component.css'],
})
export class RepportsHeaderSelectorComponent {

  @Attribute('id') id: any;
  @Input() REPPORTS_HEADER!: ReportsHealth;
  @Input() ORG_UNIT!: { id: string, external_id: string, name: string };

  @Input() ALL_NEEDED_RECOS!: string[];
  @Input() SELECTED_RECOS!: string[];

  @Output() onValidateData: EventEmitter<any> = new EventEmitter();
  @Output() onCancelDataValidated: EventEmitter<any> = new EventEmitter();
  @Output() onSendDataToDhis2 = new EventEmitter<FormGroup>();

  WHITE_SPACE: string = '&nbsp;'.repeat(5);

  _sendToDhis2Form!: FormGroup;

  constructor(private userCtx: UserContextService, private snackbar: SnackbarService) {
    this._sendToDhis2Form = this.CreateFormGroup();
  }

  CreateFormGroup(): FormGroup {
    return new FormGroup({
      dhis2_username: new FormControl('', [Validators.required]),
      dhis2_password: new FormControl('', [Validators.required])
    });
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

  async sendDataToDhis2(event: Event) {
    event.preventDefault();
    if (this.onSendDataToDhis2 && this.ORG_UNIT) {
      this._sendToDhis2Form.value['dhis2_orgunit_uid'] = this.ORG_UNIT.external_id;
      this._sendToDhis2Form.value['dhis2_orgunit_name'] = this.ORG_UNIT.name;
      this.onSendDataToDhis2.emit(this._sendToDhis2Form);
    }
  }

  openSendDataToDhis2Modal(){
    if(this.ALL_NEEDED_RECOS.length != this.SELECTED_RECOS.length) {
      this.REPPORTS_HEADER.SHOW_DHIS2_MODAL = false;
      this.snackbar.show('Pour envoyer les données au DHIS2, il faut selectionner tous RECO', { backgroundColor: 'warning', position: 'TOP' });
    } else {
      this.REPPORTS_HEADER.SHOW_DHIS2_MODAL = true;
    }
  }

  closeSendDataToDhis2Modal(){
    this.REPPORTS_HEADER.SHOW_DHIS2_MODAL = false;
  }

  CanValidateReportData():boolean{
    return this.userCtx.canValidateReportData();
  }

  CanSendValidatedReportToDhis2():boolean{
    return this.userCtx.canSendValidatedReportToDhis2();
  }





}
