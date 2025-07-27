import Notification from "../models/notification.model.js";

const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .populate("relatedUser", "name username profilePicture")
      .populate("relatedPost", "content image");

    if (!Array.isArray(notifications)) {
      return res.status(500).json({ message: "Données des notifications mal formatées" });
    }

    res.status(200).json(notifications);
  } catch (error) {
    console.log("Error in getUserNotifications", error);
    res.status(500).json({ message: "Erreur serveur interne" });
  }
};

const markNotificationAsRead = async (req, res) => {
  const notificationId = req.params.id;
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: req.user._id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée" });
    }

    res.json(notification);
  } catch (error) {
    console.log("Erreur de markNotificationAsRead", error);
    res.status(500).json({ message: "Erreur serveur interne" });
  }
};

const deleteNotification = async (req, res) => {
  const notificationId = req.params.id;
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Notification non trouvée ou non autorisée" }); 
    }

    res.json({ message: "Notification supprimée avec succès" });
  } catch (error) {
    console.log("Erreur de deleteNotification", error);
    res.status(500).json({ message: "Erreur serveur interne" }); 
  }
};



export { getUserNotifications, markNotificationAsRead, deleteNotification };
