// Author: Preston Lee

import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Observable, throwError } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { DataSegmentationModuleService } from './data-segmentation-module.service';
import { StatusService } from './status.service';
import { DataSegmentationModuleConfig } from './models/data-segmentation-module-config';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ModuleEditorDataService {

  public loading = false;
  public loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public module: BehaviorSubject<DataSegmentationModuleConfig | null> = new BehaviorSubject<DataSegmentationModuleConfig | null>(null);
  
  // Expose loading as observable for reactive templates
  get isLoading$(): Observable<boolean> {
    return this.loading$.asObservable();
  }
  private originalModule: DataSegmentationModuleConfig | null = null;
  private loadModuleSubject = new Subject<string>();

  constructor(
    protected moduleService: DataSegmentationModuleService,
    protected statusService: StatusService,
    protected toastrService: ToastrService,
    protected router: Router
  ) {
    // Use switchMap to automatically cancel previous requests when a new one starts
    this.loadModuleSubject.pipe(
      tap(() => {
        console.log('[Service] Setting loading to true');
        this.loading = true;
        this.loading$.next(true);
        // Don't clear module state immediately - let switchMap handle cancellation
        // Clearing here causes the UI to flash empty
      }),
      switchMap((id: string) => {
        console.log('[Service] switchMap triggered for module:', id);
        return this.moduleService.getFull(id).pipe(
          tap((module: DataSegmentationModuleConfig) => {
            console.log('[Service] HTTP response received for:', id, 'module:', module?.id || 'null');
            // Verify the module has the expected structure
            if (!module || !module.id) {
              console.error('[Service] Invalid module data received');
              this.loading = false;
              this.loading$.next(false);
              this.toastrService.error("The server returned invalid module data.", "Invalid Module Data");
              this.module.next(null);
              this.originalModule = null;
              this.router.navigate(['/system/modules']);
              return;
            }
            
            // Verify the module ID matches what we requested
            if (module.id !== id) {
              console.warn(`[Service] Module ID mismatch: requested ${id}, got ${module.id}`);
            }
            
            console.log('[Service] Module valid, updating permissions and storing original');
            this.statusService.updatePermissionsFor(module);
            // Store original state for revert
            this.originalModule = JSON.parse(JSON.stringify(module));
            // Update loading state
            console.log('[Service] Setting loading to false');
            this.loading = false;
            this.loading$.next(false);
            // Emit the module - this must happen after loading is set to false
            console.log('[Service] Emitting module to BehaviorSubject:', module.id);
            this.module.next(module);
            console.log('[Service] Module emitted, current BehaviorSubject value:', this.module.value?.id || 'null');
          }),
          catchError((e: any) => {
            this.loading = false;
            this.loading$.next(false);
            this.module.next(null);
            this.originalModule = null;
            
            let errorMessage = "The module couldn't be loaded. Check the ID and your connectivity and try again.";
            
            // Provide more specific error messages
            if (e?.error?.error) {
              if (e.error.error === 'Module not found') {
                errorMessage = `Module "${id}" was not found on the server. It may have been deleted or the ID is incorrect.`;
              } else {
                errorMessage = `Server error: ${e.error.error}`;
              }
            } else if (e?.message) {
              errorMessage = `Error: ${e.message}`;
            }
            
            this.toastrService.error(errorMessage, "Couldn't load Module");
            return of(null);
          })
        );
      })
    ).subscribe();
  }

  loadModule(id: string) {
    console.log('[Service] loadModule called with:', id);
    // Only clear if loading a different module to prevent UI flashing
    const currentModuleId = this.module.value?.id;
    console.log('[Service] Current module ID:', currentModuleId || 'null');
    if (currentModuleId !== id) {
      console.log('[Service] Different module, clearing current module');
      this.module.next(null);
      this.originalModule = null;
    } else {
      console.log('[Service] Same module, keeping current module visible');
    }
    
    // Emit the ID to trigger the switchMap chain
    // switchMap will automatically cancel any previous request
    console.log('[Service] Emitting to loadModuleSubject:', id);
    this.loadModuleSubject.next(id);
  }
  
  /**
   * Clear all module state (useful when navigating away)
   */
  clearModule(): void {
    this.module.next(null);
    this.originalModule = null;
    this.loading = false;
    this.loading$.next(false);
  }

  savable(): boolean {
    return !!this.module.value?.id;
  }

  hasChanges(): boolean {
    if (!this.module.value || !this.originalModule) {
      return false;
    }
    return JSON.stringify(this.module.value) !== JSON.stringify(this.originalModule);
  }

  revert(): void {
    if (!this.originalModule) {
      this.toastrService.warning('No original state to revert to.', 'Cannot Revert');
      return;
    }
    
    const reverted = JSON.parse(JSON.stringify(this.originalModule));
    this.module.next(reverted);
    this.toastrService.success('Module reverted to original state.', 'Reverted');
  }

  save(module: DataSegmentationModuleConfig): Observable<any> {
    if (!module.id) {
      this.toastrService.error('No module ID available. Cannot save.', 'Error Saving');
      return throwError(() => new Error('No module ID'));
    }
    
    return this.moduleService.update(module.id, module).pipe(
      tap((data: any) => {
        // Update original state after successful save
        this.originalModule = JSON.parse(JSON.stringify(module));
        this.toastrService.success('Successfully updated the server. Changes should be effective immediately.', 'Module Saved');
      }),
      catchError((e: any) => {
        this.toastrService.error('Module could not be saved to remote server. Try downloading it locally and posting it later?', 'Error Saving');
        return throwError(() => e);
      })
    );
  }

}

