import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomNotification from '../../components/Notification/Notification';
import { useNavigate } from 'react-router-dom';

const Affectation = () => {
  const [ressources, setRessources] = useState({
    ambulanciers: [],
    ambulances: []
  });
  const [affectations, setAffectations] = useState([]);
  const [selectedAmbulancier, setSelectedAmbulancier] = useState(null);
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({});
const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const [ressourcesRes, affectationsRes] = await Promise.all([
          axios.get('http://localhost:3000/api/affectations/ressources', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:3000/api/affectations', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setRessources(ressourcesRes.data);
        setAffectations(affectationsRes.data.filter(aff => aff.ambulancierId && aff.ambulanceId));
        setLoading(false);
      } catch (err) {
       if (err.response?.status === 403) {
    handleUnauthorized();
  } else {
    setError('Erreur lors du chargement des données');
  }
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);
const handleUnauthorized = () => {
  localStorage.removeItem('token'); // On supprime le token
  navigate('/login');              // Redirection vers la page login
};

  const showConfirm = (message, onConfirm) => {
    setDialogConfig({
      message,
      onConfirm: () => {
        onConfirm();
        setShowConfirmDialog(false);
      }
    });
    setShowConfirmDialog(true);
  };

  const handleAffectation = async () => {
    if (!selectedAmbulancier || !selectedAmbulance) {
      setError('Veuillez sélectionner un ambulancier et une ambulance');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:3000/api/affectations',
        {
          ambulancierId: selectedAmbulancier,
          ambulanceId: selectedAmbulance
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Affectation créée avec succès');
      setError(null);

      setRessources(prev => ({
        ambulanciers: prev.ambulanciers.map(a =>
          a._id === selectedAmbulancier ? { ...a, statut: 'en mission' } : a
        ),
        ambulances: prev.ambulances.map(a =>
          a._id === selectedAmbulance ? { ...a, statut: 'en mission' } : a
        )
      }));

      setAffectations(prev => [response.data, ...prev]);
      setSelectedAmbulancier(null);
      setSelectedAmbulance(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création de l\'affectation');
      setSuccess(null);
    }
  };

  const handleClearHistory = async () => {
    showConfirm("Êtes-vous sûr de vouloir effacer tout l'historique des affectations ?", async () => {
      try {
        await axios.delete('http://localhost:3000/api/affectations/clear', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setSuccess('Historique effacé avec succès');
        setError(null);
        setAffectations([]);

        const response = await axios.get('http://localhost:3000/api/affectations/ressources', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRessources(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Erreur lors de la suppression de l\'historique');
        setSuccess(null);
      }
    });
  };

  const handleTerminerAffectation = async (affectationId) => {
    try {
      await axios.patch(
        `http://localhost:3000/api/affectations/${affectationId}/terminer`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Affectation terminée avec succès');
      setError(null);

      const [ressourcesRes, affectationsRes] = await Promise.all([
        axios.get('http://localhost:3000/api/affectations/ressources', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:3000/api/affectations', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setRessources(ressourcesRes.data);
      setAffectations(affectationsRes.data.filter(aff => aff.ambulancierId && aff.ambulanceId));
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la terminaison de l\'affectation');
      setSuccess(null);
    }
  };

  const styles = {
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: "'Inter', sans-serif",
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '2rem',
      textAlign: 'center',
      background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '1.5rem',
      position: 'relative',
      paddingBottom: '0.5rem',
      '&:after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '50px',
        height: '3px',
        background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
        borderRadius: '3px'
      }
    },
    mainCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 25px rgba(0, 0, 0, 0.03)',
      marginBottom: '2rem',
      border: '1px solid rgba(0, 0, 0, 0.03)'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1.5rem',
      marginBottom: '1rem',
      '@media (max-width: 768px)': {
        gridTemplateColumns: '1fr'
      }
    },
       header: {
      background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
      color: "white",
      padding: "20px",
      borderRadius: "8px 8px 0 0",
      marginBottom: "0"
    },
    headerTitle: {
      margin: "0",
      fontSize: "24px",
      fontWeight: "600"
    },
    formGroup: {
      marginBottom: '1.25rem'
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: '500',
      color: '#475569',
      fontSize: '0.9rem'
    },
    select: {
      width: '100%',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      backgroundColor: 'white',
      fontSize: '0.95rem',
      transition: 'all 0.2s',
      '&:focus': {
        outline: 'none',
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
      }
    },
    button: {
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '0.875rem 2rem',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '600',
      display: 'block',
      margin: '1.5rem auto 0',
      transition: 'all 0.2s',
      '&:hover': {
        backgroundColor: '#2563eb',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
      },
      '&:disabled': {
        backgroundColor: '#cbd5e1',
        cursor: 'not-allowed',
        transform: 'none',
        boxShadow: 'none'
      }
    },
    clearButton: {
      backgroundColor: '#ef4444',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: '500',
      transition: 'all 0.2s',
      '&:hover': {
        backgroundColor: '#dc2626'
      }
    },
    terminerButton: {
      backgroundColor: '#2563eb',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: '500',
      transition: 'all 0.2s',
      '&:hover': {
        backgroundColor: '#2563eb'
      }
    },
    alert: {
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      fontSize: '0.95rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    },
    error: {
      backgroundColor: '#fff5f5',
      color: '#dc2626',
      borderLeft: '4px solid #dc2626'
    },
    success: {
      backgroundColor: '#f0fdf4',
      color: '#16a34a',
      borderLeft: '4px solid #16a34a'
    },
    resourceGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    },
    resourceCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 25px rgba(0, 0, 0, 0.03)',
      border: '1px solid rgba(0, 0, 0, 0.03)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.05)'
      }
    },
    resourceContent: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '1rem',
      maxHeight: '500px',
      overflowY: 'auto',
      paddingRight: '0.5rem'
    },
    itemCard: {
      backgroundColor: '#ffffff',
      borderRadius: '10px',
      padding: '1.25rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.2s',
      border: '1px solid #e2e8f0',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.35rem 0.8rem',
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: '600',
      marginTop: '0.75rem',
      backgroundColor: '#f1f5f9',
      color: '#334155'
    },
    available: {
      backgroundColor: '#f0fdf4',
      color: '#166534'
    },
    onMission: {
      backgroundColor: '#fffbeb',
      color: '#92400e'
    },
    itemTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      paddingBottom: '0.5rem',
      borderBottom: '1px solid #f1f5f9'
    },
    itemText: {
      fontSize: '0.9rem',
      color: '#64748b',
      marginBottom: '0.5rem',
      lineHeight: '1.5',
      '& strong': {
        color: '#475569',
        fontWeight: '500'
      }
    },
    emptyState: {
      textAlign: 'center',
      padding: '2rem',
      color: '#64748b'
    },
    loadingSpinner: {
      width: '48px',
      height: '48px',
      border: '4px solid rgba(59, 130, 246, 0.1)',
      borderTopColor: '#3b82f6',
      borderRadius: '50%',
      margin: '0 auto 1.5rem',
      animation: 'spin 1s linear infinite'
    },
    loadingText: {
      color: '#64748b',
      fontSize: '1rem',
      textAlign: 'center'
    },
    // Nouveaux styles pour la boîte de dialogue de confirmation
    confirmDialog: {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "2000",
    },
    confirmDialogContent: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "20px",
      width: "350px",
      maxWidth: "90%",
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      animation: "fadeInScale 0.3s forwards",
    },
    confirmDialogMessage: {
      marginBottom: "20px", 
      fontSize: "16px", 
      color: "#333", 
      textAlign: "center"
    },
    confirmDialogButtons: {
      display: "flex", 
      justifyContent: "center", 
      gap: "15px"
    },
    confirmDialogButton: {
      padding: "10px 20px",
      border: "none",
      borderRadius: "20px",
      cursor: "pointer",
      fontWeight: "bold",
      transition: "all 0.2s",
    },
    confirmDialogCancelButton: {
      backgroundColor: "#ecf0f1",
      color: "#7f8c8d",
    },
    confirmDialogConfirmButton: {
      backgroundColor: "#e74c3c",
      color: "white",
    }
  };

  if (loading) {
    return (
      <div style={{
        ...styles.container,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Chargement des ressources...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>Gestion des Affectations</h2>
      </div>

      {showConfirmDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <p style={{ marginBottom: '20px' }}>{dialogConfig.message}</p>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                onClick={() => setShowConfirmDialog(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e0e0e0',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={dialogConfig.onConfirm}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <CustomNotification 
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {success && (
        <CustomNotification 
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}

      {/* Formulaire d'affectation */}
      <div style={styles.mainCard}>
        <h2 style={styles.sectionTitle}>Nouvelle Affectation</h2>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label htmlFor="ambulancier" style={styles.label}>Ambulancier</label>
            <select
              id="ambulancier"
              style={styles.select}
              onChange={(e) => setSelectedAmbulancier(e.target.value)}
            >
              <option value="">Sélectionner un ambulancier</option>
              {ressources.ambulanciers
                .filter(a => a.statut === 'disponible')
                .map(amb => (
                  <option key={amb._id} value={amb._id}>
                    {amb.nom} {amb.prenom} - {amb.matricule}
                  </option>
                ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="ambulance" style={styles.label}>Ambulance</label>
            <select
              id="ambulance"
              style={styles.select}
              onChange={(e) => setSelectedAmbulance(e.target.value)}
            >
              <option value="">Sélectionner une ambulance</option>
              {ressources.ambulances
                .filter(a => a.statut === 'disponible')
                .map(amb => (
                  <option key={amb._id} value={amb._id}>
                    Ambulance {amb.id} - Type {amb.type}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <button
          style={styles.button}
          onClick={handleAffectation}
          disabled={!selectedAmbulancier || !selectedAmbulance}
        >
          Valider l'Affectation
        </button>
      </div>

      {/* Ressources */}
      <div style={styles.resourceGrid}>
        {/* Ambulanciers */}
        <div style={styles.resourceCard}>
          <h2 style={styles.sectionTitle}>Ambulanciers ({ressources.ambulanciers.length})</h2>
          <div style={styles.resourceContent}>
            {ressources.ambulanciers.map(amb => (
              <div key={amb._id} style={styles.itemCard}>
                <h3 style={styles.itemTitle}>
                  <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {amb?.nom || 'N/A'} {amb?.prenom || 'N/A'}
                </h3>
                <p style={styles.itemText}><strong>Matricule:</strong> {amb.matricule}</p>
                <p style={styles.itemText}><strong>Téléphone:</strong> {amb.telephone}</p>
                <p style={styles.itemText}><strong>Expérience:</strong> {amb.anneesExperience} ans</p>
                <span style={{
                  ...styles.statusBadge,
                  ...(amb.statut === 'en-mission' ? styles.onMission : styles.available)
                }}>
                  {amb.statut === 'en-mission' ? 'En mission' : 'Disponible'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ambulances */}
        <div style={styles.resourceCard}>
          <h2 style={styles.sectionTitle}>Ambulances ({ressources.ambulances.length})</h2>
          <div style={styles.resourceContent}>
            {ressources.ambulances.map(amb => (
              <div key={amb._id} style={styles.itemCard}>
                <h3 style={styles.itemTitle}>
                  <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Ambulance {amb.id}
                </h3>
                <p style={styles.itemText}><strong>Type:</strong> {amb.type}</p>
                <p style={styles.itemText}><strong>Position:</strong> {amb.position?.lat ? `${amb.position.lat}, ${amb.position.lng}` : 'Non définie'}</p>
                {amb.destination && <p style={styles.itemText}><strong>Destination:</strong> {amb.destination}</p>}
                <span style={{
                  ...styles.statusBadge,
                  ...(amb.etat === 'en mission' ? styles.onMission : styles.available)
                }}>
                  {amb.etat === 'en mission' ? 'En mission' : 'Disponible'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Affectations */}
        <div style={styles.resourceCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={styles.sectionTitle}>Historique des Affectations ({affectations.length})</h2>
            {affectations.length > 0 && (
              <button 
                onClick={handleClearHistory}
                style={styles.clearButton}
              >
                Effacer l'historique
              </button>
            )}
          </div>
          <div style={styles.resourceContent}>
            {affectations.length > 0 ? (
              affectations.map(aff => (
                <div key={aff._id} style={styles.itemCard}>
                  <h3 style={styles.itemTitle}>
                    <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {aff.ambulancierId.nom} {aff.ambulancierId.prenom}
                  </h3>
                  <p style={styles.itemText}><strong>Téléphone:</strong> {aff.ambulancierId.telephone}</p>
                  <p style={styles.itemText}><strong>Ambulance:</strong> Type {aff.ambulanceId.type}</p>
                  <p style={styles.itemText}><strong>État:</strong> {aff.ambulanceId.etat}</p>
                  <p style={styles.itemText}><strong>Date de début:</strong> {new Date(aff.dateDebut).toLocaleString()}</p>
                  {aff.dateFin && (
                    <p style={styles.itemText}><strong>Date de fin:</strong> {new Date(aff.dateFin).toLocaleString()}</p>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    {!aff.dateFin && (
                      <button 
                        onClick={() => handleTerminerAffectation(aff._id)}
                        style={styles.terminerButton}
                      >
                        Terminer l'affectation
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.emptyState}>
                Aucune affectation enregistrée
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
};

export default Affectation;