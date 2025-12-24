// Author: Preston Lee

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InformationCategorySetting } from '@complylight/core';

@Component({
  selector: 'app-category-edit-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './category-edit-modal.component.html',
  styleUrl: './category-edit-modal.component.scss'
})
export class CategoryEditModalComponent {
  @Input() category!: InformationCategorySetting;
  @Input() allCategories: InformationCategorySetting[] = [];
  @Output() save = new EventEmitter<InformationCategorySetting>();
  @Output() cancel = new EventEmitter<void>();

  availableParents(): InformationCategorySetting[] {
    return this.allCategories.filter(cat => 
      cat.act_code !== this.category.act_code && 
      !this.category.isDescendantOf(cat)
    );
  }

  parentCode(): string {
    return this.category.parent?.act_code || '';
  }

  setParent(parentCode: string) {
    if (!parentCode) {
      this.category.parent = undefined;
      this.category.parentCode = undefined;
    } else {
      const parent = this.allCategories.find(c => c.act_code === parentCode);
      if (parent) {
        this.category.parent = parent;
        this.category.parentCode = parentCode;
      }
    }
  }

  onSave() {
    this.save.emit(this.category);
  }

  onCancel() {
    this.cancel.emit();
  }
}

