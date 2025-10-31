import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LocationService } from '../../core/services/location.service';
import { Location } from '../../core/models/location';
import * as L from 'leaflet';
import { LocationCreateFormComponent } from '../../components/location-create-form/location-create-form.component';
import { LocationSidebarComponent } from '../../components/location-sidebar/location-sidebar.component';
import {LocationPendingCopyFormComponent} from '../location-pending-copy-form/location-pending-copy-form.component';
import {LocationEditDialogComponent} from '../../components/location-edit-dialog/location-edit-dialog.component';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-location-detail-page',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, RouterLink, LocationCreateFormComponent, LocationSidebarComponent, LocationPendingCopyFormComponent, LocationEditDialogComponent, FormsModule],
  templateUrl: './location-detail-page.component.html',
  styleUrls: ['./location-detail-page.component.css']
})
export class LocationDetailPage implements OnInit, AfterViewInit {
  location: Location | null = null;
  locations: Location[] | undefined;
  pendingLocations: any[] = [];
  criteriaTree: any | null = null;
  showRejectForm = false;
  rejectionReason = '';


  duplicateMode = false;

  // map
  private map!: L.Map;
  markers: Array<{ marker: L.Marker, iconUrl: string, baseSize: [number, number], location?: Location }> = [];

  days = [
    { key: 'monday', label: 'Понеділок' },
    { key: 'tuesday', label: 'Вівторок' },
    { key: 'wednesday', label: 'Середа' },
    { key: 'thursday', label: 'Четвер' },
    { key: 'friday', label: 'П’ятниця' },
    { key: 'saturday', label: 'Субота' },
    { key: 'sunday', label: 'Неділя' }
  ];

  showGroup = true;
  openTypes = new Set<any>();
  showCommentsMap = new Map<any, boolean>();
  swappedFields: Record<string, boolean> = {};
  swappedDuplicateFields: Record<string, boolean> = {};
  originalLeftValues: Record<string, any> = {};
  originalDuplicateLeftValues: Record<string, any> = {};
  originalRightValues: Record<string, any> = {};
  originalDuplicateRightValues: Record<string, any> = {};
  showUpdateForm = false;
  showRejectedPendingModal = false;


  constructor(
    private route: ActivatedRoute,
    private locationService: LocationService,
    protected router: Router
  ) {}

  selectedPending: any | null = null;
  showModal = false;
  modalLocation: any | null = null;

  selectedDuplicate: any | null = null;
  showModalDuplicate = false;


  openModal(pending: any) {
    if (pending.status === 'rejected') {
      this.selectedPending = pending;
      this.showRejectedPendingModal = true;
      return;
    }

    // Якщо pending → стандартна модалка порівняння
    this.selectedPending = { ...pending };
    this.modalLocation = { ...this.location };
    this.showModal = true;
  }

  deletePending(pendingId: number) {
    if (!confirm('Ви впевнені, що хочете видалити це оновлення?')) return;

    this.locationService.deletePending(pendingId).subscribe({
      next: () => {
        alert('Оновлення видалено');
        this.showRejectedPendingModal = false;
        this.loadPendingLocations();
      },
      error: err => {
        console.error('Помилка при видаленні оновлення:', err);
        alert('Не вдалося видалити оновлення');
      }
    });
  }


  openDuplicateModal(duplicate: any) {
    // створюємо копії, щоб не змінювати реальні об'єкти
    this.selectedDuplicate = { ...duplicate };
    this.modalLocation = { ...this.location }; // 👈 нова властивість
    this.showModalDuplicate = true;
  }

  openUpdateForm(event: Event) {
    event.preventDefault();
    this.showUpdateForm = true;
  }

  onUpdateSubmitted(res: any) {
    this.showUpdateForm = false;
    console.log('✅ Pending copy saved:', res);
  }

