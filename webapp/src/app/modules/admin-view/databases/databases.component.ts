import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  standalone: false,
  selector: 'app-admin-database',
  templateUrl: `./databases.component.html`,
  styleUrls: ['./databases.component.css'],
})
export class DatabasesComponent implements OnInit {
  constructor(private router: Router) { }

  ngOnInit(): void {



  }
}
