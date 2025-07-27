// Controller handling user.controller logic
const UserModel = require("../models/user.model");
const { catchAsync } = require("../utils/errorHandler");
const { AppError } = require("../utils/errorHandler");
const Responses = require("../utils/responses");
const { HTTP_STATUS, GLOBAL_MESSAGES } = require("../constants/auth.constants");
const {
  deleteProfileImage,
  uploadProfileImage,
} = require("../utils/profileImageHanlder");
const constants = require("../constants/user.constants");
const {
  PAGINATION,
  EXCLUDED_FIELDS,
  USER_ERRORS,
  USER_SUCCESS,
  SORT_OPTIONS,
  SEARCH_OPTIONS,
} = require("../constants/user.constants");

exports.getProfile = catchAsync(async (req, res) => {
  const user = await UserModel.findById(req.user.id)
    .select("-password -refreshToken -passwordResetToken -passwordResetExpires")
    .lean();

  if (!user) {
    throw new AppError(GLOBAL_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return res
    .status(HTTP_STATUS.OK)
    .json(
      Responses.responses(
        HTTP_STATUS.OK,
        { user },
        "Profile fetched successfully"
      )
    );
});

exports.uploadImage = catchAsync(async (req, res) => {
  const { profilePicture } = req.body;

  if (!profilePicture) {
    throw new AppError(constants.USER_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // Upload new image first
  const newProfileImageUrl = await uploadProfileImage(profilePicture);

  if (!newProfileImageUrl) {
    throw new AppError("Failed to upload image", HTTP_STATUS.BAD_REQUEST);
  }

  return res
    .status(HTTP_STATUS.OK)
    .json(
      Responses.responses(
        HTTP_STATUS.OK,
        { newProfileImageUrl },
        constants.USER_SUCCESS.PROFILE_UPDATE
      )
    );
});

exports.updateProfile = catchAsync(async (req, res) => {
  let userId = req.user.id;
  const updates = { ...req.body };
  delete updates.password;
  delete updates.role;

  // Find the current user profile
  let existingUser = await UserModel.findById(userId);
  if (existingUser && existingUser.role === "superAdmin") {
    //see the id in the params if the user is superAdmin
    userId = req.params.userId;
    existingUser = await UserModel.findById(userId);
  }
  if (!existingUser) {
    throw new AppError(constants.USER_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // Update user profile
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  ).select(constants.EXCLUDED_FIELDS.SENSITIVE);

  if (!user) {
    throw new AppError(constants.USER_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return res
    .status(HTTP_STATUS.OK)
    .json(
      Responses.responses(
        HTTP_STATUS.OK,
        { user },
        constants.USER_SUCCESS.PROFILE_UPDATE
      )
    );
});

exports.getUserById = catchAsync(async (req, res) => {
  const user = await UserModel.findById(req.params.userId)
    .select(constants.EXCLUDED_FIELDS.SENSITIVE)
    .lean();

  if (!user) {
    throw new AppError(constants.USER_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return res
    .status(HTTP_STATUS.OK)
    .json(
      Responses.responses(
        HTTP_STATUS.OK,
        { user },
        constants.USER_SUCCESS.FETCH_SUCCESS
      )
    );
});

exports.deleteUser = catchAsync(async (req, res) => {
  const user = await UserModel.findById(req.params.userId);

  if (!user) {
    throw new AppError(constants.USER_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (user.role === "superAdmin") {
    throw new AppError(
      constants.USER_ERRORS.CANNOT_DELETE_SUPER_ADMIN,
      HTTP_STATUS.FORBIDDEN
    );
  }

  // Use deleteOne() instead of remove()
  // await UserModel.deleteOne({ _id: req.params.userId });
  await UserModel.findByIdAndUpdate(req.params.userId, {
    $set: { deleted: true },
  });

  return res
    .status(HTTP_STATUS.OK)
    .json(
      Responses.responses(
        HTTP_STATUS.OK,
        null,
        constants.USER_SUCCESS.DELETE_SUCCESS
      )
    );
});

// Existing methods remain the same...
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const page = Math.max(
    parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE,
    1
  );
  const limit = Math.min(
    Math.max(parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT, 1),
    PAGINATION.MAX_LIMIT
  );

  const skip = (page - 1) * limit;

  const query = {};

  if (req.query.role) {
    if (!["user", "admin", "superAdmin"].includes(req.query.role)) {
      throw new AppError(USER_ERRORS.INVALID_ROLE, HTTP_STATUS.BAD_REQUEST);
    }
    query.role = req.query.role;
  }

  if (req.query.isVerified !== undefined) {
    query.isVerified = req.query.isVerified === "true";
  }

  if (req?.query?.gender !== undefined) {
    query.gender = req?.query?.gender;
  }
  const [users, total] = await Promise.all([
    UserModel.find(query)
      .select(EXCLUDED_FIELDS.SENSITIVE)
      .skip(skip)
      .limit(limit)
      .sort(SORT_OPTIONS.CREATED_DESC)
      .lean(),
    UserModel.countDocuments(query),
  ]).catch((error) => {
    throw new AppError("Database query failed", HTTP_STATUS.SERVER_ERROR);
  });

  const totalPages = Math.ceil(total / limit);
  if (page > totalPages && total > 0) {
    throw new AppError(USER_ERRORS.INVALID_PAGE, HTTP_STATUS.BAD_REQUEST);
  }

  return res.status(HTTP_STATUS.OK).json(
    Responses.responses(
      HTTP_STATUS.OK,
      {
        users,
        pagination: {
          current: page,
          pages: totalPages,
          total,
          perPage: limit,
        },
      },
      USER_SUCCESS.FETCH_SUCCESS
    )
  );
});

// Keep existing methods (getUserById, getProfile, updateProfile, deleteUser)...

// New methods for search, stats, and bulk operations
exports.searchUsers = catchAsync(async (req, res, next) => {
  const { query, fields } = req.query;

  if (!query) {
    throw new AppError(
      USER_ERRORS.SEARCH_QUERY_REQUIRED,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
    ],
  };

  if (fields) {
    const allowedFields = fields
      .split(",")
      .filter((field) => SEARCH_OPTIONS.ALLOWED_FIELDS.includes(field));

    if (allowedFields.length === 0) {
      throw new AppError(
        USER_ERRORS.INVALID_SEARCH_FIELDS,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    searchQuery.$or = allowedFields.map((field) => ({
      [field]: { $regex: query, $options: "i" },
    }));
  }

  const users = await UserModel.find(searchQuery)
    .select(EXCLUDED_FIELDS.SENSITIVE)
    .limit(SEARCH_OPTIONS.MAX_RESULTS)
    .lean();

  return res
    .status(HTTP_STATUS.OK)
    .json(
      Responses.responses(
        HTTP_STATUS.OK,
        { users },
        USER_SUCCESS.SEARCH_SUCCESS
      )
    );
});

exports.getUserStats = catchAsync(async (req, res, next) => {
  const stats = await UserModel.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        verifiedUsers: {
          $sum: { $cond: [{ $eq: ["$isVerified", true] }, 1, 0] },
        },
        unverifiedUsers: {
          $sum: { $cond: [{ $eq: ["$isVerified", false] }, 1, 0] },
        },
        adminCount: {
          $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] },
        },
        userCount: {
          $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] },
        },
        averageProfileCompleteness: {
          $avg: "$profileCompleteness",
        },
      },
    },
  ]);

  // Get recent activity
  const recentActivity = await UserModel.find()
    .select("name createdAt lastLogin")
    .sort({ lastLogin: -1 })
    .limit(5)
    .lean();

  const finalStats = {
    ...stats[0],
    recentActivity,
  };

  return res
    .status(HTTP_STATUS.OK)
    .json(
      Responses.responses(
        HTTP_STATUS.OK,
        finalStats,
        USER_SUCCESS.STATS_SUCCESS
      )
    );
});

exports.bulkUpdate = catchAsync(async (req, res, next) => {
  const { userIds, updates } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError(USER_ERRORS.INVALID_USER_IDS, HTTP_STATUS.BAD_REQUEST);
  }

  // Validate allowed update fields
  const allowedUpdates = ["role", "isVerified", "profileCompleteness"];
  const updateFields = Object.keys(updates);
  const isValidOperation = updateFields.every((field) =>
    allowedUpdates.includes(field)
  );

  if (!isValidOperation) {
    throw new AppError(
      USER_ERRORS.INVALID_UPDATE_FIELDS,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const result = await UserModel.updateMany(
    { _id: { $in: userIds } },
    { $set: updates },
    { new: true, runValidators: true }
  );

  return res.status(HTTP_STATUS.OK).json(
    Responses.responses(
      HTTP_STATUS.OK,
      {
        modifiedCount: result.nModified,
      },
      USER_SUCCESS.BULK_UPDATE_SUCCESS
    )
  );
});

exports.sendContactEmail = catchAsync(async (req, res) => {
  const { name, email, phone, message, service } = req.body;

  try {
    await emailService.sendContactUsEmail(name, phone, email, message, service);
  } catch (error) {
    console.error("Welcome email failed:", error);
  }

  // Respond with a success message
  return res
    .status(HTTP_STATUS.OK)
    .json(Responses.responses(HTTP_STATUS.OK, "Email sent successfully"));
});

exports.bulkDelete = catchAsync(async (req, res, next) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError(USER_ERRORS.INVALID_USER_IDS, HTTP_STATUS.BAD_REQUEST);
  }

  // Prevent deletion of super admin users
  const users = await UserModel.find({ _id: { $in: userIds } });
  const hasSuperAdmin = users.some((user) => user.role === "superAdmin");

  if (hasSuperAdmin) {
    throw new AppError(
      USER_ERRORS.CANNOT_DELETE_SUPER_ADMIN,
      HTTP_STATUS.FORBIDDEN
    );
  }

  const result = await UserModel.deleteMany({ _id: { $in: userIds } });

  return res.status(HTTP_STATUS.OK).json(
    Responses.responses(
      HTTP_STATUS.OK,
      {
        deletedCount: result.deletedCount,
      },
      USER_SUCCESS.BULK_DELETE_SUCCESS
    )
  );
});
