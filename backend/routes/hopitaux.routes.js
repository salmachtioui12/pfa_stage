const express = require('express');
const router = express.Router();
const Hopital = require('../models/Hopital');
const { fetchHopitauxNearby } = require('../services/hopitaux.service');
const mongoose = require('mongoose'); 
const ObjectId = mongoose.Types.ObjectId;
router.get('/', async (req, res) => {
  const { lat, lng, radius } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: "lat et lng requis" });

  try {
    // Récupère les hôpitaux proches via Overpass API
    const overpassHopitaux = await fetchHopitauxNearby(lat, lng, radius);

    // Fusionne les données Overpass avec celles en base Mongo
    const hopitauxComplets = await Promise.all(overpassHopitaux.map(async (hopital) => {
      const stock = await Hopital.findOne({ osmId: hopital.id });
 
      // Si Overpass ne fournit pas d’adresse, on prend celle de la base
      const adresseFinale = hopital.adresse && hopital.adresse.trim() !== ""
        ? hopital.adresse
        : stock?.adresse ?? "Adresse inconnue";

      return {
        ...hopital,
        adresse: adresseFinale,
        nombreAmbulances: stock?.nombreAmbulances ?? null,
        ambulances: stock?.ambulances ?? []
      };
    }));

    res.json(hopitauxComplets);
  } catch (err) {
    console.error(" Erreur Overpass API:", err);
    res.status(500).json({ error: "Erreur API Overpass" });
  }
});


router.get('/stocks', async (req, res) => {
  try {
    const hopitaux = await Hopital.find();
    res.json(hopitaux);
  } catch (err) {
    res.status(500).json({ error: "Erreur MongoDB" });
  }
});
// cree hopital
router.post('/api/hopitaux', async (req, res) => {
  const { osmId, nom, adresse, position, nombreAmbulances,ambulances } = req.body;
  try {
    const hopital = new Hopital({ osmId, nom, adresse, position, nombreAmbulances,ambulances });
    await hopital.save();
    res.status(201).json(hopital);
  } catch (err) {
    res.status(500).json({ error: "Erreur enregistrement MongoDB" });
  }
});


// update hopital
router.put('/:id', async (req, res) => {
  try {
    const hopital = await Hopital.findById(req.params.id);
    if (!hopital) return res.status(404).json({ error: "Hôpital non trouvé" });

    // Mise à jour des champs simples
    hopital.nom = req.body.nom;
    hopital.adresse = req.body.adresse;
    hopital.region = req.body.region;
    hopital.position = req.body.position;
    hopital.osmId=req.body.osmId;
  
    hopital.profilVerifie = req.body.profilVerifie ?? hopital.profilVerifie;

     // 🚑 Fusion des ambulances
    if (Array.isArray(req.body.ambulances)) {
      const existantes = hopital.ambulances || [];

      const fusion = req.body.ambulances.map(newAmb => {
        const deja = existantes.find(a => a.id === newAmb.id);
        console.log("iddddddddddd",newAmb.id)
        
        return deja ? deja : newAmb; // ⚠️ garde l’ancienne si elle existe
      });

      hopital.ambulances = fusion;
    }
    // Contact
    hopital.contact = {
      telephoneUrgence: req.body.contact?.telephoneUrgence || "",
      telephoneSecondaire: req.body.contact?.telephoneSecondaire || "",
      email: req.body.contact?.email || "",
      siteWeb: req.body.contact?.siteWeb || ""
    };

    // Responsable
    hopital.responsable = {
      nom: req.body.responsable?.nom || "",
      contact: req.body.responsable?.contact || ""
    };

    // Capacités
    hopital.capacites = {
      lits: req.body.capacites?.lits || 0,
      sallesOperation: req.body.capacites?.sallesOperation || 0,
      ambulances: req.body.capacites?.ambulances || 0,
      urgenceDisponible: req.body.capacites?.urgenceDisponible || false,
      heuresOuverture: req.body.capacites?.heuresOuverture || ""
    };

    // Médias
    hopital.medias = {
      logo: req.body.medias?.logo || "",
      imageCouverture: req.body.medias?.imageCouverture || ""
    };

    await hopital.save(); // déclenche middleware post('save')

    res.json({
      message: "Hôpital mis à jour avec succès",
      hopital
    });
  } catch (err) {
    console.error("Erreur lors de la mise à jour de l'hôpital :", err);
    res.status(500).json({ error: "Erreur lors de la mise à jour de l'hôpital" });
  }
});

module.exports = router;
// routes/hopitaux.js
router.put('/profil/:id', async (req, res) => {
  const id = req.params.id;
 // Mise à jour en un seul appel (plus simple que la version précédente)
  try {
    const hopital = await Hopital.findByIdAndUpdate(id, req.body, { new: true });
    if (!hopital) return res.status(404).json({ message: 'Hôpital non trouvé' });

    res.json({ message: "Profil mis à jour avec succès", hopital });
  } catch (err) {
    console.error("Erreur update hopital:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});



// TEST 
router.put('/test-route/:id', async (req, res) => {
  console.log(' Route atteinte, ID:', req.params.id);
  return res.status(200).json({ test: "OK" });
});
// Route DELETE pour supprimer un hôpital
router.delete('/:id', async (req, res) => {
  console.log(" Suppression en cours pour ID :", req.params.id);
  try {
    const hopital = await Hopital.findByIdAndDelete(req.params.id);
    if (!hopital) {
      return res.status(404).json({ error: "Hôpital non trouvé" });
    }
    res.json({ message: " Hôpital supprimé avec succès", hopital });
  } catch (err) {
    console.error(" Erreur suppression hôpital:", err);
    res.status(500).json({ error: "Erreur lors de la suppression de l'hôpital" });
  }
});

router.get('/profil/:id', async (req, res) => {
  try {
    
    const hopital = await Hopital.findById(req.params.id);
    if (!hopital) {
      return res.status(404).json({ message: "Hôpital non trouvé" });
    }
    res.json(hopital);
  } catch (err) {
    console.error("Erreur lors de la récupération du profil:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
router.get('/profil/by-email/:email', async (req, res) => {
  try {
    const emailRecherche = req.params.email;
    const hopital = await Hopital.findOne({ "contact.email": { $regex: new RegExp(`^${emailRecherche}$`, 'i') } });

    if (!hopital) {
      return res.status(404).json({ message: "Hôpital non trouvé pour cet email" });
    }

    res.json(hopital);
  } catch (err) {
    console.error("Erreur lors de la récupération du profil par email:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});



module.exports = router;