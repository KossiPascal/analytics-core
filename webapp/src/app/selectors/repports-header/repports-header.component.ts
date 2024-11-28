import { Component, Input, Output, EventEmitter, Attribute, AfterViewInit } from '@angular/core';
import { ReportsHealth } from '@kossi-models/selectors';

@Component({
  selector: 'repports-header-selector',
  templateUrl: './repports-header.component.html',
  styleUrls: ['./repports-header.component.css'],
})
export class RepportsHeaderSelectorComponent {
  @Attribute('id') id: any;
  @Input() REPPORTS_HEADER!: ReportsHealth;

  @Output() onValidateData: EventEmitter<any> = new EventEmitter();
  @Output() onCancelDataValidated: EventEmitter<any> = new EventEmitter();
  @Output() onSendDataToDhis2: EventEmitter<any> = new EventEmitter();

  WHITE_SPACE: string = '&nbsp;'.repeat(5);

  constructor() {}

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
    if (this.onSendDataToDhis2) {
      this.onSendDataToDhis2.emit();
    }
  }

}
