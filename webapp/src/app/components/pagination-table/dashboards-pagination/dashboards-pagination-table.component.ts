import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PaginateTableBaseComponent } from '../base-pagination-table.component';

@Component({
    standalone: false,
    selector: 'dashboards-pagination-table',
    templateUrl: './dashboards-pagination-table.component.html',
    styleUrls: ['./dashboards-pagination-table.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardsPaginationTableComponent extends PaginateTableBaseComponent<any> {

    // @Input() override pageSizeOptions: any[] = [10, 20, 50, 100, 'ALL'];
    // @Input() override initialPageSize: number = 10;
    
    constructor() {
        super();
    }
}
