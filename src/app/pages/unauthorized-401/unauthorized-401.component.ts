import { Component } from '@angular/core';
import { AuthService } from '../../core/services/security/auth.service';
import {MenuBarComponent} from '../../components/menu-bar/menu-bar.component';

@Component({
  selector: 'app-unauthorized-401',
  imports: [
    MenuBarComponent
  ],
  templateUrl: './unauthorized-401.component.html'
})
export class Unauthorized401Component {
  constructor(private auth: AuthService) {}
  openLogin() {
    this.auth.openLoginModal();
  }
}
