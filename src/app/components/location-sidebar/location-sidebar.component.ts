import {Component, Input} from '@angular/core';
import {Location} from '../../core/models/location';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-location-sidebar',
  imports: [CommonModule],
  templateUrl: './location-sidebar.component.html',
  styleUrl: './location-sidebar.component.css'
})
export class LocationSidebarComponent {
  @Input() location: Location | null = null;
}
