import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaginateTableBaseComponent } from '../base-pagination-table.component';

@Component({
    standalone: false,
    selector: 'reports-pagination-table',
    templateUrl: './reports-pagination-table.component.html',
    styleUrls: ['./reports-pagination-table.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPaginationTableComponent extends PaginateTableBaseComponent<any> {
  constructor() {
    super();
  }
}
