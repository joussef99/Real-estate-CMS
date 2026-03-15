# API Reference & Administrator Guide

## 📚 Complete API Documentation

### Base URL

```
http://localhost:3000
```

---

## 🔑 Authentication

### Login

**Endpoint**: `POST /api/auth/login`

**Request Body**:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response** (200):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin"
  }
}
```

**Error** (401):

```json
{
  "error": "Invalid credentials"
}
```

**Usage**: Save token to `localStorage` and include in Authorization header:

```javascript
const token = localStorage.getItem("admin_token");
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};
```

---

## 🏢 Projects API

### Get All Projects

**Endpoint**: `GET /api/projects`

**Auth**: No

**Response** (200):

```json
[
  {
    "id": 1,
    "name": "Mountain View iCity",
    "location": "New Cairo",
    "price_range": "EGP 5M - EGP 25M",
    "type": "Apartment",
    "status": "Under Construction",
    "description": "iCity is a revolutionary concept...",
    "main_image": "https://...",
    "gallery": "[\"https://...\",\"https://...\"]",
    "amenities": "[\"Central Park\",\"Clubhouse\",\"Smart Home\",\"Security\"]",
    "developer_id": 1,
    "destination_id": 3,
    "is_featured": 1,
    "beds": "1-4 Beds",
    "size": "100 - 450 sqm",
    "developer_name": "Mountain View",
    "destination_name": "New Cairo"
  }
]
```

### Get Project by ID

**Endpoint**: `GET /api/projects/:id`

**Auth**: No

**Parameters**: `:id` - Project ID

**Response** (200): Single project object (same as above)

**Error** (404):

```json
{
  "error": "Not found"
}
```

### Create Project

**Endpoint**: `POST /api/admin/projects`

**Auth**: Yes (Bearer token required)

**Request Body**:

```json
{
  "name": "New Luxury Compound",
  "location": "Sheikh Zayed",
  "price_range": "EGP 10M - EGP 50M",
  "type": "Villa",
  "status": "Off-Plan",
  "description": "Exclusive luxury villas in...",
  "main_image": "https://...",
  "gallery": ["https://...", "https://..."],
  "amenities": ["Gym", "Pool", "Golf"],
  "developer_id": 2,
  "destination_id": 5,
  "is_featured": false,
  "beds": "4-6 Beds",
  "size": "500 - 1000 sqm"
}
```

**Response** (200):

```json
{
  "id": 15
}
```

### Update Project

**Endpoint**: `PUT /api/admin/projects/:id`

**Auth**: Yes

**Request Body**: Same as Create (all fields optional)

**Response** (200):

```json
{
  "success": true
}
```

### Delete Project

**Endpoint**: `DELETE /api/admin/projects/:id`

**Auth**: Yes

**Response** (200):

```json
{
  "success": true
}
```

---

## 👥 Developers API

### Get All Developers

**Endpoint**: `GET /api/developers`

**Auth**: No

**Response** (200):

```json
[
  {
    "id": 1,
    "name": "Mountain View",
    "logo": "https://...",
    "description": "Mountain View is a leading Egyptian...",
    "website": "https://mountainviewegypt.com"
  }
]
```

### Create Developer

**Endpoint**: `POST /api/admin/developers`

**Auth**: Yes

**Request Body**:

```json
{
  "name": "New Developer",
  "logo": "https://",
  "description": "Description here",
  "website": "https://website.com"
}
```

**Response** (200):

```json
{
  "id": 5
}
```

### Update Developer

**Endpoint**: `PUT /api/admin/developers/:id`

**Auth**: Yes

**Request Body**: Same as Create

**Response** (200):

```json
{
  "success": true
}
```

### Delete Developer

**Endpoint**: `DELETE /api/admin/developers/:id`

**Auth**: Yes

**Response** (200):

```json
{
  "success": true
}
```

---

## 📍 Destinations API

### Get All Destinations

**Endpoint**: `GET /api/destinations`

**Auth**: No

**Response** (200):

```json
[
  {
    "id": 1,
    "name": "New Capital",
    "image": "https://",
    "description": "The New Administrative Capital...",
    "project_count": 5
  }
]
```

### Create Destination

**Endpoint**: `POST /api/admin/destinations`

**Auth**: Yes

**Request Body**:

```json
{
  "name": "New Location",
  "image": "https://",
  "description": "Description of location"
}
```

**Response** (200):

```json
{
  "id": 7
}
```

### Update Destination

**Endpoint**: `PUT /api/admin/destinations/:id`

**Auth**: Yes

**Request Body**: Same as Create

**Response** (200):

```json
{
  "success": true
}
```

### Delete Destination

**Endpoint**: `DELETE /api/admin/destinations/:id`

**Auth**: Yes

**Response** (200):

```json
{
  "success": true
}
```

---

## 📰 Blogs API

### Get All Blogs

**Endpoint**: `GET /api/blogs`

**Auth**: No

**Response** (200):

```json
[
  {
    "id": 1,
    "title": "Investing in the New Capital",
    "content": "The New Capital is set to become...",
    "image": "https://",
    "category": "Investment",
    "author": "Ahmed Mansour",
    "created_at": "2024-01-15T10:30:00"
  }
]
```

### Create Blog

**Endpoint**: `POST /api/admin/blogs`

**Auth**: Yes

**Request Body**:

```json
{
  "title": "Blog Title",
  "content": "Full blog content here",
  "image": "https://",
  "category": "Market Trends",
  "author": "Author Name"
}
```

**Response** (200):

```json
{
  "id": 10
}
```

### Update Blog

**Endpoint**: `PUT /api/admin/blogs/:id`

**Auth**: Yes

**Request Body**: Same as Create

**Response** (200):

```json
{
  "success": true
}
```

### Delete Blog

**Endpoint**: `DELETE /api/admin/blogs/:id`

**Auth**: Yes

**Response** (200):

```json
{
  "success": true
}
```

---

## 💼 Careers API

### Get All Careers

**Endpoint**: `GET /api/careers`

**Auth**: No

**Response** (200):

```json
[
  {
    "id": 1,
    "title": "Luxury Property Consultant",
    "location": "New Cairo, Egypt",
    "type": "Full-time",
    "description": "Join our elite sales team...",
    "requirements": "3+ years experience..."
  }
]
```

### Create Career

**Endpoint**: `POST /api/admin/careers`

**Auth**: Yes

**Request Body**:

```json
{
  "title": "Senior Agent",
  "location": "New Cairo",
  "type": "Full-time",
  "description": "Job description here",
  "requirements": "Requirements here"
}
```

**Response** (200):

```json
{
  "id": 3
}
```

### Update Career

**Endpoint**: `PUT /api/admin/careers/:id`

**Auth**: Yes

**Request Body**: Same as Create

**Response** (200):

```json
{
  "success": true
}
```

### Delete Career

**Endpoint**: `DELETE /api/admin/careers/:id`

**Auth**: Yes

**Response** (200):

```json
{
  "success": true
}
```

---

## 📊 Admin Dashboard API

### Get Statistics

**Endpoint**: `GET /api/admin/stats`

**Auth**: Yes

**Response** (200):

```json
{
  "projects": 12,
  "developers": 4,
  "destinations": 6,
  "blogs": 5
}
```

---

## 🛠️ Admin Guide

### Logging In

1. Navigate to `http://localhost:3000/admin/login`
2. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
3. Click "Login"
4. Redirected to dashboard (token saved in localStorage)

