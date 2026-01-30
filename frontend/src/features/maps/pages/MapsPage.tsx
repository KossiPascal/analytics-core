import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layers,
  Filter,
  RefreshCw,
  MapPin,
  Navigation,
  Users,
  Building2,
  Eye,
  EyeOff,
  Maximize,
  MoreHorizontal,
  X
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { PageHeader } from '@components/layout';
import { Button } from '@components/ui/Button/Button';
import { Modal } from '@components/ui/Modal/Modal';
import { useNotification } from '@/hooks/useNotification';
import { MapsApi } from '@/services/api/api.service';
import { DashboardFilters } from '@/features/dashboards/components';
import type { DashboardFilterParams } from '@/stores/dashboard.store';
import styles from './MapsPage.module.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapDataPoint {
  id: string;
  lat: number;
  lng: number;
  form?: string;
  reported_date?: string;
  year: number;
  month: string;
  reco: { id: string; name: string };
  patient: { id: string; name: string; external_id: string; code: string; sex: 'M' | 'F' };
  family: { id: string; name: string; given_name: string; external_id: string; code: string };
}

interface HealthCenter {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  chwCount: number;
  recoCount: number;
}

const TILE_LAYERS = {
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    name: 'Rues',
  },
  satellite: {
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    name: 'Satellite',
  },
  terrain: {
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    name: 'Terrain',
  },
  humanitarian: {
    url: 'https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    name: 'Humanitaire',
  },
};

