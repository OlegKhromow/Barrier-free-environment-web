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

@Component({
  selector: 'app-location-detail-page',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, RouterLink, LocationCreateFormComponent, LocationSidebarComponent, LocationPendingCopyFormComponent, LocationEditDialogComponent],
  templateUrl: './location-detail-page.component.html',
  styleUrls: ['./location-detail-page.component.css']
})
export class LocationDetailPage implements OnInit, AfterViewInit {
  location: Location | null = null;
  locations: Location[] | undefined;
  pendingLocations: any[] = [];
  criteriaTree: any | null = null;

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
  originalLeftValues: Record<string, any> = {};
  originalRightValues: Record<string, any> = {};
  showUpdateForm = false;

  constructor(
    private route: ActivatedRoute,
    private locationService: LocationService,
    private router: Router
  ) {}

  selectedPending: any | null = null;
  showModal = false;
  modalLocation: any | null = null;


  openModal(pending: any) {
    // створюємо копії, щоб не змінювати реальні об'єкти
    this.selectedPending = { ...pending };
    this.modalLocation = { ...this.location }; // 👈 нова властивість
    this.showModal = true;
  }

  openUpdateForm(event: Event) {
    event.preventDefault();
    this.showUpdateForm = true;
  }

  onUpdateSubmitted(res: any) {
    this.showUpdateForm = false;
    console.log('✅ Pending copy saved:', res);
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



  closeModal() {
    this.showModal = false;
    this.selectedPending = null;
    this.modalLocation = null;
    this.swappedFields = {};
    this.originalLeftValues = {};
    this.originalRightValues = {};
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



  ngOnInit() {
    const id = String(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.locationService.getLocationById(id).subscribe(loc => {
        this.location = loc;
        console.log('✅ Location object:', loc);

        this.loadCriteriaTree();
        this.loadPendingLocations();
      });
    }
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
