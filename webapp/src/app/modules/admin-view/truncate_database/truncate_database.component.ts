import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiService } from '@kossi-services/api.service';
import { toArray } from '@kossi-shared/functions';

@Component({
  standalone: false,
  selector: 'app-admin-truncate-database',
  templateUrl: `./truncate_database.component.html`,

})
export class TruncateDatabaseComponent implements OnInit {

  responseMsg: string = '';
  constMsg: string = "Loading...";
  initMsg: string = this.constMsg;

  isLoading!: boolean;
  isEntityLoading!: boolean;
  EntitiesList$: { name: string, table: string }[] = [];
  EntitiesForm!: FormGroup;
  initEntity: string[] = [];
  Actions$:string[] = ["TRUNCATE", "DROP"];


  constructor(private api: ApiService) { }

  createEntitiesFilterFormGroup(): FormGroup {
    return new FormGroup({
      entities: new FormControl([], [Validators.required]),
      action: new FormControl('TRUNCATE', [Validators.required]),
    });
  }

  ngOnInit(): void {
    this.EntitiesForm = this.createEntitiesFilterFormGroup();
    this.initAllData();
  }

  async initAllData() {
    this.isLoading = true;
    this.initMsg = 'Chargement des Entities ...';
    this.api.getDatabaseEntities().subscribe(async (res: { status: number, data: any }) => {
      if (res.status == 200) this.EntitiesList$ = res.data;
    }, (err: any) => {
      this.isLoading = false;
      console.log(err.error);
    });
  }

  EntitiesSelectedList(): { name: string, table: string }[] {
    var entitiesSelected: { name: string, table: string }[] = [];
    const entities: string[] = toArray(this.EntitiesForm.value.entities);
    this.initEntity = entities;
    for (let i = 0; i < this.EntitiesList$.length; i++) {
      const entity = this.EntitiesList$[i];
      if (entities.includes(entity.name)) entitiesSelected.push(entity)
    }
    return entitiesSelected;
  }

  TruncateBd() {
    const selectedEntites = this.EntitiesSelectedList();
    if (selectedEntites.length > 0) {
      this.responseMsg = '';
      this.initMsg = this.constMsg;
      this.isEntityLoading = true;

      this.api.truncateDatabase({ procide: true, entities: selectedEntites, action: this.EntitiesForm.value.action }).subscribe(async (res: { status: number, data: any }) => {
        this.responseMsg = res.data.toString();
        if (res.status == 200) this.initEntity = [];
        this.isEntityLoading = false;
      }, (err: any) => {
        console.log(err.error);
        this.isEntityLoading = false;
        this.responseMsg = err.toString();
      });
    }
  }
}
