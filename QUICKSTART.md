# Quick Start & Feature Walkthrough

## 🚀 Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd livin
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

This starts:

- Express backend on `http://localhost:3000`
- Vite frontend on `http://localhost:5173`

### 3. Access the Application

- **Public Site**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin/login
- **Default Credentials**: admin / admin123

### 4. Start Using

- Browse public pages (home, projects, developers, etc.)
- Log in to admin
- Create, edit, delete projects/developers/etc.
- Changes appear on public site instantly

---

## 🎯 Feature Walkthrough

### PUBLIC SITE

#### Home Page (`/`)

```
What you see:
├── Hero section with search
├── Featured projects (2 latest marked as featured)
├── Developer showcase (first 4 developers)
├── Destination preview (first 6 locations)
├── Latest blog posts (3 most recent)
└── Call-to-action sections

What happens:
- Featured projects fetched from API (is_featured = 1)
- All content dynamically loaded
```

#### Projects Page (`/projects`)

```
What you see:
├── All projects in cards
├── Advanced filters:
│   ├── Property Type (Apartment/Villa/Penthouse/Townhouse)
│   ├── Number of Beds (1/2/3/4/5)
│   ├── Price Range (categories)
│   └── Destination (New Capital/North Coast/etc)
├── Search bar (by name/location)
└── Active filter count

How to use:
1. Click "Filters" to show/hide filter panel
2. Select any filter options
3. Results update instantly (client-side)
4. Click project card to see details
5. Clear individual filters with X button
```

#### Project Details Page (`/projects/:id`)

```
What you see:
├── Large image gallery
├── Image thumbnails below (clickable)
├── Project details:
│   ├── Name, location, type
│   ├── Beds, size, price range
│   ├── Status badge
│   ├── Developer info (name, logo, website)
│   └── Location/destination info
├── Amenities list
├── Full description
└── Contact section

How to use:
1. Click on project from list
2. Click or hover on thumbnails to change main image
3. Use arrow buttons to navigate gallery
4. Scroll down for full details
5. Click developer website link
```

#### Developers Page (`/developers`)

```
What you see:
├── Developer profile sections:
│   ├── Developer logo
│   ├── Developer name
│   ├── Company description
│   ├── Website link
│   └── Their projects (grid)
└── Each developer in separate section

How to use:
1. Browse all developers
2. Read company descriptions
3. Visit their website
4. View their projects
5. Click project to see details
```

#### Destinations Page (`/destinations`)

```
What you see:
├── Destination sections:
│   ├── Destination image
│   ├── Location name
│   ├── Description
│   └── Projects in this location
└── Multiple destination sections

How to use:
1. Browse locations
2. Read about each destination
3. See projects available there
4. Click project for details
```

#### Blogs Page (`/blogs`)

```
What you see:
├── Blog cards (3-column grid):
│   ├── Blog image
│   ├── Category badge
│   ├── Title
│   ├── Author name
│   └── Publication date
└── All blogs from database

How to use:
1. Browse all blog posts
2. See publication date
3. Click post to read (Route: /blogs/:id) [currently not linked]
4. Search by reading titles
```

#### Careers Page (`/careers`)

```
What you see:
├── Job listings:
│   ├── Job title
│   ├── Location (with icon)
│   ├── Employment type (with icon)
│   └── "Apply Now" button
└── All open positions

How to use:
1. Browse available positions
2. See location and type
3. Click "Apply Now" (currently shows alert)
```

---

### ADMIN PANEL

#### Login Page (`/admin/login`)

```
What you see:
├── Login form:
│   ├── Username field
│   ├── Password field
│   └── Login button
└── Clean admin interface

How to use:
1. Enter username: admin
2. Enter password: admin123
3. Click "Login"
4. Redirected to dashboard
5. Token saved in localStorage

Note: Logout by clearing localStorage + refreshing
```

#### Dashboard (`/admin/dashboard`)

