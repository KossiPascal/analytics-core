import { Component, OnInit } from '@angular/core';
import { ApiService } from '@kossi-services/api.service';

@Component({
  standalone: false,
  selector: 'rebuild-sql-views',
  templateUrl: './rebuild-sql-views.component.html',
  styleUrl: './rebuild-sql-views.component.css',
})
export class RebuildSqlViewsComponent implements OnInit {
  CHANGE_STATE: any = null;

  MIGRATIONS_LIST!: { name: string; path: string; time: number; }[];
  
  RUNED_MIGRATIONS_LIST!: { name: string; path: string; time: number; }[];

  SELECTED_MIGRATIONS_NAME:string[] = [];

  GET_ERROR: any;
  RUNED_ERROR: any;

  constructor(private api: ApiService) {
  }


  ngOnInit(): void {
    // setTimeout(() => {
    // });
    this.getAllMigrationsPathList()
  }

  isSuccess(migrationName:string): 'ok' | 'no' | undefined {
    if (this.MIGRATIONS_LIST && this.RUNED_MIGRATIONS_LIST && this.SELECTED_MIGRATIONS_NAME.includes(migrationName)) {
      return this.RUNED_MIGRATIONS_LIST.some(m => m.name == migrationName) ? 'ok' : 'no';
    }
    return;
  }

  hasCommonMigrations(
    listA: { name: string; path: string; time: number }[],
    listB: { name: string; path: string; time: number }[]
  ): boolean {
    const namesA = new Set(listA.map(item => item.name));
    return listB.some(item => namesA.has(item.name));
  }
  


  getAllMigrationsPathList() {
    // this.SELECTED_MIGRATIONS_NAME = [];
    this.GET_ERROR = null;
    this.api.getAllMigrationsPathList().subscribe({
      next: (res: { status: number, data: { name: string; path: string; time: number; }[] }) => {
        if (res.status == 200) {
          this.MIGRATIONS_LIST = res.data;
          // this.SELECTED_MIGRATIONS_NAME = [...this.SELECTED_MIGRATIONS_NAME, ...this.MIGRATIONS_LIST.map(m=> m.name)];
        } else {
          this.GET_ERROR = res.data;
        }
      },
      error: (err) => {
        this.GET_ERROR = err;
      },
      complete: () => {
        // console.log('Finished!');
      }
    })
  }

  runAllMigrationsAvailable() {
    // this.SELECTED_MIGRATIONS_NAME = [];
    this.api.runAllMigrationsAvailable().subscribe({
      next: (res: { status: number, data: { name: string; path: string; time: number; }[] }) => {
        if (res.status == 200) {
          this.RUNED_MIGRATIONS_LIST = res.data;
          this.SELECTED_MIGRATIONS_NAME = [...this.SELECTED_MIGRATIONS_NAME, ...this.RUNED_MIGRATIONS_LIST.map(m=> m.name)];
        } else {
          this.RUNED_ERROR = res.data;
        }
      },
      error: (err) => {
        this.RUNED_ERROR = err;
      },
      complete: () => {
        // console.log('Finished!');
      }
    })
  }

  getOneMigrationsPath() {
    // this.SELECTED_MIGRATIONS_NAME = [];
    this.api.getOneMigrationsPath('migrationName').subscribe({
      next: (res: { status: number, data: { name: string; path: string; time: number; } }) => {
        if (res.status == 200) {
          this.MIGRATIONS_LIST = [res.data];
          // this.SELECTED_MIGRATIONS_NAME = [...this.SELECTED_MIGRATIONS_NAME, ...this.MIGRATIONS_LIST.map(m=> m.name)];
        } else {
          this.GET_ERROR = res.data;
        }
      },
      error: (err) => {
        this.GET_ERROR = err;
      },
      complete: () => {
        // console.log('Finished!');
      }
    })
  }

  runOneMigrationAvailable(migrationName: string) {
    // this.SELECTED_MIGRATIONS_NAME = [];
    this.api.runOneMigrationAvailable(migrationName).subscribe({
      next: (res: { status: number, data: { name: string; path: string; time: number; } }) => {
        if (res.status == 200) {
          this.RUNED_MIGRATIONS_LIST = [...(this.RUNED_MIGRATIONS_LIST??[]), res.data];
          this.SELECTED_MIGRATIONS_NAME = [...this.SELECTED_MIGRATIONS_NAME, ...this.RUNED_MIGRATIONS_LIST.map(m=> m.name)];
        } else {
          this.RUNED_ERROR = res.data;
        }
      },
      error: (err) => {
        this.RUNED_ERROR = err;
      },
      complete: () => {
        // console.log('Finished!');
      }
    })
  }


}