  changeStatus(newStatus: string, rejectionReason?: string) {
    if (!this.location) return;
    const id = this.location.id;

    const body = rejectionReason ? { rejectionReason } : {};

    this.locationService.changeStatus(id, newStatus, body).subscribe({
      next: () => {
        alert(`Статус змінено на ${newStatus}`);
        this.locationService.getLocationById(id).subscribe(loc => this.location = loc);
      },
      error: err => {
        console.error('❌ Помилка при зміні статусу:', err);
        alert('Не вдалося змінити статус');
      }
    });
  }

  openRejectForm() {
    this.showRejectForm = true;
  }

  submitRejection() {
    if (!this.rejectionReason.trim()) {
      alert('Вкажіть причину відхилення');
      return;
    }
    this.changeStatus('rejected', this.rejectionReason);
    this.showRejectForm = false;
    this.rejectionReason = '';
  }

  cancelRejection() {
    this.showRejectForm = false;
    this.rejectionReason = '';
  }



  confirmChanges() {
    if (!this.modalLocation || !this.selectedPending || !this.location) return;

    const locationId = this.location.id;
    const pendingCopyId = this.selectedPending.id;

    // 👇 Формуємо DTO для відправки
    const updatedData = {
      name: this.modalLocation.name,
      address: this.modalLocation.address,
      description: this.modalLocation.description,
      contacts: this.modalLocation.contacts,
      workingHours: this.modalLocation.workingHours,
      type: this.modalLocation.type,
    };

    this.locationService.updateLocationFromPending(locationId, pendingCopyId, updatedData)
      .subscribe({
        next: (res) => {
          console.log('✅ Локацію оновлено:', res);
          alert('Зміни підтверджено успішно!');
          this.closeModal();
          this.loadPendingLocations(); // оновимо список
          this.locationService.getLocationById(locationId).subscribe(loc => this.location = loc); // оновити головну локацію
        },
        error: (err) => {
          console.error('❌ Помилка при оновленні:', err);
          alert('Помилка при підтвердженні змін');
        }
      });
  }

  confirmDuplicateChanges() {
    if (!this.modalLocation || !this.selectedDuplicate || !this.location) return;

    const locationId = this.location.id;
    const duplicateId = this.selectedDuplicate.id;

    const updatedData = {
      name: this.selectedDuplicate.name,
      address: this.selectedDuplicate.address,
      description: this.selectedDuplicate.description,
      contacts: this.selectedDuplicate.contacts,
      workingHours: this.selectedDuplicate.workingHours,
      type: this.selectedDuplicate.type,
    };

    this.locationService.updateDuplicateFromLocation(locationId, duplicateId, updatedData)
      .subscribe({
        next: (res) => {
          console.log('✅ Локацію оновлено:', res);
          alert('Зміни підтверджено успішно!');
          this.closeModal();

          // 👇 Після видалення старої локації — переходимо на сторінку дубліката
          this.router.navigate([`/locations/${duplicateId}`]).then(() => {
            // 👇 Форсуємо повне перезавантаження компонента/сторінки
            window.location.reload();
          });
        },
        error: (err) => {
          console.error('❌ Помилка при оновленні:', err);
          alert('Помилка при підтвердженні змін');
        }
      });
  }




  closeModal() {
    this.showModal = false;
    this.selectedPending = null;
    this.modalLocation = null;
    this.swappedFields = {};
    this.originalLeftValues = {};
    this.originalRightValues = {};
  }

  closeModalDuplicate() {
    this.showModalDuplicate = false;
    this.selectedDuplicate = null;
    this.modalLocation = null;
    this.swappedDuplicateFields = {};
    this.originalDuplicateLeftValues = {};
    this.originalDuplicateRightValues = {};
  }


  swapField(field: string) {
    if (!this.modalLocation || !this.selectedPending) return;

    if (this.swappedFields[field]) {
      // 🔄 Повертаємо обидва значення
      this.modalLocation[field] = this.originalLeftValues[field];
      this.selectedPending[field] = this.originalRightValues[field];
      this.swappedFields[field] = false;
    } else {
      // 💾 Зберігаємо початкові значення
      this.originalLeftValues[field] = this.modalLocation[field];
      this.originalRightValues[field] = this.selectedPending[field];

      // ⮂ Міняємо ліве на значення pending
      this.modalLocation[field] = this.selectedPending[field];
      // ❌ У правому — прочерк
      this.selectedPending[field] = '—';
      this.swappedFields[field] = true;
    }
  }

