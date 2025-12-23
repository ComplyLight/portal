// Author: Preston Lee

import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataSegmentationModuleService, ModuleSummary } from './data-segmentation-module.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-data-segmentation-module',
    templateUrl: './data-segmentation-module.component.html',
    styleUrls: ['./data-segmentation-module.component.scss'],
    imports: [CommonModule, RouterModule]
})
export class DataSegmentationModuleComponent implements OnInit {

    public modules = signal<ModuleSummary[]>([]);
    public loading = signal<boolean>(false);
    public togglingModules = signal<Set<string>>(new Set());
    
    public hasModules = computed(() => this.modules().length > 0);
    public isEmpty = computed(() => !this.loading() && this.modules().length === 0);

    constructor(
        private moduleService: DataSegmentationModuleService,
        private toastrService: ToastrService
    ) {
    }

    ngOnInit(): void {
        this.loadModules();
    }

    loadModules(): void {
        this.loading.set(true);
        console.log('Loading modules...');
        this.moduleService.list().subscribe({
            next: (modules) => {
                console.log('Modules loaded:', modules);
                this.modules.set(modules || []);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error loading modules:', error);
                console.error('Error details:', JSON.stringify(error, null, 2));
                const errorMessage = error?.error?.error || error?.message || 'Failed to load modules from server.';
                this.toastrService.error(errorMessage, 'Error');
                this.modules.set([]);
                this.loading.set(false);
            }
        });
    }

    toggleModule(module: ModuleSummary): void {
        const togglingSet = this.togglingModules();
        if (togglingSet.has(module.id)) {
            return; // Already toggling
        }

        const newSet = new Set(togglingSet);
        newSet.add(module.id);
        this.togglingModules.set(newSet);

        const operation = module.enabled 
            ? this.moduleService.disable(module.id)
            : this.moduleService.enable(module.id);

        operation.subscribe({
            next: (response) => {
                // Update the local module state
                const updatedModules = this.modules().map(m => 
                    m.id === module.id ? { ...m, enabled: !m.enabled } : m
                );
                this.modules.set(updatedModules);
                
                const updatedSet = new Set(this.togglingModules());
                updatedSet.delete(module.id);
                this.togglingModules.set(updatedSet);
                
                const updatedModule = updatedModules.find(m => m.id === module.id);
                const action = updatedModule?.enabled ? 'enabled' : 'disabled';
                this.toastrService.success(`Module "${module.name}" has been ${action}.`, 'Success');
            },
            error: (error) => {
                console.error('Error toggling module:', error);
                const updatedSet = new Set(this.togglingModules());
                updatedSet.delete(module.id);
                this.togglingModules.set(updatedSet);
                const action = module.enabled ? 'disable' : 'enable';
                this.toastrService.error(`Failed to ${action} module "${module.name}".`, 'Error');
            }
        });
    }

    isToggling(moduleId: string): boolean {
        return this.togglingModules().has(moduleId);
    }

}

