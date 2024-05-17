import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ResponsiveService {
  private mobile!:boolean;

  set setMobile(isMobile:boolean) {
    this.mobile = isMobile;
  }

  get isMobile() {
    return this.mobile;
  }
}
