import {Component, EventEmitter, inject, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {AlertService} from '../../core/services/alert.service';

@Component({
  selector: 'app-reject-dialog',
  imports: [
    FormsModule
  ],
  templateUrl: './reject-dialog.component.html',
  styleUrl: './reject-dialog.component.css'
})
export class RejectDialogComponent {
  @Output() cancel = new EventEmitter<void>();
  @Output() submit = new EventEmitter<string>();

  private alertService = inject(AlertService);

  rejectionReason = '';

  onSubmit() {
    if (!this.rejectionReason.trim()) {
      this.alertService.open('Вкажіть причину відхилення');
      return;
    }
    this.submit.emit(this.rejectionReason);
    this.rejectionReason = '';
  }

  onCancel() {
    this.rejectionReason = '';
    this.cancel.emit();
  }

}
