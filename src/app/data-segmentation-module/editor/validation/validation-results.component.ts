// Author: Preston Lee

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValidationResult } from '../../module-schema.service';
import { ErrorObject } from 'ajv';

@Component({
  selector: 'app-validation-results',
  imports: [CommonModule],
  templateUrl: './validation-results.component.html',
  styleUrl: './validation-results.component.scss'
})
export class ValidationResultsComponent {
  @Input() validationResult: ValidationResult | null = null;

  get errors(): ErrorObject[] {
    return this.validationResult?.errors || [];
  }

  get isValid(): boolean {
    return this.validationResult?.valid ?? false;
  }

  getErrorMessage(error: ErrorObject): string {
    if (error.message) {
      return error.message;
    }
    return `${error.keyword} error at ${error.instancePath}`;
  }

  getParamKeys(params: Record<string, any>): string[] {
    return Object.keys(params);
  }
}

