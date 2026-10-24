# DevBlog

> A full-stack developer blogging platform built with the MERN stack — inspired by Medium and Dev.to. Writers can publish rich articles, readers can engage with likes, bookmarks, and nested comments, and everyone gets a personalised profile with a follow system.

---

## Table of Contents

1. [Why This Project](#1-why-this-project)
2. [Features](#2-features)
3. [Tech Stack & Why Each Choice](#3-tech-stack--why-each-choice)
4. [Project Structure](#4-project-structure)
5. [Getting Started (Local Setup)](#5-getting-started-local-setup)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [API Reference](#7-api-reference)
8. [Security Measures](#8-security-measures)
9. [Code Comment Philosophy](#9-code-comment-philosophy)
10. [Contributing](#10-contributing)
11. [License](#11-license)

---

## 1. Why This Project

Most developers learn CRUD apps in isolation — a todo list, a notes app, a weather widget.  
DevBlog is an attempt to build something **real and complete**:

- A **multi-user system** with roles, authentication, and authorisation.
- A **content platform** with a real rich-text editor, image uploads, slugs, and SEO meta tags.
- A **social layer** with likes, bookmarks, follows, and nested comments.
- **Production-grade concerns** like rate limiting, helmet security headers, HTML sanitisation, email verification, and PWA support.

The goal is to understand how every piece of a modern web application connects — not just how to write code, but *why* each decision is made.

---

## 2. Features

| Category | Feature |
|---|---|
| Auth | Register, login, JWT-based sessions, email verification |
| Posts | Create / edit / delete posts, rich text (Quill), cover images, draft/publish toggle, scheduled publishing |
| Discovery | Full-text search, filter by category or tag, sort by latest / oldest / popular, "Following" feed |
| Engagement | Like posts, bookmark posts, nested comment threads with replies, notifications for likes / comments / replies / follows |
| Profiles | Public profile pages, follower / following system, cover & avatar images |
| UX | Light / Dark / Sepia themes, PWA (installable app), fully responsive layout |
| Developer UX | Skeleton loading states, error boundaries, toast notifications, confirm modals |

---

## 3. Tech Stack & Why Each Choice

### Frontend

| Library / Tool | Version | Why this over alternatives |
|---|---|---|
| **React** | 19 | The industry-standard UI library. Component model fits a content-heavy, dynamic app perfectly. Chosen over Vue/Svelte because of its ecosystem size and job-market relevance. |
| **Vite** | 7 | Dramatically faster than Create-React-App (CRA). Near-instant dev server startup via native ES modules. CRA is officially deprecated. |
| **React Router** | 7 | Declarative, nested routing. The standard for React SPAs. v7 includes first-class lazy route support — we use `lazy()` on every page to code-split the bundle. |
| **Zustand** | 5 | Minimal, boilerplate-free global state. Chosen over Redux because Redux requires actions/reducers/slices for simple auth state that Zustand handles in a single `create()` call. Context API alone was avoided because it re-renders every consumer on any state change. |
| **Axios** | 1.x | Automatic JSON parsing, interceptors for attaching the auth token and handling 401 logouts globally. Fetch API lacks interceptors without custom wrappers. |
| **Quill** | 2 | Mature, actively maintained rich-text editor. Produces clean, semantic HTML output that is easy to sanitise. Chosen over TipTap (heavier) and Draft.js (harder API). |
| **DOMPurify** | 3 | Client-side XSS sanitisation before rendering Quill HTML via `dangerouslySetInnerHTML`. Belt-and-suspenders defence alongside server-side sanitise-html. |
| **react-helmet-async** | 3 | Per-page `<title>` and `<meta>` tags for SEO and social sharing previews. The async version is required with React 18+ Suspense. |
| **react-hot-toast** | 2 | Lightweight, accessible toast notifications. Zero-config, good defaults. |
| **date-fns** | 4 | Modular date formatting. Tree-shakeable — only imports the functions used. Chosen over Moment.js (bloated, no tree-shaking) and Day.js (less complete API). |
| **vite-plugin-pwa** | 1 | Generates a service worker and web app manifest, making DevBlog installable as a Progressive Web App. Requires almost no manual configuration. |
| **EmailJS** | 4 | Contact-form emails sent directly from the browser without a dedicated backend email route. Free tier is sufficient for a showcase project. |

### Backend

| Library / Tool | Version | Why this over alternatives |
|---|---|---|
| **Node.js** | LTS | Single language across the full stack (JavaScript everywhere). Non-blocking I/O fits a blog's read-heavy workload well. |
| **Express** | 5 | Minimal, unopinionated HTTP framework. v5 finally makes `async` route handlers throw errors automatically — no need for `try/catch` in every controller. Chosen over Fastify because Express's ecosystem and documentation are more beginner-accessible. |
| **MongoDB Atlas** | — | Document model fits blog posts naturally (posts have variable fields like `tags`, `categories`, nested likes arrays). No rigid schema migrations needed. Atlas provides a free cloud tier perfect for small projects. Chosen over PostgreSQL for this project because the data is document-shaped, not relational. |
| **Mongoose** | 9 | ODM that adds schema validation, virtual fields, pre-save hooks (for password hashing), and readable query syntax on top of the raw MongoDB driver. |
| **bcryptjs** | 3 | Secure, one-way password hashing using the bcrypt algorithm. salted hashes mean two identical passwords produce different hashes. Pure-JS implementation — no native binaries needed. |
| **jsonwebtoken** | 9 | Signs and verifies JWTs for stateless authentication. Chosen over sessions because JWTs work cleanly across separate frontend/backend origins and are easy to pass as a Bearer token. |
| **Cloudinary + Multer** | — | Cloudinary stores and serves images from a CDN with automatic optimisation (resize, quality). Multer handles multipart form uploads and passes the buffer to Cloudinary's upload stream. No images are stored on the server disk. |
| **Nodemailer** | 8 | Sends transactional emails (email verification, password reset) via SMTP. Works with Gmail App Passwords and any other SMTP provider. |
| **sanitize-html** | 2 | Server-side HTML sanitisation of Quill post content. Strips dangerous tags and attributes (e.g. `<script>`, `onerror`) before saving to the database — the primary XSS defence layer. |
| **Helmet** | 8 | Sets a suite of security-related HTTP response headers in one line (`X-Content-Type-Options`, `X-Frame-Options`, CSP, etc.). Every Express app should use it. |
| **express-rate-limit** | 8 | Prevents brute-force attacks on auth endpoints (max 10 attempts / 15 min) and general API abuse (max 100 req / 15 min per IP). |
| **Morgan** | 1 | HTTP request logger for development. Prints each request method, route, status code, and response time to the terminal. Disabled in production. |
| **slugify** | 1 | Generates clean, URL-friendly slugs from post titles (`"Hello World!" → "hello-world"`). Handles special characters and spaces automatically. |

---

## 4. Project Structure

```
DevBlog/
│
├── package.json              # Root: runs both servers with "concurrently"
│
├── backend/                  # Node.js / Express REST API
│   ├── server.js             # Entry point — loads .env, connects to MongoDB, starts listening
│   ├── app.js                # Express app — middleware and route mounting (imported by tests)
│   ├── .env.example          # Template for environment variables (commit this, NOT .env)
│   │
│   ├── config/
│   │   ├── db.js             # Connects to MongoDB Atlas via Mongoose
│   │   └── cloudinary.js     # Configures the Cloudinary SDK with API credentials
│   │
│   ├── models/               # Mongoose schemas — define the shape of database documents
│   │   ├── User.model.js     # Users: auth fields, profile info, followers, bcrypt hook
│   │   ├── Post.model.js     # Posts: title, content, slug, likes, bookmarks, readTime
│   │   └── Comment.model.js  # Comments: content, parentComment (for nesting), soft-delete
│   │
│   ├── controllers/          # Business logic — what happens when a route is hit
│   │   ├── auth.controller.js     # Register, login, getMe, updateProfile, changePassword
│   │   ├── post.controller.js     # Post CRUD, like, bookmark, search, pagination
│   │   ├── comment.controller.js  # Add comment/reply, soft-delete, like
│   │   └── user.controller.js     # Public profile, follow/unfollow
│   │
│   ├── routes/               # Route definitions — maps HTTP verbs + paths to controllers
│   │   ├── auth.routes.js
│   │   ├── post.routes.js
│   │   ├── comment.routes.js             # Nested under /api/posts/:id/comments
│   │   ├── comment-standalone.routes.js  # Standalone /api/comments/:id (delete, like)
│   │   └── user.routes.js
│   │
│   ├── middleware/           # Functions that run before the controller on every request
│   │   ├── auth.middleware.js    # "protect" — verifies JWT and attaches req.user
│   │   ├── error.middleware.js   # Global error handler + 404 not-found handler
│   │   └── upload.middleware.js  # Multer config — memory storage, file type/size limits
│   │
│   ├── utils/
│   │   ├── generateToken.js  # Signs a JWT with the user ID and expiry
│   │   └── sendEmail.js      # Nodemailer helper for verification/reset emails
│   │
│   └── tests/                # Jest + Supertest API tests against an in-memory MongoDB
│       ├── auth.test.js      # Register, login, password reset, JWT guard, injection attempts
│       ├── posts.test.js     # Ownership checks, drafts, sanitising, likes, comments
│       └── admin.test.js     # Admin-only access, role changes, user deletion cleanup
│
└── frontend/                 # React / Vite SPA
    ├── index.html            # Vite's HTML entry point
    ├── vite.config.js        # Vite + React plugin + PWA plugin config
    │
    └── src/
        ├── main.jsx          # React root — renders <App /> into the DOM
        ├── App.jsx           # Router setup, lazy-loaded routes, auth:logout listener
        ├── index.css         # Global design tokens (CSS variables), reset, base styles
        ├── App.css           # Layout-level styles shared across pages
        │
        ├── store/
        │   └── authStore.js  # Zustand store — holds user object, token, auth actions
        │
        ├── api/              # Axios call wrappers — one file per backend resource
        │   ├── axios.js      # Axios instance with base URL + auth token interceptor
        │   ├── auth.js       # login, register, getMe, updateProfile, changePassword
        │   ├── posts.js      # getAllPosts, getPostBySlug, createPost, likePost, ...
        │   ├── comments.js   # getComments, addComment, deleteComment, likeComment
        │   └── users.js      # getUserProfile, followUser
        │
        ├── components/       # Reusable UI pieces used across multiple pages
        │   ├── Navbar.jsx         # Top navigation bar with search, theme toggle, user menu
        │   ├── Footer.jsx         # Site-wide footer
        │   ├── PostCard.jsx       # Card displayed in post lists (title, excerpt, author)
        │   ├── PostCardSkeleton.jsx  # Loading placeholder for PostCard
        │   ├── CommentSection.jsx    # Full thread: top-level comments + nested replies
        │   ├── Pagination.jsx        # Page navigation with prev/next and page numbers
        │   ├── ProtectedRoute.jsx    # Redirects to /login if user is not authenticated
        │   ├── ErrorBoundary.jsx     # Catches React render errors, shows fallback UI
        │   ├── ConfirmModal.jsx      # Reusable "are you sure?" confirmation dialog
        │   └── LoadingSpinner.jsx    # Full-page or inline loading indicator
        │
        ├── pages/            # One component per route — each maps to a URL
        │   ├── HomePage.jsx        # Post feed with search, filters, sort, pagination
        │   ├── PostDetailPage.jsx  # Full post view: content, like, bookmark, comments
        │   ├── CreatePostPage.jsx  # Create + Edit post form (Quill editor, image upload)
        │   ├── ProfilePage.jsx     # Public user profile with posts and follow button
        │   ├── EditProfilePage.jsx # Edit own name, bio, avatar, cover image
        │   ├── MyPostsPage.jsx     # Author's dashboard: all posts including drafts
        │   ├── BookmarksPage.jsx   # Saved bookmarked posts
        │   ├── SettingsPage.jsx    # Change password, delete account
        │   ├── LoginPage.jsx       # Login form
        │   ├── RegisterPage.jsx    # Registration form with validation
        │   ├── VerifyEmailPage.jsx # Token-based email verification landing page
        │   ├── AboutPage.jsx       # Static about page
        │   ├── ContactPage.jsx     # Contact form (EmailJS)
        │   └── NotFoundPage.jsx    # 404 catch-all
        │
        ├── hooks/
        │   └── useFetch.js   # Generic data-fetching hook with loading/error state
        │
        └── utils/
            └── helpers.js    # Pure utility functions: formatDate, timeAgo, getInitials, ...
```

---

## 5. Getting Started (Local Setup)

### Prerequisites

- **Node.js** v18+ — [nodejs.org](https://nodejs.org)
- A **MongoDB Atlas** free cluster — [cloud.mongodb.com](https://cloud.mongodb.com)
- A **Cloudinary** free account — [cloudinary.com](https://cloudinary.com)
- A **Gmail App Password** for email sending — [Google App Passwords](https://support.google.com/accounts/answer/185833)

---

### Option A — Run both servers together (recommended)

```bash
# 1. Clone the repo
git clone https://github.com/devKiNGCRiC/DevBlog.git
cd DevBlog

# 2. Install all dependencies at once (root + backend + frontend)
npm run install:all

# 3. Create backend/.env  (copy from backend/.env.example and fill in your values)
# 4. Create frontend/.env (copy the line below)
#    VITE_API_URL=http://localhost:5000/api

# 5. Start both servers simultaneously
npm run dev
```

The backend will be available at `http://localhost:5000`  
The frontend will be available at `http://localhost:5173`

---

### Option B — Run servers separately

**Terminal 1 — Backend:**

```bash
cd backend
npm install
# Create and fill .env (see Section 6)
npm run dev
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm install
# Create frontend/.env with: VITE_API_URL=http://localhost:5000/api
npm run dev
```

---

### Available root scripts

| Script | What it does |
|---|---|
| `npm run dev` | Starts backend + frontend concurrently |
| `npm run dev:backend` | Starts only the backend (nodemon) |
| `npm run dev:frontend` | Starts only the frontend (Vite) |
| `npm run build` | Builds the frontend for production |
| `npm start` | Starts the backend in production mode |
| `npm run install:all` | Installs dependencies in all three package.json files |

### Running the tests

```bash
cd backend
npm test
```

The backend tests run against a throwaway in-memory MongoDB (`mongodb-memory-server`), so no `.env`, Atlas cluster, Cloudinary account or email account is needed. Emails are mocked. The first run downloads a MongoDB binary (~100 MB) and is slower; later runs take about 15 seconds.

---

## 6. Environment Variables Reference

### `backend/.env`

> Copy `backend/.env.example` and fill in real values. **Never commit this file.**

```env
# --- Server ---
PORT=5000
NODE_ENV=development

# --- MongoDB ---
# Get from: MongoDB Atlas > Connect > Drivers
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/<dbname>

# --- JWT ---
# A long, random secret string. Used to sign and verify auth tokens.
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRE=7d

# --- Cloudinary ---
# Get from: cloudinary.com > Dashboard
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# --- CORS ---
# The URL of your frontend (used to allow cross-origin requests)
CLIENT_URL=http://localhost:5173

# --- Email (Nodemailer) ---
# For Gmail: generate an App Password (not your regular Gmail password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_app_password
EMAIL_FROM="DevBlog <your_email@gmail.com>"
```

### `frontend/.env`

```env
# Points the frontend to the backend API
VITE_API_URL=http://localhost:5000/api

# EmailJS — used only for the Contact page form
# Get from: emailjs.com > Account > API Keys
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

> **Why the `VITE_` prefix?**  
> Vite only exposes environment variables that start with `VITE_` to the browser bundle. Variables without this prefix are kept server-side only (in Vite's Node.js build process). This prevents accidentally leaking backend secrets to the client.

---

## 7. API Reference

All API routes are prefixed with `/api`. Protected routes require the header:  
`Authorization: Bearer <your_jwt_token>`

### Auth — `/api/auth`

| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Create a new account. Sends a verification email. |
| `POST` | `/login` | Public | Authenticate and receive a JWT token. |
| `GET` | `/me` | Protected | Get the currently logged-in user's full profile. |
| `GET` | `/verify-email` | Public | Verify email address using the token from the email link. |
| `POST` | `/resend-verification` | Public | Re-send the verification email. |
| `POST` | `/forgot-password` | Public | Send a password-reset email. |
| `PUT` | `/reset-password/:token` | Public | Reset password using the token from the reset email. |
| `PUT` | `/profile` | Protected | Update name, bio, location, website, avatar, or cover image. |
| `PUT` | `/change-password` | Protected | Change password (requires current password). |
| `DELETE` | `/account` | Protected | Permanently delete own account. |

### Posts — `/api/posts`

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/` | Public | Get all published posts. Supports `?page`, `?limit`, `?search`, `?category`, `?tag`, `?author`, `?sortBy`, `?feed=following` (logged-in only: posts from authors you follow). |
| `GET` | `/categories` | Public | Get the list of all distinct post categories. |
| `GET` | `/slug/:slug` | Public | Get a single published post by its URL slug. |
| `GET` | `/:id/related` | Public | Get up to 3 published posts that share tags or categories with this one. |
| `GET` | `/id/:id` | Protected | Get a post by its MongoDB ID (allows draft access by the author). |
| `GET` | `/my-posts` | Protected | Get all posts (incl. drafts) for the logged-in author. |
| `GET` | `/bookmarks` | Protected | Get all posts bookmarked by the logged-in user. |
| `POST` | `/` | Protected | Create a new post. Accepts `multipart/form-data` (cover image). Optional `scheduledAt` (future ISO date) publishes it automatically at that time; `""` clears the schedule (same on `PUT`). |
| `PUT` | `/:id` | Protected (Author/Admin) | Update a post. |
| `DELETE` | `/:id` | Protected (Author/Admin) | Delete a post and all its comments. Removes image from Cloudinary. |
| `POST` | `/:id/like` | Protected | Toggle like on a post. |
| `POST` | `/:id/bookmark` | Protected | Toggle bookmark on a post. |

### Comments — `/api/posts/:postId/comments` and `/api/comments`

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/posts/:postId/comments` | Public | Get all comments (with nested replies) for a post. |
| `POST` | `/api/posts/:postId/comments` | Protected | Add a top-level comment or a reply (`parentComment` in body). |
| `DELETE` | `/api/comments/:id` | Protected (Author/Admin) | Soft-delete a comment (replaces content with a placeholder). |
| `POST` | `/api/comments/:id/like` | Protected | Toggle like on a comment. |

### Users — `/api/users`

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/:username` | Public | Get public profile + paginated posts for a user. |
| `POST` | `/:id/follow` | Protected | Toggle follow / unfollow a user. |

### Notifications — `/api/notifications`

Created automatically when someone likes your post, comments on it, replies to your comment, or follows you. Unliking/unfollowing removes the notification.

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/` | Protected | Get my notifications (newest first). Supports `?page`, `?limit` (max 50). Includes `unreadCount`. |
| `GET` | `/unread-count` | Protected | Number of unread notifications (polled by the navbar bell). |
| `PUT` | `/read-all` | Protected | Mark all my notifications as read. |
| `PUT` | `/:id/read` | Protected | Mark one of my notifications as read. |

### Health Check

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Returns `200 OK` if the server is running. Used by deployment platforms. |

---

## 8. Security Measures

The following security practices are applied throughout the project:

| Layer | Measure | How |
|---|---|---|
| HTTP Headers | Security response headers | `helmet` sets CSP, X-Frame-Options, X-Content-Type-Options, etc. on every response |
| Rate Limiting | Brute-force protection | `express-rate-limit` — 10 auth attempts / 15 min, 100 API requests / 15 min |
| Passwords | One-way hashing | `bcryptjs` with salt rounds via a Mongoose pre-save hook |
| Authentication | Stateless JWT sessions | Tokens are signed with `JWT_SECRET`, verified in `auth.middleware.js` on every protected route |
| Auth Inputs | NoSQL injection prevention | Auth handlers reject any field that isn't a plain string, so a body like `{"token": {"$ne": ""}}` can't become a MongoDB operator (covered by tests) |
| Post Content | Server-side XSS prevention | `sanitize-html` strips disallowed tags from Quill HTML before it is saved to MongoDB |
| Post Content | Client-side XSS prevention | `DOMPurify` sanitises post HTML again before rendering it in the browser |
| File Uploads | Type and size limits | Multer only accepts `image/jpeg`, `image/png`, and `image/webp`, max 5 MB per upload |
| Drafts | Authorisation check | `GET /api/posts/id/:id` requires authentication; drafts are only returned to their author or an admin |
| CORS | Controlled origin | Only requests from `CLIENT_URL` (from `.env`) are accepted |
| Secrets | Never committed | All API keys and credentials live in `.env` files that are excluded by `.gitignore` |

---

## 9. Code Comment Philosophy

Every file in this project is written with **educational comments** — the goal is that a developer reading any file for the first time can understand *what* the code does, *why* it is structured that way, and *how* it connects to the rest of the system.

Comments follow this pattern across all files:

```
// ============================================================
// File header — what this file is, its role in the system,
// and how to remember what it does.
// ============================================================
```

```javascript
// Step-by-step inline comments explain the "why", not just the "what"
const user = await User.findOne({ email }).select("+password");
// We use ".select('+password')" because password has "select: false" in the schema.
// We need the password here to compare it — special exception!
```

This level of commenting is intentional for a learning project. In a production codebase you would reduce comments to only the non-obvious parts.

---

## 10. Contributing

This is a personal learning project, but feedback and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request.

Please make sure your code follows the existing style and that no `.env` files or secrets are included in the PR.

---

## 11. License

This project is open-source under the [MIT License](LICENSE).

---

*Built from scratch as a full-stack learning project — every line written, debugged, and understood.*
