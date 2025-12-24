// Author: Preston Lee

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import { DataSegmentationModuleConfig } from './models/data-segmentation-module-config';
import { BackendService } from '../backend/backend.service';

export interface ValidationResult {
  valid: boolean;
  errors: ErrorObject[] | null;
}

@Injectable({
  providedIn: 'root'
})
export class ModuleSchemaService {

  private ajv: Ajv;
  private cachedSchema: any = null;
  private validateFunction: ValidateFunction | null = null;

  constructor(
    private http: HttpClient,
    private backendService: BackendService
  ) {
    this.ajv = new Ajv({ allErrors: true, verbose: true });
  }

  /**
   * Get the JSON schema for module validation
   * Uses the defined schema (server schema endpoint may not be available)
   */
  getSchema(): Observable<any> {
    if (this.cachedSchema) {
      return of(this.cachedSchema);
    }

    // Use defined schema directly
    // The server schema endpoint (/modules/schema) may not be available
    this.cachedSchema = this.getDefinedSchema();
    this.compileSchema();
    return of(this.cachedSchema);
  }

  /**
   * Define the JSON schema for DataSegmentationModuleConfig
   */
  private getDefinedSchema(): any {
    return {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "required": ["id", "name", "enabled", "categories", "purposes"],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "name": {
          "type": "string",
          "minLength": 1
        },
        "version": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "enabled": {
          "type": "boolean"
        },
        "categories": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["act_code", "name"],
            "properties": {
              "act_code": {
                "type": "string",
                "minLength": 1
              },
              "name": {
                "type": "string",
                "minLength": 1
              },
              "system": {
                "type": "string"
              },
              "description": {
                "type": "string"
              },
              "enabled": {
                "type": "boolean"
              },
              "parentCode": {
                "type": "string"
              }
            }
          }
        },
        "purposes": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["act_code", "name"],
            "properties": {
              "act_code": {
                "type": "string",
                "minLength": 1
              },
              "name": {
                "type": "string",
                "minLength": 1
              },
              "system": {
                "type": "string"
              },
              "description": {
                "type": "string"
              },
              "enabled": {
                "type": "boolean"
              },
              "parentCode": {
                "type": "string"
              }
            }
          }
        },
        "policies": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "name"],
            "properties": {
              "id": {
                "type": "string",
                "minLength": 1
              },
              "name": {
                "type": "string",
                "minLength": 1
              },
              "control_authority": {
                "type": "string"
              },
              "control_id": {
                "type": "string"
              }
            }
          }
        },
        "rules": {
          "type": "object",
          "properties": {
            "bindings": {
              "type": "array",
              "items": {
                "type": "object",
                "required": ["id"],
                "properties": {
                  "id": {
                    "type": "string",
                    "minLength": 1
                  },
                  "category": {
                    "type": "string"
                  },
                  "purpose": {
                    "type": "string"
                  },
                  "basis": {
                    "type": "object",
                    "properties": {
                      "system": {
                        "type": "string"
                      },
                      "code": {
                        "type": "string"
                      },
                      "display": {
                        "type": "string"
                      }
                    }
                  },
                  "labels": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "system": {
                          "type": "string"
                        },
                        "code": {
                          "type": "string"
                        },
                        "display": {
                          "type": "string"
                        }
                      }
                    }
                  },
                  "codeSets": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "groupID": {
                          "type": "string"
                        },
                        "codes": {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "system": {
                                "type": "string"
                              },
                              "code": {
                                "type": "string"
                              },
                              "confidence": {
                                "type": "number",
                                "minimum": 0,
                                "maximum": 1
                              }
                            }
                          }
                        }
                      }
                    }
                  },
                  "policies": {
                    "type": "array",
                    "items": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        },
        "settings": {
          "type": "object",
          "properties": {
            "editable": {
              "type": "boolean"
            }
          }
        }
      }
    };
  }

  /**
   * Compile the schema for validation
   */
  private compileSchema(): void {
    if (this.cachedSchema) {
      try {
        this.validateFunction = this.ajv.compile(this.cachedSchema);
      } catch (error) {
        console.error('Error compiling schema:', error);
        this.validateFunction = null;
      }
    }
  }

  /**
   * Validate a module against the schema
   */
  validate(module: DataSegmentationModuleConfig): ValidationResult {
    if (!this.validateFunction) {
      // Schema not loaded yet, try to get it synchronously
      this.cachedSchema = this.getDefinedSchema();
      this.compileSchema();
    }

    if (!this.validateFunction) {
      return {
        valid: false,
        errors: [{
          instancePath: '',
          schemaPath: '',
          keyword: 'schema',
          params: {},
          message: 'Schema not available for validation'
        } as ErrorObject]
      };
    }

    const valid = this.validateFunction(module);
    return {
      valid: valid,
      errors: valid ? null : (this.validateFunction.errors || [])
    };
  }

  /**
   * Initialize schema (fetch or use defined)
   */
  initialize(): Observable<void> {
    return this.getSchema().pipe(
      map(() => undefined)
    );
  }
}

