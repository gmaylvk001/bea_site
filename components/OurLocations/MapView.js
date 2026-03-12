"use client";

const MAPS_BASE =
  "https://www.google.com/maps/d/embed?mid=1vsvXMLc5zU4Aoks8fq6rNSBTauwsMYtz";

export default function MapView({ selectedStore }) {
  const src = selectedStore?._coords?.lat
    ? `${MAPS_BASE}&ll=${selectedStore._coords.lat},${selectedStore._coords.lng}&z=14`
    : `${MAPS_BASE}&ll=11.636463743060151,77.66049321182919&z=9`;

  return (
    <iframe
      key={src}
      src={src}
      width="100%"
      height="100%"
      style={{ border: 0 }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
