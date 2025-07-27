// Mongoose schema for message.model
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "chats" },
    imageUrl: { type: String },
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const model = mongoose.model("messages", messageSchema);

module.exports = model;