```
What you see:
├── Stats cards:
│   ├── Total Projects count
│   ├── Total Developers count
│   ├── Total Destinations count
│   └── Total Blog Posts count
├── Quick Actions:
│   ├── "Add New Developer" button
│   ├── "Create Blog Post" button
│   └── "Post Job Opening" button
└── Sidebar with all management links

How to use:
1. View statistics at a glance
2. Click quick action buttons to add content
3. Use sidebar to navigate to manage pages
```

#### Manage Projects (`/admin/projects`)

```
What you see:
├── Table with columns:
│   ├── Project name (with image)
│   ├── Location
│   ├── Type
│   ├── Beds
│   ├── Size
│   ├── Status badge
│   └── Action buttons (Edit/Delete)
├── "Back to Dashboard" link
└── "Add Project" button

How to use:
1. View all projects in table
2. Click edit icon → modify → update
3. Click delete icon → confirm → deleted
4. Click "Add Project" → fill form → create

Common Issues:
- Delete fails: Check you're logged in (token still valid)
- Can't edit: Make sure form fields are filled
```

#### Add/Edit Project (`/admin/projects/new` and `/admin/projects/edit/:id`)

```
Form Fields:
├── Project Name (required)
├── Location (required)
├── Price Range (required, e.g., "EGP 5M - EGP 25M")
├── Property Type (required, dropdown):
│   ├── Apartment
│   ├── Villa
│   ├── Penthouse
│   └── Townhouse
├── Number of Beds (optional, e.g., "1-4" or "Studio")
├── Size (optional, e.g., "100-450 sqm")
├── Developer (required, dropdown - fetched from API)
├── Destination (required, dropdown - fetched from API)
├── Status (select):
│   ├── Off-Plan
│   ├── Under Construction
│   └── Completed
├── Main Image URL (required, https://...)
├── Description (required, text area)
├── Featured Checkbox (optional, shows on home)
└── Buttons: Submit | Cancel

How to use:
1. Fill all required fields
2. Images must be full URLs (https://...)
3. Select developer and destination from dropdowns
4. Check "Featured" if should appear on home page
5. Click "Create Project" or "Update Project"
6. Auto-redirects to projects list
7. New/updated project visible immediately

Tips:
- Get free images from Unsplash, Pexels, Pixabay
- Use URLs like: https://images.unsplash.com/...
- Beds can be "Studio", "1", "2", "3", "4", "5", or "1-4"
```

#### Manage Developers (`/admin/developers`)

```
What you see:
├── Table with columns:
│   ├── Developer name (with logo)
│   ├── Website URL
│   └── Action buttons (Edit/Delete)
├── "Back to Dashboard" link
└── "Add Developer" button

How to use:
1. View all developers
2. Edit or delete as needed
3. Click "Add Developer" to create new

Form Fields (Add/Edit):
├── Developer Name (required)
├── Logo URL (required, company logo)
├── Website URL (required, https://...)
└── Description (required, text area)
```

#### Manage Destinations (`/admin/destinations`)

```
What you see:
├── Table with columns:
│   ├── Destination name (with image)
│   └── Action buttons (Edit/Delete)
├── "Back to Dashboard" link
└── "Add Destination" button

How to use:
1. View all locations
2. Edit or delete as needed
3. Click "Add Destination" to create new

Form Fields (Add/Edit):
├── Destination Name (required)
├── Image URL (required, location photo)
└── Description (required, text area)
```

#### Manage Blogs (`/admin/blogs`)

```
What you see:
├── Table with columns:
│   ├── Blog title (with image)
│   ├── Category
│   ├── Author
│   └── Action buttons (Edit/Delete)
├── "Back to Dashboard" link
└── "Add Blog Post" button

How to use:
1. View all blog posts
2. Edit or delete as needed
3. Click "Add Blog Post" to create new

Form Fields (Add/Edit):
├── Title (required)
├── Category (required, e.g., "Investment", "Market Trends")
├── Author (required, person's name)
├── Image URL (required, article header image)
├── Content (required, full article text, large textarea)
└── Buttons: Submit | Cancel

Tips:
- Write detailed blog content
- Use clear categories
- Add author name for credibility
```

