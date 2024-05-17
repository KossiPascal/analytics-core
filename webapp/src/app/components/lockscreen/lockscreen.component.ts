import { Component, OnInit } from '@angular/core';
import { FormGroup } from "@angular/forms";
import { Router } from '@angular/router';
import { AuthService } from '@kossi-services/auth.service';
import { HttpClient } from "@angular/common/http";
import { ConfigService } from '@kossi-app/services/config.service';


@Component({
  selector: 'app-lockscreen',
  templateUrl: './lockscreen.component.html'
})
export class LockScreenComponent implements OnInit {
  authForm!: FormGroup;
  isLoginForm: boolean = true;
  message: string = 'Vous êtes déconnecté !';
  isLoading:boolean = false;
  LoadingMsg: string = "Loading...";
  showRegisterPage:boolean = false;
  APP_LOGO: string = ''
  constructor(private auth: AuthService, private router: Router, private http: HttpClient, private conf:ConfigService) { }

  ngOnInit(): void { }

}
