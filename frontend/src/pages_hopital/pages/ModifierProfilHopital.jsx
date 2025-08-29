import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ModiferProfilHopital.css"



export default function ModifierProfilHopital() {
  const [profil, setProfil] = useState({
    nom: "",
    adresse: "",
    position: { lat: 0, lng: 0 },
    region: "",
    contact: {
      telephoneUrgence: "",
      telephoneSecondaire: "",
      email: "",
      siteWeb: ""
    },
    responsable: {
      nom: "",
      contact: ""
    },
    capacites: {
      lits: 0,
      sallesOperation: 0,
      ambulances: 0,
      urgenceDisponible: false,
      heuresOuverture: ""
    },
    medias: {
      logo: "",
      imageCouverture: ""
    },
    ambulances: [],
    profilVerifie: false
  });

  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
 
  let email = null;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      email = payload.email;
    } catch {
      email = null;
    }
  }
const handleUnauthorized = () => {
  localStorage.removeItem('token'); // On supprime le token
  navigate('/login');              // Redirection vers la page login
};

  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/hopitaux/profil/by-email/${email}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfil(res.data);
        setLoading(false);
      }
       catch (error) {
  if (error.response?.status === 403) {
    handleUnauthorized();
  } else {
    setMessage({ text: "Erreur lors du chargement des données.", type: "error" });
  }
  setLoading(false);
}

    };
    
    if (email) {
      fetchProfil();
    } else {
      setLoading(false);
      setMessage({ text: "Email utilisateur introuvable.", type: "error" });
    }
  }, [email, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfil({ ...profil, [name]: value });
  };

  const handleNestedChange = (parent, e) => {
    const { name, value, type, checked } = e.target;
    setProfil({
      ...profil,
      [parent]: {
        ...profil[parent],
        [name]: type === 'checkbox' ? checked : value
      }
    });
  };

  const handleAmbulanceChange = (index, e) => {
    const { name, value } = e.target;
    const newAmbulances = [...profil.ambulances];
    newAmbulances[index] = { ...newAmbulances[index], [name]: value };
    setProfil({ ...profil, ambulances: newAmbulances });
  };

  const addAmbulance = () => {
    setProfil({
      ...profil,
      ambulances: [...profil.ambulances, { id: Date.now(), type: 'A' }]
    });
  };

  const removeAmbulance = (index) => {
    const newAmbulances = profil.ambulances.filter((_, i) => i !== index);
    setProfil({ ...profil, ambulances: newAmbulances });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3000/api/hopitaux/${profil._id}`, profil);
      setMessage({ text: "Profil mis à jour avec succès !", type: "success" });
      setTimeout(() => navigate("/hopital/profil"), 1500);
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      setMessage({ text: "Erreur lors de la mise à jour du profil.", type: "error" });
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
    </div>
  );

  if (!profil) return (
    <div className="error-container">
      <h2>Aucun profil trouvé</h2>
      <p>Nous n'avons pas pu charger le profil de l'hôpital.</p>
    </div>
  );

  return (
    <div className="modifier-profil-page">
      <div className="profil-header">
        <div className="header-content">
          <h1>Modifier le profil hospitalier</h1>
          <p>Mettez à jour les informations de votre établissement</p>
        </div>
        <span className={`verification-badge ${profil.profilVerifie ? 'verified' : 'not-verified'}`}>
          {profil.profilVerifie ? "Profil vérifié" : "Non vérifié"}
        </span>
      </div>

      {message.text && (
        <div className={`message-alert ${message.type}`}>
          {message.type === "success" ? (
            <svg className="icon" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          ) : (
            <svg className="icon" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="profil-form">
        {/* Section Informations générales */}
        <div className="form-section">
          <h2>Informations générales</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="nom">Nom de l'hôpital *</label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={profil.nom}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="adresse">Adresse</label>
              <input
                type="text"
                id="adresse"
                name="adresse"
                value={profil.adresse}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="region">Région</label>
              <input
                type="text"
                id="region"
                name="region"
                value={profil.region}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Coordonnées GPS</label>
              <div className="gps-coordinates">
                <input
                  type="number"
                  id="lat"
                  name="lat"
                  value={profil.position?.lat || 0}
                  onChange={(e) => setProfil({
                    ...profil, 
                    position: { ...profil.position, lat: parseFloat(e.target.value) }
                  })}
                  step="0.000001"
                  placeholder="Latitude"
                />
                <input
                  type="number"
                  id="lng"
                  name="lng"
                  value={profil.position?.lng || 0}
                  onChange={(e) => setProfil({
                    ...profil, 
                    position: { ...profil.position, lng: parseFloat(e.target.value) }
                  })}
                  step="0.000001"
                  placeholder="Longitude"
                />
                 <div className="form-group">
              <label htmlFor="osmId">osmId</label>
              <input
                type="text"
                id="osmId"
                name="osmId"
                value={profil.osmId}
                onChange={handleChange}
              />
            </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Contact */}
        <div className="form-section">
          <h2>Coordonnées de contact</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="telephoneUrgence">Téléphone urgence *</label>
              <input
                type="text"
                id="telephoneUrgence"
                name="telephoneUrgence"
                value={profil.contact?.telephoneUrgence || ""}
                onChange={(e) => handleNestedChange('contact', e)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="telephoneSecondaire">Téléphone secondaire</label>
              <input
                type="text"
                id="telephoneSecondaire"
                name="telephoneSecondaire"
                value={profil.contact?.telephoneSecondaire || ""}
                onChange={(e) => handleNestedChange('contact', e)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profil.contact?.email || ""}
                onChange={(e) => handleNestedChange('contact', e)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="siteWeb">Site web</label>
              <input
                type="text"
                id="siteWeb"
                name="siteWeb"
                value={profil.contact?.siteWeb || ""}
                onChange={(e) => handleNestedChange('contact', e)}
                placeholder="https://"
              />
            </div>
          </div>
        </div>

        {/* Section Responsable */}
        <div className="form-section">
          <h2>Responsable</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="responsableNom">Nom du responsable</label>
              <input
                type="text"
                id="responsableNom"
                name="nom"
                value={profil.responsable?.nom || ""}
                onChange={(e) => handleNestedChange('responsable', e)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="responsableContact">Contact responsable</label>
              <input
                type="text"
                id="responsableContact"
                name="contact"
                value={profil.responsable?.contact || ""}
                onChange={(e) => handleNestedChange('responsable', e)}
              />
            </div>
          </div>
        </div>

        {/* Section Capacités */}
        <div className="form-section">
          <h2>Capacités</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="lits">Nombre de lits</label>
              <input
                type="number"
                id="lits"
                name="lits"
                value={profil.capacites?.lits || 0}
                onChange={(e) => handleNestedChange('capacites', e)}
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="sallesOperation">Salles d'opération</label>
              <input
                type="number"
                id="sallesOperation"
                name="sallesOperation"
                value={profil.capacites?.sallesOperation || 0}
                onChange={(e) => handleNestedChange('capacites', e)}
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="ambulances">Nombre d'ambulances</label>
              <input
                type="number"
                id="ambulances"
                name="ambulances"
                value={profil.capacites?.ambulances || 0}
                onChange={(e) => handleNestedChange('capacites', e)}
                min="0"
              />
            </div>

            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="urgenceDisponible"
                name="urgenceDisponible"
                checked={profil.capacites?.urgenceDisponible || false}
                onChange={(e) => handleNestedChange('capacites', e)}
              />
              <label htmlFor="urgenceDisponible">Service d'urgence disponible</label>
            </div>

            <div className="form-group">
              <label htmlFor="heuresOuverture">Heures d'ouverture</label>
              <input
                type="text"
                id="heuresOuverture"
                name="heuresOuverture"
                value={profil.capacites?.heuresOuverture || ""}
                onChange={(e) => handleNestedChange('capacites', e)}
                placeholder="Ex: 24h/24 ou 8h-20h"
              />
            </div>
          </div>
        </div>

        {/* Section Médias */}
        <div className="form-section">
          <h2>Médias</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="logo">URL du logo</label>
              <input
                type="text"
                id="logo"
                name="logo"
                value={profil.medias?.logo || ""}
                onChange={(e) => handleNestedChange('medias', e)}
              />
              {profil.medias?.logo && (
                <div className="media-preview">
                  <p>Aperçu du logo :</p>
                  <img src={profil.medias.logo} alt="Logo actuel" />
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="imageCouverture">URL image de couverture</label>
              <input
                type="text"
                id="imageCouverture"
                name="imageCouverture"
                value={profil.medias?.imageCouverture || ""}
                onChange={(e) => handleNestedChange('medias', e)}
              />
              {profil.medias?.imageCouverture && (
                <div className="media-preview">
                  <p>Aperçu de la couverture :</p>
                  <img src={profil.medias.imageCouverture} alt="Couverture actuelle" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section Ambulances */}
        <div className="form-section">
          <div className="section-header">
            <h2>Ambulances embarquées</h2>
            <button type="button" onClick={addAmbulance} className="add-button">
            + 
              Ajouter
            </button>
          </div>

          {profil.ambulances?.length === 0 ? (
            <div className="empty-state">
              <p>Aucune ambulance enregistrée</p>
            </div>
          ) : (
            <div className="ambulances-list">
              {profil.ambulances?.map((amb, index) => (
                <div className="ambulance-card" key={index}>
                  <div className="ambulance-fields">
                  <div className="form-group">
                    <label htmlFor={`ambulance-${index}-id`}>ID ambulance</label>
                    <input
                      type="number"
                      id={`ambulance-${index}-id`}
                      name="id"
                      value={amb.id || ""}
                      onChange={(e) => handleAmbulanceChange(index, e)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor={`ambulance-${index}-type`}>Type ambulance</label>
                    <select
                      id={`ambulance-${index}-type`}
                      name="type"
                      value={amb.type || "A"}
                      onChange={(e) => handleAmbulanceChange(index, e)}
                    >
                      <option value="A">Type A</option>
                      <option value="B">Type B</option>
                      <option value="C">Type C</option>
                    </select>
                  </div>
</div>
                  <button 
                   type="button" 
                    onClick={() => removeAmbulance(index)}
                  className="delete-btn"
                        >
                           ×
                  </button>
                
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={() => navigate("/hopital/profil")}>
            Annuler
          </button>
          <button type="submit" className="submit-button">
            Enregistrer les modifications
          </button>
        </div>
      </form>

      <style >{`
      
        /* Header */
        .profil-header {
         
         color: "white",
          padding: 2rem;
          border-radius: var(--radius-lg);
          margin-bottom: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          box-shadow: var(--shadow-md);
        }

        .header-content h1 {
          font-size: 1.75rem;
          margin: 0 0 0.5rem 0;
          font-weight: 700;
        }

        .header-content p {
          margin: 0;
          opacity: 0.9;
          font-size: 1rem;
        }

        .verification-badge {
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .verified {
          background-color: rgba(16, 185, 129, 0.1);
          color: #065f46;
        }
      .not-verified {
          background-color: rgba(245, 158, 11, 0.1);
          color: #92400e;
        }
            .ambulance-card {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    padding: 1rem;
    background-color: white;
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
    margin-bottom: 1rem;
  }

  .ambulance-fields {
    flex-grow: 1;
    display: flex;
    gap: 1rem;
  }

  .ambulance-fields .form-group {
    flex: 1;
    margin-bottom: 0;
  }

  .delete-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #fef2f2;
    color: #dc2626;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .delete-btn:hover {
    background-color: #fee2e2;
  }
      `}</style>
    </div>
  );
}