// constants/user.constants.js

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

const EXCLUDED_FIELDS = {
  SENSITIVE:
    "-password -refreshToken -passwordResetToken -passwordResetExpires",
};

const USER_ERRORS = {
  NOT_FOUND: "User not found",
  INVALID_PAGE: "Invalid page number",
  INVALID_LIMIT: "Page limit must be between 1 and 100",
  INVALID_ROLE: "Invalid role specified",
  INVALID_ID: "Invalid user ID",
  SEARCH_QUERY_REQUIRED: "Search query is required",
  INVALID_SEARCH_FIELDS: "Invalid search fields provided",
  INVALID_USER_IDS: "Valid user IDs array is required",
  INVALID_UPDATE_FIELDS: "Invalid update fields provided",
  CANNOT_DELETE_SUPER_ADMIN: "Super admin users cannot be deleted",
};

const USER_SUCCESS = {
  FETCH_SUCCESS: "Users fetched successfully",
  PROFILE_FETCH: "Profile fetched successfully",
  PROFILE_UPDATE: "Profile updated successfully",
  DELETE_SUCCESS: "User deleted successfully",
  SEARCH_SUCCESS: "Search completed successfully",
  STATS_SUCCESS: "User statistics fetched successfully",
  BULK_UPDATE_SUCCESS: "Users updated successfully",
  BULK_DELETE_SUCCESS: "Users deleted successfully",
};

const SORT_OPTIONS = {
  CREATED_DESC: { createdAt: -1 },
};

const SEARCH_OPTIONS = {
  MAX_RESULTS: 50,
  ALLOWED_FIELDS: ["name", "email", "role", "createdAt"],
};
const GENDER_TYPES = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
};
module.exports = {
  PAGINATION,
  EXCLUDED_FIELDS,
  USER_ERRORS,
  USER_SUCCESS,
  SORT_OPTIONS,
  SEARCH_OPTIONS,
  GENDER_TYPES,
};
