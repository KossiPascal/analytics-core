import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarService } from '@kossi-services/snackbar.service';

@Component({
  selector: 'app-snackbar',
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.css']
})
export class SnackbarComponent implements OnInit {
  message: string = '';
  visible: boolean = false;
  backgroundColor: string = 'default';
  position:'TOP'|'BOTTOM' = 'BOTTOM';


  constructor(private snackBar: MatSnackBar, private snackbarService: SnackbarService) {
    this.snackbarService.getSnackbarVisibility().subscribe((visibility: boolean) => {
      this.visible = visibility;
    });

    this.snackbarService.getSnackbarMessage().subscribe((message: string) => {
      this.message = message.replace("\n", '<br>');
    });

    this.snackbarService.getSnackbarBackColor().subscribe((backgroundColor: string) => {
      this.backgroundColor = backgroundColor;
    });

    this.snackbarService.getSnackbarPosition().subscribe((position: 'TOP'|'BOTTOM') => {
      this.position = position;
    });
  }

  ngOnInit() {

  }

  // Method to close the snackbar manually
  close() {
    this.visible = false;
  }


  // openSnackBar(message: string, action: string) {
  //   this.snackBar.open(message, action, {
  //     duration: 2000, // Duration in milliseconds
  //   });
  // }
  // this.openSnackBar(message, 'Close');


}
