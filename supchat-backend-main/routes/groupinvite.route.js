// Express routes for groupinvite.route
const express = require("express");
const router = express.Router();
const inviteCtrl = require("../controllers/groupinvite.controller");
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/", protect, inviteCtrl.sendInvite);
router.post("/email", protect, inviteCtrl.sendInviteByEmail);
router.get("/received", protect, inviteCtrl.getReceivedInvites);
router.get("/received/:groupId", protect, inviteCtrl.getReceivedInvitesById);
router.get("/sent", protect, inviteCtrl.getSentInvites);
router.put("/accept/:id", protect, inviteCtrl.acceptInvite);
router.put("/reject/:id", protect, inviteCtrl.rejectInvite);
router.delete("/:id", protect, inviteCtrl.deleteInvite);

module.exports = router;
