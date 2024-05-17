// web-socket.service.ts

import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { ModalService } from './modal.service';
import { ReloadingComponent } from '../modals/reloading/reloading.component';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  // private socket: WebSocketSubject<any>;



  constructor(private mService:ModalService) {
    // this.socket = webSocket('ws://localhost:8000');
    // this.socket.subscribe(
    //   (msg) => {
    //     if ('type' in msg) {
    //       if (msg.type == 'reload') {
    //         this.mService.open({ component: ReloadingComponent })
    //       }
    //     }
    //   },
    //   // Called when connection fails (either from server side or client side)
    //   err => console.error(err),
    //   // Called when connection is closed (for whatever reason)
    //   () => console.log('complete')
    // );
  }


  sendReloadMessage() {
    // this.socket.next('reload');
  }
}
