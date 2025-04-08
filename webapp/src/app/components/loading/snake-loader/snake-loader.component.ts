import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-snake-loader',
  templateUrl: './snake-loader.component.html',
  styleUrls: ['./snake-loader.component.css']
})
export class SnakeLoaderComponent {
  @Input() isLoading: boolean = false;
}
