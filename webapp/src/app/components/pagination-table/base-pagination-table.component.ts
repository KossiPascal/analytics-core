import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, ChangeDetectionStrategy, OnInit } from '@angular/core';


@Component({
    standalone: false,
    selector: 'base-paginate-table',
    template: ``,
    styles: [``],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginateTableBaseComponent<T> implements OnChanges, OnInit {

    @Input() PAGINATION_DATA!: T[];
    @Input() pageSizeOptions!: any[];
    @Input() initialPageSize!: number;

    @Output() onPageChanged: EventEmitter<T[]> = new EventEmitter();

    currentPage: number = 1;
    pageSize!: number;
    paginatedData: T[] = [];

    constructor(){}


    ngOnInit(): void {
        this.initialPageSize =  this.initialPageSize ?? 50;
        this.pageSize = this.initialPageSize;
        this.pageSizeOptions = this.pageSizeOptions ?? [50, 100, 200, 300, 400, 500, 1000, 'ALL'];
        this.PAGINATION_DATA = this.PAGINATION_DATA ?? [];
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['PAGINATION_DATA']) {
            this.currentPage = 1;
            setTimeout(() => {
                this.updatePagination();
            });
        }
    }
    
    get datalength():number {
        return this.PAGINATION_DATA.length;
    }

    get totalPages(): number {
        return Math.ceil(this.PAGINATION_DATA.length / this.pageSize);
    }

    updatePagination(): void {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.paginatedData = this.PAGINATION_DATA.slice(startIndex, endIndex);
        this.onPageChanged.emit(this.paginatedData);
    }

    // paginateChildrenVaccines(results: RecoVaccinationDashboard[], page: number, pageSize: number = 10): RecoVaccinationDashboard[] {
    //     return results.map(dashboard => {
    //         const startIndex = (page - 1) * pageSize;
    //         const endIndex = startIndex + pageSize;
    //         return {
    //             ...dashboard,
    //             children_vaccines: dashboard.children_vaccines.slice(startIndex, endIndex)
    //         };
    //     });
    // }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePagination();
        }
    }

    prevPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePagination();
        }
    }

    changePageSize(event: Event) {
        const optVal = (event.target as HTMLSelectElement).value;
        this.pageSize = optVal === 'ALL' ? this.datalength : +optVal;
        this.currentPage = 1;
        this.updatePagination();
    }
}
