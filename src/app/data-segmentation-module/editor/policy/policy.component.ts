// Author: Preston Lee

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Policy } from '@complylight/core';
import { BaseComponent } from '../../base.component';

@Component({
  selector: 'app-policy',
  imports: [CommonModule, FormsModule],
  templateUrl: './policy.component.html',
  styleUrl: './policy.component.scss'
})
export class PolicyComponent extends BaseComponent {
  @Input() policy!: Policy;
  @Input() editing: boolean = false;
  @Output() delete = new EventEmitter<Policy>();
  @Output() update = new EventEmitter<Policy>();

  onDelete() {
    this.delete.emit(this.policy);
  }

  onUpdate() {
    this.update.emit(this.policy);
  }
}

