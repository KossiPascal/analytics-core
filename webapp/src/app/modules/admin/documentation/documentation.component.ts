import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@kossi-app/services/auth.service';
// declare var $:any;


@Component({
  templateUrl: './documentation.component.html'
})
export class DocumentationComponent implements OnInit {

  constructor(private route: ActivatedRoute, private router:Router, private auth:AuthService) { }

  ngOnInit() {
  }

}
