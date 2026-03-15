# System Architecture & Data Flow

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                   (React + TypeScript + Vite)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐        ┌──────────────┐     ┌──────────────┐  │
│  │   Public     │        │    Admin     │     │  Dashboard   │  │
│  │   Pages      │        │    Pages     │     │   Pages      │  │
│  │              │        │              │     │              │  │
│  │ • Home       │        │ • Login      │     │ • Stats      │  │
│  │ • Projects   │        │ • Dashboard  │     │ • Analytics  │  │
│  │ • Details    │        │ • CRUD Forms │     │              │  │
│  │ • Developers │        │              │     │              │  │
│  │ • Blogs      │        │              │     │              │  │
│  └──────────────┘        └──────────────┘     └──────────────┘  │
│                                                                   │
│                    ↓↓↓↓↓ HTTP/REST ↓↓↓↓↓                         │
│                                                                   │
│          ┌────────────────────────────────────┐                  │
│          │    React Router                     │                 │
│          │    State Management (useState)      │                 │
│          │    API Calls (fetch)                │                 │
│          └────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     API LAYER (Express.js)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  AUTH        │  │  PUBLIC      │  │  ADMIN       │           │
│  │  ROUTES      │  │  ROUTES      │  │  ROUTES      │           │
│  │              │  │              │  │              │           │
│  │ POST /login  │  │ GET /projects│  │ POST /admin/*│           │
│  │              │  │ GET /devs    │  │ PUT /admin/* │           │
│  │ JWT Generate │  │ GET /blogs   │  │ DELETE /admin│           │
│  │ Middleware   │  │ GET /careers │  │              │           │
│  │              │  │ GET /dests   │  │ JWT Verify   │           │
│  │              │  │              │  │ Middleware   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                   │
│                    ↓↓↓↓↓ SQL Queries ↓↓↓↓↓                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (SQLite)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Projects │ │Developers│ │ Destinat │ │  Blogs   │           │
│  │          │ │          │ │ ions     │ │          │           │
│  │ • id(PK) │ │ • id(PK) │ │ • id(PK) │ │ • id(PK) │           │
│  │ • name   │ │ • name   │ │ • name   │ │ • title  │           │
│  │ • dev_id │ │ • logo   │ │ • image  │ │ • content│           │
│  │ • dest_id│ │ • website│ │ • desc   │ │ • author │           │
│  │ • beds   │ │ • desc   │ │          │ │ • date   │           │
│  │ • size   │ │          │ │          │ │          │           │
│  │ • gallery│ │          │ │          │ │          │           │
│  │ • image  │ │          │ │          │ │          │           │
│  │ • desc   │ │          │ │          │ │          │           │
│  │ • status │ │          │ │          │ │          │           │
│  │ • price  │ │          │ │          │ │          │           │
│  │ • type   │ │          │ │          │ │          │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                   │
│  ┌──────────┐ ┌──────────┐                                      │
│  │ Careers  │ │  Users   │                                      │
│  │          │ │          │                                      │
│  │ • id(PK) │ │ • id(PK) │                                      │
│  │ • title  │ │ • user   │                                      │
│  │ • location│ │ • pass  │                                      │
│  │ • type   │ │ • role   │                                      │
│  │ • desc   │ │          │                                      │
│  │ • req    │ │          │                                      │
│  └──────────┘ └──────────┘                                      │
│                                                                   │
│        Foreign Key Relationships:                                │
│        Projects.developer_id → Developers.id                    │
│        Projects.destination_id → Destinations.id                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Request/Response Flow

### Public API Request

```
Client Browser
     ↓
[GET /api/projects]
     ↓
Express Router
     ↓
SELECT ... FROM projects JOIN developers ...
     ↓
SQLite Database
     ↓
[Array of projects with developer names]
     ↓
JSON Response
     ↓
React Component (useState)
     ↓
Re-render UI
```

### Protected API Request (Admin)

```
Admin Browser
     ↓
[POST /api/admin/projects + JWT Token]
     ↓
Express Router
     ↓
JWT Verification Middleware
     ↓
Token Valid?
├─ No → 401 Unauthorized
├─ Yes ↓
     ↓
Validate Request Body
     ↓
INSERT INTO projects (...)
     ↓
SQLite Database
     ↓
Success Response with ID
     ↓
React Component (navigate)
     ↓
Redirect to Projects List
     ↓
useEffect triggers
     ↓
[GET /api/projects]
     ↓
Updated Data Shown
```

---

## 🔐 Authentication Flow

```
1. User enters credentials
   ↓
2. POST /api/auth/login { username, password }
   ↓
3. Server:
   - Find user by username
   - Compare password with bcrypt hash
   - If match: Generate JWT
   ↓
4. Response: { token, user }
   ↓
5. Client stores token in localStorage
   ↓
6. For subsequent requests:
   - Read token from localStorage
   - Add to Authorization header
   - Send with every admin request
   ↓
7. Server:
   - Extract token from header
   - Verify JWT signature
   - Extract user info from payload
   - Allow/Deny request
```

---

## 🔄 CRUD Operation Flows

### CREATE (Add New Project)

```
1. User fills form in AddProject.tsx
2. Form validation (HTML5)
3. User clicks "Submit"
4. handleSubmit() triggered
5. POST /api/admin/projects {formData}
6. Server validates
7. INSERT INTO projects (...)
8. Database returns new ID
9. Response: { id: 123 }
10. Client redirects to /admin/projects
11. useEffect in ManageProjects fetches list
12. GET /api/projects
13. Component re-renders with new item
```

### READ (View Projects)

```
1. User navigates to /projects
2. Component mounts
3. useEffect triggers
4. GET /api/projects
5. Server executes:
   SELECT p.*, d.name, dest.name
   FROM projects p
   LEFT JOIN developers d ...
   LEFT JOIN destinations dest ...
6. Database returns array
7. JSON response to client
8. Component: setProjects(data)
9. Component re-renders, projects displayed
10. User clicks on project → GET /api/projects/:id
11. Single project data fetched
12. /projects/:id shows details
```

### UPDATE (Edit Project)

```
1. User navigates to /admin/projects/edit/123
2. useEffect checks if ID exists
3. GET /api/projects/123 (no auth needed for read)
4. Fetch returns project data
5. Form populates with existing data
6. User modifies fields
7. User clicks "Update"
8. PUT /api/admin/projects/123 {updatedData}
9. Server receives with JWT token
10. Token verified ✓
11. UPDATE projects SET ... WHERE id=123
12. Database updates record
13. Response: { success: true }
14. Client redirects to /admin/projects
15. GET /api/projects refreshes list
16. UI shows updated data
```

### DELETE (Remove Project)

```
1. User clicks delete icon in table
2. Confirmation dialog shown
3. User confirms
4. DELETE /api/admin/projects/123
5. Server receives JWT token
6. Token verified ✓
7. DELETE FROM projects WHERE id=123
8. Database deletes record
9. Response: { success: true }
10. Client calls fetchProjects()
11. GET /api/projects refreshes list
12. Deleted item no longer visible
```

---

## 🔀 Component Hierarchy

```
App.tsx (Main Router)
│
├── Public Routes
│   ├── Home.tsx
│   ├── Projects.tsx
│   ├── ProjectDetails.tsx
│   ├── Developers.tsx
│   ├── Destinations.tsx
│   ├── Blogs.tsx
│   ├── Careers.tsx
│   ├── About.tsx
│   └── Contact.tsx
│
└── Admin Routes
    ├── Login.tsx (No sidebar)
    │
    └── [AdminSidebar, Main Content] Layout
        ├── Dashboard.tsx (Stats)
        │
        ├── Projects
        │   ├── ManageProjects.tsx (List + Delete)
        │   └── AddProject.tsx (Create + Update)
        │
        ├── Developers
        │   ├── ManageDevelopers.tsx (List + Delete)
        │   └── AddEditDeveloper.tsx (Create + Update)
        │
        ├── Destinations
        │   ├── ManageDestinations.tsx (List + Delete)
        │   └── AddEditDestination.tsx (Create + Update)
        │
        ├── Blogs
        │   ├── ManageBlogs.tsx (List + Delete)
        │   └── AddEditBlog.tsx (Create + Update)
        │
        └── Careers
            ├── ManageCareers.tsx (List + Delete)
            └── AddEditCareer.tsx (Create + Update)

Shared Components
├── Navbar.tsx (Public pages navigation)
├── AdminSidebar.tsx (Admin pages navigation)
├── Button.tsx (Reusable button)
└── ProjectCard.tsx (Project preview card)
```

---

## 🗄️ Database Query Patterns

### Get All Projects with Relations

```sql
SELECT p.*, d.name as developer_name, dest.name as destination_name
FROM projects p
LEFT JOIN developers d ON p.developer_id = d.id
LEFT JOIN destinations dest ON p.destination_id = dest.id
```

### Get Destinations with Count

```sql
SELECT d.*, (SELECT COUNT(*) FROM projects p WHERE p.destination_id = d.id) as project_count
FROM destinations d
```

### Project Filtering (Client-side)

```javascript
const filtered = projects.filter((p) => {
  const matchName = p.name.includes(search);
  const matchType = types.includes(p.type);
  const matchBeds = beds.some((b) => p.beds.includes(b));
  const matchPrice = matchesPrice(p.price_range);
  return matchName && matchType && matchBeds && matchPrice;
});
```

---

## 📡 API Error Handling

### 401 Unauthorized

```javascript
// Missing or invalid JWT token
{
  "error": "Unauthorized",
  "status": 401
}

// Solution: Log in again, get new token
localStorage.removeItem('admin_token');
navigate('/admin/login');
```

### 404 Not Found

```javascript
// Resource doesn't exist
{
  "error": "Not found",
  "status": 404
}

// Solution: Check ID exists
```

### 500 Server Error

```javascript
// Server-side error
{
  "error": "Internal Server Error",
  "status": 500
}

// Solution: Check server logs, restart server
```

---

## 🎯 State Management Pattern

```javascript
// Each admin page follows this pattern:

const [items, setItems] = useState([]);
const [loading, setLoading] = useState(false);
const token = localStorage.getItem('admin_token');

useEffect(() => {
  // Fetch data on mount
  fetch('/api/...')
    .then(res => res.json())
    .then(data => setItems(data));
}, []);

const handleCreate = async (formData) => {
  const res = await fetch('/api/admin/...', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(formData)
  });
  if (res.ok) {
    // Refresh data
    const data = await fetch(...).then(r => r.json());
    setItems(data);
  }
};

const handleDelete = async (id) => {
  if (confirm('Delete?')) {
    const res = await fetch(`/api/admin/.../${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setItems(items.filter(i => i.id !== id));
    }
  }
};
```

---

## 🚀 Deployment Architecture

### Development

```
npm run dev
  ├── Vite Dev Server (Port 5173 frontend)
  └── Express Server (Port 3000 backend + frontend)
       └── SQLite Database (realestate.db)
```

### Production

```
Client (Vercel/Netlify)
  ↓ HTTP
Server (Railway/Heroku)
  ├── Express.js
  ├── Environment Variables
  └── PostgreSQL/MySQL
```

---

## 📈 Scalability Considerations

### Current Bottlenecks

1. Single JS file for all routes → Switch to route modules
2. In-memory JWT secret → Use environment variables
3. SQLite → Upgrade to PostgreSQL for production
4. No pagination → Implement cursor-based pagination
5. Client-side filtering → Implement server-side search

### Performance Optimizations

1. Add database indexes on frequently queried columns
2. Implement pagination (limit 10-50 per page)
3. Add caching headers to API responses
4. Compress images with CDN
5. Lazy load images in lists
6. Implement request batching

### Security Enhancements

1. Add rate limiting middleware
2. Implement CORS properly
3. Add request validation/sanitization
4. Hash passwords with bcrypt (already done)
5. Add audit logging
6. Implement refresh tokens + access tokens

---

## 🔧 Technology Stack Details

### Frontend

- **React 18**: UI library with hooks
- **TypeScript**: Type safety
- **Vite**: Lightning-fast build tool
- **React Router v6**: Client-side routing
- **Tailwind CSS**: Utility-first CSS
- **Framer Motion**: Smooth animations
- **Lucide React**: 300+ icons

### Backend

- **Node.js**: Runtime
- **Express.js**: Web framework
- **better-sqlite3**: Synchronous SQLite driver
- **jsonwebtoken**: JWT generation/verification
- **bcryptjs**: Password hashing

### Database

- **SQLite**: Lightweight, file-based database
- **6 Tables**: Projects, Developers, Destinations, Blogs, Careers, Users
- **Foreign Keys**: Maintain data integrity

---

## 📋 Development Workflow

1. **Create Feature**

   ```
   Add table to db.exec() in server.ts
   ↓
   Add GET endpoint for public API
   ↓
   Add POST/PUT/DELETE endpoints (admin)
   ↓
   Add type to types.ts
   ↓
   Add manage page (list + delete)
   ↓
   Add form page (create + edit)
   ↓
   Add routes to App.tsx
   ↓
   Test all CRUD operations
   ```

2. **Update Frontend**

   ```
   Find page that needs changes
   ↓
   Add useEffect with fetch()
   ↓
   Store in state with useState()
   ↓
   Render with .map()
   ↓
   Test loading states
   ↓
   Test error cases
   ```

3. **Deploy**
   ```
   Test locally with npm run dev
   ↓
   Build frontend: npm run build
   ↓
   Deploy frontend (Vercel/Netlify)
   ↓
   Deploy backend (Railway/Heroku)
   ↓
   Update environment URLs
   ↓
   Smoke test all features
   ```

---

**System Version**: 1.0 - Complete & Production-Ready
**Last Updated**: March 2024
