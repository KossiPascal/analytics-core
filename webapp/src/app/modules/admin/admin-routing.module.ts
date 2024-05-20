import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UsersComponent } from './users/users.component';
import { LoginAccessGuard } from '@kossi-src/app/guards/login-access-guard';
import { RolesComponent } from './roles/roles.component';
import { DatabasesComponent } from './databases/databases.component';
import { SignatureComponent } from './signature/signature.component';
import { PdfGeneratorComponent } from './pdf-generator/pdf-generator.component';
import { ApiComponent } from './api-list/api-list.component';
import { DeleteCouchdbDataComponent } from './delete_couchdb_data/delete_couchdb_data.component';
import { DocumentationComponent } from './documentation/documentation.component';
import { TruncateDatabaseComponent } from './truncate_database/truncate_database.component';

const routes: Routes = [
  { path: '', redirectTo: 'users', pathMatch: 'full' },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'admin/users',
      title: 'Users',
    },
  },
  {
    path: 'documentations',
    component: DocumentationComponent,
    canActivate: [],
    data: {
      href: 'admin/documentations',
      title: 'Documentation'
    }
  },
  {
    path: 'delete-couchdb-data',
    component: DeleteCouchdbDataComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: "admin/delete-couchdb-data",
      title: "DeleteCouchdbData"
    }
  },
  {
    path: 'truncate-database',
    component: TruncateDatabaseComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: "admin/truncate-database",
      title: "TruncateDatabase"
    }
  },
  {
    path: 'roles',
    component: RolesComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'admin/roles',
      title: 'Roles',
    },
  },
  {
    path: 'databases',
    component: DatabasesComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'admin/databases',
      title: 'Databases',
    },
  },
  {
    path: 'api-access',
    component: ApiComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: "admin/api-access",
      title: 'Apis'
    },
  },
  {
    path: 'signature',
    component: SignatureComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'admin/signature',
      title: 'Signature',
    },
  },
  {
    path: 'pdf-generator',
    component: PdfGeneratorComponent,
    canActivate: [LoginAccessGuard],
    data: {
      href: 'admin/pdf-generator',
      title: 'Pdf Generator',
    },
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule { }
