# Game Gauge Web - Frontend

Modern, responsive web application for Game Gauge built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/ui (Radix UI primitives)
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod
- **HTTP Client:** Axios
- **Icons:** Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn or pnpm
- Game Gauge API running (backend)

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/zachauker/game-gauge-web.git
cd game-gauge-web
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Game Gauge
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## 📁 Project Structure

```
game-gauge-web/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (auth)/              # Auth pages (login, register)
│   │   ├── (main)/              # Main app pages (home, games, etc.)
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css          # Global styles
│   ├── components/              # React components
│   │   ├── ui/                  # Shadcn/ui components
│   │   ├── layout/              # Layout components (nav, footer)
│   │   ├── games/               # Game-related components
│   │   ├── auth/                # Auth components
│   │   └── ...
│   ├── lib/                     # Utilities and configurations
│   │   ├── api.ts              # API client and types
│   │   └── utils.ts            # Helper functions
│   ├── store/                   # Zustand stores
│   │   └── auth.ts             # Auth state management
│   └── hooks/                   # Custom React hooks
├── public/                      # Static assets
├── .env.local                   # Environment variables
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind configuration
└── tsconfig.json               # TypeScript configuration
```

## 🎨 Features

### MVP Features
- ✅ User authentication (register, login, logout)
- ✅ Home page with featured games
- ✅ Search games (IGDB integration)
- ✅ Game detail pages
- ✅ Rate games (1-10 scale)
- ✅ Write reviews
- ✅ Create and manage lists
- ✅ User profile page
- ✅ Dark mode support
- ✅ Fully responsive (mobile-friendly)

### Planned Features
- [ ] Activity feed
- [ ] User following
- [ ] Recommendations
- [ ] Advanced search filters
- [ ] Social features (like, comment)
- [ ] Notifications

## 🧩 Component Library (Shadcn/ui)

This project uses Shadcn/ui components. To add new components:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
# etc...
```

Available components:
- Button, Card, Dialog, Input, Label
- Select, Textarea, Avatar, Badge
- Dropdown Menu, Tabs, Toast
- And many more...

See: https://ui.shadcn.com/docs/components

## 📱 Mobile-First Design

All components are designed mobile-first with responsive breakpoints:

- **xs:** < 640px (mobile)
- **sm:** 640px+ (large mobile)
- **md:** 768px+ (tablet)
- **lg:** 1024px+ (desktop)
- **xl:** 1280px+ (large desktop)
- **2xl:** 1536px+ (extra large)

## 🔐 Authentication Flow

1. User registers/logs in
2. Token stored in localStorage
3. Token added to all API requests via interceptor
4. Protected routes check authentication
5. Automatic redirect to login if unauthorized

## 🌐 API Integration

The app connects to your Game Gauge API. All API calls are in `src/lib/api.ts`:

```typescript
import { api } from '@/lib/api';

// Login
const { data } = await api.post('/auth/login', { email, password });

// Get games
const { data } = await api.get('/games');

// Rate game
await api.post(`/games/${gameId}/rating`, { score: 9 });
```

## 🎯 Available Scripts

```bash
# Development
npm run dev          # Start dev server (port 3001)

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

## 🌙 Dark Mode

Dark mode is supported out of the box using `next-themes`. Users can:
- Toggle between light/dark/system theme
- Theme preference is persisted
- No flash of incorrect theme on load

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: Your API URL
4. Deploy!

```bash
# Or using Vercel CLI
npm install -g vercel
vercel
```

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify
- Self-hosted (Docker, PM2, etc.)

## 📦 Building for Production

```bash
npm run build
```

This creates an optimized production build in `.next/` folder.

To test the production build locally:

```bash
npm run build
npm run start
```

## 🔧 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | Application name | No | `Game Gauge` |
| `NEXT_PUBLIC_APP_URL` | Frontend URL | No | `http://localhost:3001` |

**Note:** All variables starting with `NEXT_PUBLIC_` are exposed to the browser.

## 🎨 Customizing Theme

Edit `tailwind.config.js` to customize colors, spacing, fonts, etc.

Edit `src/app/globals.css` to modify CSS variables for light/dark themes.

## 🐛 Troubleshooting

### "Cannot connect to API"
- Check that backend is running on port 3000
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS settings in backend

### "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 3001 already in use
```bash
PORT=3002 npm run dev
```

### TypeScript errors
```bash
npm run type-check
```

## 📚 Learning Resources

- **Next.js:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Shadcn/ui:** https://ui.shadcn.com
- **TypeScript:** https://www.typescriptlang.org/docs
- **React Hook Form:** https://react-hook-form.com

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 👤 Author

Zach Auker

## 🆘 Support

- Create an issue on GitHub
- Check existing issues for solutions
- Refer to documentation

## 🎉 Next Steps

After setup:

1. ✅ Install dependencies: `npm install`
2. ✅ Configure environment: Edit `.env.local`
3. ✅ Start backend API (port 3000)
4. ✅ Start frontend: `npm run dev`
5. ✅ Open http://localhost:3001
6. 🚀 Start building!

---

Built with ❤️ using Next.js 14 and TypeScript
