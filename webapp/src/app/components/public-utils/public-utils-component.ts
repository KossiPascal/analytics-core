import { Attribute, Component, Input } from '@angular/core';
import { ConstanteService } from '@kossi-services/constantes.service';

@Component({
  selector: 'app-public-utils',
  templateUrl: `./public-utils-component.html`,
  styleUrls: ['./public-utils-component.css'],
})
export class PublicUtilsComponent {

  constructor(private cst:ConstanteService){}

  downloadAPK(prodApp: boolean){
    // const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const link = document.createElement('a');
    link.href = this.cst.backenUrl(`publics/download/kendeya-${prodApp ? 'prod' : 'dev'}-apk`);
    link.download = `kendeya-${prodApp ? 'prod' : 'dev'}.apk`;
    link.click();
  }

  openGuidePage(){
    // const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const link = document.createElement('a');
    link.href = this.cst.backenUrl(`publics/kendeya-guide-formation`);
    link.target = '_blank';
    link.click();
  }
}

