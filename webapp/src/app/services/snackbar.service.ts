import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {

  private snackbarVisibilitySubject: Subject<boolean> = new Subject<boolean>();
  private snackbarMessageSubject: Subject<string> = new Subject<string>();
  private snackbarBackgroundColorSubject: Subject<'danger' | 'info' | 'warning' | 'success' | 'default'> = new Subject<'danger' | 'info' | 'warning' | 'success' | 'default'>();
  private snackbarPositionSubject: Subject<'TOP'|'BOTTOM'> = new Subject<'TOP'|'BOTTOM'>();
  constructor() { }

  show(message: string, param:{position?:'TOP'|'BOTTOM', backgroundColor?: 'danger' | 'info' | 'warning' | 'success' | 'default', duration?: number}) {
    const backgroundColor = param.backgroundColor ?? 'default';
    const duration = param.duration ?? 3000;
    const position = param.position ?? 'BOTTOM';

    this.snackbarVisibilitySubject.next(true);
    this.snackbarMessageSubject.next(message);
    this.snackbarBackgroundColorSubject.next(backgroundColor);
    this.snackbarPositionSubject.next(position);
    setTimeout(() => {
      this.hideSnackbar();
    }, duration); // Hide the snackbar after the specified duration
  }

  hideSnackbar() {
    this.snackbarVisibilitySubject.next(false);
  }

  getSnackbarVisibility() {
    return this.snackbarVisibilitySubject.asObservable();
  }

  getSnackbarMessage() {
    return this.snackbarMessageSubject.asObservable();
  }

  getSnackbarBackColor() {
    return this.snackbarBackgroundColorSubject.asObservable();
  }

  getSnackbarPosition() {
    return this.snackbarPositionSubject.asObservable();
  }
}
