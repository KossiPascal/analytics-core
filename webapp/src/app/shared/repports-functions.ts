import { FormGroup } from "@angular/forms";
import { SnackbarService } from "@kossi-services/snackbar.service";
import { toArray } from "./functions";


export function StartShowData(formGroup: FormGroup, snackbar: SnackbarService, reportName?:string) {
  if (!formGroup || formGroup.invalid) {
    snackbar.showError('Veuillez remplir tous les champs requis.');
    return false;
  }
  if (!(formGroup.value.recos.length > 0)) {
    snackbar.show({ msg: 'Veuillez sélectionner au moins un RECO', color: 'warning', position: 'TOP' });
    return false;
  }
  if (!(toArray(formGroup.value.months).length > 0)) {
    snackbar.show({ msg: 'Veuillez sélectionner au moins un mois', color: 'warning', position: 'TOP' });
    return false;
  }
  if (!(formGroup.value.year > 0)) {
    snackbar.show({ msg: 'Veuillez sélectionner au moins une année', color: 'warning', position: 'TOP' });
    return false;
  }
  return true;
}

export function NoDataToShow(snackbar: SnackbarService, reportName?:string){
  return snackbar.show({ msg: 'Aucune données disponible pour ces paramettres. Veuillez reessayer!', color: 'info', position: 'TOP', duration: 5000 });
}

export function ErrorOnDataToShow(snackbar: SnackbarService, err:any, reportName?:string){
  return snackbar.show({ msg: `Erreur lors de la récupération des rapports: ${err}`, color: 'danger', position: 'TOP', duration: 5000 });
}
