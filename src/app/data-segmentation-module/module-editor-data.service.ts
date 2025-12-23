// Author: Preston Lee

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
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
  public module: BehaviorSubject<DataSegmentationModuleConfig | null> = new BehaviorSubject<DataSegmentationModuleConfig | null>(null);

  constructor(
    protected moduleService: DataSegmentationModuleService,
    protected statusService: StatusService,
    protected toastrService: ToastrService,
    protected router: Router
  ) {
  }

  loadModule(id: string) {
    this.loading = true;
    this.moduleService.getFull(id).subscribe({
      next: (module: DataSegmentationModuleConfig) => {
        this.loading = false;
        this.statusService.updatePermissionsFor(module);
        this.module.next(module);
      },
      error: (e: any) => {
        this.loading = false;
        this.toastrService.error("The module couldn't be loaded. Check the ID and your connectivity and try again.", "Couldn't load Module");
        this.router.navigate(['/system/modules']);
      }
    });
  }

  savable(): boolean {
    return !!this.module.value?.id;
  }

  save(module: DataSegmentationModuleConfig) {
    if (!module.id) {
      this.toastrService.error('No module ID available. Cannot save.', 'Error Saving');
      return;
    }
    
    this.moduleService.update(module.id, module).subscribe({
      next: (data: any) => {
        this.toastrService.success('Successfully updated the server. Changes should be effective immediately.', 'Module Saved');
      }, 
      error: (e: any) => {
        this.toastrService.error('Module could not be saved to remote server. Try downloading it locally and posting it later?', 'Error Saving');
      }
    });
  }

}

