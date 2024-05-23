import { Injectable } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Injectable({
  providedIn: 'root',
})
export class ModalService {

  constructor(private bsModalService: BsModalService) {}

  open({ component, modalClass }: { component: any; modalClass?: 'modal-sm' | 'modal-lg' | 'modal-xl'; }): BsModalRef<any> | undefined {
    // Close any active modal before opening a new one
    const modalCount = this.bsModalService.getModalsCount();
    if (modalCount > 0) {
      // this.bsModalService.hide(modalCount - 1); // Close the last active modal
      // this.bsModalService.hide(); // Hide all active modals
      return;
    }
    return this.bsModalService.show(component, {
      class: modalClass
    });
  }

  openCustom({ component, modalClass }: { component: any; modalClass?: 'modal-sm' | 'modal-lg' | 'modal-xl'; }) {
    return this.bsModalService.show(component, {
      class: modalClass
    });
  }
}
