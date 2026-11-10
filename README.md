# 🌐 **Social Network Project**

---

## 📚 **Overview**

Welcome to the **Social Network Project**! 🚀 This is a modern social networking application that empowers users to:

- Connect and build friendships. 🤝
- Discover friends through smart recommendations. 💡
- Manage their connections seamlessly. ✨

The project is powered by:

- **Backend**: Node.js & Express.js API.
- **Frontend**: Vue.js-based user interface.
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
- 🌐 **Node.js** v22.12.0 or higher
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
   - `yarn test`: Run tests using **Jest**.
   - `yarn lint`: Perform code linting using **ESLint**.

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

3. Start the frontend development server:
   ```bash
   yarn start
   ```

---

## 🔄 **API Routes**

Explore the REST API endpoints available for managing users, friendships, and recommendations. For an easy way to test the API, click the button below to import the Postman collection. 👇

[<img src="https://run.pstmn.io/button.svg" alt="Run in Postman" style="width: 160px;">](https://god.gw.postman.com/run-collection/8243464-dfed08d9-f93d-4f02-bc66-4e5c84d4d0b3?action=collection%2Ffork&source=rip_markdown&collection-url=entityId%3D8243464-dfed08d9-f93d-4f02-bc66-4e5c84d4d0b3%26entityType%3Dcollection%26workspaceId%3Daa682c41-5450-4149-beca-ae2a45c19f0d)

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
  - `name` (string): The user's name.
  - `email` (string): The user's email address.

---

### **Friendship Routes** 👫

- **`POST /api/users/createFriendship`**
  Creates a new friendship between two users.
  **Body Parameters**:
  - `userId1` (string): ID of the first user.
  - `userId2` (string): ID of the second user.

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

## 🛠️ **Technologies Used**

### **Backend**
- 🟢 **Node.js**: Server-side runtime.
- ⚡ **Express.js**: Web framework.
- 🧪 **Jest**: Testing framework.
- 🛠️ **ESLint**: Code linting tool.

### **Frontend**
- 🌟 **Vue.js**: Modern frontend framework.

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
