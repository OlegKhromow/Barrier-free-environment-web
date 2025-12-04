import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-alert-modal',
  imports: [],
  templateUrl: './alert-modal.component.html',
  styleUrl: './alert-modal.component.css'
})
export class AlertModalComponent {
  @Input() message: string | null = null;
  @Output() closed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }
}
