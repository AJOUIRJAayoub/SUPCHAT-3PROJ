// Utility functions used across the backend
const message = require("../models/message.model");
const chat = require("../models/chat.model");

exports.receiveMessage = async (data) => {
  try {
    const newMessage = await message.create(data);
    await chat.findByIdAndUpdate(data?.chat, {
      latestMessage: newMessage._id,
    });
    const populatedMessage = await message
      .findById(newMessage._id)
      .populate("sender", "name email")
      .populate("chat");
    return populatedMessage;
  } catch (e) {
    console.log("error occured receiving message", e);
  }
};
