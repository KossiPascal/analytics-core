import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-graduation-loader',
  templateUrl: './graduation-loader.component.html',
  styleUrls: ['./graduation-loader.component.css']
})
export class GraduationLoaderComponent {
  @Input() isLoading: boolean = false;
}
