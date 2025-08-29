const mongoose = require("mongoose");
const Ambulance = require("./Ambulance");

//  Schéma ambulance embarquée
const EmbeddedAmbulanceSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  type: { type: String, enum: ['A', 'B', 'C'], required: true }
}, { _id: false });

//  Schéma hopital

const HopitalSchema = new mongoose.Schema({
  osmId: Number,
  nom: { type: String, required: true },
  adresse: String,
  position: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  region: String,

  contact: {
    telephoneUrgence: String,
    telephoneSecondaire: String,
    email: String,
    siteWeb: String
  },

  responsable: {
    nom: String,
    contact: String
  },

  capacites: {
    lits: Number,
    sallesOperation: Number,
    ambulances: Number,
    urgenceDisponible: Boolean,
    heuresOuverture: String
  },

  medias: {
    logo: String,
    imageCouverture: String
  },
   userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // si tu as un modèle User
    required: true
  },

  profilVerifie: { type: Boolean, default: false },
  dateCreation: { type: Date, default: Date.now },
  ambulances: [EmbeddedAmbulanceSchema]
});

// 3. creation hopital + synchronisation(syncAmbulances) avec ambulances
HopitalSchema.post('save', async function(hopital) {
  console.log(" Middleware SAVE déclenché pour :", hopital.nom);
  await syncAmbulances(hopital);
});

// update hopital + synchronisation(syncAmbulances) avec ambulances
HopitalSchema.post('findOneAndUpdate', async function(result) {
  if (result) await syncAmbulances(result);
});

// 5. Fonction de synchronisation avec ambulances
async function syncAmbulances(hopital) {
  console.log(" syncAmbulances appelée pour :", hopital.nom);
  if (!hopital?.ambulances) return;

  try {
    const ambulanceIds = hopital.ambulances.map(a => a.id);

    // 	Crée ou met à jour les ambulances dans la base
    await Promise.all(hopital.ambulances.map(async (amb) => {
      await Ambulance.findOneAndUpdate(
        { id: amb.id, hopitalId: hopital._id },
        {
          type: amb.type,
          position: hopital.position,
         
          hopitalId: hopital._id
        },
        { upsert: true }
      );
    }));

    //  Supprime les ambulances de la base liées à l'hôpital supprimé
    const result = await Ambulance.deleteMany({
      hopitalId: hopital._id,
      id: { $nin: ambulanceIds }
    });

    console.log(` ${ambulanceIds.length} ambulances synchronisées pour ${hopital.nom}`);
    console.log(` ${result.deletedCount} ambulances supprimées pour ${hopital.nom}`);
  } catch (err) {
    console.error(" Erreur synchro ambulances:", err);
  }
}

// delete d'un hopital
HopitalSchema.post("findOneAndDelete", async function (doc) {
 
  if (!doc) return; // rien à faire si l'hôpital n'existe pas
 // si l'hopital existe  + suppression des ambulaces 
  try {
    const result = await Ambulance.deleteMany({ hopitalId: doc._id });
    console.log(
      `  ${result.deletedCount} ambulances supprimées (cascade) pour «${doc.nom}»`
    );
  } catch (err) {
    console.error(" Erreur durant la suppression en cascade :", err);
  }
});

module.exports = mongoose.model("Hopital", HopitalSchema);