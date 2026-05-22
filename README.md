# BuildBill AI

BuildBill AI is a full-stack SaaS-style GST billing platform built in Next.js App Router for Indian contractors, interior designers, painters, freelancers, and small businesses.

## Included product areas

- Landing page, login, signup, pricing, dashboard, invoice history, create invoice, customers, and settings
- Cookie-based JWT-style authentication with password hashing
- Local JSON-backed data layer for users, customers, invoices, and settings
- Automatic GST calculations with CGST, SGST, and IGST support
- Printable invoice detail page with downloadable PDF generation
- Customer management and payment status tracking

## Demo login

- Email: `demo@buildbill.ai`
- Password: `buildbill123`

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local` for local secrets:

```bash
SESSION_SECRET=replace-with-a-long-random-secret
DATABASE_URL=
```

When `DATABASE_URL` is empty, the app uses the local JSON demo database. For Vercel or any real deployment, set `DATABASE_URL` to a hosted Postgres connection string from Neon, Supabase, Vercel Storage, or another Postgres provider.

## Supabase setup

1. Create a Supabase project.
2. Open **Project Settings** > **Database**.
3. Copy the pooled Postgres connection string.
4. Add it to `.env.local` for local testing and to Vercel **Environment Variables** for deployment:

```bash
DATABASE_URL=postgresql://postgres.your-project:your-password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require
SESSION_SECRET=replace-with-a-long-random-secret
```

The first time the app connects, it creates the `users`, `customers`, and `invoices` tables automatically.

## Key routes

- `/` landing page
- `/login` login
- `/signup` signup
- `/dashboard` dashboard
- `/invoices` invoice history
- `/invoices/new` create invoice
- `/customers` customer management
- `/settings` business settings
- `/pricing` plan comparison

## API surface

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `GET /api/me`
- `GET /api/dashboard`
- `GET /api/customers`
- `POST /api/customers`
- `PATCH /api/customers/:customerId`
- `DELETE /api/customers/:customerId`
- `GET /api/invoices`
- `POST /api/invoices`
- `GET /api/invoices/:invoiceId`
- `PATCH /api/invoices/:invoiceId`
- `DELETE /api/invoices/:invoiceId`
- `GET /api/invoices/:invoiceId/pdf`
- `PATCH /api/settings`

## Data model

Local demo data is persisted in `data/buildbill-db.json` with these core collections:

- `users`
- `customers`
- `invoices`

In production, set `DATABASE_URL` to use Postgres. The app automatically creates `users`, `customers`, and `invoices` tables and seeds the demo account when the database is empty.
