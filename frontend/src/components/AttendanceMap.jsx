import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to center map when location changes
function ChangeView({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, 13);
        }
    }, [center, map]);
    return null;
}

const AttendanceMap = ({ location, markers = [] }) => {
    const defaultCenter = [0, 0];
    const center = location ? [location.latitude, location.longitude] : defaultCenter;

    return (
        <div style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <MapContainer center={center} zoom={location ? 13 : 2} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {location && (
                    <Marker position={[location.latitude, location.longitude]}>
                        <Popup>Your Current Location</Popup>
                    </Marker>
                )}

                {markers.map((m, idx) => (
                    <Marker key={idx} position={[m.latitude, m.longitude]}>
                        <Popup>{m.name || 'Employee Location'}</Popup>
                    </Marker>
                ))}

                <ChangeView center={location ? [location.latitude, location.longitude] : null} />
            </MapContainer>
        </div>
    );
};

export default AttendanceMap;
