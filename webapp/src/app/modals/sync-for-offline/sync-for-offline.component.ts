import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { currentYear, currentMonth, getMonthsList, getYearsList, toArray } from '@kossi-shared/functions';
import { UserContextService } from '@kossi-services/user-context.service';
import { RecosMap } from '@kossi-models/org-unit-interface';
import { ModalService } from '@kossi-services/modal.service';
import { LocalSyncService } from '@kossi-services/local-sync.service';
import { User } from '@kossi-models/user-role';

@Component({
  standalone: false,
  selector: 'sync-for-offline-confirm-modal',
  templateUrl: './sync-for-offline.component.html',
  styleUrl: './sync-for-offline.component.css'
})
export class SyncForOfflineConfirmComponent implements OnInit {
  _formGroup!: FormGroup;

  Months$: { labelEN: string; labelFR: string; id: string; uid: number }[] = [];
  Years$: number[] = [];
  month$!: { labelEN: string; labelFR: string; id: string; uid: number };
  year$!: number;
  data_syncing: boolean = false;
  errorMessage: string | null = null;

  Recos$: RecosMap[] = [];

  USER!: User | null

  constructor(private modalService: ModalService, private userCtx: UserContextService, private snackbar: SnackbarService, private lSync:LocalSyncService) {
    this.initializeComponent();
  }

  private async initializeComponent() {
    this.USER = await this.userCtx.currentUser();
    if (!(this.Recos$.length > 0)) this.Recos$ = this.USER?.recos ?? [];
  }

  ngOnInit(): void {
    this.year$ = currentYear();
    this.month$ = currentMonth();
    this.Months$ = getMonthsList().filter(m => this.month$ && m.uid <= this.month$.uid);
    this.Years$ = getYearsList().filter(y => this.year$ && y <= this.year$);
    this._formGroup = this.CreateFormGroup();
  }


  initMonths(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    if (Number(selectElement.value) < this.year$) {
      this.Months$ = getMonthsList();
    } else {
      this.Months$ = getMonthsList().filter(m => this.month$ && m.uid <= this.month$.uid);
    }
    // this.Months$ = getMonthsList().filter(m => this.month$ && m.uid <= this.month$.uid);
  }

  CreateFormGroup(): FormGroup {
    return new FormGroup({
      year: new FormControl(this.year$, [Validators.required]),
      months: new FormControl(this.month$.id, [Validators.required]),
    });
  }

  close() {
    this.modalService.close();
  }

  StartSubmit() {
    this.START_SYNC_FOR_OFFLINE();
  }

  async START_SYNC_FOR_OFFLINE(event?: Event) {
    if (event) event.preventDefault();
    this.errorMessage = null;
    if (!(this.Recos$.length > 0)) {
      this.errorMessage = 'Pas de RECO disponible pour votre compte';
      return;
    }
    if (!(toArray(this._formGroup.value.months).length > 0)) {
      this.errorMessage = 'Veuillez sélectionner au moins un mois';
      return;
    }
    if (!(this._formGroup.value.year > 0)) {
      this.errorMessage = 'Veuillez sélectionner au moins une année';
      return;
    }

    this.data_syncing = true;
    this._formGroup.value.recos = this.Recos$.map(r => r.id);
    this._formGroup.value.months = toArray(this._formGroup.value.months);

    this.lSync.syncWithServer(this.USER, this._formGroup.value).subscribe(success => {
      if (success) {
        this.close();
        this.snackbar.show({ msg: 'Tout a été synchronisé avec succès', color: 'success', duration: 5000 });
      } else {
        this.errorMessage = 'Erreur lors de la synchronisation';
      }
      this.data_syncing = false;
    });

  }
}
