import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LOCAL_REPPORTS_DB_NAME, LOCAL_DASHBOARDS_DB_NAME, DatabaseName } from '@kossi-models/db';
import { AuthService } from '@kossi-services/auth.service';
import { ConstanteService } from '@kossi-services/constantes.service';
import { IndexedDbService } from '@kossi-services/indexed-db.service';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: `./login.component.html`,
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  message!: string;

  isLoading: boolean = false;

  APP_LOGO!: string;
  COUNTRY_LOGO!: string;
  APP_NAME!: string;


  constructor(private cst: ConstanteService, private auth: AuthService, private indexdb: IndexedDbService) {
    this.APP_LOGO = this.cst.APP_LOGO;
    this.COUNTRY_LOGO = this.cst.COUNTRY_LOGO;
    this.APP_NAME = this.cst.APP_TITLE;
  }

  ngOnInit(): void {
    // this.auth.isAlreadyLogin;
    this.loginForm = this.createFormGroup();
  }

  createFormGroup(): FormGroup {
    return new FormGroup({
      credential: new FormControl("", [
        Validators.required,
        Validators.minLength(3),
      ]),
      password: new FormControl("", [
        Validators.required,
        Validators.minLength(8),
      ]),
      // rememberMe: new FormControl(false, []),
    });
  }


  login(): void {
    this.isLoading = true;
    const { credential, password } = this.loginForm.value;
    // Appel à la méthode de connexion
    this.auth.login({ credential, password }).subscribe({
      next: async () => {

        const username = await this.indexdb.getOne<{ id: string; data: any }>('user_info', 'username');

        if (!username || username.data !== credential) {
          const dbsName = [...LOCAL_REPPORTS_DB_NAME, ...LOCAL_DASHBOARDS_DB_NAME];
          for (const name of dbsName) {
            await this.indexdb.deleteAllFromDB({ dbName: name });
          }

          await this.indexdb.update<{ id: string; data: any }>({ dbName: 'user_info', newData: { id: 'username', data: credential } }).then(() => {})
        }

        this.isLoading = false;
        location.href = 'reports';
      },
      error: (err: any) => {
        // Gestion des erreurs
        this.isLoading = false;
        this.message = err?.message || 'Erreur lors de la connexion';
      }
    });
  }

  // loginUser(): any {
  //   this.isLoading = true;
  //   this.auth.login(this.loginForm.value);

  //   if error
  //   this.message = res.message;
  //   this.isLoading = false;


  //   return this.api.login()
  //     .subscribe(async (res: { status: number, token: any, orgunits: any, persons: any, message: any }) => {
        
        
        
        
  //       if (res.status === 200) {
  //         if (res.token && res.orgunits && res.persons) {
            
  //           const userData = Object.entries(res).map(([key, value]) => ({ id: key === 'token' ? 'user' : key, data: value }));

  //           await this.indexdb.saveMany<{ id: string, data: string }>({ dbName: 'token', datas: userData });

  //           location.href = 'dashboards';
  //         }
  //       } else {
          
  //       }
       
  //       return;
  //     }, (err: any) => {
  //       // this.message = err;
  //       this.message = 'Erreur de connexion';
  //       console.log(err);
  //       this.isLoading = false;
  //       return;
  //     });
  // }
}
