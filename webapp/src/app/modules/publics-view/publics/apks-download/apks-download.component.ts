import { Component, OnInit } from '@angular/core';
import { PublicPagesService } from '@kossi-services/public-pages.service';
// declare var $:any;


@Component({
  standalone: false,
  selector: 'app-apks-download',
  templateUrl: './apks-download.component.html',
  styleUrl: './apks-download.component.css'
})
export class ApksDownloadComponent implements OnInit {


  constructor(private pb:PublicPagesService){}

  ngOnInit() {
  }

  downloadAPK(prodApp: boolean){
    this.pb.downloadAPK(prodApp);
  }

}
