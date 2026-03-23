# 🏡 Livin – Real Estate Platform

A full-stack real estate platform built with modern technologies to manage properties, developers, and user leads.

---

## 🚀 Overview

Livin is a real estate web application that allows:

- 🏢 Manage developers and projects
- 🌍 Browse destinations and properties
- 📝 Publish blogs
- 📥 Capture user leads
- 🔐 Secure admin dashboard
- 🖼️ Upload and manage images

---

## 🧱 Tech Stack

**Frontend**

- React (Vite)
- TypeScript
- Tailwind CSS

**Backend**

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL

---

## 📂 Project Structure

```
root/
├── client/        # Frontend
├── server/        # Backend
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── prisma/
│   └── uploads/
```

---

## ⚙️ Setup

### Install dependencies

```
cd server && npm install
cd ../client && npm install
```

### Environment Variables (server/.env)

```
DATABASE_URL=your_postgresql_url
JWT_SECRET=your_secret_key
PORT=5000
```

### Run project

```
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Production Deployment

### Backend on Railway

```
cd server
npm install
npm run build
npm start
```

Required Railway variables:

```
DATABASE_URL=postgresql://...
JWT_SECRET=generated-secret
ADMIN_INITIAL_PASSWORD=strong-password
NODE_ENV=production
CORS_ORIGIN=https://your-hostinger-domain.com,https://www.your-hostinger-domain.com
BACKEND_URL=https://your-backend.up.railway.app
```

### Frontend on Hostinger

Build with the backend URL wired into Vite:

```
cd client
VITE_API_URL=https://your-backend.up.railway.app npm run build
```

Upload the generated `client/dist` assets to Hostinger.

---

## 🔐 Authentication

- JWT-based authentication
- Admin-only protected routes
- Use token in requests:

```
Authorization: Bearer <token>
```

---

## 🧪 Useful Commands

### Create admin user

```
npx ts-node src/scripts/create-admin.ts
```

### Seed database

```
npx prisma db seed
```

### Migrate from SQLite

```
npx ts-node src/scripts/migrate-sqlite-to-postgres.ts
```

---

## 📡 API Examples

### Login

```
POST /api/auth/login
```

### Get projects

```
GET /api/projects
```

### Admin (protected)

```
GET /api/admin/stats
```

---

## ⚠️ Notes

- Make sure PostgreSQL is running
- Token is required for admin routes
- Do not set Content-Type manually when uploading files

---

## 🌟 Future Improvements

- Cloud storage for images (Cloudinary / S3)
- Advanced filtering & search
- Performance optimization

---

## 👨‍💻 Author

Built by **Your Name**

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
