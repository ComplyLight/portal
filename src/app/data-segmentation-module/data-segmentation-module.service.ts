// Author: Preston Lee

import { Injectable } from '@angular/core';
import { BaseService } from '../base/base.service';
import { Observable, throwError } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

export interface ModuleSummary {
    id: string;
    name: string;
    version?: string;
    description?: string;
    enabled: boolean;
}

export interface ModuleResponse {
    message: string;
    id?: string;
    error?: string;
    details?: string;
}

@Injectable({
    providedIn: 'root'
})
export class DataSegmentationModuleService extends BaseService {

    private static MODULES_PATH = '/modules';

    /**
     * Get the base URL for module endpoints
     */
    private modulesUrl(): string {
        const baseUrl = this.backendService.cdsUrl;
        if (!baseUrl) {
            throw new Error('CDS URL is not configured');
        }
        return baseUrl + DataSegmentationModuleService.MODULES_PATH;
    }

    /**
     * Get URL for a specific module
     */
    private moduleUrl(id: string): string {
        return this.modulesUrl() + '/' + id;
    }

    /**
     * Get URL for enabling a module
     */
    private enableModuleUrl(id: string): string {
        return this.moduleUrl(id) + '/enable';
    }

    /**
     * Get URL for disabling a module
     */
    private disableModuleUrl(id: string): string {
        return this.moduleUrl(id) + '/disable';
    }

    /**
     * Get headers with basic auth for admin operations
     */
    private adminHeaders(): HttpHeaders {
        // For now, we'll use the same headers as regular requests
        // In a production environment, you'd want to get credentials from a secure source
        // and add: headers.set('Authorization', 'Basic ' + btoa('administrator:password'))
        return this.backendService.headers();
    }

    /**
     * List all modules
     */
    list(): Observable<ModuleSummary[]> {
        if (!this.backendService.cdsUrl) {
            console.error('cdsUrl is not configured. Check COMPLYLIGHT_PORTAL_CDS_ROOT_URL configuration.');
            return throwError(() => new Error('CDS URL is not configured. Please check COMPLYLIGHT_PORTAL_CDS_ROOT_URL configuration.'));
        }
        try {
            const url = this.modulesUrl();
            console.log('Fetching modules from:', url);
            return this.http.get<ModuleSummary[]>(url, { 
                headers: this.backendService.headers() 
            });
        } catch (error) {
            console.error('Error constructing modules URL:', error);
            return throwError(() => error instanceof Error ? error : new Error('Failed to construct modules URL'));
        }
    }

    /**
     * Get a specific module by ID
     */
    get(id: string): Observable<any> {
        if (!this.backendService.cdsUrl) {
            return throwError(() => new Error('CDS URL is not configured. Please check COMPLYLIGHT_PORTAL_CDS_ROOT_URL configuration.'));
        }
        try {
            return this.http.get<any>(this.moduleUrl(id), { 
                headers: this.backendService.headers() 
            });
        } catch (error) {
            return throwError(() => error instanceof Error ? error : new Error('Failed to construct module URL'));
        }
    }

    /**
     * Get full module data by ID (for editor)
     */
    getFull(id: string): Observable<any> {
        return this.get(id);
    }

    /**
     * Update a module
     */
    update(id: string, module: any): Observable<ModuleResponse> {
        if (!this.backendService.cdsUrl) {
            return throwError(() => new Error('CDS URL is not configured. Please check COMPLYLIGHT_PORTAL_CDS_ROOT_URL configuration.'));
        }
        try {
            return this.http.put<ModuleResponse>(this.moduleUrl(id), module, { 
                headers: this.adminHeaders() 
            });
        } catch (error) {
            return throwError(() => error instanceof Error ? error : new Error('Failed to construct module URL'));
        }
    }

    /**
     * Enable a module
     */
    enable(id: string): Observable<ModuleResponse> {
        if (!this.backendService.cdsUrl) {
            return throwError(() => new Error('CDS URL is not configured. Please check COMPLYLIGHT_PORTAL_CDS_ROOT_URL configuration.'));
        }
        try {
            return this.http.post<ModuleResponse>(this.enableModuleUrl(id), {}, { 
                headers: this.adminHeaders() 
            });
        } catch (error) {
            return throwError(() => error instanceof Error ? error : new Error('Failed to construct enable module URL'));
        }
    }

    /**
     * Disable a module
     */
    disable(id: string): Observable<ModuleResponse> {
        if (!this.backendService.cdsUrl) {
            return throwError(() => new Error('CDS URL is not configured. Please check COMPLYLIGHT_PORTAL_CDS_ROOT_URL configuration.'));
        }
        try {
            return this.http.post<ModuleResponse>(this.disableModuleUrl(id), {}, { 
                headers: this.adminHeaders() 
            });
        } catch (error) {
            return throwError(() => error instanceof Error ? error : new Error('Failed to construct disable module URL'));
        }
    }

}

