// Author: Preston Lee

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Policy } from '@complylight/core';

@Component({
  selector: 'app-policy-edit-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './policy-edit-modal.component.html',
  styleUrl: './policy-edit-modal.component.scss'
})
export class PolicyEditModalComponent {
  @Input() policy!: Policy;
  @Output() save = new EventEmitter<Policy>();
  @Output() cancel = new EventEmitter<void>();

  onSave() {
    this.save.emit(this.policy);
  }

  onCancel() {
    this.cancel.emit();
  }
}

