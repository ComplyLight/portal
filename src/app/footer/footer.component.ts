// Author: Preston Lee

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-footer',
	templateUrl: './footer.component.html',
	styleUrl: './footer.component.scss',
	imports: [RouterLink, CommonModule]
})
export class FooterComponent {

	constructor() {
	}

}

