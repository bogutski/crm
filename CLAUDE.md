# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server (port 3000)
npm run build            # Production build
npm run lint             # ESLint
npm run test:e2e         # Playwright tests
npm run test:e2e:ui      # Playwright with UI
npm run test:e2e:headed  # Playwright headed mode
npm run seed             # Populate database with test data
npm run seed:extreme     # Large-scale test data generation
npm run db:reset         # Clear all collections
npm run openapi:generate # Generate OpenAPI documentation
```

## Architecture Overview

This is a **Next.js 16 + React 19** CRM application using **MongoDB/Mongoose**, **NextAuth 5**, and **AI SDK** with support for OpenAI, Anthropic, and Google providers.

### Module Pattern

Feature modules live in `modules/` with a consistent structure:

```
modules/{feature}/
├── model.ts          # Mongoose schema & TypeScript interface
├── controller.ts     # Business logic & CRUD operations
├── validation.ts     # Zod schemas for request validation
├── types.ts          # TypeScript types & DTOs
├── routes.meta.ts    # OpenAPI route definitions
└── index.ts          # Public exports
```

**Modules**: user, contact, opportunity, task, ai-dialogue, api-token, channel, interaction, dictionary, pipeline, project, system-settings

### API Routes

API routes at `app/api/{resource}/route.ts` follow this pattern:

```typescript
export async function POST(request: NextRequest) {
  const authResult = await apiAuth(request);  // Auth check (session or API token)
  const body = await request.json();
  const data = createSchema.parse(body);      // Zod validation
  const result = await controllerFn(data);    // Business logic from module
  return NextResponse.json(result, { status: 201 });
}
```

### Authentication

- **NextAuth 5** with Google OAuth and Credentials providers
- **Dual auth**: Session-based (cookies) + API tokens (Bearer with `crm_sk_` prefix)
- Auth helper: `apiAuth(request)` in `lib/api-auth.ts` handles both methods
- Session helper: `auth()` from `modules/user/auth.ts` for page components

### AI Integration

- Provider factory in `lib/ai/service.ts` - `getAIModel()` returns configured model
- Supports OpenAI, Anthropic, Google based on system settings
- Streaming via `streamText` from ai SDK
- Chat endpoint at `app/api/chat/route.ts`

### Key Directories

- `app/` - Next.js App Router pages and API routes
- `modules/` - Feature modules with models, controllers, validation
- `lib/` - Shared utilities (mongodb connection, auth, AI service)
- `components/ui/` - Reusable UI components (Button, Input, Select, DatePicker, etc.)
- `scripts/` - Database seeding and utilities

### Database

- MongoDB with cached connection in `lib/mongodb.ts`
- All resources scoped by `ownerId` for multi-tenancy
- Pagination: `limit`, `skip`, `total` response pattern (default limit: 50)

### Page Pattern

Server components with auth guard:

```typescript
export default async function Page({ searchParams }) {
  const session = await auth();
  if (!session) redirect('/login');
  // Fetch data, render client component
}
```

## Environment Variables

Required in `.env.local`:
- `MONGODB_URI` - MongoDB connection string
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth
- `NEXTAUTH_SECRET` - Session signing
- `API_URL` - Base URL for API calls (used in scripts)

Optional AI provider keys:
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`
