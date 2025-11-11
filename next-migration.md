# Next.js Migration Plan

## Executive Summary

This document outlines the strategic plan for migrating the conflict-management-frontend application from a Vite + React SPA to Next.js with App Router. This migration will enable Server-Side Rendering (SSR), Incremental Static Regeneration (ISR), and improved SEO while maintaining the current functionality and user experience.

## Current Architecture

- **Build Tool**: Vite 5
- **Framework**: React 18 with TypeScript
- **Routing**: React Router (client-side only)
- **State Management**: React Query + Context API
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Cookie-based (recently migrated from localStorage)

## Migration Benefits

### 1. Performance at Scale
- **SSR/ISR**: Faster Time to First Byte (TTFB) for global users
- **Automatic Code Splitting**: Per-route optimization out of the box
- **Image Optimization**: Automatic WebP/AVIF conversion with next/image
- **Edge Runtime**: Deploy to edge locations for reduced latency

### 2. SEO Improvements
- **Server-Side Rendering**: Better crawlability for marketing pages
- **Metadata API**: Improved Open Graph and Twitter card support
- **Static Generation**: Pre-render public pages at build time

### 3. Developer Experience
- **File-Based Routing**: Simplified routing with app directory
- **Server Components**: Reduced client bundle size
- **Built-in API Routes**: Consolidate BFF patterns
- **TypeScript Native**: First-class TypeScript support

### 4. Scalability
- **ISR**: Regenerate pages on-demand without full rebuilds
- **Middleware**: Edge-based auth and routing logic
- **Streaming**: Progressive rendering for faster perceived performance
- **Parallel Routes**: Better UX for complex layouts

## Migration Strategy

### Phase 1: Foundation (Week 1-2)

#### Setup Next.js Project
```bash
npx create-next-app@latest conflict-management-frontend-next --typescript --tailwind --app
```

#### Migration Tasks
1. **Install Dependencies**
   ```bash
   npm install @tanstack/react-query axios zod react-hook-form
   npm install @radix-ui/react-* # shadcn/ui dependencies
   ```

2. **Configure Path Aliases**
   ```typescript
   // tsconfig.json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

3. **Setup Tailwind Configuration**
   - Copy `tailwind.config.ts` from current project
   - Migrate custom theme settings

4. **Migrate shadcn/ui Components**
   - Copy `/src/components/ui` directory
   - Ensure all components work with Next.js

### Phase 2: Public Pages (Week 3-4)

#### Migrate Static/Marketing Pages to SSR/SSG

**Priority Pages:**
- Landing page (`/`) → SSG with ISR
- Case submission form (`/submit-case`) → SSG
- Login pages (`/admin/login`, `/panelist/login`) → SSR

**Implementation:**
```typescript
// app/page.tsx
export const revalidate = 3600; // ISR - revalidate every hour

export default async function HomePage() {
  // Fetch data at build time/request time
  return <ConflictMediationLanding />;
}
```

**Benefits:**
- Instant page loads from CDN
- Better SEO for marketing content
- Reduced client-side JavaScript

### Phase 3: Authenticated Dashboards (Week 5-7)

#### Strategy: Hybrid Rendering

**Admin Dashboard**
- Server Components for layout and nav
- Client Components for interactive widgets
- Route Handlers for API aggregation (BFF pattern)

**Implementation:**
```typescript
// app/admin/dashboard/page.tsx
import { AdminStats } from './AdminStats'; // Server Component
import { AdminActivity } from './AdminActivity'; // Client Component

export default async function AdminDashboard() {
  // Fetch initial data server-side
  const stats = await getAdminStats();

  return (
    <div>
      <AdminStats data={stats} />
      <AdminActivity /> {/* Uses React Query for real-time updates */}
    </div>
  );
}
```

**Panelist & Client Dashboards**
- Similar approach to Admin Dashboard
- Maintain React Query for real-time updates
- Use Server Components for initial data loading

### Phase 4: Real-Time Features (Week 8)

#### WebSocket/SSE Integration

**Option A: Keep Client-Side WebSockets**
- Maintain current polling with React Query
- Gradually migrate to WebSocket connections

**Option B: Server-Sent Events via Route Handlers**
```typescript
// app/api/messages/stream/route.ts
export async function GET(request: Request) {
  const stream = new ReadableStream({
    start(controller) {
      // Push updates to client
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
```

### Phase 5: Authentication & Middleware (Week 9-10)

#### Migrate Cookie-Based Auth to Next.js Middleware

**Middleware Setup:**
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/panelist/:path*', '/client/:path*'],
};
```

**Benefits:**
- Edge-based authentication (faster)
- No client-side redirect flash
- Better security with middleware validation

### Phase 6: Image & Asset Optimization (Week 11)

#### Migrate to next/image

**Before (Vite):**
```tsx
<img src={avatarUrl} alt="Avatar" className="w-10 h-10" />
```

**After (Next.js):**
```tsx
import Image from 'next/image';

<Image
  src={avatarUrl}
  alt="Avatar"
  width={40}
  height={40}
  loading="lazy"
  quality={85}
/>
```

**Benefits:**
- Automatic WebP/AVIF conversion
- Responsive images with srcset
- Lazy loading by default
- Reduced LCP (Largest Contentful Paint)

### Phase 7: API Layer & BFF (Week 12)

#### Consolidate API Calls with Route Handlers

**Current Approach:**
- Multiple client → backend calls per page
- Higher latency for complex views

**Next.js Route Handlers (BFF Pattern):**
```typescript
// app/api/admin/dashboard/route.ts
export async function GET(request: Request) {
  // Aggregate multiple backend calls
  const [stats, cases, meetings] = await Promise.all([
    fetchAdminStats(),
    fetchAdminCases(),
    fetchAdminMeetings(),
  ]);

  return Response.json({
    stats,
    cases,
    meetings,
  });
}
```

**Benefits:**
- Single client request per view
- Better caching at edge
- Reduced network chattiness

### Phase 8: Testing & Deployment (Week 13-14)

#### Testing Strategy
1. **Unit Tests**: Migrate Jest tests to Vitest or Next.js built-in test runner
2. **E2E Tests**: Use Playwright for critical user flows
3. **Performance Testing**: Lighthouse CI for SSR pages
4. **Load Testing**: Ensure backend can handle SSR traffic

#### Deployment Strategy

**Option A: Vercel (Recommended)**
- Native Next.js support
- Automatic edge deployment
- ISR and streaming out of the box

**Option B: Self-Hosted (AWS/GCP/Azure)**
- Use Node.js standalone output
- Configure CDN (CloudFront/CloudFlare)
- Setup caching headers

**Deployment Checklist:**
```bash
# Build for production
npm run build

# Analyze bundle
npm run analyze

# Test production build locally
npm run start

# Deploy
vercel deploy --prod
```

## CDN Strategy for Global Scale

### Caching Layers

**1. Static Assets**
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

**2. ISR Pages**
- Set `revalidate` per page
- Use `revalidateTag` for on-demand invalidation

**3. API Responses**
- Cache at edge with proper headers
- Use `unstable_cache` for expensive operations

### Edge Deployment

**Benefits:**
- Sub-100ms response times globally
- Reduced backend load
- Better DDoS protection

**Implementation:**
```typescript
export const runtime = 'edge';

export default async function Page() {
  // Runs on edge, closer to users
}
```

## Page Grouping Strategy

### Directory Structure

```
app/
├── (public)/              # Public pages (SSG/ISR)
│   ├── page.tsx          # Landing page
│   ├── submit-case/
│   └── layout.tsx        # Public layout
├── (auth)/               # Auth pages (SSR)
│   ├── admin/login/
│   ├── panelist/login/
│   └── layout.tsx        # Auth layout
├── admin/                # Admin dashboard (hybrid)
│   ├── dashboard/
│   ├── cases/
│   ├── panelists/
│   └── layout.tsx        # Admin layout with nav
├── panelist/             # Panelist portal (hybrid)
│   ├── dashboard/
│   ├── cases/
│   ├── meetings/
│   └── layout.tsx        # Panelist layout
├── client/               # Client portal (hybrid)
│   ├── dashboard/
│   ├── cases/
│   └── layout.tsx        # Client layout
└── api/                  # API routes (BFF)
    ├── admin/
    ├── panelist/
    └── client/
```

### Route Groups Benefits
- Shared layouts per section
- Clean URL structure
- Parallel data fetching
- Better code organization

## Performance Targets

### Lighthouse Scores
- **Performance**: 90+
- **Accessibility**: 100
- **Best Practices**: 100
- **SEO**: 100

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Bundle Sizes
- **Initial JS**: < 200KB gzipped
- **Per-route JS**: < 50KB gzipped
- **Total CSS**: < 50KB gzipped

## Migration Risks & Mitigation

### Risk 1: Breaking Changes
**Mitigation:**
- Gradual migration (run both apps in parallel)
- Feature flags for new routes
- Comprehensive testing before cutover

### Risk 2: SEO Impact
**Mitigation:**
- 301 redirects for all routes
- Maintain URL structure
- Submit new sitemap to search engines

### Risk 3: Server Load
**Mitigation:**
- Use ISR instead of pure SSR where possible
- Implement caching at multiple layers
- Monitor backend performance closely

### Risk 4: Dev Team Learning Curve
**Mitigation:**
- Training sessions on Next.js App Router
- Pair programming for first few pages
- Document patterns and best practices

## Success Criteria

1. **Performance**
   - 50% reduction in TTFB for public pages
   - 30% reduction in initial JS bundle size
   - All Core Web Vitals in "Good" range

2. **SEO**
   - 100% of pages crawlable by search engines
   - Improved rankings for target keywords
   - Rich snippets for key pages

3. **User Experience**
   - No regressions in functionality
   - Faster perceived performance
   - Improved mobile experience

4. **Operations**
   - Successful deployment to edge
   - 99.9% uptime maintained
   - Backend load reduced by 40%

## Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|------------|
| 1. Foundation | 2 weeks | Next.js project setup |
| 2. Public Pages | 2 weeks | SSG/ISR for marketing |
| 3. Dashboards | 3 weeks | Hybrid rendering |
| 4. Real-Time | 1 week | WebSocket/SSE |
| 5. Auth | 2 weeks | Middleware auth |
| 6. Images | 1 week | next/image migration |
| 7. API/BFF | 1 week | Route handlers |
| 8. Testing | 2 weeks | Full QA & deployment |
| **Total** | **14 weeks** | Production-ready |

## Post-Migration Optimizations

1. **Implement React Server Components**
   - Reduce client bundle further
   - Fetch data closer to components

2. **Add Partial Prerendering (PPR)**
   - Mix static and dynamic content
   - Best of SSG and SSR

3. **Optimize Data Fetching**
   - Use `cache()` and `unstable_cache()`
   - Implement request memoization

4. **Monitor & Iterate**
   - Real User Monitoring (RUM)
   - A/B test performance improvements
   - Continuous optimization based on metrics

## Conclusion

Migrating to Next.js App Router will position the conflict-management-frontend for scale, improved performance, and better SEO. The hybrid approach (SSR for public pages, client-side for dashboards) balances the benefits of modern web architecture with the needs of a real-time, interactive application.

**Recommended Next Steps:**
1. Review and approve migration plan
2. Allocate 3-month development window
3. Set up Next.js project and run Phase 1
4. Begin gradual migration with public pages first
5. Monitor metrics and adjust strategy as needed
