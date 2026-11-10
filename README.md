# 🌐 **Social Network Project**

---

## 📚 **Overview**

Welcome to the **Social Network Project**! 🚀 This is a modern social networking application that empowers users to:

- Connect and build friendships. 🤝
- Discover friends through smart recommendations. 💡
- Manage their connections seamlessly. ✨

The project is powered by:

- **Backend**: Node.js & Express.js API.
- **Frontend**: Vue.js 3 user interface built with Vite.
- **Database**: Neo4j for powerful graph-based relationships.

To make the setup and deployment effortless, the application is fully containerized using **Docker** and **Docker Compose**.

---

## 🌟 **Key Features**

✅ User registration and management.
✅ Create and view friendships.
✅ Find common friends.
✅ Get friend recommendations based on mutual connections.

---

## 📋 **Requirements**

Before diving in, ensure you have the following tools installed:

- 🐳 **Docker** & **Docker Compose**
- 🌐 **Node.js** 24.22.2 LTS (pinned in [`.nvmrc`](.nvmrc), run `nvm use`, or with asdf `asdf install nodejs 24.22.2`)
- 📦 **Yarn** 1.22.22 (pinned via `packageManager`, run `corepack enable` once and Corepack picks the right version)
- 🧠 **Neo4j** database (if running locally without Docker)

---

## ⚙️ **Setup Guide**

### 1️⃣ **Prepare Environment Variables**

Start by setting up your environment variables. A `.env.example` file is included in the project root. Copy it and customize it as `.env`:

```bash
cp .env.example .env
```

---

### 2️⃣ **Run the Application**

#### 🐋 **Using Docker (Recommended)**

1. Navigate to the root of the project directory.
2. Build and start all services (backend, frontend, and Neo4j) using Docker Compose:

```bash
docker-compose up --build
```

That's it! 🎉 The application is now up and running.

#### 🏗️ **Running Locally Without Docker**

If you prefer to run the services manually, follow the steps below.

---

### 🔧 **Backend Setup**

