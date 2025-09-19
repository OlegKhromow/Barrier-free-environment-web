import {Component, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {MenuBarComponent} from './components/menu-bar/menu-bar.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, MenuBarComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Barrier-free-environment-web');
}
