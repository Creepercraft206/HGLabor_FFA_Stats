import {Component, inject} from '@angular/core';
import {NgIf} from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [
    NgIf,
    RouterLink
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  mobileMenuOpen: boolean = false;

  openMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

}