#### Manage Careers (`/admin/careers`)

```
What you see:
├── Table with columns:
│   ├── Job title
│   ├── Location
│   ├── Employment Type
│   └── Action buttons (Edit/Delete)
├── "Back to Dashboard" link
└── "Add Job Posting" button

How to use:
1. View all job openings
2. Edit or delete as needed
3. Click "Add Job Posting" to create new

Form Fields (Add/Edit):
├── Job Title (required, e.g., "Senior Property Manager")
├── Location (required, e.g., "New Cairo, Cairo")
├── Employment Type (required, dropdown):
│   ├── Full-time
│   ├── Part-time
│   ├── Contract
│   └── Remote
├── Job Description (required, what the job entails)
├── Requirements (required, skills/experience needed)
└── Buttons: Submit | Cancel

Tips:
- Be specific about requirements
- Mention required experience years
- List key responsibilities
```

---

## 💡 Common Workflows

### Adding a Complete Real Estate Project

**Path**: /admin/projects/new

Steps:

1. Log in to admin
2. Go to Projects → "Add Project"
3. Fill in:
   - Name: "Nile Towers Luxury Residences"
   - Location: "New Cairo"
   - Price Range: "EGP 8M - EGP 50M"
   - Type: "Apartment"
   - Status: "Under Construction"
   - Beds: "1-4 Beds"
   - Size: "120 - 350 sqm"
