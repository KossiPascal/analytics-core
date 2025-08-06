import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '@kossi-models/user-role';
import { ApiService } from '@kossi-services/api.service';
import { AuthService } from '@kossi-services/auth.service';
import { IndexedDbService } from '@kossi-services/indexed-db.service';
import { ModalService } from '@kossi-services/modal.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';

@Component({
    standalone: false,
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {


    @Input() COMPONENT_TYPE!: 'profile' | 'update_password';

    passwordMinLength = 8;

    profileForm!: FormGroup;
    passwordForm!: FormGroup;

    USER!: User | null

    constructor(private auth: AuthService, private api: ApiService, private indexdb: IndexedDbService, public mService: ModalService, private fb: FormBuilder, private userCtx: UserContextService, private snackbar: SnackbarService,) {
        this.initApp();
    }



    async initApp() {
        this.USER = await this.userCtx.currentUser();
        this.initForms();
    }

    initForms() {
        if (this.COMPONENT_TYPE == 'profile') {
            this.profileForm = this.fb.group({
                fullname: [this.USER?.fullname ?? '', [Validators.required]],
                email: [this.USER?.email ?? '', [Validators.email]],
                phone: [this.USER?.phone ?? '', [Validators.required]]
                //   userLogo
            });
        }
        if (this.COMPONENT_TYPE == 'update_password') {
            this.passwordForm = this.fb.group({
                oldPassword: ['', [Validators.required]],
                newPassword: ['', [Validators.required, Validators.minLength(this.passwordMinLength)]],
                confirmPassword: ['', [Validators.required, Validators.minLength(this.passwordMinLength)]]
            });
        }
    }

    get passwordNotMatch(): any {
        const newPassword:string = (this.passwordForm.value.newPassword ?? '');
        const confirmPassword:string = (this.passwordForm.value.confirmPassword ?? '');
        const isOk1 = (newPassword.trim()).length > this.passwordMinLength;
        const isOk2 = (confirmPassword.trim()).length > this.passwordMinLength;
        // if (!isOk1 || !isOk2)  return false;
        return isOk1 && isOk2 && newPassword !== confirmPassword;
    }


    ngOnInit(): void {
        this.initForms();
    }

    updateProfile(): void {
        if (this.COMPONENT_TYPE == 'profile') {
            if (this.profileForm.valid) {
                const id = this.USER?.id;
                const { fullname, email, phone } = this.profileForm.value;
                this.api.updateProfile({ id, fullname, email, phone }).subscribe({
                    next: (res: { status: number, data: any }) => {
                        if (res.status == 200) {
                            this.indexdb.update<{ id: string; data: any }>({ dbName: 'token', newData: { id: 'user', data: res.data } }).then(async () => {
                                const userTokens = await this.indexdb.getAll<{ id: string, data: string }>('token');

                                this.USER = await this.userCtx.currentUser(userTokens);

                                this.snackbar.show({ msg: 'Modifié avec succès', color: 'success', duration: 3000 });
                                // location.reload();
                                // window.location.reload();
                                // this.mService.close({ success: true });
                            }).catch((error) => {
                                this.snackbar.show({ msg: 'Vous devez vous reconnecter', color: 'danger', duration: 5000 });
                            });
                        } else {
                            this.snackbar.show({ msg: res.data || 'Erreur, pas de changement effectué', color: 'danger', duration: 5000 });
                        }
                    },
                    error: (err) => {
                        this.snackbar.show({ msg: err || 'Erreur, pas de changement effectué', color: 'danger', duration: 5000 });
                    }
                })
            } else {
                this.snackbar.show({ msg: 'Données incorrect', color: 'danger', duration: 5000 });
            }
        }
    }

    updatePassword(): void {
        if (this.COMPONENT_TYPE == 'update_password') {
            if (this.passwordForm.valid) {
                const { oldPassword, newPassword, confirmPassword } = this.passwordForm.value;
                if (newPassword === confirmPassword) {
                    const id = this.USER?.id;

                    this.api.updatePassword({ id, newPassword, oldPassword }).subscribe({
                        next: (res: { status: number, data: any }) => {
                            if (res.status == 200) {

                                this.snackbar.show({ msg: 'Modifié avec succès, déconnection imminante', color: 'success', duration: 3000 });
                                // this.mService.close({ success: true });

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
    }
}