### Managing Projects

1. Click "Projects" in sidebar
2. Click "Add Project" button
3. Fill in all fields:
   - **Basic Info**: Name, Location, Type (Apartment/Villa/Penthouse/Townhouse)
   - **Pricing**: Price Range (e.g., "EGP 5M - EGP 25M")
   - **Status**: Off-Plan, Under Construction, Completed
   - **Specs**: Beds (e.g., "1-4"), Size (e.g., "100-450 sqm")
   - **Developer**: Select from dropdown
   - **Destination**: Select from dropdown
   - **Media**: Main Image URL
   - **Details**: Description
   - **Featured**: Check to show on home page
4. Click "Create Project"
5. To edit: Click edit icon → modify → update
6. To delete: Click trash icon → confirm

### Managing Developers

1. Click "Developers" in sidebar
2. Click "Add Developer" button
3. Fill in:
   - Developer Name
   - Logo URL (company logo)
   - Website URL
   - Description
4. Click "Create Developer"

### Managing Destinations

1. Click "Destinations" in sidebar
2. Click "Add Destination" button
3. Fill in:
   - Destination Name
   - Image URL
   - Description
4. Click "Create Destination"

### Managing Blog Posts

1. Click "Blogs" in sidebar
2. Click "Add Blog Post" button
3. Fill in:
   - Title
   - Category (Investment, Market Trends, etc.)
   - Author Name
   - Image URL
   - Content (main text)
