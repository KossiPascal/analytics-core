import { Attribute, Component, Input } from '@angular/core';
import { ConstanteService } from '@kossi-services/constantes.service';
import { PublicPagesService } from '@kossi-services/public-pages.service';

@Component({
  selector: 'app-public-utils',
  templateUrl: `./public-utils-component.html`,
  styleUrls: ['./public-utils-component.css'],
})
export class PublicUtilsComponent {

  constructor(private pb:PublicPagesService){}

  downloadAPK(prodApp: boolean){
    this.pb.downloadAPK(prodApp);
  }

  openGuidePage(){
    this.pb.openGuidePage();
  }

  openRecoGuidePage(){
    this.pb.openRecoGuidePage();
  }
}

