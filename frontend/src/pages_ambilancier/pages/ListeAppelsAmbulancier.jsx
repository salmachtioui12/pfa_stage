import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { useNavigate } from 'react-router-dom';

// Fix leaflet marker icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Custom styles
const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "'Segoe UI', Roboto, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    paddingBottom: "15px",
    borderBottom: "2px solid #e0e0e0",
  },
  title: {
    color: "#2c3e50",
    fontSize: "28px",
    fontWeight: "600",
    margin: "0",
  },
  interventionCard: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    padding: "25px",
    marginBottom: "30px",
    borderLeft: "5px solid #3498db",
  },
  patientHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  patientName: {
    color: "#2c3e50",
    fontSize: "22px",
    fontWeight: "500",
    margin: "0",
  },
  gravityTag: (gravity) => ({
    backgroundColor: 
      gravity === "critique" ? "#e74c3c" :
      gravity === "urgent" ? "#f39c12" :
      "#2ecc71",
    color: "white",
    padding: "5px 15px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "bold",
    marginLeft: "15px",
  }),
  detailSection: {
    marginBottom: "20px",
  },
  sectionTitle: {
    color: "#3498db",
    fontSize: "18px",
    fontWeight: "500",
    marginBottom: "15px",
    display: "flex",
    alignItems: "center",
  },
  detailRow: {
    display: "flex",
    marginBottom: "10px",
    fontSize: "15px",
  },
  detailLabel: {
    fontWeight: "600",
    color: "#7f8c8d",
    minWidth: "150px",
  },
  detailValue: {
    color: "#34495e",
  },
  divider: {
    border: "none",
    height: "1px",
    backgroundColor: "#ecf0f1",
    margin: "20px 0",
  },
  mapContainer: {
    height: "400px",
    width: "100%",
    borderRadius: "8px",
    marginTop: "20px",
    border: "1px solid #e0e0e0",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "200px",
    fontSize: "18px",
    color: "#7f8c8d",
  },
  error: {
    color: "#e74c3c",
    backgroundColor: "#fdecea",
    padding: "15px",
    borderRadius: "5px",
    textAlign: "center",
    margin: "20px 0",
  },
  emptyState: {
    textAlign: "center",
    color: "#7f8c8d",
    padding: "40px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
  },
  actionButton: {
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    marginRight: "10px",
    fontWeight: "500",
    transition: "background-color 0.3s",
    ":hover": {
      backgroundColor: "#2980b9",
    },
  },
  buttonGroup: {
    display: "flex",
    marginTop: "15px",
  },
  routeInfo: {
    backgroundColor: "#f8f9fa",
    padding: "10px",
    borderRadius: "5px",
    marginTop: "10px",
  },
  secondaryButton: {
    backgroundColor: "#95a5a6",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    marginRight: "10px",
    fontWeight: "500",
    transition: "background-color 0.3s",
    ":hover": {
      backgroundColor: "#7f8c8d",
    },
  },
};

export default function MesInterventions() {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [route, setRoute] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
const navigate = useNavigate();

  // Configure leaflet icons
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });
  }, []);

  // Custom icons
  const patientIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/1077/1077012.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const ambulanceIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967497.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const hopitalIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const isValidCoordinate = (coord) => {
    return coord && 
           typeof coord.lat === 'number' && 
           typeof coord.lng === 'number' &&
           Math.abs(coord.lat) <= 90 &&
           Math.abs(coord.lng) <= 180;
  };

 const calculateRoute = async (start, end) => {
  if (!isValidCoordinate(start) || !isValidCoordinate(end)) {
    setError("Coordonnées invalides pour le calcul d'itinéraire");
    return;
  }

  setCalculatingRoute(true);
  setError("");
  setRoute(null);
  setDistance(null);
  setDuration(null);

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const res = await axios.get(url);

    if (res.data && res.data.routes && res.data.routes.length > 0) {
      const coords = res.data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      setRoute(coords);
      setDistance(`${(res.data.routes[0].distance / 1000).toFixed(1)} km`);
      setDuration(`${Math.round(res.data.routes[0].duration / 60)} min`);
    } else {
      setError("Aucune route trouvée");
    }
  } catch (err) {
    console.error("Routing error:", err);
    setError("Impossible de calculer l'itinéraire. Utilisez Google Maps.");
  } finally {
    setCalculatingRoute(false);
  }
};


  const openGoogleMapsNavigation = (start, end) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const openWazeNavigation = (end) => {
    const url = `https://www.waze.com/ul?ll=${end.lat},${end.lng}&navigate=yes`;
    window.open(url, "_blank");
  };
