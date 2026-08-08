import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

const MapHeatmap = () => {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    api.get('/admin/locations').then((res) => setLocations(res.data?.locations || []));
  }, []);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/30">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Complaint heatmap</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Incident hotspots</h2>
        </div>
      </div>
      <div className="h-[520px] rounded-3xl overflow-hidden border border-slate-800">
        <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom className="h-full w-full">
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {locations.map((item) => (
            <Marker key={`${item.lat}-${item.lng}`} position={[item.lat, item.lng]}>
              <Popup>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm">{item.description}</p>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapHeatmap;