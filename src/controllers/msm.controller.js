import mongoose from "mongoose";
import User from "../models/user.model.js";
import Conversation from "../models/msm.model.js";

const createMessage = async (req, res) => {
  const { receiverId, content, conversationId } = req.body;
  const senderId = req.user._id;

  // Vérifier si le message est vide
  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Le message ne peut pas être vide." });
  }

  // Vérification de la validité de l'ID du destinataire
  if (!mongoose.Types.ObjectId.isValid(receiverId)) {
    return res.status(400).json({ message: "ID de destinataire invalide." });
  }

  try {
    // Vérification du destinataire
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Utilisateur destinataire introuvable." });
    }

    // Empêcher l'envoi de message à soi-même
    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({ message: "Vous ne pouvez pas vous envoyer un message à vous-même." });
    }

    // Vérifier ou créer la conversation
    let conversation;
    if (conversationId) {
      // Si un `conversationId` est fourni, on l'utilise
      conversation = await Conversation.findById(conversationId);
    } else {
      // Sinon, on cherche une conversation existante avec les deux participants
      conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
      });

      if (!conversation) {
        // Si aucune conversation n'est trouvée, on en crée une nouvelle
        conversation = new Conversation({
          participants: [senderId, receiverId],
          messages: [],
        });
        await conversation.save();
      }
    }

    // Ajouter le message à la conversation
    conversation.messages.push({
      sender: senderId,
      receiver: receiverId,
      content,
      timestamp: new Date(),
    });

    await conversation.save();

    // Réponse réussie
    res.status(201).json({
      message: "Message envoyé avec succès.",
      conversation,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur, veuillez réessayer." });
  }
};

const deleteMessage = async (req, res) => {
  const { messageId, conversationId } = req.params;
  const userId = req.user._id;

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation introuvable." });
    }

    const message = conversation.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message introuvable." });
    }

    if (message.sender.toString() !== userId.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Vous n'avez pas les droits pour supprimer ce message." });
    }

    // Marquer le message comme supprimé
    message.isDeleted = true;  // Met à jour le champ isDeleted

    await conversation.save();

    res.status(200).json({
      message: "Message marqué comme supprimé avec succès.",
      conversation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur, veuillez réessayer." });
  }
};

const getMessages = async (req, res) => {
  const { userId } = req.params; // On récupère l'ID de l'utilisateur depuis les paramètres de la requête

  try {
    // Vérifie si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    // Récupère toutes les conversations auxquelles l'utilisateur participe
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("messages.sender", "username avatar _id profileImage profilePicture")  // Ajout de profileImage et profilePicture
      .populate("messages.receiver", "username avatar _id profileImage profilePicture")  // Idem pour le destinataire
      .exec();

    // Si aucune conversation n'est trouvée
    if (!conversations.length) {
      return res.status(404).json({ message: "Aucune conversation trouvée." });
    }

    // On retourne les conversations avec leurs messages
    res.status(200).json({ conversations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur, veuillez réessayer." });
  }
};


export { createMessage ,deleteMessage, getMessages };
