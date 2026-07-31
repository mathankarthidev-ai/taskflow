# TaskFlow

An internal, role-aware task workspace built with Next.js App Router, TypeScript, Prisma, and Supabase Postgres.

## Run locally

```bash
copy .env.example .env
# Paste your Supabase PostgreSQL connection string into .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Before these commands, replace the placeholder `DATABASE_URL` in `.env` with the direct connection URI shown in Supabase Dashboard → **Connect**. Stop any currently running `npm run dev` terminal before `db:push`, because Windows locks Prisma's query engine while the development server is active.

Use any seeded `@taskflow.company` address on the sign-in page. Example roles: `oliver` (member), `maya` (Creative lead), and `alex` (super admin).

## Architecture and database

Supabase Postgres is the persistence layer. It provides a managed relational database, a reviewer-friendly dashboard, secure connection management, and a clean path to Supabase Auth or Realtime later. Prisma owns the application data model and migrations. The core relationships are `User → Task` (creator and optional assignee), `Task → Comment`, plus audit `ActivityLog` and per-user `Notification` records; enums constrain roles, teams, priorities, and workflow state.

The app is server-rendered by default. Server Actions handle sign-in, task creation, movement, routing, comments, archiving, and admin user controls. Permission decisions are enforced close to writes: members act on their own work, leads can route/manage their team, and admins see/manage the company. Cross-team requests are created as `isIncoming=true`, leaving them unassigned until the target team lead routes them.

## Assumptions

- The company domain is `taskflow.company`; mock sign-in only accepts seeded users.
- A team member can view their team's board, while write permissions remain scoped.
- Reports export CSV for the selected scope and support the last 7 days, month-to-date, or a custom creation-date range.
