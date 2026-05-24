# Allo Inventory — Take-Home Exercise

A Next.js inventory reservation system that prevents race conditions during checkout.

## How to run locally

### Prerequisites
- Node.js 18+
- A Supabase account (free)
- An Upstash Redis account (free)

### Setup

1. Clone the repository:
   git clone https://github.com/yourusername/allo-inventory.git
   cd allo-inventory

2. Install dependencies:
   npm install

3. Create a `.env` file in the root:
   DATABASE_URL="your-supabase-connection-string"
   REDIS_URL="your-upstash-redis-url"

4. Run database migrations:
   npx prisma migrate dev

5. Seed the database:
   npx prisma db seed

6. Start the dev server:
   npm run dev

7. Open http://localhost:3000

## How expiry works in production

Reservations expire after 10 minutes. In production on Vercel, a cron job runs every minute and calls `/api/cron/expire`. This route finds all PENDING reservations where `expiresAt` is in the past, sets their status to RELEASED, and decrements the `reservedUnits` count so the stock becomes available again to other shoppers.

This is configured in `vercel.json`:
   {
     "crons": [{
       "path": "/api/cron/expire",
       "schedule": "* * * * *"
     }]
   }

## Concurrency approach

When two users try to reserve the last unit simultaneously, we use a database transaction to atomically check stock and create the reservation. If stock is insufficient, the API returns a 409 response. This prevents double booking.

## Trade-offs and things I'd do differently

- **Redis locking**: I removed Redis distributed locking to simplify the setup. With more time I would add it back using `ioredis` SET NX to guarantee atomicity under high concurrency.
- **Idempotency**: Did not implement idempotency keys. Would add them using a Redis key per `Idempotency-Key` header.
- **Error handling**: Could be more granular with better user-facing error messages.
- **UI**: Kept minimal — would add better loading states and animations with more time.
- **Testing**: No automated tests. Would add Jest unit tests for the reservation logic.

## Tech stack

- Next.js 16 with App Router
- TypeScript
- Prisma + Supabase (Postgres)
- Upstash Redis
- Tailwind CSS
- Vercel (hosting + cron)