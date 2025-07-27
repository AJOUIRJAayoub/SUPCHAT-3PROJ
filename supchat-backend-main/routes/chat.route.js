// Express routes for chat.route
const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const { protect } = require("../middleware/auth"); // auth middleware

router.post("/", protect, chatController.createChat);
router.get("/", protect, chatController.getUserChats);
router.get("/:id", protect, chatController.getChatById);
router.get("/private/:userId", protect, chatController.getOrCreatePrivateChat);
router.delete("/:id", protect, chatController.deleteChat);
router.put("/rename", protect, chatController.renameGroupChat);
router.post("/adduser", protect, chatController.addUserToGroup);
router.post(
  "/removeUser/fromgroup",
  protect,
  chatController.removeUserFromGroup
);
router.patch(
  "/update-admin-permission",
  protect,
  chatController.updateAdminMessagingPermission
);

module.exports = router;
