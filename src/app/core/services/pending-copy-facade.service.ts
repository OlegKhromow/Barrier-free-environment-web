import { Injectable } from '@angular/core';
import { LocationService } from './location.service';
import { AlertService } from './alert.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class PendingCopyFacadeService {

  constructor(
    private locationService: LocationService,
    private alertService: AlertService
  ) {}

  /**
   * Головна точка входу
   */
  createPendingCopy(
    dto: any,
    callbacks?: {
      onStart?: () => void;
      onFinish?: () => void;
      onSuccess?: (pending: any) => void;
    }
  ) {
    callbacks?.onStart?.();

    dto.imageServiceId ??= uuidv4();

    if (dto.selectedImages?.length) {
      this.checkImagesValidity(dto, () =>
        this.createAndUpload(dto, callbacks)
      );
    } else {
      this.createAndUpload(dto, callbacks);
    }
  }

  private checkImagesValidity(dto: any, onValid: () => void) {
    const imageServiceId = dto.imageServiceId;
    let validCount = 0;
    const total = dto.selectedImages.length;

    dto.selectedImages.forEach((img: { file: File }) => {
      const imageId = uuidv4();

      this.locationService
        .imageIsValid(imageServiceId, imageId, img.file)
        .subscribe({
          next: () => {
            validCount++;
            if (validCount === total) {
              onValid();
            }
          },
          error: err => {
            const msg =
              err?.error?.message ||
              err?.message ||
              'Помилка перевірки зображення';
            this.alertService.open(
              `Зображення невалідне (${img.file.name}):\n${msg}`
            );
          }
        });
    });
  }

  private createAndUpload(dto: any, callbacks?: any) {
    this.locationService
      .createPendingCopy(dto.location_id, dto)
      .subscribe({
        next: pending => {
          if (dto.selectedImages?.length) {
            this.uploadImages(pending.imageServiceId, dto.selectedImages, () => {
              callbacks?.onFinish?.();
              callbacks?.onSuccess?.();
            });
          } else {
            callbacks?.onFinish?.();
            callbacks?.onSuccess?.();
          }
        },
        error: err => {
          callbacks?.onFinish?.();
          const msg =
            err?.error?.description ||
            err?.error?.message ||
            err?.message ||
            'Помилка створення pending copy';
          this.alertService.open(msg);
        }
      });
  }

  private uploadImages(
    imageServiceId: string,
    images: { file: File }[],
    onDone: () => void
  ) {
    let uploaded = 0;

    images.forEach(img => {
      const imageId = uuidv4();
      this.locationService
        .uploadLocationImage(imageServiceId, imageId, img.file)
        .subscribe({
          next: () => {
            uploaded++;
            if (uploaded === images.length) {
              onDone();
            }
          },
          error: () => {
            this.alertService.open('Помилка завантаження зображення');
          }
        });
    });
  }
}