export default function MapsPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerClusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const healthCenterMarkersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [mapData, setMapData] = useState<{ withMap: MapDataPoint[]; withoutMap: MapDataPoint[] }>({
    withMap: [],
    withoutMap: [],
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [healthCenters, _setHealthCenters] = useState<HealthCenter[]>([]);
  const [currentTileLayer, setCurrentTileLayer] = useState<'streets' | 'satellite' | 'terrain' | 'humanitarian'>('streets');
  const [showRecoMarkers, setShowRecoMarkers] = useState(true);
  const [showHealthCenters, setShowHealthCenters] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isLayerModalOpen, setIsLayerModalOpen] = useState(false);
  const [filters, setFilters] = useState<DashboardFilterParams | null>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const { showSuccess, showError, showWarning } = useNotification();

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map instance
    const map = L.map(mapRef.current, {
      center: [9.6, -13.6], // Centered on Guinea
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
    });

    // Add tile layer
    L.tileLayer(TILE_LAYERS[currentTileLayer].url, {
      maxZoom: 19,
    }).addTo(map);

    // Add zoom control to top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Create marker cluster group
    const markerCluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });
    map.addLayer(markerCluster);

    mapInstanceRef.current = map;
    markerClusterRef.current = markerCluster;

    // Try to locate user
    locateUser(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerClusterRef.current = null;
    };
  }, []);

  // Update tile layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add new tile layer
    L.tileLayer(TILE_LAYERS[currentTileLayer].url, {
      maxZoom: 19,
    }).addTo(map);
  }, [currentTileLayer]);

  const locateUser = (map: L.Map) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          if (userMarkerRef.current) {
            map.removeLayer(userMarkerRef.current);
          }

          const userIcon = L.divIcon({
            html: '<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            className: 'user-marker',
          });

          userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
            .addTo(map)
            .bindPopup('Vous êtes ici');
        },
        (error) => console.warn('Geolocation failed:', error.message),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const refreshMarkers = useCallback(() => {
    const cluster = markerClusterRef.current;
    const map = mapInstanceRef.current;
    if (!cluster || !map) return;

    // Clear existing markers
    cluster.clearLayers();

    if (!showRecoMarkers) return;

    const bounds: L.LatLngBounds = L.latLngBounds([]);

    // Add RECO markers
    mapData.withMap.forEach((point) => {
      if (typeof point.lat !== 'number' || typeof point.lng !== 'number') return;

      const markerIcon = L.divIcon({
        html: `<div style="background: #f59e0b; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          </svg>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        className: 'reco-marker',
      });

      const marker = L.marker([point.lat, point.lng], { icon: markerIcon });

      const popupContent = `
        <div style="font-size: 13px; min-width: 200px;">
          <strong style="font-size: 14px; color: #1e293b;">${point.reco.name}</strong><br/>
          <hr style="margin: 8px 0; border: none; border-top: 1px solid #e2e8f0;"/>
          <p style="margin: 4px 0;"><strong>Formulaire:</strong> ${formatForm(point.form || '')}</p>
          <p style="margin: 4px 0;"><strong>Patient:</strong> ${point.patient.name} (${point.patient.sex})</p>
          <p style="margin: 4px 0;"><strong>Code:</strong> ${point.patient.external_id}</p>
          <p style="margin: 4px 0;"><strong>Ménage:</strong> ${point.family.given_name}</p>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${point.reported_date?.split('T')[0] || '-'}</p>
          <hr style="margin: 8px 0; border: none; border-top: 1px solid #e2e8f0;"/>
          <button onclick="window.open('https://www.google.com/maps?q=${point.lat},${point.lng}', '_blank')"
            style="width: 100%; padding: 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
            Ouvrir dans Google Maps
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      cluster.addLayer(marker);
      bounds.extend([point.lat, point.lng]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.1));
    }
  }, [mapData, showRecoMarkers]);

  const refreshHealthCenterMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing health center markers
    healthCenterMarkersRef.current.forEach((marker) => map.removeLayer(marker));
    healthCenterMarkersRef.current = [];

    if (!showHealthCenters) return;

    healthCenters.forEach((hc) => {
      if (!hc.lat || !hc.lng) return;

      const hcIcon = L.divIcon({
        html: `<div style="background: #22c55e; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
          </svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: 'hc-marker',
      });

      const marker = L.marker([hc.lat, hc.lng], { icon: hcIcon })
        .bindPopup(`
          <div style="font-size: 13px;">
            <strong style="font-size: 14px;">${hc.name}</strong><br/>
            <p style="margin: 4px 0;"><strong>ASC:</strong> ${hc.chwCount}</p>
            <p style="margin: 4px 0;"><strong>RECO:</strong> ${hc.recoCount}</p>
          </div>
        `)
        .addTo(map);

      healthCenterMarkersRef.current.push(marker);
    });
  }, [healthCenters, showHealthCenters]);

  // Refresh markers when data changes
  useEffect(() => {
    refreshMarkers();
  }, [refreshMarkers]);

  useEffect(() => {
    refreshHealthCenterMarkers();
  }, [refreshHealthCenterMarkers]);

  const formatForm = (form: string): string => {
    if (!form) return '-';
    const parts = form.split('_');
    const isFollowup = parts.includes('followup');
    if (isFollowup) {
      return `Suivi ${parts.filter((p) => p !== 'followup').join(' ')}`;
    }
    return parts.join(' ');
  };

  const handleFilter = async (filterParams: DashboardFilterParams) => {
    setIsLoading(true);
    setFilters(filterParams);
    setIsFilterModalOpen(false);

    try {
      const response = await MapsApi.getRecoDataMaps({
        months: filterParams.months || [],
        year: filterParams.year || new Date().getFullYear(),
        recos: filterParams.recos || [],
        sync: false,
      });

      if (response?.status === 200 && response.data) {
        const data = response.data as { withMap: any[]; withoutMap: any[] };
        setMapData({
          withMap: data.withMap.map((item: any, index: number) => ({
            id: `map-${index}`,
            lat: item.latitude,
            lng: item.longitude,
            form: item.form,
            reported_date: item.reported_date,
            year: item.year,
            month: item.month,
            reco: item.reco,
            patient: item.patient,
            family: item.family,
          })),
          withoutMap: data.withoutMap || [],
        });
        showSuccess(`${data.withMap.length} point(s) chargé(s)`);
      } else {
        showWarning('Aucune donnée trouvée');
      }
    } catch (error) {
      showError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCenterOnUser = () => {
    const map = mapInstanceRef.current;
    if (map && userMarkerRef.current) {
      const latlng = userMarkerRef.current.getLatLng();
      map.setView(latlng, 14);
    } else {
      locateUser(map!);
    }
  };

  const handleZoomToFit = () => {
    const map = mapInstanceRef.current;
    const cluster = markerClusterRef.current;
    if (!map || !cluster) return;

    const bounds = cluster.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.1));
    }
  };

  const stats = {
    total: mapData.withMap.length + mapData.withoutMap.length,
    withCoords: mapData.withMap.length,
    withoutCoords: mapData.withoutMap.length,
  };

  return (
    <div className={styles.pageContainer}>
      {/* Compact Header */}
      <PageHeader
        title="Cartes"
        subtitle="Visualisation géographique des activités RECO"
      />

      {/* Full Screen Map Container */}
      <div className={styles.mapWrapper}>
        {/* Map */}
        <div ref={mapRef} className={styles.map} />

        {/* Loading Overlay */}
        {isLoading && (
          <div className={styles.mapOverlay}>
            <RefreshCw size={32} className="animate-spin" />
            <span>Chargement...</span>
          </div>
        )}

        {/* Top Controls - Filter and More */}
        <div className={styles.topControls}>
          <Button variant="primary" size="sm" onClick={() => setIsFilterModalOpen(true)}>
            <Filter size={16} />
            Filtrer
          </Button>

          {/* More Menu */}
          <div className={styles.moreMenuWrapper} ref={moreMenuRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={styles.moreButton}
            >
              {isMoreMenuOpen ? <X size={16} /> : <MoreHorizontal size={16} />}
              Plus
            </Button>

            {isMoreMenuOpen && (
              <div className={styles.moreMenu}>
                <button
                  className={styles.moreMenuItem}
                  onClick={() => {
                    setIsLayerModalOpen(true);
                    setIsMoreMenuOpen(false);
                  }}
                >
                  <Layers size={16} />
                  <span>Couches</span>
                </button>
                <button
                  className={`${styles.moreMenuItem} ${showRecoMarkers ? styles.active : ''}`}
                  onClick={() => setShowRecoMarkers(!showRecoMarkers)}
                >
                  {showRecoMarkers ? <Eye size={16} /> : <EyeOff size={16} />}
                  <Users size={16} />
                  <span>RECO</span>
                </button>
                <button
                  className={`${styles.moreMenuItem} ${showHealthCenters ? styles.active : ''}`}
                  onClick={() => setShowHealthCenters(!showHealthCenters)}
                >
                  {showHealthCenters ? <Eye size={16} /> : <EyeOff size={16} />}
                  <Building2 size={16} />
                  <span>Centres</span>
                </button>
                <button className={styles.moreMenuItem} onClick={handleCenterOnUser}>
                  <Navigation size={16} />
                  <span>Ma position</span>
                </button>
                <button className={styles.moreMenuItem} onClick={handleZoomToFit}>
                  <Maximize size={16} />
                  <span>Ajuster vue</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Info Panel - Stats & Legend */}
        <div className={styles.bottomPanel}>
          <div className={styles.statsSection}>
            <div className={styles.statItem}>
              <MapPin size={14} />
              <span>{stats.withCoords} avec coordonnées</span>
            </div>
            <div className={styles.statItem}>
              <span>{stats.withoutCoords} sans coordonnées</span>
            </div>
            <div className={styles.statItem}>
              <strong>Total:</strong> {stats.total}
            </div>
          </div>
          <div className={styles.legendSection}>
            <div className={styles.legendItem}>
              <div className={styles.legendMarker} style={{ background: '#f59e0b' }}></div>
              <span>Activités RECO</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendMarker} style={{ background: '#22c55e', borderRadius: '4px' }}></div>
              <span>Centres de santé</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendMarker} style={{ background: '#3b82f6' }}></div>
              <span>Votre position</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filtrer les données"
      >
        <DashboardFilters
          onFilter={handleFilter}
          isLoading={isLoading}
          initialValues={filters || undefined}
        />
      </Modal>

      {/* Layer Selection Modal */}
      <Modal
        isOpen={isLayerModalOpen}
        onClose={() => setIsLayerModalOpen(false)}
        title="Sélectionner le fond de carte"
      >
        <div className={styles.layerOptions}>
          {(Object.keys(TILE_LAYERS) as Array<keyof typeof TILE_LAYERS>).map((key) => (
            <label
              key={key}
              className={`${styles.layerOption} ${currentTileLayer === key ? styles.layerOptionActive : ''}`}
            >
              <input
                type="radio"
                name="tileLayer"
                value={key}
                checked={currentTileLayer === key}
                onChange={() => {
                  setCurrentTileLayer(key);
                  setIsLayerModalOpen(false);
                }}
              />
              <span>{TILE_LAYERS[key].name}</span>
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
}
