const express = require("express");
const router = express.Router();
const Intervention = require("../models/Intervention");
const Ambulance = require("../models/Ambulance");
const Appel = require("../models/Appel");
const { updateAppelStatus } = require('../services/appels.service');
const { getAllStats } = require('../services/stats.service');
const { notifierStatistiques } = require('../websocket');

const {prioriserEtAffecterAmbulances } = require('../services/appels.service');
const verifyToken = require('../middlewares/auth.middleware');
const Ambulancier = require('../models/Ambulancier');

// GET /interventions/en-cours
router.get("/en-cours", async (req, res) => {
  try {
    // On cherche toutes les interventions avec statut "en cours"
    // et on enrichit avec les infos d'appel et d'ambulance
    const interventions = await Intervention.find({ statut: "en cours" })
      .populate("appelId")// Remplace l'ID par l'objet Appel complet
      .populate("ambulanceId")// Remplace l'ID par l'objet Ambulance complet
      .sort({ debutIntervention: -1 });// Trie du plus récent au plus ancien

    res.json(interventions);
  } catch (err) {
    console.error(" Erreur récupération interventions :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});



// GET interventions de l'ambulancier connecté
router.get('/mes-interventions', verifyToken, async (req, res) => {
  try {
    // L'utilisateur connecté est un ambulancier (via le token)
    const userId = req.user.id;

    // Trouver le document Ambulancier correspondant à ce userId
    const ambulancier = await Ambulancier.findOne({ userId });
    if (!ambulancier) {
      return res.status(404).json({ message: "Ambulancier non trouvé" });
    }

    // Trouver toutes les interventions liées à cet ambulancier
    const interventions = await Intervention.find({ ambulancierId: ambulancier._id })
      .populate('appelId')
      .populate('ambulanceId')
      .populate('hopitalId');

    res.json(interventions);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
//  terminer une intervention
async function terminerIntervention(interventionId) {
   // Récupération de l'intervention
  const intervention = await Intervention.findById(interventionId);
  if (!intervention) throw new Error("Intervention introuvable");

  // Marquer comme terminée et ajouter la date de fin
  intervention.finIntervention = new Date();
  intervention.statut = "terminée";
  await intervention.save();
  // Libérer l'ambulance assignée
  if (intervention.ambulanceId) {
    await Ambulance.findByIdAndUpdate(intervention.ambulanceId, {
      etat: 'disponible',
      //statut: 'disponible',
      destination: null,
    });
  }
  //  Mettre à jour l'appel lié comme "terminé"
  if (intervention.appelId) {
    await Appel.findByIdAndUpdate(intervention.appelId, {
      etat: "terminée",
    });
  }
 // Réaffecter les ambulances si nécessaire
  await prioriserEtAffecterAmbulances();
  // Mettre à jour les stats en temps réel
  const updatedStats = await getAllStats();
  notifierStatistiques(updatedStats);

  return intervention;
}
//  Terminer une intervention (PATCH)
router.patch("/:id/terminer", async (req, res) => {
  try {
    const intervention = await terminerIntervention(req.params.id);
    res.json({ message: "Intervention terminée", intervention });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Terminer une intervention (PUT, alternative)
router.put("/:id/finish", async (req, res) => {
  try {
    const intervention = await terminerIntervention(req.params.id);
    res.json({ message: "Intervention et appel terminés", intervention });
  } catch (error) {
    console.error("Erreur lors de la fin d'intervention :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;

