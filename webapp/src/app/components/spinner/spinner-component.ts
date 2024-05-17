import { Attribute, Component, Input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  templateUrl: `./spinner-component.html`,
  styleUrls: ['./spinner-component.css'],
})
export class SpinnerComponent {
  @Attribute('id') id: any;
  @Input() isLoading!: boolean;
}