  swapDuplicateField(field: string) {
    if (!this.modalLocation || !this.selectedDuplicate) return;

    if (this.swappedDuplicateFields[field]) {
      // 🔄 Повертаємо обидва значення
      this.selectedDuplicate[field] = this.originalDuplicateLeftValues[field];
      this.modalLocation[field] = this.originalDuplicateRightValues[field];
      this.swappedDuplicateFields[field] = false;
    } else {
      // 💾 Зберігаємо початкові значення
      this.originalDuplicateLeftValues[field] = this.selectedDuplicate[field];
      this.originalDuplicateRightValues[field] = this.modalLocation[field];

      // ⮂ Міняємо ліве (оригінал) на наше значення
      this.selectedDuplicate[field] = this.modalLocation[field];
      // ❌ У правому (нашому) — прочерк
      this.modalLocation[field] = '—';
      this.swappedDuplicateFields[field] = true;
    }
  }




  swapContactField(field: string) {
    if (!this.modalLocation?.contacts || !this.selectedPending?.contacts) return;

    const key = 'contact_' + field;

    if (this.swappedFields[key]) {
      this.modalLocation.contacts[field] = this.originalLeftValues[key];
      this.selectedPending.contacts[field] = this.originalRightValues[key];
      this.swappedFields[key] = false;
    } else {
      this.originalLeftValues[key] = this.modalLocation.contacts[field];
      this.originalRightValues[key] = this.selectedPending.contacts[field];

      this.modalLocation.contacts[field] = this.selectedPending.contacts[field];
      this.selectedPending.contacts[field] = '—';
      this.swappedFields[key] = true;
    }
  }

  swapDuplicateContactField(field: string) {
    if (!this.modalLocation?.contacts || !this.selectedDuplicate?.contacts) return;

    const key = 'contact_' + field;

    if (this.swappedDuplicateFields[key]) {
      this.selectedDuplicate.contacts[field] = this.originalDuplicateLeftValues[key];
      this.modalLocation.contacts[field] = this.originalDuplicateRightValues[key];
      this.swappedDuplicateFields[key] = false;
    } else {
      this.originalDuplicateLeftValues[key] = this.selectedDuplicate.contacts[field];
      this.originalDuplicateRightValues[key] = this.modalLocation.contacts[field];

      this.selectedDuplicate.contacts[field] = this.modalLocation.contacts[field];
      this.modalLocation.contacts[field] = '—';
      this.swappedDuplicateFields[key] = true;
    }
  }


  // 🔹 Видалення
  deleteLocation() {
    if (!this.location) return;
    const id = this.location.id;
    if (!confirm('Ви впевнені, що хочете видалити локацію?')) return;
    this.locationService.deleteLocation(id).subscribe({
      next: () => {
        alert('Локацію видалено');
        // можеш редіректнути, якщо треба
      },
      error: err => {
        console.error('Помилка видалення', err);
        alert('Не вдалося видалити локацію');
      }
    });
  }


  swapWorkingHours() {
    if (!this.modalLocation || !this.selectedPending) return;
    const key = 'workingHours';

    if (this.swappedFields[key]) {
      this.modalLocation.workingHours = this.originalLeftValues[key];
      this.selectedPending.workingHours = this.originalRightValues[key];
      this.swappedFields[key] = false;
    } else {
      this.originalLeftValues[key] = JSON.parse(JSON.stringify(this.modalLocation.workingHours));
      this.originalRightValues[key] = JSON.parse(JSON.stringify(this.selectedPending.workingHours));

      this.modalLocation.workingHours = this.selectedPending.workingHours;
      this.selectedPending.workingHours = {};
      for (const d of this.days) {
        this.selectedPending.workingHours[d.key] = { open: '—', close: '—' };
      }
      this.swappedFields[key] = true;
    }
  }

