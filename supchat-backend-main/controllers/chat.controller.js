// Controller handling chat.controller logic
const Chat = require("../models/chat.model");
const { AppError, catchAsync } = require("../utils/errorHandler");
const groupInvite = require("../models/groupinvite.model");

// ✅ Create a new chat
exports.createChat = catchAsync(async (req, res) => {
  const {
    users,
    isGroupChat,
    chatName,
    groupAdmin,
    isChannel,
    onlyAdminCanMessage,
  } = req.body;

  if (!users || users.length < 2) {
    throw new AppError("A chat must have at least two users", 400);
  }

  const chats = await Chat.create({
    users,
    isGroupChat,
    chatName: isGroupChat || isChannel ? chatName : undefined,
    groupAdmin: isGroupChat || isChannel ? groupAdmin : undefined,
    isChannel: isChannel ? isChannel : undefined,
    onlyAdminCanMessage: onlyAdminCanMessage,
  });

  const chat = await Chat.findById(chats?._id)
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate({
      path: "latestMessage",
      populate: {
        path: "sender",
        select: "name email",
      },
    })
    .sort({ updatedAt: -1 });
  res.status(201).json({
    status: "success",
    data: chat,
  });
});

// ✅ Get all chats for a user
exports.getUserChats = catchAsync(async (req, res) => {
  const userId = req.user._id; // assuming user is attached to req via auth middleware

  const chats = await Chat.find({ users: userId })
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate({
      path: "latestMessage",
      populate: {
        path: "sender",
        select: "name email",
      },
    })
    .sort({ updatedAt: -1 });

  res.status(200).json({
    status: "success",
    results: chats.length,
    data: chats,
  });
});

// ✅ Get chat by ID
exports.getChatById = catchAsync(async (req, res) => {
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId)
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("latestMessage");

  if (!chat) {
    throw new AppError("Chat not found", 404);
  }

  res.status(200).json({
    status: "success",
    data: chat,
  });
});

// ✅ Get or create a private chat between two users
exports.getOrCreatePrivateChat = catchAsync(async (req, res) => {
  const otherUserId = req.params.userId;
  const userId = req.user._id;

  if (!otherUserId) {
    throw new AppError("User ID is required", 400);
  }

  let chat = await Chat.findOne({
    isGroupChat: false,
    isChannel: { $ne: true },
    users: { $all: [userId, otherUserId], $size: 2 },
  })
    .populate("users", "-password")
    .populate({
      path: "latestMessage",
      populate: { path: "sender", select: "name email" },
    });

  if (!chat) {
    chat = await Chat.create({ users: [userId, otherUserId] });

    chat = await Chat.findById(chat._id)
      .populate("users", "-password")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email" },
      });
  }

  res.status(200).json({ status: "success", data: chat });
});

// ✅ Delete a chat
exports.deleteChat = catchAsync(async (req, res) => {
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId);
  if (!chat) throw new AppError("Chat not found", 404);

  const isAdmin = ["admin", "superAdmin"].includes(req.user.role);
  const isGroupAdmin = chat.groupAdmin?.toString() === req.user._id.toString();
  if (!isAdmin && !isGroupAdmin) {
    throw new AppError("Not authorized to delete this chat", 403);
  }
  await chat.deleteOne();

  res.status(200).json({
    status: "success",
    message: "Chat deleted successfully",
  });
});

// ✅ Update chat name (for group chats)
exports.renameGroupChat = catchAsync(async (req, res) => {
  const { chatId, newName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName: newName },
    { new: true }
  );

  if (!updatedChat) {
    throw new AppError("Group chat not found", 404);
  }

  res.status(200).json({
    status: "success",
    data: updatedChat,
  });
});

// ✅ Remove a user from a group or channel
exports.removeUserFromGroup = catchAsync(async (req, res) => {
  const { chatId, userIdToRemove } = req.body;

  if (!chatId || !userIdToRemove) {
    throw new AppError("chatId and userIdToRemove are required", 400);
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new AppError("Group/Channel not found", 404);
  }

  await groupInvite.findOneAndDelete({
    group: chatId,
    invitedUser: userIdToRemove,
  });

  // Remove the user from the users array
  chat.users = chat.users.filter(
    (userId) => userId.toString() !== userIdToRemove
  );

  // Optional: if group admin is removed, you can handle fallback here
  if (chat.groupAdmin?.toString() === userIdToRemove) {
    chat.groupAdmin = chat.users[0] || null; // fallback admin
  }

  await chat.save();

  const updatedChat = await Chat.findById(chatId)
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.status(200).json({
    status: "success",
    message: "User removed from group/channel",
    data: updatedChat,
  });
});

// ✅ Add a user to a group or channel
exports.addUserToGroup = catchAsync(async (req, res) => {
  const { chatId, userIdToAdd } = req.body;

  if (!chatId || !userIdToAdd) {
    throw new AppError("chatId and userIdToAdd are required", 400);
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new AppError("Group/Channel not found", 404);
  }

  // Check if user is already in the group
  if (chat.users.includes(userIdToAdd)) {
    throw new AppError("User is already in the group/channel", 400);
  }

  chat.users.push(userIdToAdd);
  await chat.save();

  const updatedChat = await Chat.findById(chatId)
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.status(200).json({
    status: "success",
    message: "User added to group/channel",
    data: updatedChat,
  });
});

// ✅ Update "onlyAdminCanMessage" field of a chat
exports.updateAdminMessagingPermission = catchAsync(async (req, res) => {
  const { chatId, value } = req.body;

  if (typeof value !== "boolean") {
    throw new AppError("Value must be a boolean (true or false)", 400);
  }

  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { onlyAdminCanMessage: value },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!chat) {
    throw new AppError("Chat not found", 404);
  }

  res.status(200).json({
    status: "success",
    message: `Updated onlyAdminCanMessage to ${value}`,
    data: chat,
  });
});
