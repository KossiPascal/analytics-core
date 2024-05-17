import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';



@Component({
  selector: 'app-admin-user',
  templateUrl: `./databases.component.html`,
  styleUrls: ['./databases.component.css'],
})
export class DatabasesComponent implements OnInit {
  constructor(private router: Router) { }

  ngOnInit(): void {



  }
}