const handleUnauthorized = () => {
  localStorage.removeItem('token'); // On supprime le token
  navigate('/login');              // Redirection vers la page login
};

  useEffect(() => {
    const fetchInterventions = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Utilisateur non authentifié");
        setLoading(false);
        return;
      }
      
      try {
        const decoded = jwtDecode(token);
        const res = await axios.get(
          "http://localhost:3000/interventions/mes-interventions",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setInterventions(res.data.filter(iv => iv.statut === "en cours"));
      } catch (err) {
        console.error("Fetch error:", err);
        if (err.response?.status === 403) {
    handleUnauthorized();
  } else {
    setError('Erreur lors du chargement des données');
  }
      } finally {
        setLoading(false);
      }
    };
    
    fetchInterventions();
  }, []);

  if (loading) return <div style={styles.loading}>Chargement en cours...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (interventions.length === 0) return (
    <div style={styles.emptyState}>
      <p>Aucune intervention en cours actuellement.</p>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Mes Interventions en Cours</h1>
      </div>

      {interventions.map(iv => {
        const posPatient = iv.appelId?.position;
        const posAmbulance = iv.ambulanceId?.position;
        const posHopital = iv.hopitalId?.position;
        const centerMap = posAmbulance || posPatient || [33.57, -7.59];

        return (
          <div key={iv._id} style={styles.interventionCard}>
            <div style={styles.patientHeader}>
              <h2 style={styles.patientName}>
                {iv.appelId?.patientName || "Patient non spécifié"}
                <span style={styles.gravityTag(iv.appelId?.gravite)}>
                  {iv.appelId?.gravite}
                </span>
              </h2>
              <div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Début:</span>
                  <span style={styles.detailValue}>
                    {new Date(iv.debutIntervention).toLocaleString()}
                  </span>
                </div>
                {iv.finEstimee && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Fin estimée:</span>
                    <span style={styles.detailValue}>
                      {new Date(iv.finEstimee).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div style={styles.detailSection}>
              <h3 style={styles.sectionTitle}> Détails de l'appel</h3>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Localisation:</span>
                <span style={styles.detailValue}>{iv.appelId?.localisation}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Description:</span>
                <span style={styles.detailValue}>{iv.appelId?.description}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Heure appel:</span>
                <span style={styles.detailValue}>
                  {new Date(iv.appelId?.heureAppel).toLocaleString()}
                </span>
              </div>
              {posPatient && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Coordonnées:</span>
                  <span style={styles.detailValue}>
                    {posPatient.lat}, {posPatient.lng}
                  </span>
                </div>
              )}
            </div>

            <hr style={styles.divider} />

            <div style={{ display: "flex", gap: "30px" }}>
              <div style={{ flex: 1 }}>
                <h3 style={styles.sectionTitle}> Ambulance</h3>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>ID ambulancier:</span>
                  <span style={styles.detailValue}>{iv.ambulancierId}</span>
                </div>
                {posAmbulance && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Position:</span>
                    <span style={styles.detailValue}>
                      {posAmbulance.lat}, {posAmbulance.lng}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={styles.sectionTitle}> Hôpital</h3>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Nom:</span>
                  <span style={styles.detailValue}>{iv.hopitalId?.nom}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Adresse:</span>
                  <span style={styles.detailValue}>{iv.hopitalId?.adresse}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Urgence disponible:</span>
                  <span style={{
                    ...styles.detailValue,
                    color: iv.hopitalId?.capacites?.urgenceDisponible ? "#27ae60" : "#e74c3c",
                    fontWeight: "600"
                  }}>
                    {iv.hopitalId?.capacites?.urgenceDisponible ? "Oui" : "Non"}
                  </span>
                </div>
              </div>
            </div>

            {posAmbulance && posPatient && (
              <>
                <div style={styles.buttonGroup}>
                  <button 
                    style={styles.actionButton}
                    onClick={() => calculateRoute(posAmbulance, posPatient)}
                    disabled={calculatingRoute}
                  >
                    {calculatingRoute ? "Calcul en cours..." : "Calculer l'itinéraire"}
                  </button>
                  <button 
                    style={styles.secondaryButton}
                    onClick={() => openGoogleMapsNavigation(posAmbulance, posPatient)}
                  >
                    Ouvrir dans Google Maps
                  </button>
                  <button 
                    style={styles.secondaryButton}
                    onClick={() => openWazeNavigation(posPatient)}
                  >
                    Ouvrir dans Waze
                  </button>
                  
                </div>

                {error && (
                  <div style={{ ...styles.error, margin: "15px 0", padding: "10px" }}>
                    {error}
                  </div>
                )}
              </>
            )}

            {(distance || duration) && (
              <div style={styles.routeInfo}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Distance:</span>
                  <span style={styles.detailValue}>{distance}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Durée estimée:</span>
                  <span style={styles.detailValue}>{duration}</span>
                </div>
              </div>
            )}

          {(posPatient || posAmbulance || posHopital) && (
  <div style={styles.mapContainer}>
    <MapContainer
      center={centerMap}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", borderRadius: "8px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {posPatient && (
        <Marker position={[posPatient.lat, posPatient.lng]} icon={patientIcon}>
          <Popup>Patient: {iv.appelId?.patientName}</Popup>
        </Marker>
      )}

      {posAmbulance && (
        <Marker position={[posAmbulance.lat, posAmbulance.lng]} icon={ambulanceIcon}>
          <Popup>Votre ambulance</Popup>
        </Marker>
      )}

      {posHopital && (
        <Marker position={[posHopital.lat, posHopital.lng]} icon={hopitalIcon}>
          <Popup>Hôpital: {iv.hopitalId?.nom}</Popup>
        </Marker>
      )}

      {route && (
        <Polyline 
          positions={route} 
          color="#3498db" 
          weight={5} 
          opacity={0.7} 
        />
      )}
    </MapContainer>
  </div>
)}

          </div>
        );
      })}
    </div>
  );
}