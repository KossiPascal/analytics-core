import { Component } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import Chart from 'chart.js/auto';
import { NgForm } from '@angular/forms';
import { FormGroupService } from '@kossi-services/form-group.service';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { from } from 'rxjs';
import { notNull } from '@kossi-shared/functions';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { RecoDataMaps } from '@kossi-models/maps';
import { BaseMapsComponent } from '../base-maps.component';
import { IndicatorsDataOutput } from '@kossi-models/interfaces';
import { MapsService } from '@kossi-services/maps.service';


interface MapViwerForReco {
  id: string | undefined,
  form: string | undefined,
  year: number
  month: string
  reported_date: string | undefined,
  lat: number | undefined,
  lng: number | undefined,
  reco: { id: string, name: string }
  patient: { id: string, name: string, external_id: string, code: string, sex: 'M' | 'F' }
  family: { id: string, name: string, given_name: string, external_id: string, code: string }
}

interface ViwerForHealthCenter {
  id: string | undefined,
  name: string | undefined,
  chwCount: number,
  recoCount: number,
  lat: number | undefined,
  lng: number | undefined
}


@Component({
  standalone: false,
  selector: 'app-reco-map-viewer',
  templateUrl: './reco-map.component.html',
  styleUrls: ['./reco-map.component.css'],
})
export class RecoMapComponent extends BaseMapsComponent<{ withMap: RecoDataMaps[], withoutMap: RecoDataMaps[] }> {

  override MAP_NAME = 'RECOS_DATA_MAPS';


  private map!: L.Map;
  private ascCluster!: L.MarkerClusterGroup;
  private ascMarkers: L.Marker[] = [];
  public fsMarkers: L.Marker[] = [];
  private userMarker!: L.Marker;
  private lines: L.Polyline[] = [];
  private regionLayer!: L.GeoJSON;

  private boundsGuinea: L.LatLngBoundsExpression = [[7.0, -15.0], [13.0, -7.5]];
  private boundsWestAfrica: L.LatLngBoundsExpression = [[2.5, -17.0], [15.0, 5.0]];
  private worldTileLayer!: L.TileLayer;
  private defaultTileLayer!: L.TileLayer;
  private autoZoomEnabled: boolean = true;
  private viewGuineaOnly: boolean = true;
  private viewWorld: boolean = false;
  private chart: any;
  private canvas: HTMLCanvasElement | null = null;

  private recos$: MapViwerForReco[] = [];
  private HealthCenters$: ViwerForHealthCenter[] = [];
  private chw: { country: string | undefined, region: string | undefined, district: string | undefined, commune: string | undefined, healthCenter: string | undefined };

  private get defaultChw() {
    return {
      country: undefined,
      region: undefined,
      district: undefined,
      commune: undefined,
      healthCenter: undefined,
    }
  }

  isLoading: boolean = false;
  showASCValid: boolean = true;
  showASCInvalid: boolean = true;
  showFS: boolean = true;
  showGlobe: boolean = false;
  worldViewAnimated: boolean = false;
  showFilterModal: boolean = false;
  showOrgUnitFilterModal: boolean = false;
  displayedASCCount: number = 0;


  currentTileLayer?: L.TileLayer;



  readonly tileLayers: Record<string, string> = {
    streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    terrain: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    humanitarian: 'https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
  };


  // get DATA_FETCHED() {
  //   return ((this.MAPS_DATA as any)[this.MAP_NAME]?.data ?? { withMap: [], withoutMap: [] }) as { withMap: RecoDataMaps[], withoutMap: RecoDataMaps[] };
  // }

  DATA_FETCHED: { withMap: RecoDataMaps[], withoutMap: RecoDataMaps[] } = { withMap: [], withoutMap: [] };

  constructor(private mapsService: MapsService, private ldbfetch: LocalDbDataFetchService, fGroup: FormGroupService, conn: ConnectivityService, snackbar: SnackbarService, userCtx: UserContextService) {
    super(
      fGroup,
      conn,
      snackbar,
      userCtx,
      {
        fetchMaps: (formData, isOnline) => {
          return from(this.ldbfetch.GetRecoDataMaps(formData, isOnline));
        },
        afterFetchedMaps: async (data: any) => {
          const dataFetched = data as IndicatorsDataOutput<{ withMap: RecoDataMaps[], withoutMap: RecoDataMaps[] }> | undefined;
          this.DATA_FETCHED = dataFetched?.data ?? { withMap: [], withoutMap: [] }

          this.resetFilters();
        },
        onMapsInit: async () => {
          this.canvas = document.getElementById('recoChart') as any;
          await this.initMap();
          this.resetFilters()
        }
      }
    );
    this.chw = this.defaultChw;
  }



  formatForm(form: string): string {
    if (!form || typeof form !== 'string') return '';

    const parts = form.split('_');
    const isFollowup = parts.includes('followup');

    if (isFollowup) {
      const filteredParts = parts.filter(p => p !== 'followup');
      return `Suivi ${filteredParts.join(' ')}`;
    }

    return parts.join(' ');
  }



  private initMapWithOSMLayer(): void {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      // attribution: '<i class="fas fa-map-marker-alt"></i> <strong>My Custom Map</strong>',
      // maxZoom: 19,
      errorTileUrl: '/assets/offline-tile-0.png', // si la tuile échoue
    }).addTo(this.map);

    // 🗺️ Carte alternative sombre (facultatif)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      // attribution: '&copy; CARTO',
      errorTileUrl: '/assets/offline-tile-0.png',
    });
  }

  /** ✅ Couche hors-ligne : fond gris ou image locale */
  private initMapWithOfflineTileLayer(): void {
    L.tileLayer('/assets/img/offline-tile-0.png', {
      tileSize: 256,
      attribution: 'Vous êtes en mode hors-ligne',
    }).addTo(this.map);
  }



  private async initMap(): Promise<void> {
    // 🧼 Supprimer les URLs d'icônes par défaut de Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    // 🎯 Définir une icône par défaut personnalisée AVANT toute création de marker
    L.Icon.Default.mergeOptions({
      // iconUrl: 'assets/logo/ih.png',
      // iconRetinaUrl: 'assets/logo/ih.png',
      shadowUrl: '', // ou null selon si tu veux une ombre
    });

    // 🗺️ Initialiser la carte AVANT d’ajouter des contrôles
    this.map = L.map('map', {
      attributionControl: false, // on désactive l'attribution par défaut
      zoomControl: false,
      maxBounds: [[4.0, -1.5], [13.0, 3.0]], // Guinee + frontières
      maxBoundsViscosity: 1.0
    }).setView([9.6, -13.6], 7); // Centré sur la Guinée

    if (this.isOnline) {
      this.initMapWithOSMLayer();
      this.initAfterMapInit();
    } else {
      this.initMapWithOfflineTileLayer();
      this.initAfterMapInit();
    }

  }

  async initAfterMapInit() {
    L.control.zoom({ position: 'topright' }).addTo(this.map);
    L.control.attribution({ position: 'bottomright' }).addTo(this.map).setPrefix(false);
    const CustomAttribution = L.Control.extend({
      onAdd(map: L.Map) {
        const div = L.DomUtil.create('div', 'custom-attribution');
        // div.innerHTML = `
        //   <img src="assets/logo/ih.png" style="height: 20px; vertical-align: middle; margin-right: 6px;">
        //   <a style="text-decoration: none;font-weight: bold;" href="https://integratehealth.org/">Santé Intégrée</a>
        // `;
        return div;
      },
      onRemove(map: L.Map) {
        // Rien à faire ici pour le moment
      }
    });
    const attributionControl = new CustomAttribution({ position: 'bottomright' });
    attributionControl.addTo(this.map);

    // ➕ Regroupement de marqueurs
    this.ascCluster = L.markerClusterGroup();
    this.map.addLayer(this.ascCluster);

    // 📍 Chargement des données dynamiques
    this.locateUser();

    this.isLoading = true;
    await this.loadMapsData();
    await this.loadFSMarkers();
    await this.refreshASCMarkers();
    this.isLoading = false;
  }

  updateMapBounds(): void {
    const bounds = this.viewGuineaOnly ? this.boundsGuinea : this.boundsWestAfrica;//this.boundsExtended;
    this.map.setMaxBounds(bounds);
    this.map.fitBounds(bounds);
  }

  applyFilters(): void {
    this.showFilterModal = false;
    this.showOrgUnitFilterModal = false;
    this.loadFSMarkers();
    this.zoomToFitAll();
    this.refreshASCMarkers();
  }

  async resetFilters(): Promise<void> {
    this.showASCValid = true;
    this.showASCInvalid = true;
    this.showFS = true;
    this.viewGuineaOnly = true;
    this.showFilterModal = false;
    this.showOrgUnitFilterModal = false;


    await this.loadMapsData()
    this.updateMapBounds();
    this.zoomToFitAll();
    this.applyFilters();
  }

  toggleWorldView(): void {
    if (this.viewWorld) {
      this.map.removeLayer(this.defaultTileLayer);
      this.worldTileLayer.addTo(this.map);

      this.map.setMaxBounds(null as any);
      this.map.flyTo([20, 0], 2, { animate: true, duration: 3, easeLinearity: 0.25 });

      // Ajout d'une animation visuelle
      this.worldViewAnimated = true;
      this.showGlobe = true;
      setTimeout(() => {
        this.worldViewAnimated = false;
        this.showGlobe = false;
      }, 2000);
    } else {
      this.map.removeLayer(this.worldTileLayer);
      this.defaultTileLayer.addTo(this.map);
      this.updateMapBounds();
    }
  }

  locateUser(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.map.setView([latitude, longitude], 13);

          const userIcon = L.icon({
            iconUrl: 'assets/img/user-marker.png',
            iconSize: [28, 28],
            iconAnchor: [14, 28],
          });

          if (this.userMarker) {
            this.map.removeLayer(this.userMarker);
          }

          this.userMarker = L.marker([latitude, longitude], { icon: userIcon })
            .addTo(this.map)
            // .bindPopup('📍 Vous êtes ici')
            .openPopup();
        },
        (error) => console.warn('Géolocalisation échouée:', error.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }

  changeBasemap(event: Event): void {
    const style: string = (event.target as HTMLSelectElement).value;
    if (this.currentTileLayer) {
      this.map.removeLayer(this.currentTileLayer);
    }
    if (this.isOnline) {
      const url = this.tileLayers[style] || this.tileLayers['streets'];
      this.currentTileLayer = L.tileLayer(url, {
        errorTileUrl: '/assets/offline-tile-0.png',
        maxZoom: 21,
      }).addTo(this.map);
    } else {
      this.currentTileLayer = L.tileLayer('/assets/img/offline-tile-0.png', {
        tileSize: 256,
        attribution: 'Vous êtes en mode hors-ligne',
      }).addTo(this.map);
    }
  }

  async loadMapsData(healthCenterId: string | undefined = undefined) {
    const chwsData: MapViwerForReco[] = [];

    for (let i = 0; i < this.DATA_FETCHED.withMap.length; i++) {
      const map = this.DATA_FETCHED.withMap[i];
      chwsData.push({
        id: `map-${i}`,
        year: map.year,
        month: map.month,
        form: map.form,
        reported_date: map.reported_date,
        lat: map.latitude,
        lng: map.longitude,
        reco: map.reco,
        patient: map.patient,
        family: map.family,

      });
    }

    this.recos$ = chwsData;
  }

  async refreshASCMarkers(): Promise<void> {
    this.ascCluster.clearLayers();
    this.ascMarkers = [];
    this.lines.forEach(line => this.map.removeLayer(line));
    this.lines = [];

    const filtered = this.recos$.filter(asc => this.showASCValid || this.showASCInvalid);
    this.displayedASCCount = filtered.length;
    const latlngs: L.LatLng[] = [];

    filtered.forEach(data => {
      const lat = data?.lat;
      const lng = data?.lng;

      if (typeof lat === 'number' && typeof lng === 'number') {

        const marker = L.marker([lat, lng], {
          icon: L.icon({
            iconUrl: 'assets/img/yellow-marker.png',
            iconSize: [50, 50],
            iconAnchor: [14, 28],
          })
        });

        const style = `style="color:${1 > 5 ? 'red' : 'green'} ;"`;
        const popupId = `open-map-${Math.random().toString(36).substr(2, 9)}`;
        
        const popupContent = `
          <div style="font-size:14px">
            <strong>${data.reco.name}</strong><br>
            <strong>Formulaire:</strong> ${this.formatForm(data.form ?? '')}<br>
            <strong>Patient:</strong> ${data.patient.name} (${data.patient.external_id}) (${data.patient.sex})<br>
            <strong>Ménage:</strong> ${data.family.given_name} (${data.family.external_id})<br>
            <strong>Date:</strong> ${data.reported_date?.split('T')[0]}<br>
            <button id="${popupId}" style="margin-top:5px;">📍 Ouvrir dans Google Maps</button>
          </div>
        `;
        
        marker.bindPopup(popupContent);

        marker.on('popupopen', () => {
          setTimeout(() => {
            const button = document.getElementById(popupId);
            if (button) {
              button.addEventListener('click', () => {
                this.mapsService.openInGoogleMaps({ lat, lng });
              });
            }
          }, 0); // s'assurer que le DOM de la popup est bien chargé
        });

        // <strong>Latitude:</strong> ${data.lat}<br>
        // <strong>Longitude:</strong> ${data.lng}<br>
        // ${asc?.validityReason || ''}<br>

        this.ascCluster.addLayer(marker);
        this.ascMarkers.push(marker);
        latlngs.push(marker.getLatLng());

      }
    });


    if (this.autoZoomEnabled && latlngs.length) {
      const bounds = L.latLngBounds(latlngs);
      this.map.fitBounds(bounds.pad(0.1));
    }

    this.updateStatsChart(filtered);
  }

  updateStatsChart(data: any[]): void {

    if (!this.canvas) {
      console.warn('[Chart] Canvas element with ID "recoChart" not found.');
      return;
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      console.warn('[Chart] Unable to get 2D context from canvas.');
      return;
    }

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    // if (data.length === 0) {
    //   console.log('[Chart] No data available to display.');
    //   return;
    // }

    const validCount = data.filter(d => d.valid).length;
    const invalidCount = data.filter(d => !d.valid).length;

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Valides', 'Invalides'],
        datasets: [{
          data: [validCount, invalidCount],
          backgroundColor: ['#4CAF50', '#FF9800'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (tooltipItem) => {
                const label = tooltipItem.label || '';
                const value = tooltipItem.raw as number;
                return `${label}: ${value}`;
              }
            }
          }
        }
      }
    });
  }


  async loadFSMarkers(): Promise<void> {
    this.fsMarkers.forEach(m => this.map.removeLayer(m));
    this.fsMarkers = [];

    if (!this.showFS) return;

    this.HealthCenters$.forEach(fs => {
      if (fs?.lat && fs?.lng) {
        const marker = L.marker([fs.lat, fs.lng], {
          icon: L.icon({
            iconUrl: 'assets/img/health-center.png',
            iconSize: [30, 30],
            iconAnchor: [14, 28],
          })
        }).bindPopup(`
          <strong>FS:</strong> ${fs.name}<br>
          <strong>ID:</strong> ${fs.id}<br>
          <strong>Nbr ASC:</strong> ${fs.chwCount}<br>
          <strong>Nbr RECO:</strong> ${fs.recoCount}<br>`
        );

        marker.addTo(this.map);
        this.fsMarkers.push(marker);
      }
    });
  }

  async toggleFSMarkers(): Promise<void> {
    if (this.showFS) {
      await this.loadFSMarkers();
    } else {
      this.fsMarkers.forEach(m => this.map.removeLayer(m));
      this.fsMarkers = [];
    }
  }

  zoomToFitAll(): void {
    const bounds = new L.LatLngBounds([]);
    this.ascMarkers.forEach(m => bounds.extend(m.getLatLng()));
    this.fsMarkers.forEach(m => bounds.extend(m.getLatLng()));
    if (this.userMarker) bounds.extend(this.userMarker.getLatLng());
    if (bounds.isValid()) this.map.fitBounds(bounds.pad(0.05));
  }

  clearMap(): void {
    this.ascCluster.clearLayers();
    this.fsMarkers.forEach(m => this.map.removeLayer(m));
    this.fsMarkers = [];
    this.lines.forEach(l => this.map.removeLayer(l));
    this.lines = [];
    if (this.userMarker) this.map.removeLayer(this.userMarker);
    if (this.regionLayer) this.map.removeLayer(this.regionLayer);
  }


  async makeOrgUnitMapFilter(form: NgForm) {
    const { healthCenter } = this.chw;

    if (form.invalid || !notNull(healthCenter)) {
      alert('Veuillez remplir tous les champs requis.');
      return;
    }

    await this.loadMapsData(healthCenter)
    this.applyFilters();
    this.zoomToFitAll();

    form.resetForm();
    this.chw = this.defaultChw;
    return;

  }



}
