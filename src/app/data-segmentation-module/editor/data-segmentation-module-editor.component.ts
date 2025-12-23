// Author: Preston Lee

import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ModuleEditorDataService } from '../module-editor-data.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StatusService } from '../status.service';
import { BaseComponent } from '../base.component';
import { Binding, InformationCategorySetting, Policy, Rules } from '@complylight/core';
import { DataSegmentationModuleConfig } from '../models/data-segmentation-module-config';
import { CategoryComponent } from './category/category.component';
import { PurposeComponent } from './purpose/purpose.component';
import { PolicyComponent } from './policy/policy.component';

import * as uuid from 'uuid';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-data-segmentation-module-editor',
  imports: [CommonModule, RouterModule, FormsModule, CategoryComponent, PurposeComponent, PolicyComponent],
  templateUrl: './data-segmentation-module-editor.component.html',
  styleUrl: './data-segmentation-module-editor.component.scss'
})
export class DataSegmentationModuleEditorComponent extends BaseComponent implements OnInit {
  
  public module: DataSegmentationModuleConfig | null = null;
  
  public sidebarActive: boolean = true;
  public download_locked: boolean = false;
  
  constructor(
    protected dataService: ModuleEditorDataService, 
    protected statusService: StatusService, 
    protected toastrService: ToastrService, 
    protected http: HttpClient, 
    protected route: ActivatedRoute, 
    protected router: Router
  ) {
    super();
  }
  
  totalCodesFor(binding: Binding) {
    let count = 0;
    binding.codeSets.forEach(n => {
      count += n.codes.length;
    });
    return count;
  }
  
  bindingForId(id: string): Binding | null {
    let r: Binding | null = null;
    this.module?.rules?.bindings.forEach(n => {
      if (id == n.id) {
        r = n;
      }
    });
    return r;
  }

  ngOnInit(): void {
    const moduleId = this.route.snapshot.paramMap.get('id');
    if (moduleId) {
      this.dataService.loadModule(moduleId);
    }
    
    this.dataService.module.subscribe(m => {
      if (m) {
        this.module = m;
        let binding_id = this.route.snapshot.firstChild?.paramMap.get('id');
        if (!binding_id && this.module.rules?.bindings && this.module.rules.bindings.length > 0) {
          this.router.navigate(['bindings', this.module.rules.bindings[0].id], { relativeTo: this.route });
        }
      } else if (this.dataService.loading) {
        // Do nothing as the data service is probably downloading something
      } else {
        console.log("Module editor forcing navigation to modules list.");
        this.router.navigate(['/system/modules']);
      }
    });
  }

  toggleSidebar() {
    this.sidebarActive = !this.sidebarActive;
    console.log("Toggled sidebar to " + this.sidebarActive);
  }

  selectedBindingId(): string | null {
    let id = null;
    if (this.route.snapshot.firstChild) {
      id = this.route.snapshot.firstChild.paramMap.get('id');
    }
    return id;
  }

  downloadModule() {
    if (!this.module) return;
    
    let copy = JSON.parse(JSON.stringify(this.module));
    if (this.statusService.permissions.edit) {
      if (!copy.settings) {
        copy.settings = {};
      }
      copy.settings.editable = !this.download_locked;
    }
    const blob = new Blob([JSON.stringify(copy, null, "\t")], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.module.id || 'module'}.json`;
    a.click();
    this.toastrService.success("File saved to your browser downloads folder.", "Module Downloaded");
  }

  createBinding() {
    if (!this.module) return;
    
    if (!this.module.rules) {
      this.module.rules = new Rules();
    }
    
    let r = Binding.fromTemplate();
    this.module.rules.bindings.push(r);
    this.router.navigate(['bindings', r.id], { relativeTo: this.route });
  }

  saveToServer() {
    if (!this.module) return;
    
    if (this.dataService.savable() && this.module) {
      this.dataService.save(this.module);
    }
  }

  deleteBinding(b: Binding) {
    if (!this.module?.rules) return;
    
    let i = this.module.rules.bindings.indexOf(b, 0);
    if (i !== undefined && i > -1) {
      this.module.rules.bindings.splice(i, 1);
    }
    if (this.route.snapshot.firstChild?.paramMap.get("id") == b.id) {
      this.router.navigate(['.'], { relativeTo: this.route });
    }
  }

  duplicateBinding(b: Binding) {
    if (!this.module?.rules) return;
    
    const clone = JSON.parse(JSON.stringify(b));
    clone.id += '-copy';
    this.module.rules.bindings.push(clone);
    this.router.navigate(['bindings', clone.id], { relativeTo: this.route });
  }

  createCategory() {
    if (!this.module) return;
    
    const category = new InformationCategorySetting('NEW', 'New Category', 'Description');
    this.module.categories.push(category);
  }

  deleteCategory(category: InformationCategorySetting) {
    if (!this.module) return;
    
    const index = this.module.categories.indexOf(category);
    if (index > -1) {
      this.module.categories.splice(index, 1);
    }
  }

  createPurpose() {
    if (!this.module) return;
    
    const purpose = new InformationCategorySetting('NEW', 'New Purpose', 'Description');
    this.module.purposes.push(purpose);
  }

  deletePurpose(purpose: InformationCategorySetting) {
    if (!this.module) return;
    
    const index = this.module.purposes.indexOf(purpose);
    if (index > -1) {
      this.module.purposes.splice(index, 1);
    }
  }

  createPolicy() {
    if (!this.module) return;
    
    if (!this.module.policies) {
      this.module.policies = [];
    }
    
    const policy = new Policy('policy-' + uuid.v4().substring(0, 6), 'New Policy', '', '');
    this.module.policies.push(policy);
  }

  deletePolicy(policy: Policy) {
    if (!this.module || !this.module.policies) return;
    
    const index = this.module.policies.indexOf(policy);
    if (index > -1) {
      this.module.policies.splice(index, 1);
    }
  }
}

