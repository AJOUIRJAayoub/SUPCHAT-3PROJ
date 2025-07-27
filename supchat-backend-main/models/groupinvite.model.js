// Mongoose schema for groupinvite.model
const mongoose = require("mongoose");

const groupInviteSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "chats" },
    invitedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const model = mongoose.model("groupinvites", groupInviteSchema);

module.exports = model;
