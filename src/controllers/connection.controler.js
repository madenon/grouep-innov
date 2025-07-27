import { sendConnectionAcceptedEmail } from "../mailtrap/emails.js";
import ConnectionRequest from "../models/connectionRequest.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.params; // a qui on  envoie une demande d invitation
    const senderId = req.user._id; // deja connecté et qui envoie la demande
    if (senderId.toString() === userId.toString()) {
      return res.status(403).json({
        message: "Vous ne pouvez pas vous envoyer une demande à vous-même",
      });
    }
    if (req.user.connections.includes(userId)) {
      return res.status(403).json({ message: "vous êtes déjà connectés." });
    }
    const existingRequest = await ConnectionRequest.findOne({
      sender: senderId,
      recipient: userId,
      status: "pending",
    });
    if (existingRequest) {
      return res
        .status(403)
        .json({ message: "Vous avez deja envoyé une demande de connection" });
    }
    const newRequest = new ConnectionRequest({
      sender: senderId,
      recipient: userId,
    });
    await newRequest.save();
    res.status(200).json({ message: "Demande d'invitation envoyée" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur Serveur Internal" });
  }
};

const acceptConnectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    const request = await ConnectionRequest.findById(requestId)
      .populate("sender", "name email  username")
      .populate("recipient", "name  username");
    if (!request) {
      return res
        .status(404)
        .json({ message: "Demande d'invitation introuvable" });
    }
    // verifier que l utilisateur n est pas deja connecte

    if (request.recipient._id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Non autorisé à accepter cette demande" });
    }
    if (request.status !== "pending") {
      return res
        .status(403)
        .json({ message: "Cette demande a déjà été traitée" });
    }

    request.status = "accepted";
    await request.save();

    await User.findByIdAndUpdate(request.sender._id, {
      $addToSet: { connections: userId },
    });
    await User.findByIdAndUpdate(userId, {
      $addToSet: { connections: request.sender._id },
    });

    const notification = new Notification({
      recipient: request.sender._id,
      type: "connectionAccepted",
      relatedUser: userId,
    });

    await notification.save();
    res.status(200).json({ message: "Demande d'invitation acceptée" });
    // envoie d'email
    const senderEmail = request.sender.email;
    const requestSenderName = request.sender.name;
    const requestAccepterName = request.recipient.name;
    const profileUrl =
      process.env.CLIENT_URL + "/profile/" + request.recipient.username;

    try {
      await sendConnectionAcceptedEmail(
        senderEmail,
        requestSenderName, // nom du destinataire de la demande
        requestAccepterName,
        profileUrl
      );
    } catch (error) {
      console.log("Erreur d'envoie d'acceptation de connection", error);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur Serveur Internal" });
  }
};

const rejectConnectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    const request = await ConnectionRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Demande introuvable" });
    }
    if (request.recipient.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Non autorisé à accepter cette demande" });
    }

    if (request.status !== "pending") {
      return res
        .status(403)
        .json({ message: "Cette demande a déjà été traitée" });
    }
    request.status = "rejected";
    await request.save();
    res.json({ message: "Demande d'invitation rejettée" });
  } catch (error) {
    console.log("Erreur de rejectConnectionRequest", error);
    res.status(500).json({ message: "Erreur Serveur Internal" });
  }
};

const getConnectionRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;
    const requests = await ConnectionRequest.find({
      recipient: userId,
      status: "pending",
    })
      .populate("sender", "name  username headline connections")
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.status(200).json(requests);
  } catch (error) {
    console.log("Erreur de getConnectionRequests", error);
    res.status(500).json({ message: "Erreur Serveur Internal" });
  }
};

const getUserConnections = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate(
      "connections",
      "name username profilePicture headline connections"
    );
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }
    res.json(user.connections);
  } catch (error) {
    console.log("Erreur de getUserConnection", error);
    res.status(500).json({ message: "Erreur Serveur Internal" });
  }
};

const removeConnection = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;
    if (!myId) {
      return res.status(400).json({ message: "myId manquant" });
    }
    if (!userId) {
      return res.status(400).json({ message: "userId manquant" });
    }
    await User.findByIdAndUpdate(myId, {
      $pull: { connections: userId },
    });
    await User.findByIdAndUpdate(userId, {
      $pull: { connections: myId },
    });

    res.status(200).json({ message: "Connexion supprimée" });
  } catch (error) {
    console.log("Erreur de removeConnection", error);
    res.status(500).json({ message: "Erreur Serveur Internal" });
  }
};
const getConnectionStatus = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;
    const currentUser = req.user;

    if (currentUser.connections.includes(targetUserId)) {
      return res.status(200).json({ status: "connected" });
    }
    const pendingRequest = await ConnectionRequest.findOne({
      $or: [
        { sender: currentUserId, recipient: targetUserId },
        { sender: targetUserId, recipient: currentUserId },
      ],
      status: "pending",
    });
    if (pendingRequest) {
      if (pendingRequest.sender.toString() === currentUserId.toString()) {
        return res.status(200).json({ status: "pending" });
      } else {
        return res
          .status(200)
          .json({ status: "received", requestId: pendingRequest._id });
      }
    }
    // s'il y a pas de connection ou de demande en attente 
    return res.status(200).json({ status: "not_connected" });
  } catch (error) {
    console.log("Erreur de getConnectionStatus", error);
    res.status(500).json({ message: "Erreur Serveur Internal" });
  }
};

export {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getConnectionRequests,
  getUserConnections,
  removeConnection,
  getConnectionStatus,
};
