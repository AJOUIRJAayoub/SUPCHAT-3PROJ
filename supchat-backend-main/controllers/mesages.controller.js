// Controller handling mesages.controller logic
const Message = require("../models/message.model");
const Chat = require("../models/chat.model");
const { AppError, catchAsync } = require("../utils/errorHandler");

// ✅ Send a message
exports.sendMessage = catchAsync(async (req, res) => {
  const { content, chatId, imageUrl } = req.body;

  if (!content || !chatId) {
    throw new AppError("Invalid data passed into request", 400);
  }

  const newMessage = await Message.create({
    sender: req.user.id,
    content,
    chat: chatId,
    imageUrl: imageUrl,
  });

  // Update latest message in Chat
  await Chat.findByIdAndUpdate(chatId, {
    latestMessage: newMessage._id,
  });

  const populatedMessage = await Message.findById(newMessage._id)
    .populate("sender", "name email")
    .populate("chat");

  res.status(201).json({
    status: "success",
    data: populatedMessage,
  });
});

// ✅ Get all messages for a chat
exports.getChatMessages = catchAsync(async (req, res) => {
  const chatId = req.params.chatId;

  const messages = await Message.find({ chat: chatId })
    .populate("sender", "name email profilePicture")
    .populate("chat");

  res.status(200).json({
    status: "success",
    results: messages.length,
    data: messages,
  });
});

exports.unReadMessagesOfChat = catchAsync(async (req, res) => {
  const chatId = req.params.chatId;
  const userId = req.user.id;
  const messages = await Message.find({
    chat: chatId,
    seenBy: { $ne: userId }, // userId is NOT in the seenBy array
  });
  res.status(200).json({
    status: "success",
    result: messages?.length,
    data: { unreadMessages: messages?.length },
  });
});

// ✅ Mark message(s) as seen
exports.markAsSeen = catchAsync(async (req, res) => {
  const { messageIds } = req.body; // array of message IDs

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    throw new AppError("No messages provided", 400);
  }

  await Message.updateMany(
    { _id: { $in: messageIds } },
    { $addToSet: { seenBy: req.user.id } }
  );

  res.status(200).json({
    status: "success",
    message: "Messages marked as seen",
  });
});

// ✅ Optional: Delete a message
exports.deleteMessage = catchAsync(async (req, res) => {
  const messageId = req.params.id;

  const message = await Message.findById(messageId);
  if (!message) throw new AppError("Message not found", 404);

  // Optional: Only allow sender to delete
  if (message.sender.toString() !== req.user.id) {
    throw new AppError("Unauthorized to delete this message", 403);
  }

  await message.deleteOne();

  res.status(200).json({
    status: "success",
    message: "Message deleted",
  });
});
