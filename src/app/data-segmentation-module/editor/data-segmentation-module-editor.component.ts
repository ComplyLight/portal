// Author: Preston Lee

import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { ModuleEditorDataService } from '../module-editor-data.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StatusService } from '../status.service';
import { BaseComponent } from '../base.component';
import { Binding, InformationCategorySetting, Policy, Rules } from '@complylight/core';
import { DataSegmentationModuleConfig } from '../models/data-segmentation-module-config';
import { ModuleSchemaService, ValidationResult } from '../module-schema.service';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged, map } from 'rxjs/operators';

import * as uuid from 'uuid';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ValidationResultsComponent } from './validation/validation-results.component';
import { CategoryEditModalComponent } from './modals/category-edit-modal.component';
import { PurposeEditModalComponent } from './modals/purpose-edit-modal.component';
import { PolicyEditModalComponent } from './modals/policy-edit-modal.component';
import { ConfirmationModalComponent } from './modals/confirmation-modal.component';

@Component({
  selector: 'app-data-segmentation-module-editor',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ValidationResultsComponent, CategoryEditModalComponent, PurposeEditModalComponent, PolicyEditModalComponent, ConfirmationModalComponent],
  templateUrl: './data-segmentation-module-editor.component.html',
  styleUrl: './data-segmentation-module-editor.component.scss'
})
export class DataSegmentationModuleEditorComponent extends BaseComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  
  public module = signal<DataSegmentationModuleConfig | null>(null);
  public loading = signal<boolean>(false);
  public activeTab = signal<string>('basic');
  public isValidating: boolean = false;
  public isSaving: boolean = false;
  public validationResult: ValidationResult | null = null;
  public showValidationModal: boolean = false;
  
  // Modal states
  public showCategoryModal: boolean = false;
  public showPurposeModal: boolean = false;
  public showPolicyModal: boolean = false;
  public editingCategory: InformationCategorySetting | null = null;
  public editingPurpose: InformationCategorySetting | null = null;
  public editingPolicy: Policy | null = null;
  
  // Confirmation modal state
  public showConfirmModal: boolean = false;
  public confirmTitle: string = 'Confirm Action';
  public confirmMessage: string = 'Are you sure?';
  public confirmButtonClass: string = 'btn-primary';
  private confirmCallback: (() => void) | null = null;
  
  constructor(
    public dataService: ModuleEditorDataService, 
    public statusService: StatusService, 
    protected toastrService: ToastrService, 
    protected http: HttpClient, 
    protected route: ActivatedRoute, 
    protected router: Router,
    protected schemaService: ModuleSchemaService
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
  
  getCategoryName(code: string | undefined): string {
    const module = this.module();
    if (!module || !code) return '';
    const category = module.categories.find(c => c.act_code === code);
    return category?.name || '';
  }

  getPurposeName(code: string | undefined): string {
    const module = this.module();
    if (!module || !code) return '';
    const purpose = module.purposes.find(p => p.act_code === code);
    return purpose?.name || '';
  }

  getBindingsCount(): number {
    return this.module()?.rules?.bindings?.length || 0;
  }

  // Helper methods for two-way binding with signals
  updateModuleField(field: keyof DataSegmentationModuleConfig, value: any) {
    const current = this.module();
    if (!current) return;
    this.module.set({ ...current, [field]: value });
  }

  ngOnInit(): void {
    console.log('[Editor] ngOnInit called');
    // Initialize schema service once
    this.schemaService.initialize().pipe(takeUntil(this.destroy$)).subscribe();
    
    // Convert BehaviorSubject to signal using toSignal
    // Initialize loading signal from current value
    this.loading.set(this.dataService.loading$.value);
    console.log('[Editor] Initial loading state:', this.loading());
    this.dataService.loading$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(loading => {
      console.log('[Editor] Loading state changed:', loading);
      this.loading.set(loading);
    });
    
    // Initialize module signal from current value
    this.module.set(this.dataService.module.value);
    console.log('[Editor] Initial module state:', this.module()?.id || 'null');
    this.dataService.module.pipe(
      takeUntil(this.destroy$)
    ).subscribe(m => {
      console.log('[Editor] Module update received:', m?.id || 'null', 'loading:', this.loading(), 'module truthy:', !!m);
      this.module.set(m);
      console.log('[Editor] After assignment - module:', this.module()?.id || 'null', 'truthy:', !!this.module());
      console.log('[Editor] Template condition - loading:', this.loading(), 'module:', !!this.module(), 'should show editor:', !this.loading() && !!this.module());
      
      // If we have a module, check if we're on a binding route
      if (m) {
        const binding_id = this.route.snapshot.firstChild?.paramMap.get('id');
        if (binding_id) {
          this.activeTab.set('bindings');
        }
      }
    });
    
    // Subscribe to route parameter changes - use distinctUntilChanged to avoid duplicate loads
    this.route.paramMap.pipe(
      map(params => params.get('id')),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(moduleId => {
      console.log('[Editor] Route param changed:', moduleId);
      if (moduleId) {
        // Reset component state when route changes
        this.activeTab.set('basic');
        this.closeAllModals();
        // Load the module - service will clear its state and load fresh data
        console.log('[Editor] Calling loadModule with:', moduleId);
        this.dataService.loadModule(moduleId);
      } else {
        // No module ID in route, clear all state
        console.log('[Editor] No module ID in route, clearing state');
        this.module.set(null);
        this.dataService.clearModule();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  downloadModule() {
    const module = this.module();
    if (!module) return;
    
    let copy = JSON.parse(JSON.stringify(module));
    if (this.statusService.permissions.edit) {
      if (!copy.settings) {
        copy.settings = {};
      }
      copy.settings.editable = true;
    }
    const blob = new Blob([JSON.stringify(copy, null, "\t")], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${module.id || 'module'}.json`;
    a.click();
    this.toastrService.success("File saved to your browser downloads folder.", "Module Downloaded");
  }

  validateModule() {
    const module = this.module();
    if (!module) return;
    
    this.isValidating = true;
    this.validationResult = this.schemaService.validate(module);
    this.isValidating = false;
    this.showValidationModal = true;
    
    if (this.validationResult.valid) {
      this.toastrService.success('Module is valid according to the schema.', 'Validation Successful');
    } else {
      this.toastrService.warning(`Validation found ${this.validationResult.errors?.length || 0} error(s).`, 'Validation Issues');
    }
  }

  closeValidationModal() {
    this.showValidationModal = false;
  }

  revertModule() {
    this.showConfirmation(
      'Revert Changes',
      'Are you sure you want to revert all changes? This cannot be undone.',
      'btn-warning',
      () => {
        this.dataService.revert();
      }
    );
  }

  saveToServer() {
    const module = this.module();
    if (!module) return;
    
    this.isSaving = true;
    this.dataService.save(module).subscribe({
      next: () => {
        this.isSaving = false;
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  createBinding() {
    const module = this.module();
    if (!module) return;
    
    const updatedModule = { ...module };
    if (!updatedModule.rules) {
      updatedModule.rules = { bindings: [] } as unknown as Rules;
    }
    if (!updatedModule.rules.bindings) {
      updatedModule.rules.bindings = [];
    }
    
    let r = Binding.fromTemplate();
    updatedModule.rules = { ...updatedModule.rules, bindings: [...updatedModule.rules.bindings, r] } as unknown as Rules;
    this.module.set(updatedModule);
    this.router.navigate(['bindings', r.id], { relativeTo: this.route });
  }

  deleteBinding(b: Binding) {
    const module = this.module();
    if (!module?.rules) return;
    
    this.showConfirmation(
      'Delete Binding',
      `Are you sure you want to delete binding "${b.id}"?`,
      'btn-danger',
      () => {
        const updatedModule = { ...module };
        if (!updatedModule.rules) return;
        let i = updatedModule.rules.bindings.indexOf(b, 0);
        if (i !== undefined && i > -1) {
          updatedModule.rules.bindings = [...updatedModule.rules.bindings];
          updatedModule.rules.bindings.splice(i, 1);
          this.module.set(updatedModule);
        }
        if (this.route.snapshot.firstChild?.paramMap.get("id") == b.id) {
          this.router.navigate(['.'], { relativeTo: this.route });
        }
      }
    );
  }

  duplicateBinding(b: Binding) {
    const module = this.module();
    if (!module?.rules) return;
    
    const updatedModule = { ...module };
    if (!updatedModule.rules) return;
    const clone = JSON.parse(JSON.stringify(b));
    clone.id += '-copy';
    updatedModule.rules = { ...updatedModule.rules, bindings: [...updatedModule.rules.bindings, clone] } as unknown as Rules;
    this.module.set(updatedModule);
    this.router.navigate(['bindings', clone.id], { relativeTo: this.route });
  }

  // Category modal methods
  openCategoryModal(category?: InformationCategorySetting) {
    if (category) {
      this.editingCategory = JSON.parse(JSON.stringify(category));
    } else {
      this.editingCategory = new InformationCategorySetting('NEW', 'New Category', 'Description');
    }
    this.showCategoryModal = true;
  }

  closeCategoryModal() {
    this.showCategoryModal = false;
    this.editingCategory = null;
  }

  onCategorySave(category: InformationCategorySetting) {
    const module = this.module();
    if (!module) return;
    
    const updatedModule = { ...module, categories: [...module.categories] };
    const isNew = this.editingCategory?.act_code === 'NEW';
    if (isNew) {
      // New category - remove if it was added temporarily
      const tempIndex = updatedModule.categories.findIndex(c => c.act_code === 'NEW');
      if (tempIndex >= 0) {
        updatedModule.categories.splice(tempIndex, 1);
      }
      updatedModule.categories.push(category);
    } else {
      // Update existing - find by original code if it changed
      const originalCode = this.editingCategory?.act_code;
      const index = updatedModule.categories.findIndex(c => c.act_code === originalCode);
      if (index >= 0) {
        // Replace the category
        updatedModule.categories[index] = JSON.parse(JSON.stringify(category));
      }
    }
    this.module.set(updatedModule);
    this.closeCategoryModal();
  }

  deleteCategory(category: InformationCategorySetting) {
    const module = this.module();
    if (!module) return;
    
    this.showConfirmation(
      'Delete Category',
      `Are you sure you want to delete category "${category.name}"?`,
      'btn-danger',
      () => {
        const updatedModule = { ...module, categories: [...module.categories] };
        const index = updatedModule.categories.indexOf(category);
        if (index > -1) {
          updatedModule.categories.splice(index, 1);
          this.module.set(updatedModule);
        }
      }
    );
  }

  // Purpose modal methods
  openPurposeModal(purpose?: InformationCategorySetting) {
    if (purpose) {
      this.editingPurpose = JSON.parse(JSON.stringify(purpose));
    } else {
      this.editingPurpose = new InformationCategorySetting('NEW', 'New Purpose', 'Description');
    }
    this.showPurposeModal = true;
  }

  closePurposeModal() {
    this.showPurposeModal = false;
    this.editingPurpose = null;
  }

  onPurposeSave(purpose: InformationCategorySetting) {
    const module = this.module();
    if (!module) return;
    
    const updatedModule = { ...module, purposes: [...module.purposes] };
    const isNew = this.editingPurpose?.act_code === 'NEW';
    if (isNew) {
      // New purpose - remove if it was added temporarily
      const tempIndex = updatedModule.purposes.findIndex(p => p.act_code === 'NEW');
      if (tempIndex >= 0) {
        updatedModule.purposes.splice(tempIndex, 1);
      }
      updatedModule.purposes.push(purpose);
    } else {
      // Update existing - find by original code if it changed
      const originalCode = this.editingPurpose?.act_code;
      const index = updatedModule.purposes.findIndex(p => p.act_code === originalCode);
      if (index >= 0) {
        // Replace the purpose
        updatedModule.purposes[index] = JSON.parse(JSON.stringify(purpose));
      }
    }
    this.module.set(updatedModule);
    this.closePurposeModal();
  }

  deletePurpose(purpose: InformationCategorySetting) {
    const module = this.module();
    if (!module) return;
    
    this.showConfirmation(
      'Delete Purpose',
      `Are you sure you want to delete purpose "${purpose.name}"?`,
      'btn-danger',
      () => {
        const updatedModule = { ...module, purposes: [...module.purposes] };
        const index = updatedModule.purposes.indexOf(purpose);
        if (index > -1) {
          updatedModule.purposes.splice(index, 1);
          this.module.set(updatedModule);
        }
      }
    );
  }

  // Policy modal methods
  openPolicyModal(policy?: Policy) {
    if (policy) {
      this.editingPolicy = JSON.parse(JSON.stringify(policy));
    } else {
      this.editingPolicy = new Policy('policy-' + uuid.v4().substring(0, 6), 'New Policy', '', '');
    }
    this.showPolicyModal = true;
  }

  closePolicyModal() {
    this.showPolicyModal = false;
    this.editingPolicy = null;
  }

  onPolicySave(policy: Policy) {
    const module = this.module();
    if (!module) return;
    
    const policies = module.policies ? [...module.policies] : [];
    const updatedModule = { ...module, policies };
    
    const index = policies.findIndex(p => p.id === policy.id);
    if (index >= 0) {
      // Update existing - use deep clone to avoid reference issues
      policies[index] = JSON.parse(JSON.stringify(policy));
    } else {
      // New policy - use deep clone
      policies.push(JSON.parse(JSON.stringify(policy)));
    }
    updatedModule.policies = policies;
    this.module.set(updatedModule);
    this.closePolicyModal();
  }

  deletePolicy(policy: Policy) {
    const module = this.module();
    if (!module || !module.policies) return;
    
    this.showConfirmation(
      'Delete Policy',
      `Are you sure you want to delete policy "${policy.name}"?`,
      'btn-danger',
      () => {
        const policies = [...module.policies!];
        const updatedModule = { ...module, policies };
        const index = policies.indexOf(policy);
        if (index > -1) {
          policies.splice(index, 1);
          updatedModule.policies = policies;
          this.module.set(updatedModule);
        }
      }
    );
  }

  // Confirmation modal methods
  showConfirmation(title: string, message: string, buttonClass: string, callback: () => void) {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmButtonClass = buttonClass;
    this.confirmCallback = callback;
    this.showConfirmModal = true;
  }

  onConfirm() {
    if (this.confirmCallback) {
      this.confirmCallback();
      this.confirmCallback = null;
    }
    this.showConfirmModal = false;
  }

  onCancelConfirm() {
    this.confirmCallback = null;
    this.showConfirmModal = false;
  }

  private closeAllModals(): void {
    this.showCategoryModal = false;
    this.showPurposeModal = false;
    this.showPolicyModal = false;
    this.showValidationModal = false;
    this.showConfirmModal = false;
    this.editingCategory = null;
    this.editingPurpose = null;
    this.editingPolicy = null;
    this.confirmCallback = null;
  }
}
