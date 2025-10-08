import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LocationService } from '../../core/services/location.service';
import { BarrierlessCriteriaCheckService } from '../../core/services/barrierless-criteria-check.service';

@Component({
  selector: 'app-criteria-evaluation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './criteria-evaluation.component.html',
  styleUrls: ['./criteria-evaluation.component.css']
})
export class CriteriaEvaluationComponent implements OnInit {
  criteriaTree: any | null = null;
  selectedTypes: any[] = [];
  scores: { [criteriaId: string]: any } = {};
  locationId!: string; // 👈 буде зчитано з маршруту

  constructor(
    private route: ActivatedRoute,
    private locationService: LocationService,
    private checkService: BarrierlessCriteriaCheckService
  ) {}

  ngOnInit() {
    this.locationId = this.route.snapshot.paramMap.get('id')!;

    this.locationService.getLocationById(this.locationId).subscribe((location: any) => {
      if (!location?.type) {
        console.error('❌ Локація не має поля type!');
        return;
      }

      // ✅ передаємо просто ID типу
      this.locationService
        .getCriteriaTreeByTypeId(location.id)
        .subscribe(tree => (this.criteriaTree = tree));
    });
  }



  toggleType(type: any) {
    const index = this.selectedTypes.indexOf(type);
    if (index === -1) {
      this.selectedTypes.push(type);
    } else {
      this.selectedTypes.splice(index, 1);
      type.criterias.forEach((c: any) => delete this.scores[c.id]);
    }
  }

  isTypeSelected(type: any): boolean {
    return this.selectedTypes.includes(type);
  }

  onEvaluationChange(criteriaId: string, value: 'yes' | 'no') {
    if (!this.scores[criteriaId]) this.scores[criteriaId] = {};
    this.scores[criteriaId].value = value;
  }

  onCommentChange(event: Event, criteriaId: string) {
    const input = event.target as HTMLTextAreaElement;
    if (!this.scores[criteriaId]) this.scores[criteriaId] = {};
    this.scores[criteriaId].comment = input.value;
  }

  onFileChange(event: Event, criteriaId: string) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;

    const fileReaders: Promise<string>[] = Array.from(files).map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as string);
        reader.onerror = err => reject(err);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(fileReaders).then(images => {
      if (!this.scores[criteriaId]) this.scores[criteriaId] = {};
      this.scores[criteriaId].photos = images;
    });
  }

  /** 🔥 Відправка на бекенд */
  submitEvaluation() {
    const defaultUserId = '4c88cc0e-b5f8-478c-928b-08cc12f38423';

    // Формуємо масив DTO
    const checkList = Object.entries(this.scores).map(([criteriaId, data]: any) => ({
      locationId: this.locationId, // 👈 тепер автоматично з URL
      barrierlessCriteriaId: criteriaId,
      userId: defaultUserId,
      createdBy: defaultUserId,
      comment: data.comment || null,
      hasIssue: data.value === 'no',
      barrierFreeRating: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    this.checkService.saveAll(checkList).subscribe({
      next: (res) => {
        console.log('✅ Відповідь бекенду:', res);
        alert('Оцінку успішно надіслано!');
      },
      error: (err) => {
        console.error('❌ Помилка при відправці:', err);
        alert('Не вдалося надіслати оцінку.');
      }
    });
  }
}
