import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-sample-loader',
  templateUrl: './sample-loader.component.html',
  styleUrls: ['./sample-loader.component.css']
})
export class SampleLoaderComponent {
  @Input() isLoading: boolean = false;
}
