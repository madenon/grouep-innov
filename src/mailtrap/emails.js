import {
  createCommentNotificationEmailTemplate,
  createConnectionAcceptedEmailTemplate,
  createMessageNotificationEmailTemplate,
  createWelcomeEmailTemplate,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
} from "./emailTemplates.js";

import { mailtrapClient, sender } from "./mailtrap.config.js";

export const sendVerificationEmail = async (email, name, profileUrl, verificationToken) => {
  const recipient = [{ email }];

  const htmlContent = VERIFICATION_EMAIL_TEMPLATE
    .replace("{name}", name)
    .replace("{profileUrl}", profileUrl)
    .replace("{verificationCode}", verificationToken);

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Vérification de votre email",
      html: htmlContent,
      category: "Verification d'Email",
    });
    console.log("Email envoyé avec succès:", response);
  } catch (error) {
    console.log(`Erreur lors de l'envoi de verification: ${error}`);
    throw new Error(`Erreur lors de l'envoi de l'email de vérification: ${error}`);
  }
};

export const sendwelcomeEmail = async (email, name) => {
  const recipient = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      template_uuid: process.env.MAILTRAP_UUID,
      template_variables: {
        compagny: "Group Echotech Innov Sarl",
        name: name,
      },
    });
    console.log("Email de bienvenue envoyé avec succès:", response);
  } catch (error) {
    console.log(`Erreur lors de l'envoi de l'email de bienvenue: ${error}`);
    throw new Error(`Erreur lors de l'envoi de l'email de bienvenue: ${error}`);
  }
};

export const sendResetPasswordEmail = async (email, resetURL) => {
  const recipient = [{ email }];
  try {
    
  
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Reinitialisation du mot de passe",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace(
        "{resetURL}", resetURL),
      category: "Reinitialisation du mot de passe",
    })
  }
   catch (error) {
    console.log(`Erreur lors de l'envoi de l'email de reinitialisation de mot de passe: ${error}`);
    throw new Error(`Erreur lors de l'envoi de l'email de reinitialisation de mot de passe: ${error}`);
}
}

export const sendResetSuccessEmail = async(email) => {

  const recipient = [{ email }];
  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Mot de passe reinitialiser avec succès",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
      category: "Reinitialisation du mot de passe",
    })
  }
   catch (error) {
    console.log(`Erreur lors de l'envoi de l'email de reinitialisation de mot de passe: ${error}`);
    throw new Error(`Erreur lors de l'envoi de l'email de reinitialisation de mot de passe: ${error}`);
}
};

export const sendWelcomeEmail = async (email, name, profileUser) => {
  const recipient = [{ email }];
  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Bienvenue chez Group Echotech Innov Sarl",
      html: createWelcomeEmailTemplate(name, profileUser),
      category: "Bienvenue",
    });
    console.log("Bienvenue", response);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de bienvenue :", error);
    throw error;
  }
};

export const sendCommentNotificationEmail = async (
  recipientEmail,
  recipientName,
  commenterName,
  postUrl,
  commentContent
) => {
  const recipient = [{ email: recipientEmail }];
  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Nouveau commentaire sur votre publication", //  sujet corrigé
      html: createCommentNotificationEmailTemplate(
        recipientName,
        commenterName,
        postUrl,
        commentContent
      ),
      category: "commentaire_notification",
    });
    console.log("Un nouveau commentaire a été envoyé", response);
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification de commentaire :", error);
    throw error;
  }
};

export const sendConnectionAcceptedEmail = async (
  recipientEmail,
  senderName,
  recipientName,
  profileUrl
) => {
  const recipient = [{ email: recipientEmail }];
  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: `${recipientName} a accepté votre demande de connexion`, //  sujet corrigé
      html: createConnectionAcceptedEmailTemplate(
        senderName,
        recipientName,
        profileUrl
      ),
      category: "connection_accepted",
    });
    console.log("E-mail de connexion acceptée envoyé avec succès", response);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'e-mail de connexion acceptée :", error);
    throw error;
  }
};



export const sendMessageEmail = async (recipientEmail, senderName, content) => {
  const subject = `Vous avez un nouveau message de ${senderName}`;
  const htmlContent = `
    <h1>Vous avez un nouveau message de ${senderName}</h1>
    <p>${content}</p>
    <p><a href="${process.env.CLIENT_URL}/messages">Voir votre message</a></p>
  `;

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: [{ email: recipientEmail }],
      subject: subject,
      html: htmlContent,
      category: "newMessage",
    });
    console.log("Message envoyé avec succès", response);
  } catch (error) {
    console.error("Erreur lors de l'envoi du message", error);
    throw new Error("Erreur lors de l'envoi de l'email de message");
  }
};

