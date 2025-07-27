import Appointment from "../models/appointement.model.js";

// Contrôleur pour vérifier les créneaux réservés
const checkAvailability = async (req, res) => {
  const { date, time } = req.query;
  
  // Crée une date à partir du format ISO (date + heure)
  const appointmentTime = new Date(`${date}T${time}:00`);

  // Vérifie que la date est valide
  if (isNaN(appointmentTime.getTime())) {
    return res.status(400).json({ message: "Date et/ou heure invalides." });
  }

  try {
    const existingAppointment = await Appointment.findOne({ scheduledAt: appointmentTime });

    if (existingAppointment) {
      return res.status(400).json({ message: "Ce créneau est déjà réservé." });
    }

    res.status(200).json({ message: "Ce créneau est disponible." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la vérification de la disponibilité." });
  }
};

// Contrôleur pour réserver un créneau
const reserveAppointment = async (req, res) => {
  const { date, time, notes } = req.body;
  
  // Crée une date à partir du format ISO (date + heure)
  const appointmentTime = new Date(`${date}T${time}:00`);

  // Vérifie que la date est valide
  if (isNaN(appointmentTime.getTime())) {
    return res.status(400).json({ message: "Date et/ou heure invalides." });
  }

  try {
    const existingAppointment = await Appointment.findOne({ scheduledAt: appointmentTime });

    if (existingAppointment) {
      return res.status(400).json({ message: "Ce créneau est déjà réservé." });
    }

    const newAppointment = new Appointment({
      user: req.user.id,  // Assurez-vous que l'utilisateur est authentifié
      type: "discussion",  // Ou "installation" selon le cas
      scheduledAt: appointmentTime,
      notes: notes,  // Enregistrer les notes (raison du rendez-vous)
    });

    await newAppointment.save();
    res.status(201).json({ message: "Rendez-vous réservé avec succès.", newAppointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la réservation du rendez-vous." });
  }
};

// Contrôleur pour annuler un rendez-vous
const cancelAppointment = async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }

    // Vérifier si l'utilisateur authentifié est l'owner du rendez-vous
    const isOwner = appointment.user.toString() === req.user.id;
    const isSuperAdmin = req.user.role === "superAdmin";
    const isAdmin = req.user.role === "admin";

    // Si l'utilisateur n'est ni le propriétaire, ni un admin/superadmin
    if (!isOwner && !isSuperAdmin && !isAdmin) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à annuler ce rendez-vous." });
    }

    // Modifier le statut du rendez-vous
    appointment.status = "cancelled";
    await appointment.save();

    res.status(200).json({ message: "Rendez-vous annulé avec succès.", appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'annulation du rendez-vous." });
  }
};

// Contrôleur pour reporter un rendez-vous
const rescheduleAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { newDate, newTime } = req.body;
  
  // Crée une nouvelle date à partir du format ISO (date + heure)
  const newAppointmentTime = new Date(`${newDate}T${newTime}:00`);

  // Vérifie que la nouvelle date est valide
  if (isNaN(newAppointmentTime.getTime())) {
    return res.status(400).json({ message: "Nouvelle date et/ou heure invalides." });
  }

  try {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }

    // Vérifie si l'utilisateur authentifié est bien celui qui a réservé le rendez-vous
    if (appointment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier ce rendez-vous." });
    }

    // Vérifier si le nouveau créneau est déjà réservé
    const existingAppointment = await Appointment.findOne({ scheduledAt: newAppointmentTime });
    if (existingAppointment) {
      return res.status(400).json({ message: "Ce créneau est déjà réservé." });
    }

    // Mettre à jour la date du rendez-vous
    appointment.scheduledAt = newAppointmentTime;
    await appointment.save();
    res.status(200).json({ message: "Rendez-vous reporté avec succès.", appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors du report du rendez-vous." });
  }
};

// Contrôleur pour récupérer un rendez-vous par son ID
const getAppointmentById = async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }

    // Vérifie si l'utilisateur authentifié est bien celui qui a réservé le rendez-vous
    if (appointment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à voir ce rendez-vous." });
    }

    res.status(200).json({ appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération du rendez-vous." });
  }
};

// Contrôleur pour récupérer tous les rendez-vous de tous les utilisateurs

const getAllAppointments = async (req, res) => {
  try {
    // Récupérer tous les rendez-vous pour un admin
    const appointments = await Appointment.find().populate("user", "name email"); // Ajoutez `populate` pour obtenir les informations sur l'utilisateur
    res.status(200).json({ appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des rendez-vous." });
  }
};



export {
  checkAvailability,
  reserveAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getAppointmentById,
  getAllAppointments
};
