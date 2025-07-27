// Mongoose schema for chat.model
const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    isGroupChat: { type: Boolean, default: false },
    chatName: { type: String }, // Only needed for groups
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: "messages" },
    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional
    isChannel: { type: Boolean, default: false },
    onlyAdminCanMessage: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const model = mongoose.model("chats", chatSchema);

module.exports = model;
