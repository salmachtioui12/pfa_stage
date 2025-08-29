const express = require('express');
const router = express.Router();
const Affectation = require('../models/AffectationAmbulancier');
const Ambulancier = require('../models/Ambulancier');
const Ambulance = require('../models/Ambulance');
const Hopital = require('../models/Hopital');

// 🔐 Middleware pour vérifier le token
const verifyToken = require('../middlewares/auth.middleware');

// GET ambulanciers & ambulances de l'hôpital connecté
const mongoose = require("mongoose");

router.get('/ressources', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("userId dans req:", userId);

    // Récupérer l'hôpital du user connecté
    const hopital = await Hopital.findOne({ userId });
    if (!hopital) {
      return res.status(404).json({ error: 'Hôpital introuvable' });
    }

    console.log("Hopital connecté:", hopital._id, "Email:", hopital.contact.email);

    // Récupérer les ambulanciers via l'email d'hôpital
    const ambulanciers = await Ambulancier.find({ emailHopital: hopital.contact.email });

    // Récupérer les ambulances via hopitalId
    const ambulances = await Ambulance.find({ hopitalId: hopital._id });

    res.json({ ambulanciers, ambulances });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});







// POST créer affectation
// POST créer affectation
router.post('/', verifyToken, async (req, res) => {
  try {
    const { ambulancierId, ambulanceId } = req.body;
    const hopitalId = req.userId;

    // Vérification que les IDs existent
    const ambulancierExists = await Ambulancier.findById(ambulancierId);
    const ambulanceExists = await Ambulance.findById(ambulanceId);

    if (!ambulancierExists || !ambulanceExists) {
      return res.status(400).json({ error: 'Ambulancier ou ambulance introuvable' });
    }

    const affectation = new Affectation({
      ambulanceId,  // Correspond au schéma
      ambulancierId, // Correspond au schéma
      hopital: hopitalId,
      dateDebut: new Date() // Utilisez dateDebut comme dans le schéma
    });

    await affectation.save();
    
    // Mettez à jour les statuts
    await Ambulancier.findByIdAndUpdate(ambulancierId, { statut: 'en-mission' });
    await Ambulance.findByIdAndUpdate(ambulanceId, { statut: 'affecter' });

    res.status(201).json(affectation);
  } catch (error) {
    console.error('Erreur détaillée:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de l\'affectation',
      details: error.message 
    });
  }
});

// ✅ GET toutes les affectations de l’hôpital connecté
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Récupérer l'hôpital lié à ce user
    const hopital = await Hopital.findOne({ userId });
    if (!hopital) {
      return res.status(404).json({ error: 'Hôpital introuvable' });
    }

    // 2. Récupérer toutes les ambulances de cet hôpital
    const ambulances = await Ambulance.find({ hopitalId: hopital._id });
    const ambulanceIds = ambulances.map(a => a._id);

    // 3. Récupérer les affectations liées à ces ambulances
    const affectations = await Affectation.find({ ambulanceId: { $in: ambulanceIds } })
      .populate('ambulancierId', 'nom prenom telephone statut')
      .populate('ambulanceId', 'id type etat statut');

    res.json(affectations);
  } catch (error) {
    console.error("Erreur GET affectations:", error);
    res.status(500).json({ error: 'Erreur lors de la récupération des affectations' });
  }
});


// DELETE toutes les affectations d’un hôpital
router.delete('/clear', verifyToken, async (req, res) => {
  try {
    const hopitalId = req.userId;

    // Trouver toutes les affectations liées à l’hôpital
    const affectations = await Affectation.find({ hopital: hopitalId });

    // Récupérer les IDs pour les mises à jour de statuts
    const ambulancierIds = affectations.map(a => a.ambulancierId);
    const ambulanceIds = affectations.map(a => a.ambulanceId);

    // Supprimer les affectations
    await Affectation.deleteMany({ hopital: hopitalId });

    // Réinitialiser les statuts
    await Ambulancier.updateMany(
      { _id: { $in: ambulancierIds } },
      { $set: { statut: 'disponible' } }
    );

    await Ambulance.updateMany(
      { _id: { $in: ambulanceIds } },
      { $set: { statut: 'disponible' } }
    );

    res.status(200).json({ message: "Toutes les affectations ont été supprimées avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression des affectations :", error);
    res.status(500).json({ error: "Erreur lors de la suppression des affectations." });
  }
});
// PATCH terminer une affectation (ajout de dateFin)
router.patch('/:id/terminer', verifyToken, async (req, res) => {
  try {
    const affectationId = req.params.id;
    const dateFin = new Date(); // maintenant

    const affectation = await Affectation.findById(affectationId);
    if (!affectation) {
      return res.status(404).json({ error: 'Affectation introuvable' });
    }

 

    affectation.dateFin = dateFin;
    await affectation.save();

    // Libérer l'ambulancier et l'ambulance
    await Ambulancier.findByIdAndUpdate(affectation.ambulancierId, { statut: 'disponible' });
    await Ambulance.findByIdAndUpdate(affectation.ambulanceId, { statut: 'disponible' });

    res.json({ message: 'Affectation terminée', affectation });
  } catch (error) {
    console.error('Erreur lors de la terminaison:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
