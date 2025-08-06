import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from '@kossi-models/user-role';
import { ApiService } from '@kossi-services/api.service';
import { AuthService } from '@kossi-services/auth.service';
import { ConstanteService } from '@kossi-services/constantes.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';

@Component({
  standalone: false,
  selector: 'app-change-default-password',
  templateUrl: `./change-default-password.component.html`,
  styleUrls: ['./change-default-password.component.css'],
})
export class ChangeDefaultPasswordComponent implements OnInit {
  passwordForm!: FormGroup;
  message!: string;

  showOlfPassword: boolean = false;
  showPassword: boolean = false;
  isLoading: boolean = false;

  APP_LOGO!: string;
  COUNTRY_LOGO!: string;
  APP_NAME!: string;
  USER!: User | null;

  passwordMinLength = 8;

  constructor(private cst: ConstanteService, private auth: AuthService, private api: ApiService, private snackbar: SnackbarService, private userCtx: UserContextService) {
    this.initApp();
  }

  async initApp() {
    this.APP_LOGO = this.cst.APP_LOGO;
    this.COUNTRY_LOGO = this.cst.COUNTRY_LOGO;
    this.APP_NAME = this.cst.APP_TITLE;
    this.USER = await this.userCtx.currentUser();
  }

  toggleOldPasswordVisibility(): void {
    this.showOlfPassword = !this.showOlfPassword;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  ngOnInit(): void {
    // this.auth.isAlreadyLogin;
    this.passwordForm = this.createFormGroup();
  }

  createFormGroup(): FormGroup {
    return new FormGroup({
      oldPassword: new FormControl("", [
        Validators.required
      ]),
      newPassword: new FormControl("", [
        Validators.required,
        Validators.minLength(this.passwordMinLength),
      ]),
      confirmPassword: new FormControl("", [
        Validators.required,
        Validators.minLength(this.passwordMinLength),
      ]),
    });
  }

  updatePassword(): void {
    this.isLoading = true;
    if (this.passwordForm.valid) {

      const { oldPassword, newPassword, confirmPassword } = this.passwordForm.value;

      if (newPassword === confirmPassword) {
        const id = this.USER?.id;

        this.api.updatePassword({ id, newPassword, oldPassword }).subscribe({
          next: (res: { status: number, data: any }) => {
            if (res.status == 200) {

              this.snackbar.show({ msg: 'Modifié avec succès, déconnection imminante', color: 'success', duration: 3000 });

              this.auth.logout()
            } else {
              this.snackbar.show({ msg: res.data || 'Erreur, pas de changement effectué', color: 'danger', duration: 5000 });
            }
          },
          error: (err) => {
            this.snackbar.show({ msg: err || 'Erreur, pas de changement effectué', color: 'danger', duration: 5000 });
          }
        });
      } else {
        this.snackbar.show({ msg: 'Les mots de passe ne concordent pas', color: 'danger', duration: 5000 });
      }
    } else {
      this.snackbar.show({ msg: 'Les mots de passe sont invalident!', color: 'danger', duration: 5000 });
    }
  }

  get passwordNotMatch(): any {
    const newPassword: string = (this.passwordForm.value.newPassword ?? '');
    const confirmPassword: string = (this.passwordForm.value.confirmPassword ?? '');
    const isOk1 = (newPassword.trim()).length > this.passwordMinLength;
    const isOk2 = (confirmPassword.trim()).length > this.passwordMinLength;
    // if (!isOk1 || !isOk2)  return false;
    return isOk1 && isOk2 && newPassword !== confirmPassword;
  }
}
