// Author: Preston Lee

import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../settings/settings.service';

@Component({
	selector: 'app-header',
	templateUrl: './header.component.html',
	styleUrl: './header.component.scss',
	imports: [RouterLink, RouterLinkActive, CommonModule, FormsModule]
})
export class HeaderComponent {

	constructor(protected settingsService: SettingsService) {
	}

	settings(): SettingsService { return this.settingsService; }

}

