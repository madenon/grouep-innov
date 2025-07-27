import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ["sent", "read"], default: "sent" },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" }, // Référence à une conversation
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
