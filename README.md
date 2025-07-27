# SUPChat - Application de Chat en Temps Réel

SUPChat est une application de messagerie instantanée moderne avec support des groupes, channels et messages privés, construite avec React, Node.js, Socket.io et MongoDB.

![SUPChat](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Fonctionnalités

### Messagerie
- **Messages en temps réel** avec Socket.io
- **Chats privés** entre utilisateurs
- **Groupes de discussion** avec administration
- **Channels** pour communications organisées
- **Partage d'images** via Cloudinary
- **Support des émojis**
- **Indicateurs de messages non lus**

### Authentification & Profil
- **Inscription/Connexion** sécurisée avec JWT
- **Connexion Google OAuth**
- **Profils utilisateurs** personnalisables
- **Vérification par email**

### Gestion des Groupes/Channels
- Création de groupes et channels
- Système d'invitations
- Permissions administrateur
- Option "Admin seul peut envoyer des messages"
- Suppression de membres/quitter le groupe

## Technologies Utilisées

### Frontend
- **React 19** avec TypeScript
- **Redux Toolkit** pour la gestion d'état
- **Socket.io Client** pour le temps réel
- **Tailwind CSS** pour le styling
- **React Router** pour la navigation
- **Vite** comme bundler

### Backend
- **Node.js** avec Express
- **MongoDB** avec Mongoose
- **Socket.io** pour WebSocket
- **JWT** pour l'authentification
- **Nodemailer** pour les emails
- **Cloudinary** pour le stockage d'images

### DevOps
- **Docker** & **Docker Compose**
- **Nginx** pour servir le frontend

## Prérequis

- Docker et Docker Compose installés
- Node.js 18+ (pour développement local)
- Compte MongoDB (Atlas ou local)
- Compte Cloudinary pour le stockage d'images
- Compte Google Cloud (pour OAuth)

## Installation

### 1. Cloner le repository

```bash
git clone https://github.com/AJOUIRJAayoub/supchat.git
cd supchat
```

### 2. Configuration des variables d'environnement

Créer un fichier `env.txt` à la racine avec :

```env
# Port du serveur
PORT=5000

# MongoDB
MONGO_URL=mongodb+srv://YOUR_MONGO_URL

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=SUPChat
EMAIL_FROM_EMAIL=your-email@gmail.com

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 3. Lancement avec Docker

```bash
# Construction et lancement des conteneurs
docker-compose up --build

# Ou en arrière-plan
docker-compose up -d --build
```

L'application sera accessible sur :
- Frontend : http://localhost:3000
- Backend : http://localhost:5001

## Développement Local

### Backend

```bash
cd supchat-backend-main
npm install
npm run dev
```

### Frontend

```bash
cd supchat-web-main
npm install --legacy-peer-deps
npm run dev
```

## Utilisation

### 1. Inscription/Connexion
- Créez un compte avec email/mot de passe
- Ou connectez-vous avec Google
- Vérifiez votre email (check spam)

### 2. Messagerie
- **Chat privé** : Recherchez un utilisateur par email
- **Créer un groupe** : Cliquez sur "Create Group +"
- **Créer un channel** : Cliquez sur "Create a Channel +"
- **Envoyer des messages** : Tapez et appuyez Entrée
- **Partager des images** : Cliquez sur l'icône trombone

### 3. Gestion des groupes
- **Inviter des membres** : Via l'icône info du groupe
- **Permissions admin** : Toggle "Admin seul peut envoyer"
- **Quitter/Supprimer** : Via le menu info du groupe

## Structure du Projet

```
supchat/
├── supchat-backend-main/     # API Node.js/Express
│   ├── controllers/          # Logique métier
│   ├── models/              # Modèles Mongoose
│   ├── routes/              # Routes API
│   ├── middleware/          # Middlewares
│   └── utils/               # Utilitaires
├── supchat-web-main/        # Frontend React
│   ├── src/
│   │   ├── components/      # Composants React
│   │   ├── pages/          # Pages
│   │   ├── redux/          # Store Redux
│   │   └── constants/      # Constantes
│   └── script/             # Scripts utilitaires
├── docker-compose.yml       # Configuration Docker
└── env.txt                 # Variables d'environnement
```

## API Endpoints

### Authentification
- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion
- `GET /api/v1/auth/verify/:token` - Vérification email
- `POST /api/v1/auth/google` - Google OAuth

### Chat
- `GET /api/v1/chat` - Liste des chats
- `POST /api/v1/chat` - Créer un chat
- `GET /api/v1/chat/private/:userId` - Chat privé
- `DELETE /api/v1/chat/:id` - Supprimer un chat

### Messages
- `GET /api/v1/message/:chatId` - Messages d'un chat
- `POST /api/v1/message` - Envoyer un message
- `PUT /api/v1/message/seen` - Marquer comme lu

### Invitations
- `POST /api/v1/groupinvite` - Envoyer une invitation
- `PUT /api/v1/groupinvite/accept/:id` - Accepter
- `PUT /api/v1/groupinvite/reject/:id` - Refuser

## Dépannage

### Problèmes courants

**Port déjà utilisé**
- Vérifiez les ports 3000 et 5000/5001
- Modifiez les ports dans `docker-compose.yml` si nécessaire

**Erreurs de dépendances**
```bash
# Nettoyer et réinstaller
rm -rf node_modules
npm install --legacy-peer-deps
```

**Connexion à la base de données**
- Vérifiez les credentials MongoDB
- Assurez-vous que votre IP est autorisée
- Testez la connexion indépendamment

## Architecture et Évolutions Futures

### Base de données actuelle
Le projet utilise **MongoDB** pour sa simplicité et sa flexibilité durant le développement. C'est un choix pragmatique pour un MVP qui permet un développement rapide.

### Optimisations recommandées pour la production
Pour une application de chat à grande échelle, considérer :

1. **Architecture hybride**
   - PostgreSQL : Données utilisateurs, groupes, permissions
   - Redis : Cache, sessions, messages récents
   - MongoDB/Cassandra : Historique des messages
   - ElasticSearch : Recherche dans les messages

2. **Alternatives spécialisées**
   - **Cassandra** : Pour des volumes massifs de messages
   - **ScyllaDB** : Performance extrême pour le temps réel
   - **PostgreSQL + TimescaleDB** : Pour l'analytique des messages

Cette architecture actuelle reste totalement fonctionnelle pour un usage normal et peut gérer plusieurs milliers d'utilisateurs sans problème.
