import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { AuthService } from '@kossi-services/auth.service';


@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent implements OnInit {
  authForm!: FormGroup;
  message: string = 'ffff';
  isLoading: boolean = false;
  LoadingMsg: string = "Loading...";

  APP_LOGO: string = 'Consts.APP_LOGO';

  passwordType: { [key: number]: string|undefined } = {};


  constructor(private auth: AuthService) {
  }

  // private roles = new Roles(this.auth);

  ngOnInit(): void {
    // if (!this.roles.canUpdatePassword()) {
    //   return this.auth.GoToDefaultPage();
    // }
    this.authForm = this.createFormGroup();
  }

  showHidePassword(key:number) {
    this.passwordType[key] = !this.passwordType[key] || this.passwordType[key] == 'password' ? 'text' : 'password';
  }


  createFormGroup(): FormGroup {
    return new FormGroup({
      old_password: new FormControl("", [Validators.required, Validators.minLength(8)]),
      new_password: new FormControl("", [Validators.required, Validators.minLength(8)]),
      password_confirm: new FormControl("", [Validators.required, Validators.minLength(8)]),
    }, [this.MatchValidator('new_password', 'password_confirm')]);
  }


  MatchValidator(source: string, target: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const sourceCtrl = control.get(source);
      const targetCtrl = control.get(target);
      return sourceCtrl && targetCtrl && sourceCtrl.value !== targetCtrl.value
        ? { mismatch: true }
        : null;
    };
  }

  passwordMatchError() {
    return this.authForm.getError('new_password') && this.authForm.get('password_confirm')?.touched;
  }

  register(): any {
    // if (!this.auth.isLoggedIn()) {
    //   this.auth.logout();
    //   return;
    // }
    this.isLoading = true;

    // return this.auth.updateMyPassword({ old_password: this.authForm.value.old_password, new_password: this.authForm.value.new_password })
    //   .subscribe((res: { status: number, data: any }) => {
    //     if (res.status === 200) {
    //       this.message = 'Modifié avec succès !'
    //       this.isLoading = false;
    //       if(confirm('Vous devez vous reconnecter apres cette modification,\nsouhaitez-vous vous déconnecter?')){
    //         this.auth.GoToDefaultPage(true);
    //       }
    //     } else {
    //       this.message = res.data;
    //       this.isLoading = false;
    //     }
    //   }, (err: any) => {
    //     this.message = err.error;
    //     this.isLoading = false;
    //     console.log(this.message);
    //   });
  }

}
