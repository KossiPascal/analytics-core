import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  standalone: false,
  selector: 'app-admin-contacts-data-relocation',
  templateUrl: `./contacts_data_relocation.component.html`,
  styleUrls: ['./contacts_data_relocation.component.css'],
})
export class DatabasesComponent implements OnInit {
  constructor(private router: Router) { }

  ngOnInit(): void {



  }
}
