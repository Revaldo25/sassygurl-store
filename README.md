# SassyGurl Store

Premium gaming top-up platform with Next.js frontend and ASP.NET Core backend API.

## Architecture

- Frontend: `Next.js 16` (`app/`, `components/`, `app/actions/*`)
- Backend: `.NET 10 Web API` (`backend/SassyGurl.Api`)
- Database: `PostgreSQL` via `Entity Framework Core`
- Auth: JWT via backend API, stored in `auth_token` cookie by server actions

## Run backend

1. Copy env keys from `backend/SassyGurl.Api/.env.example` into your environment.
2. Set at minimum:
   - `ConnectionStrings__DefaultConnection`
   - `Jwt__Key`
   - `Jwt__Issuer`
   - `Jwt__Audience`
3. Start API:
   - `dotnet run --project backend/SassyGurl.Api/SassyGurl.Api.csproj`

Health endpoint:
- `GET /health`

## Run frontend

1. Set `NEXT_PUBLIC_API_URL` to backend base API URL (default expected: `http://localhost:5000/api`).
2. Run:
   - `npm install`
   - `npm run dev`

## Migration note

Legacy Next.js API routes and Prisma-centric flow have been migrated toward backend `.NET API` + server actions.
See `MIGRATION_PLAN.md` for phased status and remaining hardening tasks.
