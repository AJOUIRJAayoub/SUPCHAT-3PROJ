# SUPChat Docker Setup

This repository contains a backend (Node.js/Express) and a React frontend.
Both projects can be built and run using Docker Compose or started
individually during development.

## Usage

Ensure Docker and Docker Compose are installed, then run:

```bash
docker-compose up --build
```

This builds production Docker images and does **not** provide live reload.


The backend will be available on [http://localhost:5000](http://localhost:5000)
and the frontend on [http://localhost:3000](http://localhost:3000).

Environment variables for the backend are defined in `env.txt` and loaded
automatically by Docker Compose. The `FRONTEND_URL` variable should be set to the
address of the frontend so Socket.IO CORS settings work correctly.

## Local development

To work on the projects without Docker, start each service separately.

Inside `supchat-web-main` run:

```bash
npm run dev
```

This launches Vite with hot module replacement for the React frontend.

Inside `supchat-backend-main` run:

```bash
npm run dev
```

The backend starts with `nodemon` so changes are reloaded automatically.

Inside `supchat-mobile-main` run:

```bash
npm start
```

This launches the Expo development server for the React Native mobile app.

