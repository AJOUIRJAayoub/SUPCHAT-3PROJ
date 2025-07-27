// Controller handling groupinvite.controller logic
const GroupInvite = require("../models/groupinvite.model");

const Chat = require("../models/chat.model");
const User = require("../models/user.model");
const emailService = require("../utils/email");
const { AppError, catchAsync } = require("../utils/errorHandler");

// ✅ Send an invite to a user
exports.sendInvite = catchAsync(async (req, res) => {
  const { group, invitedUser } = req.body;
  const invitedBy = req.user.id;

  // Optionally check if chat isGroupChat
  const chat = await Chat.findById(group);
  if (!chat) {
    throw new AppError("Group chat not found or not a group chat", 400);
  }

  // Check if already invited
  const existing = await GroupInvite.findOne({ group, invitedUser });
  if (existing) {
    throw new AppError("User has already been invited to this group", 409);
  }

  const invite = await GroupInvite.create({ group, invitedUser, invitedBy });

  res.status(201).json({
    status: "success",
    data: invite,
  });
});

// ✅ Send an invite to a user by email
exports.sendInviteByEmail = catchAsync(async (req, res) => {
  const { group, email } = req.body;
  const invitedBy = req.user.id;

  const chat = await Chat.findById(group);
  if (!chat) {
    throw new AppError("Group chat not found or not a group chat", 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("User with this email not found", 404);
  }

  const existing = await GroupInvite.findOne({ group, invitedUser: user._id });
  if (existing) {
    throw new AppError("User has already been invited to this group", 409);
  }

  const invite = await GroupInvite.create({
    group,
    invitedUser: user._id,
    invitedBy,
  });

  const inviteUrl = `${process.env.FRONTEND_URL}/groups/${group}`;
  try {
    await emailService.sendEmail({
      to: user.email,
      subject: "Group Invitation",
      html: `<p>You have been invited to join a group.</p><p><a href="${inviteUrl}">Open Group</a></p>`,
      text: `You have been invited to join a group: ${inviteUrl}`,
    });
  } catch (error) {
    console.error("Error sending invite email", error);
  }

  res.status(201).json({
    status: "success",
    data: invite,
  });
});

// ✅ Get all invites received by a user
exports.getReceivedInvites = catchAsync(async (req, res) => {
  const invites = await GroupInvite.find({ invitedUser: req.user.id })
    .populate("group", "chatName")
    .populate("invitedBy", "name");

  res.status(200).json({
    status: "success",
    results: invites.length,
    data: invites,
  });
});

exports.getReceivedInvitesById = catchAsync(async (req, res) => {
  const groupID = req.params.groupId;

  const invites = await GroupInvite.find({
    invitedUser: req.user.id,
    group: groupID,
  })
    .populate("group", "chatName")
    .populate("invitedBy", "name");

  res.status(200).json({
    status: "success",
    results: invites.length,
    data: invites,
  });
});

// ✅ Get all invites sent by a user
exports.getSentInvites = catchAsync(async (req, res) => {
  const invites = await GroupInvite.find({ invitedBy: req.user.id })
    .populate("group", "chatName")
    .populate("invitedUser", "name");

  res.status(200).json({
    status: "success",
    results: invites.length,
    data: invites,
  });
});

// ✅ Accept an invite
exports.acceptInvite = catchAsync(async (req, res) => {
  const inviteId = req.params.id;
  const invite = await GroupInvite.findById(inviteId);

  if (!invite || invite.invitedUser.toString() !== req.user.id) {
    throw new AppError("Invite not found or not authorized", 403);
  }

  if (invite.status !== "pending") {
    throw new AppError("Invite already responded to", 400);
  }

  invite.status = "accepted";
  await invite.save();

  // Add user to group
  await Chat.findByIdAndUpdate(invite.group, {
    $addToSet: { users: invite.invitedUser },
  });

  res.status(200).json({
    status: "success",
    message: "Invite accepted and user added to group",
  });
});

// ✅ Reject an invite
exports.rejectInvite = catchAsync(async (req, res) => {
  const inviteId = req.params.id;
  const invite = await GroupInvite.findById(inviteId);

  if (!invite || invite.invitedUser.toString() !== req.user.id) {
    throw new AppError("Invite not found or not authorized", 403);
  }
  const chat = await Chat.findById(invite?.group);

  const newUsers = chat.users.filter(
    (userId) => !userId.equals(invite?.invitedUser)
  );
  await Chat.findByIdAndUpdate(invite?.group, {
    $set: { users: newUsers },
  });

  if (!chat) {
    throw new AppError("Chat not found against this invite", 403);
  }
  if (invite.status !== "pending") {
    throw new AppError("Invite already responded to", 400);
  }

  invite.status = "rejected";
  await invite.save();

  res.status(200).json({
    status: "success",
    message: "Invite rejected",
  });
});

// ✅ Delete an invite (admin or invitedBy only)
exports.deleteInvite = catchAsync(async (req, res) => {
  const invite = await GroupInvite.findById(req.params.id);

  if (!invite) throw new AppError("Invite not found", 404);

  if (
    invite.invitedBy.toString() !== req.user.id &&
    invite.invitedUser.toString() !== req.user.id
  ) {
    throw new AppError("Not authorized to delete this invite", 403);
  }

  await invite.deleteOne();

  res.status(200).json({
    status: "success",
    message: "Invite deleted",
  });
});
