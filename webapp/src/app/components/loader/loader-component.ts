import { Component } from '@angular/core';
import { AuthService } from '@kossi-services/auth.service';

@Component({
  selector: 'app-loader',
  templateUrl: `./loader-component.html`,
  styleUrls: ['./loader-component.css'],
})
export class LoaderComponent {
  APP_NAME: string;
  constructor(private auth: AuthService) {
    this.APP_NAME = this.auth.APP_NAME;
  }
}
