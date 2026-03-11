"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const createIcon = (selected) =>
  L.divIcon({
    className: "",
    html: `<div style="width:28px;height:40px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">
      <svg viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26S28 24.5 28 14C28 6.27 21.73 0 14 0z"
          fill="${selected ? "#f58b31" : "#1d4ed8"}"/>
        <circle cx="14" cy="14" r="5" fill="white"/>
      </svg>
    </div>`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });

function FlyToStore({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 14, { duration: 1 });
    }
  }, [lat, lng, map]);
  return null;
}

export default function MapView({ stores, selectedStore, onSelectStore }) {
  // Only stores that have _coords (geocoded or from location_map)
  const storesWithCoords = stores.filter((s) => s._coords?.lat && s._coords?.lng);

  const selectedCoords = selectedStore?._coords;

  const center = selectedCoords
    ? [selectedCoords.lat, selectedCoords.lng]
    : [11.1271, 78.6569]; // Tamil Nadu center

  return (
    <MapContainer
      center={center}
      zoom={7}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToStore lat={selectedCoords?.lat} lng={selectedCoords?.lng} />
      {storesWithCoords.map((store) => (
        <Marker
          key={store._id}
          position={[store._coords.lat, store._coords.lng]}
          icon={createIcon(selectedStore?._id === store._id)}
          eventHandlers={{ click: () => onSelectStore(store) }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-bold text-blue-800">{store.organisation_name}</p>
              {(store.address || store.location) && (
                <p className="text-gray-600 mt-1">{store.address || store.location}</p>
              )}
              {store.phone && <p className="text-gray-700 mt-1">{store.phone}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