  showRejectPendingForm = false;
  rejectionPendingReason = '';

  openRejectPendingForm() {
    this.showRejectPendingForm = true;

    // використовуємо setTimeout, щоб Angular встиг оновити DOM перед підстановкою
    setTimeout(() => {
      if (this.selectedPending?.rejectionReason) {
        this.rejectionPendingReason = this.selectedPending.rejectionReason;
      } else {
        this.rejectionPendingReason = '';
      }
    });
  }


  submitPendingRejection() {
    if (!this.selectedPending || !this.rejectionPendingReason.trim()) {
      alert('Вкажіть причину відхилення');
      return;
    }

    this.locationService.rejectPending(this.selectedPending.id, this.rejectionPendingReason)
      .subscribe({
        next: (res) => {
          alert('Пендінг відхилено');
          this.showRejectPendingForm = false;
          this.rejectionPendingReason = '';
          this.closeModal();
          this.loadPendingLocations();
        },
        error: (err) => {
          console.error('❌ Помилка при відхиленні пендінгу:', err);
          alert('Не вдалося відхилити пендінг');
        }
      });
  }

  cancelPendingRejection() {
    this.showRejectPendingForm = false;
    this.rejectionPendingReason = '';
  }


  swapDuplicateWorkingHours() {
    if (!this.modalLocation || !this.selectedDuplicate) return;
    const key = 'workingHours';

    if (this.swappedDuplicateFields[key]) {
      this.modalLocation.workingHours = this.originalDuplicateRightValues[key];
      this.selectedDuplicate.workingHours = this.originalDuplicateLeftValues[key];
      this.swappedDuplicateFields[key] = false;
    } else {
      this.originalDuplicateRightValues[key] = JSON.parse(JSON.stringify(this.modalLocation.workingHours));
      this.originalDuplicateLeftValues[key] = JSON.parse(JSON.stringify(this.selectedDuplicate.workingHours));

      this.selectedDuplicate.workingHours = this.modalLocation.workingHours;
      this.modalLocation.workingHours = {};
      for (const d of this.days) {
        this.modalLocation.workingHours[d.key] = { open: '—', close: '—' };
      }
      this.swappedDuplicateFields[key] = true;
    }
  }



  ngOnInit() {
    const id = String(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.locationService.getLocationById(id).subscribe(loc => {
        this.location = loc;
        console.log('✅ Location object:', loc);

        this.loadCriteriaTree();
        this.loadPendingLocations();

        // ✅ Викликати checkDuplicates лише якщо статус pending або rejected
        if (loc.status === 'pending' || loc.status === 'rejected') {
          this.checkDuplicates();
        }
      });
    }
  }

  viewLocation(id: number) {
    // Повне оновлення сторінки
    window.location.href = `/locations/${id}`;
  }




  ngAfterViewInit(): void {
    const id = String(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.locationService.getLocationById(id).subscribe(loc => {
        this.location = loc;

        setTimeout(() => {
          this.initMap();
          this.addMarker();

          const params = new URLSearchParams(window.location.search);
          const flyToLat = params.get('flyToLat');
          const flyToLng = params.get('flyToLng');
          if (flyToLat && flyToLng) {
            const lat = parseFloat(flyToLat);
            const lng = parseFloat(flyToLng);
            this.map.flyTo([lat, lng], 17, { animate: true, duration: 0.9 });
          }
        });
      });
    }
  }

