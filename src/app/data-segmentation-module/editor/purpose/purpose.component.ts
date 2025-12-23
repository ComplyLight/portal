// Author: Preston Lee

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InformationCategorySetting } from '@complylight/core';
import { BaseComponent } from '../../base.component';

@Component({
  selector: 'app-purpose',
  imports: [CommonModule, FormsModule],
  templateUrl: './purpose.component.html',
  styleUrl: './purpose.component.scss'
})
export class PurposeComponent extends BaseComponent {
  @Input() purpose!: InformationCategorySetting;
  @Input() allPurposes: InformationCategorySetting[] = [];
  @Input() editing: boolean = false;
  @Output() delete = new EventEmitter<InformationCategorySetting>();
  @Output() update = new EventEmitter<InformationCategorySetting>();

  availableParents(): InformationCategorySetting[] {
    // Return all purposes except this one and its descendants
    return this.allPurposes.filter(pur => 
      pur.act_code !== this.purpose.act_code && 
      !this.purpose.isDescendantOf(pur)
    );
  }

  onDelete() {
    this.delete.emit(this.purpose);
  }

  onUpdate() {
    this.update.emit(this.purpose);
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
    this.onUpdate();
  }
}

