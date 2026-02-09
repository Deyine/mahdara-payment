# Time Tracking Frontend - Standalone Application

## Overview

The Time Tracking frontend is a standalone React application deployed independently from the main BestCar application. It shares the same backend API but has its own authentication flow, routing, and deployment.

**Deployment:**
- URL: time.next-version.com
- Tech Stack: React 19 + Vite + TailwindCSS
- Backend: Shared Rails API at bestcar-mr.com/api
- Dev Port: 5174

## Architecture

### Deployment Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     Shared Backend API                      │
│              Rails API (bestcar-mr.com/api)                 │
│  Endpoints: /auth/login, /time_tracking/projects, etc.     │
└─────────────────────────────────────────────────────────────┘
                    ▲                          ▲
                    │                          │
        ┌───────────┴─────────┐    ┌──────────┴──────────┐
        │   Main Frontend     │    │  Time Track Frontend│
        │  bestcar-mr.com     │    │ time.next-version.com│
        │  (client/)          │    │ (time-tracking-client/)│
        │  Cars, Profits, etc.│    │ Projects, Tasks only│
        └─────────────────────┘    └─────────────────────┘
```

### Directory Structure

```
time-tracking-client/
├── src/
│   ├── components/
│   │   ├── Layout.jsx           # Simple header with logout
│   │   └── PrivateRoute.jsx     # Auth guard
│   ├── context/
│   │   ├── AuthContext.jsx      # Token auth + permissions
│   │   └── DialogContext.jsx    # Alert/confirm dialogs
│   ├── pages/
│   │   ├── Login.jsx            # Time tracking login
│   │   ├── Projects.jsx         # Projects list
│   │   ├── ProjectDetail.jsx    # Project with tasks
│   │   └── TaskDetail.jsx       # Task with time entries
│   ├── services/
│   │   └── api.js               # Axios + time tracking API
│   ├── App.jsx                  # Routing
│   ├── main.jsx                 # Entry point
│   └── index.css                # TailwindCSS styles
├── index.html
├── vite.config.js
├── tailwind.config.js
├── .env                         # Development API URL
├── .env.production              # Production API URL
└── package.json
```

## Routing

**Routes:**
- `/` - Projects list (home page)
- `/projects/:id` - Project detail with tasks
- `/tasks/:id` - Task detail with time entries
- `/login` - Login page
- `*` - Catch all (redirects to /)

**Note:** No `/time-tracking` prefix - this IS the time tracking app.

## API Integration

### Authentication
- Token stored in localStorage (`token`, `user`)
- Automatic redirect to /login on 401/403
- Same auth mechanism as main app
- JWT-based authentication

### API Endpoints

All endpoints use `/api/time_tracking/*` namespace:

**Projects:**
- `GET /api/time_tracking/projects` - List projects
- `GET /api/time_tracking/projects/:id` - Get project
- `POST /api/time_tracking/projects` - Create project
- `PUT /api/time_tracking/projects/:id` - Update project
- `DELETE /api/time_tracking/projects/:id` - Soft delete project
- `POST /api/time_tracking/projects/:id/restore` - Restore deleted project

**Tasks:**
- `GET /api/time_tracking/tasks` - List tasks (filter by project_id)
- `GET /api/time_tracking/tasks/:id` - Get task
- `POST /api/time_tracking/tasks` - Create task
- `PUT /api/time_tracking/tasks/:id` - Update task
- `DELETE /api/time_tracking/tasks/:id` - Soft delete task
- `POST /api/time_tracking/tasks/:id/complete` - Mark task as completed

**Time Entries:**
- `GET /api/time_tracking/time_entries` - List time entries
- `GET /api/time_tracking/time_entries/:id` - Get time entry
- `POST /api/time_tracking/time_entries` - Create entry (start timer)
- `PUT /api/time_tracking/time_entries/:id` - Update entry
- `DELETE /api/time_tracking/time_entries/:id` - Delete entry
- `POST /api/time_tracking/time_entries/:id/stop` - Stop running timer

### Environment Variables

**Development (.env):**
```
VITE_API_URL=http://localhost:3000/api
```

**Production (.env.production):**
```
VITE_API_URL=https://bestcar-mr.com/api
```

## Components

### Layout
Simple header with:
- App title "Time Tracking" (clickable, goes to /)
- User name display
- Logout button
- No sidebar navigation

### PrivateRoute
- Checks authentication status
- Shows loading spinner during auth check
- Redirects to /login if not authenticated
- Wraps protected content in Layout

### Dialog System
- Alert: Success/error/warning messages
- Confirm: Yes/no confirmations for delete actions
- Promise-based API: `await showAlert()`, `await showConfirm()`
- Inline styles with #167bff primary color

## Styling

### Design System
- **Primary Color:** #167bff (blue)
- **Background:** #f8fafc (light gray)
- **Text:** #1e293b (dark slate)
- **Border:** #e2e8f0 (light slate)
- **Font:** Inter, system-ui, sans-serif

### CSS Framework
- TailwindCSS for layout utilities
- Inline styles for consistent colors
- No DaisyUI (keeps bundle smaller)
- Responsive design with mobile-first approach

### Responsive
- Mobile-friendly grid layouts
- Responsive padding/margins (px-4 sm:px-6 lg:px-8)
- Max-width containers (max-w-7xl)
- Touch-friendly button sizes

## Development

### Start Development Server
```bash
cd time-tracking-client
npm run dev
```
Access at: http://localhost:5174

### Build for Production
```bash
npm run build
```
Output: `dist/` directory

### Preview Production Build
```bash
npm run preview
```

## Deployment

### Build Assets
```bash
cd time-tracking-client
npm run build
```

### Deploy to Server
Run `./deploy.sh` to build and deploy both frontends

### Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name time.next-version.com;

    root /path/to/bestcar/time-tracking-client/dist;
    index index.html;

    # SPA fallback routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: Proxy API requests (alternative to CORS)
    location /api {
        proxy_pass http://localhost:3000/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### CORS Configuration
Backend must allow time.next-version.com in `backend/config/initializers/cors.rb`:
```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'localhost:5173', 'localhost:5174', 'bestcar-mr.com', 'time.next-version.com'
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end
```

## Permissions

### Roles
Same as main app:
- `operator`: Read-only access
- `manager`: Read-only access
- `admin`: Full access (create/edit/delete)
- `super_admin`: Full access (create/edit/delete)

### Permission Checks
```javascript
const { canWrite } = useAuth(); // true for admin/super_admin
```

Used for conditional rendering of create/edit/delete buttons.

## Features

### Projects Management
- List all projects with stats (tasks count, total time, status)
- Create/edit/delete projects (admin only)
- Status management: draft, active, completed, archived
- Click project to view details
- Soft delete with restore capability

### Tasks Management
- List tasks within a project
- Create/edit/delete tasks (admin only)
- Mark tasks as completed
- Click task to view time entries
- Position ordering for task lists

### Time Entries & Timer
- List all time entries for a task
- Start/stop timer (single running entry per user)
- Manual time entry creation (with start and end times)
- Edit/delete entries (owner or admin)
- Real-time elapsed time calculation
- Total time aggregation per task/project

## Differences from Main App

1. **No Layout Navigation** - Simple header only, no sidebar menu
2. **Focused Routes** - Only time tracking routes (no /cars, /profits, etc.)
3. **Smaller Bundle** - No unused dependencies (no react-select, no car-related code)
4. **Independent Deployment** - Separate from car management, different domain
5. **Cleaner URLs** - `/projects/1` instead of `/time-tracking/projects/1`
6. **Same Backend** - Shares Rails API with main app
7. **Same Auth** - Uses same JWT tokens, same user roles
8. **Simpler Permissions** - No requireAdmin on routes, just canWrite checks in UI
9. **Standalone Branding** - "Time Tracking" title instead of "BestCar"
10. **No Multi-App Navigation** - Doesn't link to other BestCar features

## Maintenance

### Updating Dependencies
```bash
cd time-tracking-client
npm update
```

### Syncing API Changes
If backend API changes:
1. Update `src/services/api.js`
2. Keep timeTrackingAPI namespace in sync
3. Test authentication flow
4. Verify error handling

### Code Reuse
Contexts are copied from main app, not shared:
- If you update AuthContext in main app, copy changes to time-tracking-client
- If you update DialogContext in main app, copy changes to time-tracking-client
- Test both apps independently after updates

## Testing Checklist

### Local Development
- [ ] Authentication flow works (login/logout)
- [ ] Projects CRUD operations
- [ ] Tasks CRUD operations
- [ ] Timer start/stop functionality
- [ ] Permission-based UI rendering
- [ ] Multi-tenant data isolation
- [ ] API error handling
- [ ] Loading states display correctly

### Production Build
- [ ] Build completes without errors
- [ ] All routes work in production mode
- [ ] API calls use production URL
- [ ] No console errors
- [ ] Assets load correctly
