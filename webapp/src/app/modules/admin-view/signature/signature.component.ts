import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import SignaturePad, { PointGroup } from 'signature_pad';



@Component({
  standalone: false,
  selector: 'app-admin-signature',
  templateUrl: `./signature.component.html`,
  styleUrls: ['./signature.component.css'],
})
export class SignatureComponent implements OnInit {

  signaturePad!: SignaturePad;
  signatureImage: string | null = null;
  defaultMinWidth: number = 0.5;
  defaultMaxWidth: number = 2.5;
  defaultBackgroundColor: string = 'rgba(255, 255, 255, 0)';
  defaultPenColor: string = 'rgb(0, 0, 0)';
  defaultVelocityFilterWeight: number = 0.7;
  defaultThrottle: number = 16;
  defaultMinDistance: number = 5;
  defaultDotSize: number = 1;

  // Methods to update SignaturePad options
  updateMinWidth(e: Event) {
    const value: number = parseFloat((e.target as HTMLInputElement).value);
    this.signaturePad.minWidth = value;
  }

  updateMaxWidth(e: Event) {
    const value: number = parseFloat((e.target as HTMLInputElement).value);
    this.signaturePad.maxWidth = value;
  }

  updateBackgroundColor(e: Event) {
    const value: string = (e.target as HTMLInputElement).value;
    this.signaturePad.backgroundColor = value;
  }

  updatePenColor(e: Event) {
    const value: string = (e.target as HTMLInputElement).value;
    this.signaturePad.penColor = value;
  }

  updateVelocityFilterWeight(e: Event) {
    const value: number = parseFloat((e.target as HTMLInputElement).value);
    this.signaturePad.velocityFilterWeight = value;
  }

  updateThrottle(e: Event) {
    const value: number = parseFloat((e.target as HTMLInputElement).value);
    this.signaturePad.throttle = value;
  }

  updateMinDistance(e: Event) {
    const value: number = parseFloat((e.target as HTMLInputElement).value);
    this.signaturePad.minDistance = value;
  }

  updateDotSize(e: Event) {
    const value: number = parseFloat((e.target as HTMLInputElement).value);
    this.signaturePad.dotSize = value;
  }

  constructor(private router: Router) { }

  ngOnInit(): void {



    this.InitSignaturePadView();



  }


  InitSignaturePadView() {
    const signaturePadElement = document.getElementById('signature-pad');
    if (signaturePadElement) {
      this.signaturePad = new SignaturePad(signaturePadElement as any, {
        minWidth: this.defaultMinWidth,
        maxWidth: this.defaultMaxWidth,
        backgroundColor: this.defaultBackgroundColor,
        penColor: this.defaultPenColor,
        velocityFilterWeight: this.defaultVelocityFilterWeight,
        throttle: this.defaultThrottle,
        minDistance: this.defaultMinDistance,
        dotSize: this.defaultDotSize
      });

      var saveAsPNGBtn = document.getElementById('saveAsPNG');
      var saveAsJPEGBtn = document.getElementById('saveAsJPEG');
      var saveAsJPEG_05Btn = document.getElementById('saveAsJPEG_05');
      var saveAsSVGBtn = document.getElementById('saveAsSVG');

      var cancelButton = document.getElementById('clear');

      const self = this;

      if (saveAsPNGBtn) {
        saveAsPNGBtn.addEventListener('click', function (event) {
          var data = self.signaturePad.toDataURL('image/png');
          self.saveSignature(data);
        });
      }
      if (saveAsJPEGBtn) {
        saveAsJPEGBtn.addEventListener('click', function (event) {
          var data = self.signaturePad.toDataURL('image/jpg');
          self.saveSignature(data);
        });
      }
      if (saveAsJPEG_05Btn) {
        saveAsJPEG_05Btn.addEventListener('click', function (event) {
          var data = self.signaturePad.toDataURL('image/jpg', 0.5);
          self.saveSignature(data);
        });
      }
      if (saveAsSVGBtn) {
        saveAsSVGBtn.addEventListener('click', function (event) {
          var data = self.signaturePad.toDataURL('image/svg+xml');
          self.saveSignature(data);
        });
      }

      if (cancelButton) {
        cancelButton.addEventListener('click', function (event) {
          self.signaturePad.clear();
        });
      }
    }
  }

  SvgStringWithoutBase64Convertion(includeBackgroundColor?: boolean): string {
    return this.signaturePad.toSVG({ includeBackgroundColor: includeBackgroundColor });
  }


  DrawSignatureDataURL(dataUrl: string, options?: {
    ratio?: number | undefined,
    width?: number | undefined,
    height?: number | undefined,
    xOffset?: number | undefined,
    yOffset?: number | undefined,
  } | undefined) {

    this.signaturePad.fromDataURL("data:image/png;base64,iVBORw0K...", { ratio: 1, width: 400, height: 200, xOffset: 100, yOffset: 50 });

  }
  DrawSignatureFromPointGroup(data: PointGroup[], clear?: boolean) {
    return this.signaturePad.fromData(data, { clear: clear });
  }

  SignaturePointGroupsAsArray(): PointGroup[] {
    return this.signaturePad.toData();
  }

  isCanvasEmpty() {
    return this.signaturePad.isEmpty();
  }

  UnbindsAllEventHandlers() {
    this.signaturePad.off();
  }

  RebindsAllEventHandlers() {
    this.signaturePad.on();
  }

  clearSignature() {
    this.signaturePad.clear();
    this.signatureImage = null;
  }

  saveSignature(signatureUrl: string) {
    this.signatureImage = signatureUrl;
  }
}
