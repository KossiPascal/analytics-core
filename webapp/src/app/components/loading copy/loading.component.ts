import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent {
  @Input() isLoading: boolean = false;
}
