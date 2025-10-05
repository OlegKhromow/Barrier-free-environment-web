import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-duplicates-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './duplicates-dialog.component.html',
  styleUrls: ['./duplicates-dialog.component.css'],
})
export class DuplicatesDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<DuplicatesDialogComponent>
  ) {}

  onProceed(): void {
    this.dialogRef.close({ action: 'proceed' });
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  onView(locId: string): void {
    this.dialogRef.close({ action: 'view', id: locId });
  }
}
