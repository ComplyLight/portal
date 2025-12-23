// Author: Preston Lee

import { Injectable } from '@angular/core';
import { Permissions } from './models/permissions';
import { DataSegmentationModuleConfig } from './models/data-segmentation-module-config';

@Injectable({
  providedIn: 'root'
})
export class StatusService {

  public permissions: Permissions = new Permissions();

  constructor() { }

  updatePermissionsFor(module: DataSegmentationModuleConfig) {
    const editable = module.settings?.editable ?? true;
    console.log("Module request for editing support: " + editable);
    this.permissions.edit = editable;
  }
}

