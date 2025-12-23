// Author: Preston Lee

import { InformationCategorySetting, Policy, Rules } from '@complylight/core';

export interface DataSegmentationModuleConfig {
  id: string;
  name: string;
  version?: string;
  description?: string;
  enabled: boolean;
  categories: InformationCategorySetting[];
  purposes: InformationCategorySetting[];
  policies?: Policy[];
  rules?: Rules;
  settings?: {
    editable: boolean;
  };
}

