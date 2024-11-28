import { AfterViewInit, Component } from '@angular/core';
import { ApiService } from '@kossi-services/api.service';

@Component({
  selector: 'kendeya-guide-formation',
  templateUrl: './kendeya-guide-formation.component.html',
  styleUrl: './kendeya-guide-formation.component.css'
})
export class KendeyaGuideFormationComponent implements AfterViewInit {

  constructor(private api: ApiService) { }


  ngAfterViewInit(): void {
    this.save();
  }

  save(): void {
    const doc = document.getElementById('survey-form');
    if (!doc) return;
    doc.addEventListener('submit', (event) => {
      event.preventDefault(); // Empêche l'envoi du formulaire par défaut
      const target = event.target as HTMLFormElement;
      if (!target) return;
      const formData = new FormData(target);
      const surveyData: any = {};
      formData.forEach((value, key) => { surveyData[key] = value; });

      console.log(surveyData);


      this.api.saveSurvey(surveyData).subscribe((res: any) => {
        if (res.status === 200) {
          // const average = this.api.getAverage();
          console.log(res.data);
        } else {
        }
      }, (err: any) => {
      });


    });
  }

}
