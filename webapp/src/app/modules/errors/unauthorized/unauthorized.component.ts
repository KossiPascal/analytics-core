import { Component } from '@angular/core';
import { UserContextService } from '@kossi-services/user-context.service';
import { Location } from '@angular/common';
import { AuthService } from '@kossi-services/auth.service';

@Component({
  standalone: false,
  selector: 'app-unauthorized',
  templateUrl: `./unauthorized.component.html`,
  styleUrls: ['./unauthorized.component.css'],
})
export class UnauthorizedComponent {
  defaultPage!:string;

  constructor(private location: Location, private userCtx: UserContextService, private auth: AuthService) { 
    this.initializeComponent();
  }

  private async initializeComponent(){
    this.defaultPage = await this.userCtx.defaultPage();
  }

  gotToDefaultPage(){
    location.href = this.defaultPage;
  }

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
