import { AfterViewInit, Attribute, Component, EventEmitter, Input, OnInit, Output,  } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { FormsField } from '@kossi-models/interfaces';

@Component({
  standalone: false,
  selector: 'app-forms',
  templateUrl: `./forms-component.html`,
  styleUrls: ['./forms-component.css'],
})
export class FormsComponent implements OnInit, AfterViewInit {

  @Attribute('id') id: any;

  @Input() field!: FormsField;
  @Input() form!: FormGroup;
  @Input() parent!: string;
  @Input() selectedValues: any; // Input for selected checkboxes
  @Input() required: boolean = false;

  @Output() onCheckboxChange = new EventEmitter<string[]|string>(); // Output for checkbox changes
  

  @Output() onGetCurrentFullPath = new EventEmitter<string>(); // Output for checkbox changes
  

  constructor() { 
    
  }

  ngOnInit(){
    // this.onGetCurrentFullPath.emit(this.fieldName); // Emit updated selection
  }

  ngAfterViewInit(){
    this.onGetCurrentFullPath.emit(this.fieldName); // Emit updated selection
  }

  get isNote(): boolean {
    return this.field.type === 'note';
  }

  get isSelectOne(): boolean {
    return this.field.type === 'select one';
  }

  get isSelectMultiple(): boolean {
    return ['select multiple', 'select all', 'select all that apply'].includes(this.field.type);
  }

  get isInput(): boolean {
    return ['string', 'number', 'text', 'integer', 'decimal', 'date', 'time'].includes(this.field.type);
  }

  get isOtherFieldToShow(): boolean {
    const data1 = this.isNote && this.isSelectOne && this.isSelectMultiple && this.isInput;
    const data2 = ['group', 'string', 'db:person', 'db:clinic', 'db:district_hopital',].includes(this.field.type);
    if (!data1 && !data2) console.log(this.field)
    return !data1 && !data2;
  }

  get isDbObject(): boolean {
    return ['db:person', 'db:clinic', 'db:district_hopital'].includes(this.field.type);
  }

  get getLabel(): string | undefined {
    let label = this.field.label
    if (!label) return undefined;

    if (typeof label === 'string') {
      label = label;
    } else if (typeof label === 'object' && label !== null) {
      label = label['fr'];
    }

    // return label && label !== '' ? label : undefined;
    return label && label !== '' && label !== 'NO_LABEL' ? label : undefined;
  }

  get getHint(): string | undefined {
    let hint = this.field.hint;
    if (!hint) return undefined;

    let fHint;

    if (typeof hint === 'string') {
      fHint = hint ?? '';
    } else if (typeof hint === 'object' && hint !== null) {
      fHint = hint['fr'] ?? '';
    }
    return fHint && fHint !== '' ? fHint : undefined;
  }

  get fieldName():string{
    const parent = this.parent && this.parent != '' ? `${this.parent}/` : '';
    return `${parent}${this.field.name}`
  }



  get invalidField(): string {
    const control = this.form.controls[this.fieldName];
    const data = control && control.invalid && control.touched;
    return data ? 'invalid-field' : '';
   }


  getChoiceLabel(label: { [key: string]: string } | string | undefined): string | undefined {
    if (!label) return undefined;

    if (typeof label === 'string') {
      label = label;
    } else if (typeof label === 'object' && label !== null) {
      label = label['fr'];
    }

    // return label && label !== '' ? label : undefined;
    return label && label !== '' && label !== 'NO_LABEL' ? label : undefined;
  }


  get getDbData(): { name: string, value: any }[] {
    const cible = this.field.type.replaceAll('db:', '');
    return [
      { name: ``, value: '' },
      { name: `${cible}-1`, value: 1 },
      { name: `${cible}-2`, value: 2 },
      { name: `${cible}-3`, value: 3 },
      { name: `${cible}-4`, value: 4 },
      { name: `${cible}-5`, value: 5 },
      { name: `${cible}-6`, value: 6 },
      { name: `${cible}-7`, value: 7 },
    ]
  }


  get appearance():string {
    let appearance = this.field.control?.appearance ?? '';
    const readonly = this.field.bind?.readonly ?? '';

    if (['yes', 'True', 'true()', 'true', 'oui', 'Oui', '1'].includes(readonly)) {
      appearance+=' readonly';
    }
    return appearance;
    // return appearance ? appearance.split(' ') : [];
  }


  // isRequired(fieldName:string):boolean {
  //   // const required = this.field.bind?.required ?? '';
  //   // console.log(required)
  //   const control = this.form.controls?.[fieldName];
  //   // return ['yes', 'True', 'true()', 'true', 'oui', 'Oui', '1'].includes(required);

  //   return control ? control.hasValidator(Validators.required) : false
  // }


  getRadioCheckboxId(cible:'radio'|'checkbox', name: string, index:number):string{
    return `${cible}-${this.fieldName}-${name}-${index}`
  }


  
  handleCheckboxChange(event: Event, value: string) {
    const isChecked = (event.target as HTMLInputElement).checked;

    let selectedValues: string[] = this.selectedValues ?? [];

    if (isChecked) {
      selectedValues = [...selectedValues, value]; // Add value
    } else {
      selectedValues = selectedValues.filter(v => v !== value); // Remove value
    }

    this.selectedValues = selectedValues;

    this.form.controls[this.fieldName].setValue(selectedValues);
    this.onCheckboxChange.emit(selectedValues); // Emit updated selection
  }

// get hidden():string{
//   return this.appearance.includes('hidden') ? 'hidden' : '';
// }

}
