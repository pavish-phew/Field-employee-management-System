import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

const RoutingMachine = ({ from, to }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !from || !to) return;

    let routeLine;

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.routes || !data.routes.length) return;

        const coords = data.routes[0].geometry.coordinates.map(
          ([lng, lat]) => [lat, lng]
        );

        routeLine = L.polyline(coords, {
          color: "#6366f1",
          weight: 5,
        }).addTo(map);

        // auto zoom
        map.fitBounds(routeLine.getBounds());

      } catch (err) {
        console.error("Route fetch error:", err);
      }
    };

    fetchRoute();

    return () => {
      if (routeLine) {
        map.removeLayer(routeLine);
      }
    };
  }, [map, from, to]);

  return null;
};

export default RoutingMachine;