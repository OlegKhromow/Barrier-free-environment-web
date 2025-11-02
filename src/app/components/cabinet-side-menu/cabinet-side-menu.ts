import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cabinet-side-menu',
  imports: [RouterModule],
  templateUrl: './cabinet-side-menu.html',
  styleUrl: './cabinet-side-menu.css'
})
export class CabinetSideMenu {
 @Input() isAdmin: boolean = false;
}
