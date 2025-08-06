import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class MapsService {
    constructor() { }

    /**
     * Ouvre Google Maps à la position donnée
     * @param lat Latitude
     * @param lng Longitude
     */
    openInGoogleMaps({ lat, lng }: { lat: number, lng: number }): void {
        if (!this.isValidCoordinate(lat) || !this.isValidCoordinate(lng)) {
            console.error('Latitude ou longitude invalide.');
            return;
        }

        const locationQuery = `${lat},${lng}`;
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${locationQuery}`;
        const geoUrl = `geo:${locationQuery}?q=${locationQuery}`;

        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        try {
            if (isMobile && this.canUseGeoUrl()) {
                window.location.href = geoUrl; // Tentative d'ouverture de l'app
            } else {
                window.open(mapsUrl, '_blank'); // Fallback navigateur
            }
        } catch (error) {
            console.error('Erreur lors de l’ouverture de Google Maps :', error);
            window.open(mapsUrl, '_blank');
        }
    }

    /**
     * Optionnel : partage de lien via API Web Share
     */
    shareLocation({ lat, lng }: { lat: number, lng: number }): void {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

        if (navigator.share) {
            navigator.share({
                title: 'Localisation',
                text: 'Voir cette position sur Google Maps',
                url: mapsUrl,
            }).catch((error) => {
                console.warn('Partage annulé ou échoué :', error);
            });
        } else {
            console.warn('Partage non supporté sur ce navigateur.');
        }
    }

    private canUseGeoUrl(): boolean {
        return true;
    }

    private isValidCoordinate(coord: number): boolean {
        return typeof coord === 'number' && isFinite(coord);
    }
}
