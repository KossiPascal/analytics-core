import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { AuthService } from '@kossi-services/auth.service';

@Component({
  standalone: false,
  selector: 'app-error-500',
  templateUrl: `./500.component.html`,
  styleUrls: ['./500.component.css'],
})
export class Error500Component {
  constructor(private auth: AuthService, private location: Location) { }

  goBack() {
    this.location.back();
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }

  logout(){
    this.auth.logout();
  }
}