1. Navigate to the backend directory:
   ```bash
   cd social-network-backend
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Start the backend server:
   ```bash
   yarn dev    # development, auto-reload with nodemon
   yarn start  # production, plain node
   ```

4. Useful scripts:
   - `yarn test`: Run unit tests using **Jest** (no database needed).
   - `yarn test:integration`: Run API tests against a real Neo4j (see below).
   - `yarn lint`: Perform code linting using **ESLint**.

5. Integration tests (they run in CI on every pull request):

   > ⚠️ They **delete all data** in the target database. They refuse to run unless `NEO4J_URI` points to `localhost`, `127.0.0.1` or the compose `neo4j` host, so they can never touch AuraDB.

   ```bash
   docker compose up -d neo4j   # wipes the local dev data when the tests run
   NEO4J_URI=bolt://localhost:7687 NEO4J_USER=neo4j NEO4J_PASSWORD=<password from .env> yarn test:integration
   ```

---

### 🖥️ **Frontend Setup**

1. Navigate to the frontend directory:
   ```bash
   cd social-network-frontend
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Start the frontend development server (http://localhost:8080):
   ```bash
   yarn dev
   ```

4. Useful scripts:
   - `yarn test`: Run unit tests using **Vitest**.
   - `yarn lint`: Perform code linting using **ESLint**.
   - `yarn build`: Production build into `dist/`.

---

## 🚀 **Free Deployment (Render + Neo4j AuraDB Free)**

1. Create a free instance on [Neo4j AuraDB](https://console.neo4j.io) and save the generated credentials.
   On newer Aura instances the **username is the instance ID** (not `neo4j`).
2. Push this repository to GitHub.
3. On Render, choose **New > Blueprint** and select the repository. Render reads [`render.yaml`](render.yaml) and creates:
   - `social-network-backend`: free Node web service (health check on `/ping`).
   - `social-network-frontend`: static site built from `social-network-frontend/dist`.
4. When prompted, fill in the secrets (they are asked only once, at Blueprint creation):
   - `NEO4J_URI`: `neo4j+s://<instance-id>.databases.neo4j.io`
   - `NEO4J_USER`: the Aura username
   - `NEO4J_PASSWORD`: the Aura password

`render.yaml` also sets the URLs that connect both services: `CORS_ORIGIN` (backend, the frontend URL allowed by CORS) and `VITE_API_URL` (frontend, the backend URL, baked in at build time). If a service URL changes, update it there.

Free tier caveats: the Render web service sleeps after ~15 minutes without traffic (first request takes ~1 minute), and AuraDB Free pauses after 72 hours without writes (resume it in the Aura console).

---

## 🌱 **Demo Data**

A seed script fills the database with a realistic network for demos: 40 people in four circles of friends (work, university, neighborhood, sports club) connected by a few people in common. Friend counts vary like a real network (one person with 15 friends, others with 9, 7, 4, 2, 1) and 4 people have no friends yet.

```bash
cd social-network-backend
yarn seed           # local Neo4j (localhost or the compose "neo4j" host)
yarn seed --yes     # any other database, e.g. AuraDB: --yes confirms the target
yarn seed:reset     # removes only the seed users (add --yes for AuraDB)
```

- Credentials come from `NEO4J_URI`, `NEO4J_USER` and `NEO4J_PASSWORD`, read from the environment (which wins) or from the root `.env`. For AuraDB, export them in the shell instead of editing `.env`, which docker compose uses for the local Neo4j. Read the password without echoing it so it stays out of the shell history:

  ```bash
  export NEO4J_URI=neo4j+s://<instance-id>.databases.neo4j.io NEO4J_USER=<instance-id>
  read -rs "NEO4J_PASSWORD?Aura password: " && export NEO4J_PASSWORD   # zsh (bash: read -rsp "Aura password: " NEO4J_PASSWORD)
  yarn seed --yes
  ```
- Seed users have emails ending in `@seed.example.com`. Running the script again creates nothing new, and users created through the app are never changed. `seed:reset` also deletes friendships between seed users and your own users.
- It writes straight to the database, so the API rate limit does not apply.

---

## 🔄 **API Routes**

Explore the REST API endpoints available for managing users, friendships, and recommendations. For an easy way to test the API, click the button below to import the Postman collection. 👇

[<img src="https://run.pstmn.io/button.svg" alt="Run in Postman" style="width: 160px;">](https://god.gw.postman.com/run-collection/8243464-dfed08d9-f93d-4f02-bc66-4e5c84d4d0b3?action=collection%2Ffork&source=rip_markdown&collection-url=entityId%3D8243464-dfed08d9-f93d-4f02-bc66-4e5c84d4d0b3%26entityType%3Dcollection%26workspaceId%3Daa682c41-5450-4149-beca-ae2a45c19f0d)

### **Error Responses** ⚠️

Every error uses the same body: `{ "status": "error", "error": "<message>" }`.

- `400`: invalid input or malformed JSON body.
- `404`: unknown route, or a `userId` that does not exist (any route that receives one).
- `409`: conflict (email already registered, users already friends).
- `413`: request body larger than 10 KB.
- `429`: rate limit reached. Per client IP and per 15 minutes: 300 requests under `/api`, of which at most 30 writes (`POST`). Configurable with `RATE_LIMIT_MAX` and `RATE_LIMIT_WRITE_MAX`; the `RateLimit` response headers show the remaining quota. `/ping` is never limited.
- `503`: database unavailable, for example AuraDB Free paused. Requests fail after about 15 seconds instead of hanging.
- `500`: unexpected error. Details are only logged on the server, never returned.

### **User Routes** 🧑‍🤝‍🧑

- **`GET /api/users/`**
  Returns all users.

- **`GET /api/users/:userId`**
  Retrieves a specific user by ID.
  **Path Parameters**:
  - `userId` (string): ID of the user.

- **`POST /api/users/`**
  Creates a new user.
  **Body Parameters**:
  - `name` (string, required, up to 100 characters): The user's name.
  - `email` (string, required, valid address): The user's email address. Stored trimmed and lowercase, unique.
  **Errors**: `400` invalid or missing field, `409` email already registered.

---

### **Friendship Routes** 👫

- **`POST /api/users/createFriendship`**
  Creates a new friendship between two users.
  **Body Parameters**:
  - `userId1` (string, required): ID of the first user.
  - `userId2` (string, required, different from `userId1`): ID of the second user.
  **Errors**: `400` missing ids or same id twice, `404` a user does not exist, `409` users are already friends.

- **`GET /api/users/listFriends/:userId`**
  Lists all friends of a user.
  **Path Parameters**:
  - `userId` (string): ID of the user.

- **`GET /api/users/findCommonFriends/:userId1/:userId2`**
  Finds common friends between two users.
  **Path Parameters**:
  - `userId1` (string): ID of the first user.
  - `userId2` (string): ID of the second user.

---

### **Recommendation Routes** 💡

- **`GET /api/users/recommendFriends/:userId`**
  Recommends potential friends for a user.
  **Path Parameters**:
  - `userId` (string): ID of the user.

---

### **Graph Routes** 🕸️

- **`GET /api/graph`**
  Returns the whole friendship network for visualization: `{ "nodes": [{ "id", "name" }], "links": [{ "source", "target" }] }`.
  Each friendship appears once (Neo4j stores it in both directions). Emails are not included. Limited to the first 500 users by name.

---

## 🛠️ **Technologies Used**

### **Backend**
- 🟢 **Node.js**: Server-side runtime.
- ⚡ **Express.js**: Web framework.
- 🧪 **Jest**: Testing framework.
- 🛠️ **ESLint**: Code linting tool.

### **Frontend**
- 🌟 **Vue.js**: Modern frontend framework.
- ⚡ **Vite**: Dev server and build tool.
- 🧪 **Vitest**: Testing framework.

### **Database**
- 🧠 **Neo4j**: Graph database for handling relationships.

### **DevOps**
- 🐳 **Docker**: Containerization.
- 🛠️ **Docker Compose**: Multi-container orchestration.

---

## 🤝 **Contributing**

Contributions are welcome! 🎉 To contribute:

1. **Fork** the repository.
2. Create a **branch** for your feature:
   ```bash
   git checkout -b my-feature
   ```

3. **Commit** your changes:
   ```bash
   git commit -m 'Add my feature'
   ```

4. **Push** to your branch:
   ```bash
   git push origin my-feature
   ```

5. Open a **Pull Request** for review. 🙌

---

## 📜 **License**

This project is licensed under the **MIT License**. For more details, check the [LICENSE](LICENSE) file.

---

## 🎨 **Preview**

Frontend:
![Frontend UI Mockup](https://via.placeholder.com/800x400?text=Frontend+Preview)  