4. Click "Create Blog Post"

### Managing Job Postings

1. Click "Careers" in sidebar
2. Click "Add Job Posting" button
3. Fill in:
   - Job Title
   - Location
   - Employment Type (Full-time, Part-time, Contract, Remote)
   - Job Description
   - Requirements
4. Click "Create Job Posting"

---

## 🔄 Data Relationships

### Projects ↔ Developers

- A project belongs to ONE developer
- Set `developer_id` when creating project
- Developer data shown on project details page

### Projects ↔ Destinations

- A project is in ONE destination
- Set `destination_id` when creating project
- Projects grouped by destination on destinations page

### Projects ↔ Featured

- `is_featured` boolean flag
- Featured projects shown on home page
- Set flag when creating/editing project

---

## 📝 Validation Rules

### Projects

- **Name**: Required, text
- **Location**: Required, text
- **Price Range**: Required, text (e.g., "EGP 5M - EGP 25M")
- **Type**: Required, select (Apartment/Villa/Penthouse/Townhouse)
- **Status**: Required, select (Off-Plan/Under Construction/Completed)
- **Description**: Required, text
- **Main Image**: Required, URL
- **Developer ID**: Required, select
- **Destination ID**: Required, select
- **Beds**: Optional, text (e.g., "1-4", "Studio")
- **Size**: Optional, text (e.g., "100-450 sqm")

### Developers

- **Name**: Required, text
- **Logo**: Required, URL
- **Website**: Required, URL
- **Description**: Required, text

### Destinations

- **Name**: Required, text
- **Image**: Required, URL
- **Description**: Required, text

### Blogs

- **Title**: Required, text
- **Category**: Required, text
- **Author**: Required, text
- **Image**: Required, URL
- **Content**: Required, long text

### Careers

- **Title**: Required, text
- **Location**: Required, text
- **Type**: Required, select
- **Description**: Required, text
- **Requirements**: Required, text

---

## 🐛 Troubleshooting

### Can't log in

- Check credentials: `admin` / `admin123`
- Clear localStorage if stuck: Dev Tools → Application → Clear
- Check server is running: `npm run dev`

### Changes not showing

- Refresh page (Ctrl+F5 for hard refresh)
- Check browser console for errors
- Check server logs for API errors

### Images not loading

- Verify URL is public and accessible
- Use CORS-friendly image URLs
- For local images, use file:// paths or upload to CDN

### Token expired

- Log out and log back in
- Token is stored in localStorage

### Delete doesn't work

- Check confirmation dialog appears
- Check network tab for 401 unauthorized → log in again
- Check server logs for errors

---

## 📂 How to Add New Features

### Adding a New Admin Entity (e.g., Leads)

1. Create Leads table in server.ts `db.exec()`
2. Add GET /api/leads endpoint
3. Add POST /api/admin/leads endpoint
4. Add PUT /api/admin/leads/:id endpoint
5. Add DELETE /api/admin/leads/:id endpoint
6. Create src/pages/admin/ManageLeads.tsx
7. Create src/pages/admin/AddEditLead.tsx
8. Add Leads type to src/types.ts
9. Add menu item to AdminSidebar.tsx
10. Add route to App.tsx

### Adding Image Upload

1. Install multer: `npm install multer`
2. Create /upload endpoint in server.ts
3. Add file input to forms
4. Handle file upload and return URL
5. Use returned URL in data submission

---

## 🔒 Security Notes

### Production Checklist

- [ ] Change default admin password
- [ ] Use environment variables for JWT_SECRET
- [ ] Move database to PostgreSQL
- [ ] Add HTTPS
- [ ] Implement rate limiting
- [ ] Add input sanitization
- [ ] Add CORS configuration
- [ ] Use proper error handling (don't expose errors)
- [ ] Add user management instead of single admin
- [ ] Implement audit logs

---

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Check browser console for errors
3. Check server logs (terminal where `npm run dev` is running)
4. Review API responses in Network tab (Dev Tools)

---

**Last Updated**: March 2024
**Version**: 1.0 (Complete)
