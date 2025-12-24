// Author: Preston Lee

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InformationCategorySetting } from '@complylight/core';

@Component({
  selector: 'app-purpose-edit-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './purpose-edit-modal.component.html',
  styleUrl: './purpose-edit-modal.component.scss'
})
export class PurposeEditModalComponent {
  @Input() purpose!: InformationCategorySetting;
  @Input() allPurposes: InformationCategorySetting[] = [];
  @Output() save = new EventEmitter<InformationCategorySetting>();
  @Output() cancel = new EventEmitter<void>();

  availableParents(): InformationCategorySetting[] {
    return this.allPurposes.filter(pur => 
      pur.act_code !== this.purpose.act_code && 
      !this.purpose.isDescendantOf(pur)
    );
  }

  parentCode(): string {
    return this.purpose.parent?.act_code || '';
  }

  setParent(parentCode: string) {
    if (!parentCode) {
      this.purpose.parent = undefined;
      this.purpose.parentCode = undefined;
    } else {
      const parent = this.allPurposes.find(p => p.act_code === parentCode);
      if (parent) {
        this.purpose.parent = parent;
        this.purpose.parentCode = parentCode;
      }
    }
  }

  onSave() {
    this.save.emit(this.purpose);
  }

  onCancel() {
    this.cancel.emit();
  }
}

