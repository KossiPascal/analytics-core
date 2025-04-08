import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-google-loader',
  templateUrl: './google-loader.component.html',
  styleUrls: ['./google-loader.component.css']
})
export class GoogleLoaderComponent {
  @Input() isLoading: boolean = false;
}
