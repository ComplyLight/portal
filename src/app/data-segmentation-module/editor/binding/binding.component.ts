// Author: Preston Lee

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ModuleEditorDataService } from '../../module-editor-data.service';
import { StatusService } from '../../status.service';
import { BaseComponent } from '../../base.component';
import { CodeSet, CodeSetCoding, Binding, Policy } from '@complylight/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { DataSegmentationModuleConfig } from '../../models/data-segmentation-module-config';

@Component({
  selector: 'app-binding',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './binding.component.html',
  styleUrl: './binding.component.scss',
})
export class BindingComponent extends BaseComponent {

  binding: Binding | null = null;
  module: DataSegmentationModuleConfig | null = null;
  selectedCodeSet: CodeSet | null = null;
  showBulkImport: boolean = false;
  showCsvImport: boolean = false;
  csvImportText: string = '';
  bulkImportSystem: string = '';
  bulkImportCodes: string = '';
  bulkImportConfidence: number = 1.0;

  supportedCodeSystems: { name: string, system: string }[] = [
    { name: 'SNOMED CT', system: 'http://snomed.info/sct' },
    { name: 'LOINC', system: 'http://loinc.org' },
    { name: 'RxNorm', system: 'http://www.nlm.nih.gov/research/umls/rxnorm' }
  ];

  codeSystemUrlToName(url: string) {
    let name: string | null = null;
    this.supportedCodeSystems.forEach(n => {
      if (n.system == url) {
        name = n.name;
      }
    });
    return name;
  }

  constructor(private route: ActivatedRoute, protected http: HttpClient, public dataService: ModuleEditorDataService, public statusService: StatusService, public toastrService: ToastrService) {
    super();
    console.log(BindingComponent.name + " initializing.");
    this.resetBulkImport();
    this.route.paramMap.subscribe(pm => {
      let binding_id = pm.get('id')!;
      this.loadBindingFor(binding_id);
    });
  }

  loadBindingFor(id: string) {
    this.selectedCodeSet = null;
    this.dataService.module.subscribe(m => {
      if (m) {
        this.module = m;
        m.rules?.bindings.forEach(b => {
          if (id == b.id) {
            this.binding = b;
            if (!this.binding.labels) {
              this.binding.labels = [];
            }
            if (this.binding.codeSets.length > 0) {
              this.selectedCodeSet = this.binding.codeSets[0];
            } else {
              // Create a default code set if none exist
              const cs = Binding.codeSetFromTemplate();
              this.binding.codeSets.push(cs);
              this.selectedCodeSet = cs;
            }
            // Initialize policies array if not present
            if (!this.binding.policies) {
              this.binding.policies = [];
            }
          }
        });
      }
    });
  }

  availableCategories() {
    return this.module?.categories || [];
  }

  availablePurposes() {
    return this.module?.purposes || [];
  }

  availablePolicies() {
    return this.module?.policies || [];
  }

  isPolicySelected(policy: Policy): boolean {
    if (!this.binding?.policies) return false;
    return this.binding.policies.some(p => p.id === policy.id);
  }

  togglePolicy(policy: Policy) {
    if (!this.binding) return;
    
    if (!this.binding.policies) {
      this.binding.policies = [];
    }
    
    const index = this.binding.policies.findIndex(p => p.id === policy.id);
    if (index >= 0) {
      this.binding.policies.splice(index, 1);
    } else {
      this.binding.policies.push(policy);
    }
  }

  createLabel() {
    this.binding?.labels.push(Binding.labelFromTemplate());
  }

  deleteLabel(i: number) {
    if (i !== undefined && i > -1) {
      this.binding?.labels.splice(i, 1);
    }
  }

  createCodeSet() {
    if (this.binding) {
      const cs = Binding.codeSetFromTemplate();
      this.binding?.codeSets.push(cs);
      this.selectedCodeSet = cs;
    }
  }

  deleteCodeSet(i: number) {
    if (i !== undefined && i > -1) {
      this.binding?.codeSets.splice(i, 1);
    }
  }

  selectCodeSet(cs: CodeSet) {
    this.selectedCodeSet = cs;
  }

  createCode() {
    this.selectedCodeSet?.codes.push(CodeSet.codeFromTemplate());
  }

  duplicateCode(code: CodeSetCoding) {
    const clone: CodeSetCoding = JSON.parse(JSON.stringify(code));
    this.selectedCodeSet?.codes.push(clone);
  }

  deleteCode(i: number) {
    if (i !== undefined && i > -1) {
      this.selectedCodeSet?.codes.splice(i, 1);
    }
  }

  toggleBulkImport() {
    this.showBulkImport = !this.showBulkImport;
  }
  toggleCsvImport() {
    this.showCsvImport = !this.showCsvImport;
  }

  runBulkImport() {
    const codes = this.bulkImportCodes.split(/\s/);
    codes.forEach(n => {
      if (n != '') {
        let c = new CodeSetCoding()
        c.system = this.bulkImportSystem;
        c.code = n;
        c.confidence = this.bulkImportConfidence;
        this.selectedCodeSet?.codes.push(c);
      }
    });
    this.toastrService.success(`${codes.length} codes have been added.`, 'Import Completed');
    this.resetBulkImport();
  }

  runCsvImport() {
    const lines = this.csvImportText.split(/\n/)
      .map(n => { return n.trim(); })
      .filter(n => { return n.length > 0 });
    let errorLines: number[] = [];
    let codings: CodeSetCoding[] = [];
    lines.forEach((l, index) => {
      let [system, code, confidence]: string[] = l.split(',').map(n => { return n.trim() });
      if (!system || !code || !confidence) {
        console.log('CSV error at line ' + (index + 1));
        errorLines.push(index + 1);
      } else {
        let c = new CodeSetCoding();
        c.system = system
        c.code = code;
        c.confidence = Number(confidence);
        codings.push(c);
      }
    });
    if (errorLines.length > 0) {
      console.log(`Errors found in CSV text at lines ${errorLines.join(', ')}. Cancelling.`);
      this.toastrService.warning(`Import cancelled due to CSV errors at lines ${errorLines.join(', ')}. Please fix them and try again.`, 'CSV Errors');
    } else {
      codings.forEach(c => {
        this.selectedCodeSet?.codes.push(c);
      })
      this.toastrService.success(`${lines.length} codes have been added.`, 'Import Completed');
      this.resetCsvImport();
    }
  }

  resetCsvImport() {
    this.showCsvImport = false;
    this.csvImportText = '';
  }

  resetBulkImport() {
    this.showBulkImport = false;
    this.bulkImportSystem = '';
    this.bulkImportCodes = '';
    this.bulkImportConfidence = 1.0;
  }

  deduplicateCodes(cs: CodeSet) {
    let found: CodeSetCoding[] = [];
    let dupes: number[] = [];
    cs.codes.forEach((n, i) => {
      if (found.some(f => { return f.system == n.system && f.code == n.code })) {
        dupes.push(i);
      }
      found.push(n);
    })
    dupes.reverse();
    dupes.forEach(i => {
      cs.codes.splice(i, 1);
    });
  }
}

