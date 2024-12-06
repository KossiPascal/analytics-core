// import { Attribute, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
// import { FormControl, FormGroup, Validators } from '@angular/forms';
// import { AuthService } from '@kossi-src/app/services/auth.service';

// @Component({
//   selector: 'send-to-dhis2-modal',
//   templateUrl: './send-to-dhis2.component.html'
// })
// export class SendToDhis2ModalComponent implements OnInit{

//   _formGroup!: FormGroup;

//   constructor(private auth: AuthService) { }

//   @Attribute('id') id: any;
//   @Input() ORG_UNIT!: any;

//   @Output() onSendDataToDhis2: EventEmitter<any> = new EventEmitter();

//   WHITE_SPACE: string = '&nbsp;'.repeat(5);

//   ngOnInit(): void {
//     this._formGroup = this.CreateFormGroup();
//   }

//   CreateFormGroup(): FormGroup {
//     return new FormGroup({
//       dhis2_orgunit: new FormControl('', [Validators.required]),
//       dhis2_username: new FormControl('', [Validators.required]),
//       dhis2_password: new FormControl('', [Validators.required])
//     });
//   }

//   async sendToDhis2(event: Event) {
//     event.preventDefault();
//     if (this.onSendDataToDhis2) {
//       this.onSendDataToDhis2.emit();
//     }
//   }

//   close() {
//   }


// }
