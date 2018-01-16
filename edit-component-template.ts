import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { LocalDataSource } from 'ng2-smart-table';
@Component({
  selector: '${module_name}-edit',
  templateUrl: './${module_name}-edit.component.html',
})
export class ${angular_module_name}EditComponent implements OnInit {
  settings = {
    edit: {
      editButtonContent: '<i data-toggle="tooltip" title="Edit ${angular_module_name}" class="nb-edit edit-icon"></i>',
    },
    delete: {
      deleteButtonContent: '<i data-toggle="tooltip" title="Delete ${angular_module_name}" class="nb-trash delete-icon"></i>',
      confirmDelete: true,
    },
    mode: 'external',
    columns: ${table_columns},
    actions: {
      position: 'right',
      custom: [
        {
          name: 'view',
          title: '<i data-toggle="tooltip" title="View {angular_module_name}" class="fa fa-eye table-eye view-icon"></i>',
        },
      ],
    },
    hideSubHeader: true,
  };

  onEdit(event) {
    this.router.navigate(['/pages/${module_name}/edit', event.data.org_Name]);
  }
  onCustom(event) {
    this.router.navigate(['/pages/${module_name}/view', event.data.org_Name]);
  }
  onCreate() {
    this.router.navigate(['/pages/${module_name}/create']);
  }

  source: LocalDataSource;
  localData;

  constructor(
    private http: HttpClient,
    private router:Router,
  ) {
    this.source = new LocalDataSource();

    this.http.get<any>
      ('${api_url}${get_api}').subscribe(res => {
        this.localData = res.data;
        this.source = new LocalDataSource(res.data);
    });
  }

  onSearch(query: string = '') {
    if (query) {
      this.source.setFilter([
        {
          field: 'org_Code',
          search: query
        },
        {
          field: 'org_Name',
          search: query
        },
      ], false);
    } else {
      this.source = new LocalDataSource(this.localData);
    }
  }

  ngOnInit() {

  }

  onDeleteConfirm(event): void {
    let popupEvent = event;
    if (window.confirm('Are you sure you want to delete?')) {
      this.http.delete<any>
        (`${api_url}${delete_api}?org_Code=${event.data.org_Code}`).subscribe(res => {
          this.localData.splice(popupEvent.index, 1);
          this.source = new LocalDataSource(this.localData);
          alert(res.message);
      }, err => {
        alert(err.error.message);
      });
    } else {
      return;
    }
  }
}