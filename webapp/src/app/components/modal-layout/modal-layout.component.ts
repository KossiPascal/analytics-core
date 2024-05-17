import { Component, Input, HostListener, Output, EventEmitter, Attribute } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'kossi-modal-layout',
  templateUrl: './modal-layout.component.html',
  styleUrls: ['./modal-layout.component.css'],
})
export class ModalLayoutComponent {
  @Attribute('id') id: any;
  @Input() showCloseButton!: boolean;
  @Input() error?: string;
  @Input() processing!: boolean;
  @Input() isFlatButton!: boolean;
  @Input() modalTitle = 'Modal Title';
  @Input() cancelBtnName!: string;
  @Input() submitBtnName!: string;
  @Input() showBottomElements!: boolean;
  @Input() showCancelButton!: boolean;
  @Input() reloadApp!: boolean;
  @Input() hideOnConfirm: boolean = true;

  @Input() modalActionColor: 'danger-back' | 'info-back' | 'warning-back' | 'success-back' | 'light-back' = 'light-back';

  @Output() onSubmit: EventEmitter<any> = new EventEmitter();
  @Output() onCancel: EventEmitter<any> = new EventEmitter();

  errorMsg!:string;

  constructor(public bsModalRef: BsModalRef) { }

  @HostListener('window:keydown.enter')
  onEnterHandler() {
    this.submit();
  }

  cancel() {
    if (this.onCancel) {
      this.processing = true;
      this.onCancel.emit();
      this.processing = false;
    }
    this.bsModalRef.hide();
  }

  async submit() {
    if (this.onSubmit) {
      this.processing = true;
      // Créer une promesse pour attendre la fin de l'événement onSubmit
      const onSubmitPromise = new Promise<void>((resolve, reject) => {
        this.onSubmit.subscribe(() => {
          resolve();
        });
      });

      // Émettre l'événement onSubmit
      this.onSubmit.emit();

      try {
        // Attendre la fin de l'événement onSubmit
        await onSubmitPromise;
        // this.processing = false;
        if (this.hideOnConfirm) {
          this.bsModalRef.hide();
        }
        if (this.reloadApp == true) {
          window.location.reload();
        }
      } catch (error) {
        this.errorMsg = "Erreur lors de l'execution, veuillez réessayer";
        console.error("Erreur lors de l'execution, veuillez réessayer :", error);
        this.processing = false;
      }
    } else {
      this.bsModalRef.hide();
    }
  }
}