  private initMap(): void {
    if (!this.location) return;

    this.map = L.map('map', {
      center: [this.location.latitude, this.location.longitude],
      zoom: 15,
      dragging: false,
      zoomControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.getContainer().style.cursor = 'pointer';
    this.map.on('click', () => {
      if (!this.location) return;
      this.router.navigate(['/'], {
        queryParams: {
          flyToLat: this.location.latitude,
          flyToLng: this.location.longitude,
          selectedId: this.location.id
        }
      });
    });
  }

  private addMarker(): void {
    if (!this.location || !this.map) return;

    const iconUrl = 'assets/map-markers/1.png';
    const icon = this.createMarkerIcon(iconUrl, [35, 40]);

    const marker = L.marker(
      [this.location.latitude, this.location.longitude],
      {
        icon,
        interactive: false
      }
    ).addTo(this.map);

    (marker as any).getElement()?.style.setProperty('pointer-events', 'none');

    this.markers = [{ marker, iconUrl, baseSize: [35, 40], location: this.location }];
    this.map.setView([this.location.latitude, this.location.longitude], 15);
  }

  private createMarkerIcon(iconUrl: string, size: [number, number]): L.Icon {
    return new L.Icon({ iconUrl, iconSize: size as any });
  }

  loadCriteriaTree() {
    if (this.location?.id) {
      this.locationService.getCriteriaTreeByTypeId(this.location.id)
        .subscribe(tree => this.criteriaTree = tree);
    }
  }

  loadPendingLocations() {
    if (this.location?.id) {
      this.locationService.getPendingLocationsByLocationId(this.location.id)
        .subscribe(data => {
          this.pendingLocations = data;
          console.log('🕒 Pending Locations:', data);
        });
    }
  }

  toggleGroup() {
    this.showGroup = !this.showGroup;
  }

  similarLocations: any[] = [];
  showDuplicates = false;

  checkDuplicates() {
    if (!this.location) return;

    this.locationService.checkDuplicatesById(this.location.id).subscribe({
      next: (res) => {
        const body = res.body || res;
        if (body.message === 'No duplicates found') {
          this.showDuplicates = false;
        } else if (body.similar?.length) {
          this.similarLocations = body.similar;
          this.showDuplicates = true;
        }
      },
      error: (err) => {
        if (err.error?.similar?.length) {
          this.similarLocations = err.error.similar;
          this.showDuplicates = true;
        } else {
          console.error('❌ Помилка при перевірці дублікатів:', err);
          alert('Не вдалося завантажити список дублікатів');
        }
      }
    });
  }



  toggleType(type: any) {
    if (this.openTypes.has(type)) {
      this.openTypes.delete(type);
    } else {
      this.openTypes.add(type);
    }
  }

  isTypeOpen(type: any) {
    return this.openTypes.has(type);
  }

  countChecks(c: any, hasIssue: boolean): number {
    return c.barrierlessCriteriaChecks?.filter((ch: any) => ch.hasIssue === hasIssue).length || 0;
  }

  getComments(c: any): string[] {
    return c.barrierlessCriteriaChecks
      ?.map((ch: any) => ch.comment)
      .filter((comment: string) => !!comment?.trim()) || [];
  }

  toggleComments(c: any) {
    const isOpen = this.showCommentsMap.get(c) || false;
    this.showCommentsMap.set(c, !isOpen);
  }

  isCommentsOpen(c: any): boolean {
    return this.showCommentsMap.get(c) || false;
  }

  getBalancePosition(c: any): number {
    const total = c.barrierlessCriteriaChecks?.length || 0;
    if (total === 0) return 50;
    const hasIssue = this.countChecks(c, true);
    return (hasIssue / total) * 100;
  }

  hasNoSchedule(workingHours: any): boolean {
    if (!workingHours) return true;
    return this.days.every(d => {
      const day = workingHours[d.key];
      return !day || (!day.open && !day.close);
    });
  }

  getDaySchedule(day: string, workingHours: any): string {
    if (!workingHours || !workingHours[day]) return 'вихідний';
    const { open, close } = workingHours[day];
    if (!open && !close) return 'вихідний';
    if (open && close) return `${open} – ${close}`;
    return 'вихідний';
  }

  getAccessibilityLevel(score: number | null | undefined): string {
    if (score == null) return 'Немає даних';
    if (score === 100) return 'Повна безбар’єрність';
    if (score >= 70) return 'Висока безбар’єрність';
    if (score >= 50) return 'Середня безбар’єрність';
    if (score >= 30) return 'Низька безбар’єрність';
    return 'Недоступна';
  }
}
