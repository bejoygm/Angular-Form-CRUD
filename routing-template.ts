import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ${angular_module_name}Component } from './${module_name}.component';
import { ${angular_module_name}CreateComponent } from './create/${module_name}-create.component';
import { ${angular_module_name}EditComponent } from './edit/${module_name}-edit.component';

const routes: Routes = [{
  path: '',
  component: ${angular_module_name}Component,
  children: [{
    path: 'create',
    component: ${angular_module_name}CreateComponent,
  }, {
    path: 'view/:id',
    component: ${angular_module_name}CreateComponent,
  }, {
    path: 'edit/:id',
    component: ${angular_module_name}CreateComponent,
  }, {
    path: 'view',
    component: ${angular_module_name}EditComponent,
  }],
}];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
  ],
  exports: [
    RouterModule,
  ],
})
export class ${angular_module_name}RoutingModule {

}

export const routedComponents = [
  ${angular_module_name}Component,
  ${angular_module_name}CreateComponent,
  ${angular_module_name}EditComponent,
];
