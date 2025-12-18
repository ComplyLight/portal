// Author: Preston Lee

import { Injectable } from '@angular/core';
import { DataSegmentationModule, DataSegmentationModuleRegistry } from '@complylight/core';

@Injectable({
    providedIn: 'root'
})
export class ModuleRegistryService {

    private registry: DataSegmentationModuleRegistry;

    constructor() {
        this.registry = new DataSegmentationModuleRegistry();
        this.initializeDefaultModule();
    }

    /**
     * Get the module registry instance.
     */
    getRegistry(): DataSegmentationModuleRegistry {
        return this.registry;
    }

    /**
     * Initialize the registry with the default 42 CFR Part 2 module.
     * This module contains the standard ComplyLight information categories and purposes.
     */
    private initializeDefaultModule(): void {
        const defaultModule = DataSegmentationModule.fromJson({
            id: 'default-42cfr-part2',
            name: 'Default 42 CFR Part 2 Module',
            version: '1.0.0',
            description: 'Reference implementation module containing the default ComplyLight information categories and purposes based on 42 CFR Part 2 requirements',
            enabled: true,
            categories: [
                {
                    code: 'SUD',
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                    name: 'Substance Use',
                    description: 'Records possibly pertaining to commonly abused stantances.'
                },
                {
                    code: 'MENCAT',
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                    name: 'Mental Health',
                    description: 'All manner of mental health and wellbeing information.'
                },
                {
                    code: 'DEMO',
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                    name: 'Demographics',
                    description: 'General ethnic, social, and environmental background.'
                },
                {
                    code: 'DIA',
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                    name: 'Diagnoses',
                    description: 'Medically recognized conditions you have experienced.'
                },
                {
                    code: 'DIS',
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                    name: 'Disabilities',
                    description: 'Physical or mental conditions limiting movement, sense, or activity.'
                },
                {
                    code: 'GDIS',
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                    name: 'Genetics',
                    description: 'Genomic and molecular data that may indicate, for example, susceptability to heritable disease'
                },
                {
                    code: 'DISEASE',
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                    name: 'Infectious Diseases',
                    description: 'Past or present transmissible ailments.'
                },
                {
                    code: 'DRGIS',
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                    name: 'Medications',
                    description: 'Drugs prescribed to you.'
                },
                {
                    code: 'SEX',
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                    name: 'Sexual & Reproductive Health',
                    description: 'Information related to sexuality and reproductive health.'
                },
                {
                    code: 'SOCIAL',
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                    name: 'Social Determinents of Health',
                    description: 'Environmental and contextual factors that may impact your health.'
                },
                {
                    code: 'VIO',
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                    name: 'Violence',
                    description: 'Indicators of possible physical or mental harm by violence.'
                }
            ],
            purposes: [
                {
                    code: 'HIPAAConsentCD',
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                    name: 'Treatment',
                    description: 'For the purposes of providing or supporting care.'
                },
                {
                    code: 'RESEARCH',
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                    name: 'Research',
                    description: 'Scientific and academic research intended to benefit others.'
                }
            ],
            policies: [],
            rules: {
                bindings: []
            }
        });

        this.registry.addModule(defaultModule);
        console.log('ModuleRegistryService initialized with default module:', defaultModule.id);
    }

    /**
     * Get a merged module view from all enabled modules in the registry.
     * Useful for UI components that need to display all available categories/purposes.
     */
    getMergedModule(): DataSegmentationModule {
        return DataSegmentationModule.createFromRegistry(this.registry);
    }

}

