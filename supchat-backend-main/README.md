# supchat-backend
This is the Node.js backend for SUPChat.

### New endpoint

- `GET /api/v1/chat/private/:userId` – returns an existing private chat between
  the current user and `userId` or creates one if none exists.
- `POST /api/v1/groupinvite/email` – invite a user to a group by email.
