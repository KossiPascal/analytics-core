import { AfterViewInit, Component, ElementRef, HostListener } from '@angular/core';

import { ResponsiveService } from '@kossi-services/responsive.service';

@Component({
  template: '<div class="mobile-detection"></div>',
  selector: 'mobile-detection',
})
export class MobileDetectionComponent implements AfterViewInit {
  constructor(
    private elementRef:ElementRef,
    private responsiveService:ResponsiveService,
  ) {
  }

  ngAfterViewInit() {
    this.detectMobileScreenSize();
  }

  @HostListener('window:resize', [])
  private onResize() {
    this.detectMobileScreenSize();
  }

  private detectMobileScreenSize() {
    const element = this.elementRef.nativeElement.querySelector('.mobile-detection');
    const isVisible = window.getComputedStyle(element).display !== 'none';
    this.responsiveService.setMobile = isVisible;
  }
}