4. Upload image URL (must be full URL with https://)
5. Write description
6. Select Developer: (choose from dropdown)
7. Select Destination: (choose from dropdown)
8. Check "Feature this project on home page"
9. Click "Create Project"
10. View on home page and /projects page immediately

### Managing a Developer

**Path**: /admin/developers

Steps to create:

1. Go to Developers → "Add Developer"
2. Enter:
   - Name: "Emaar Misr"
   - Logo URL: (company logo image)
   - Website: "https://emaarmisr.com"
   - Description: (company background)
3. Click "Create Developer"
4. Developer appears in list
5. Available in project developer dropdown

Steps to update:

1. Find developer in list
2. Click edit icon
3. Modify fields
4. Click "Update Developer"

Steps to delete:

1. Find developer in list
2. Click delete icon
3. Confirm deletion
4. Developer removed

**Note**: Deleting developer doesn't delete their projects (database constraint), but new projects can't be assigned to them.

### Publishing a Blog Post

**Path**: /admin/blogs/new

Steps:

1. Go to Blogs → "Add Blog Post"
2. Fill in:
   - Title: "2024 Real Estate Investment Trends"
   - Category: "Investment"
   - Author: "Ahmed Hassan"
   - Image URL: (article header photo)
   - Content: (full article text - can be long!)
3. Click "Create Blog Post"
4. Blog appears on /blogs page immediately
5. Shows in latest posts on home page

### Posting a Job Opening

**Path**: /admin/careers/new

Steps:

1. Go to Careers → "Add Job Posting"
2. Fill in:
   - Title: "Real Estate Sales Manager"
   - Location: "Giza, Egypt"
   - Type: "Full-time"
   - Description: (job responsibilities)
   - Requirements: (experience, skills needed)
3. Click "Create Job Posting"
4. Job appears on /careers page immediately

---

## 🔍 Finding Data in the System

### Find Projects

- **Location**: /projects or /admin/projects
- **Filter by**: Type, Beds, Price, Destination
- **Data Source**: GET /api/projects

### Find Developers

- **Location**: /developers or /admin/developers
- **Data Source**: GET /api/developers
- **Associated**: Their projects in list

### Find Destinations

- **Location**: /destinations or /admin/destinations
- **Data Source**: GET /api/destinations
- **Shows**: Projects in each location

### Find Blogs

- **Location**: /blogs or /admin/blogs
- **Data Source**: GET /api/blogs
- **Sorted by**: Creation date (newest first)

### Find Career Openings

- **Location**: /careers or /admin/careers
- **Data Source**: GET /api/careers
- **Type**: Full-time, Part-time, Contract, Remote

---

## 🛠️ Troubleshooting Quick Guide

### Problem: Can't log in

**Solutions**:

- Check credentials: `admin` / `admin123`
- Check server is running: `npm run dev`
- Clear browser cache: Ctrl+Shift+Delete
- Check console for errors: F12 → Console

### Problem: Changes not showing on public site

**Solutions**:

- Refresh page (Ctrl+F5 for hard refresh)
- Wait 2 seconds (API takes time)
- Check network tab for failed requests
- Make sure you're viewing same project ID

### Problem: Image not loading

**Solutions**:

- Check URL starts with https://
- Test URL in new browser tab
- Use different image from Unsplash, Pexels, etc.
- Check image URL is not broken

### Problem: Delete button doesn't work

**Solutions**:

- Log in again (token might be expired)
- Check browser console for errors (F12)
- Check server logs (terminal)
- Try deleting different item first

### Problem: Form won't submit

**Solutions**:

- Fill all required fields (marked with \*)
- Check all fields have valid data
- Check server is running
- Check browser console for errors

### Problem: Getting "Unauthorized" error

**Solutions**:

- Your JWT token expired, log in again
- Clear localStorage in Dev Tools → Application
- Log out and back in
- Check Authorization header in Network tab

---

## 📝 API Testing Examples

### Test with curl (without auth)

```bash
# Get all projects
curl http://localhost:3000/api/projects

# Get single project
curl http://localhost:3000/api/projects/1

# Get developers
curl http://localhost:3000/api/developers

# Get destinations
curl http://localhost:3000/api/destinations

# Get blogs
curl http://localhost:3000/api/blogs

# Get careers
curl http://localhost:3000/api/careers
```

### Test with curl (with auth)

```bash
# Login first
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Create project
curl -X POST http://localhost:3000/api/admin/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "location": "New Cairo",
    "price_range": "EGP 10M",
    "type": "Apartment",
    "status": "Off-Plan",
    "description": "Test",
    "main_image": "https://...",
    "developer_id": 1,
    "destination_id": 1,
    "is_featured": false,
    "gallery": [],
    "amenities": ["Gym", "Pool"],
    "beds": "2",
    "size": "150 sqm"
  }'
```

---

## 📊 Sample Data Included

### Pre-loaded Developers

- Mountain View (Egypt)
- SODIC (Egypt)
- Palm Hills (Egypt)
- Emaar Misr (Egypt)

### Pre-loaded Destinations

- New Capital
- North Coast
- El Gouna
- New Cairo
- Sheikh Zayed
- Soma Bay

### Pre-loaded Projects

- Mountain View iCity (New Cairo)
- Marassi (North Coast)
- SODIC East (New Capital)

### Pre-loaded Content

- 1 Blog Post (about New Capital investment)
- 1 Career Opening (Luxury Property Consultant)

---

## ✨ Tips & Tricks

1. **Using the search**: Type in filter search on /projects page
2. **Multiple filters**: Apply several filters to narrow results
3. **Image URLs**: All images must be full https:// URLs
4. **Featured projects**: Mark important projects as featured
5. **Organizing content**: Use clear categories for blogs
6. **Job posting**: Be specific about requirements
7. **Developer assignment**: All projects must have a developer
8. **Destination assignment**: All projects must have a location
9. **Beds format**: Use "1-4", "Studio", or just numbers
10. **Size format**: Include "sqm" in the size field

---

## 🎓 Learning Tips

- **Read**: API_REFERENCE.md for complete API docs
- **Review**: ARCHITECTURE.md for system design
- **Explore**: Open browser Dev Tools → Network tab to see API calls
- **Test**: Use curl commands to test endpoints
- **Debug**: Check terminal logs while using admin panel

---

**Happy managing! 🎉**
