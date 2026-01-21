# Quick Start Guide - Game Gauge Web

## ⚡ 3-Step Setup

### 1. Install Dependencies

```bash
npm install
```

This installs:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Shadcn/ui components
- Zustand (state management)
- Axios (HTTP client)
- React Hook Form + Zod (forms & validation)

**Time:** ~2-3 minutes

### 2. Configure Environment

```bash
cp .env.example .env.local
```

The `.env.local` file should contain:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Game Gauge
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

**Important:** Make sure your backend API is running on port 3000!

### 3. Start Development Server

```bash
npm run dev
```

Open http://localhost:3001

**That's it!** 🎉

## 🏗️ Project Status

### ✅ What's Set Up

**Infrastructure:**
- ✅ Next.js 14 with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS with custom theme
- ✅ Dark mode support
- ✅ API client with interceptors
- ✅ Auth state management (Zustand)
- ✅ Mobile-responsive setup

**Dependencies:**
- ✅ All npm packages installed
- ✅ Shadcn/ui components ready
- ✅ Form handling (React Hook Form + Zod)
- ✅ Type-safe API client
- ✅ IGDB image optimization

### 🚧 What's Next (Your Tasks)

**Pages to Build:**
1. Home page (`/`)
2. Login page (`/login`)
3. Register page (`/register`)
4. Search page (`/search`)
5. Game detail page (`/games/[slug]`)
6. User profile (`/profile`)
7. Lists page (`/lists`)

**Components to Build:**
1. Navigation bar
2. Footer
3. Game card
4. Search bar
5. Rating component
6. Review form
7. List manager

## 📋 Development Workflow

### Create a New Page

```bash
# Example: Create home page
touch src/app/page.tsx
```

```typescript
// src/app/page.tsx
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold">Welcome to Game Gauge</h1>
    </div>
  );
}
```

### Add a Shadcn Component

```bash
# Add a button component
npx shadcn-ui@latest add button

# Add a card component
npx shadcn-ui@latest add card

# Add an input component
npx shadcn-ui@latest add input
```

Then import and use:

```typescript
import { Button } from "@/components/ui/button";

<Button>Click me</Button>
```

### Make an API Call

```typescript
import { api } from '@/lib/api';

// Get games
const { data } = await api.get('/games');

// Login
const response = await api.post('/auth/login', {
  email: 'test@example.com',
  password: 'password'
});
```

### Use Auth State

```typescript
import { useAuthStore } from '@/store/auth';

function Component() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {user.username}!</div>;
}
```

## 🎨 Styling Guide

### Using Tailwind

```tsx
// Responsive design (mobile-first)
<div className="px-4 md:px-8 lg:px-16">
  <h1 className="text-2xl md:text-4xl lg:text-6xl">
    Responsive heading
  </h1>
</div>

// Dark mode
<div className="bg-white dark:bg-gray-900">
  <p className="text-black dark:text-white">
    Supports dark mode!
  </p>
</div>
```

### Using CSS Variables

```tsx
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Themed button
  </button>
</div>
```

## 🔑 Authentication Example

```typescript
// Login
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

async function handleLogin(email: string, password: string) {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    
    // Save to store
    useAuthStore.getState().setAuth(data.user, data.token);
    
    // Redirect
    router.push('/');
  } catch (error) {
    console.error('Login failed:', error);
  }
}
```

## 📱 Responsive Breakpoints

```typescript
// Mobile first approach
<div className="
  w-full          // Mobile: full width
  md:w-1/2        // Tablet: half width
  lg:w-1/3        // Desktop: third width
">
  Content
</div>

// Hide on mobile, show on desktop
<div className="hidden md:block">
  Desktop only content
</div>

// Show on mobile, hide on desktop
<div className="block md:hidden">
  Mobile only content
</div>
```

## 🐛 Common Issues

### Issue: API calls fail with CORS error

**Solution:**
Check backend CORS configuration. Add frontend URL to allowed origins:

```typescript
// Backend: src/app.ts
app.use(cors({
  origin: 'http://localhost:3001'
}));
```

### Issue: "Module not found" errors

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 3001 already in use

**Solution:**
```bash
PORT=3002 npm run dev
```

### Issue: Environment variables not working

**Solution:**
- Make sure `.env.local` exists
- Restart dev server after changing env vars
- Remember: Only `NEXT_PUBLIC_*` vars are available in browser

## 📚 Next Steps

### 1. Build the Home Page

Create `src/app/page.tsx` with:
- Hero section
- Featured games
- Search bar
- Popular lists

### 2. Build Auth Pages

Create:
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`

### 3. Build Navigation

Create `src/components/layout/navbar.tsx` with:
- Logo
- Search
- User menu
- Mobile menu

### 4. Build Game Components

Create:
- `src/components/games/game-card.tsx`
- `src/components/games/game-grid.tsx`
- `src/components/games/rating-display.tsx`

### 5. Connect to API

Test all endpoints:
- Auth (login, register)
- Games (search, detail)
- Ratings (create, view)
- Reviews (create, edit, delete)
- Lists (create, manage)

## 🎯 Development Tips

1. **Use TypeScript** - The types from `src/lib/api.ts` match your backend
2. **Mobile-first** - Always design for mobile, then add desktop styles
3. **Use Shadcn components** - Don't reinvent the wheel
4. **Keep it simple** - Start with basic features, polish later
5. **Test as you go** - Test each feature with your API

## 🚀 Ready to Build!

You have everything you need:
- ✅ Modern tech stack
- ✅ Type-safe API client
- ✅ Beautiful UI components
- ✅ Dark mode support
- ✅ Responsive design setup
- ✅ Auth state management

**Start building and have fun!** 🎮

For questions or issues, check:
- README.md (full documentation)
- Next.js docs (https://nextjs.org/docs)
- Shadcn/ui docs (https://ui.shadcn.com)
