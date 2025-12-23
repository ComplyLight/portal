// Author: Preston Lee

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InformationCategorySetting } from '@complylight/core';
import { BaseComponent } from '../../base.component';

@Component({
  selector: 'app-category',
  imports: [CommonModule, FormsModule],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss'
})
export class CategoryComponent extends BaseComponent {
  @Input() category!: InformationCategorySetting;
  @Input() allCategories: InformationCategorySetting[] = [];
  @Input() editing: boolean = false;
  @Output() delete = new EventEmitter<InformationCategorySetting>();
  @Output() update = new EventEmitter<InformationCategorySetting>();

  availableParents(): InformationCategorySetting[] {
    // Return all categories except this one and its descendants
    return this.allCategories.filter(cat => 
      cat.act_code !== this.category.act_code && 
      !this.category.isDescendantOf(cat)
    );
  }

  onDelete() {
    this.delete.emit(this.category);
  }

  onUpdate() {
    this.update.emit(this.category);
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
    this.onUpdate();
  }
}

