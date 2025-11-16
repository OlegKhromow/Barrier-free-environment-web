import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {LocationService} from '../../core/services/location.service';
import {BarrierlessCriteriaCheckService} from '../../core/services/barrierless-criteria-check.service';
import {AuthService} from '../../core/services/security/auth.service';
import { v4 as uuidv4 } from 'uuid';

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
  locationId!: string;

  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private locationService: LocationService,
    private checkService: BarrierlessCriteriaCheckService,
  ) {
  }

  ngOnInit() {
    this.locationId = this.route.snapshot.paramMap.get('id')!;
    this.loadCriteriaTreeForUser();
  }

  /** 🔹 Отримує дерево критеріїв і заповнює форму, якщо є старі відгуки */
  loadCriteriaTreeForUser() {
    this.isLoading = true;

    this.locationService.getLocationById(this.locationId).subscribe({
      next: (location: any) => {
        if (!location?.type) {
          console.error('Локація не має поля type!');
          this.isLoading = false;
          return;
        }

        this.locationService.getCriteriaTreeByUser(location.id).subscribe({
          next: (tree) => {
            this.criteriaTree = tree;
            this.initializeScoresFromTree(tree);
            console.log('Дерево критеріїв завантажено:', tree);
            this.isLoading = false; // коли все готово
          },
          error: (err) => {
            console.error('Помилка при завантаженні дерева критеріїв:', err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Помилка при завантаженні локації:', err);
        this.isLoading = false;
      }
    });
  }

  /** 🧩 Заповнює форму попередніми оцінками користувача */
initializeScoresFromTree(tree: any) {
  if (!tree?.group?.types) return;

  tree.group.types.forEach((type: any) => {
    type.criterias.forEach((criteria: any) => {

      if (criteria.barrierlessCriteriaChecks?.length > 0) {
        const userCheck = criteria.barrierlessCriteriaChecks[0];

        this.scores[criteria.id] = {
          value: userCheck.hasIssue ? 'no' : 'yes',
          comment: userCheck.comment || '',
          photos: [],  // спочатку порожнє
          imageServiceId: userCheck.imageServiceId
        };

        console.log('Завантаження фото для критерію:', userCheck.imageServiceId, "##", userCheck);
        // Якщо фото існують → завантажуємо їх
        if (userCheck.imageServiceId) {
          this.loadCheckImages(criteria.id, userCheck.imageServiceId);
        }

        // Автоматично відкриваємо тип
        if (!this.selectedTypes.includes(type)) {
          this.selectedTypes.push(type);
        }
      }
    });
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

  /*
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
*/
onFileChange(event: any, criteriaId: string) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  if (!this.scores[criteriaId]) {
    this.scores[criteriaId] = { value: null, comment: '', photos: [] };
  }

  for (let file of files) {
    const reader = new FileReader();

    reader.onload = () => {
      this.scores[criteriaId].photos.push({
        file,
        preview: reader.result as string   // <<< ОЦЕ ВАЖЛИВО
      });
    };

    reader.readAsDataURL(file);
  }
}

  /** Відправка на бекенд */
  /*
submitEvaluation() {
  const formData = new FormData();

  Object.entries(this.scores).forEach(([criteriaId, data]: any) => {
    const dto = {
      locationId: this.locationId,
      barrierlessCriteriaId: criteriaId,
      comment: data.comment || null,
      hasIssue: data.value === 'no',
      barrierFreeRating: null
    };

    formData.append('checks', new Blob([JSON.stringify(dto)], { type: 'application/json' }));

    if (data.photos) {
      data.photos.forEach((p: { file: File }) => {
        formData.append('photos', p.file);
      });
    }
  });

  this.checkService.saveAll(formData).subscribe({
    next: res => {
      console.log('Відповідь бекенду:', res);
      alert('Оцінку успішно надіслано!');
    },
    error: err => {
      console.error('Помилка при відправці:', err);
      alert('Не вдалося надіслати оцінку.');
    }
  });
}
*/

submitEvaluation() {
  const checkList: any[] = [];

  Object.entries(this.scores).forEach(([criteriaId, data]: any) => {
    const imageId = uuidv4();
    const dto = {
      locationId: this.locationId,
      barrierlessCriteriaId: criteriaId,
      comment: data.comment || null,
      hasIssue: data.value === 'no',
      barrierFreeRating: null,
      imageServiceId: imageId,
    };

    checkList.push(dto);

    if (data.photos?.length) {
      const formData = new FormData();
      data.photos.forEach((p: { file: File }) => {
        formData.append('files', p.file); // Тепер масив файлів
      });

      console.log('Завантаження фото для', imageId);
      this.checkService.uploadAllCheckImages(this.locationId, imageId, formData).subscribe({
        next: res => console.log('Фото завантажено для', imageId, res),
        error: err => console.error('Помилка при завантаженні фото:', err),
      });
    }
  });

  this.checkService.saveAll(checkList).subscribe({
    next: res => {
      console.log('Відповідь бекенду:', res);
      alert('Оцінку успішно надіслано!');
    },
    error: err => {
      console.error('Помилка при відправці чеків:', err);
      alert('Не вдалося надіслати оцінку.');
    }
  });
}

loadCheckImages(criteriaId: string, imageId: string) {
  const combinedId = `${this.locationId}_${imageId}`;

  this.checkService.getCheckImages(combinedId).subscribe({
    next: (res: any) => {
      console.log("RAW images response:", res);

this.scores[criteriaId].photos = Object.entries(res).map(
  ([imageId, url]) => ({
    file: null,
    preview: url as string,
    backendId: imageId
  })
);
    },
    error: err => console.error('Не вдалося отримати фото для', imageId, err)
  });
}


removePhoto(criteriaId: string, index: number, img: any) {
  const entry = this.scores[criteriaId];

  // 1. Якщо фото ще НЕ з бекенду → просто видаляємо з масиву
  if (!img.backendId) {
    entry.photos.splice(index, 1);
    return;
  }

  // 2. Фото вже на бекенді — викликаємо delete API
  const checkImageId = entry.imageServiceId; // service id який ти зберігаєш
  const imageId = img.backendId; // id файла

  this.checkService.deleteCheckImage(this.locationId, checkImageId, imageId)
    .subscribe({
      next: () => {
        entry.photos.splice(index, 1);
      },
      error: err => {
        console.error('Не вдалося видалити фото:', err);
        alert("Помилка при видаленні фото");
      }
    });
}

}
