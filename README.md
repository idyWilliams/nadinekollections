# NadineKollections E-commerce Platform

A premium, modern e-commerce platform built for NadineKollections using Next.js 15, Supabase, and Paystack.

## Features

- **Modern Customer Frontend**:
  - Responsive design with Framer Motion animations.
  - Product browsing, filtering, and search.
  - Shopping cart with persistent state.
  - Secure checkout with Paystack integration.
  - User accounts for order history.
  - Bulk order requests.

- **Admin Dashboard**:
  - Comprehensive overview of sales and orders.
  - Product management (CRUD).
  - Order processing and status updates.
  - Bulk order request management.
  - Promotion code management.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Payments**: Paystack
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase Account
- Paystack Account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/nadinekollections.git
   cd nadinekollections
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env.local` and fill in your credentials.
   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - `PAYSTACK_SECRET_KEY`
   - `PAYSTACK_WEBHOOK_SECRET`

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

1. Go to your Supabase project SQL Editor.
2. Run the migration scripts located in `supabase/migrations/`.
3. (Optional) Run `supabase/seed.sql` to populate test data.

## Project Structure

- `/app`: Next.js App Router pages and layouts.
- `/components`: Reusable UI components.
  - `/ui`: Base design system components (shadcn/ui style).
  - `/shared`: Common components (Header, Footer).
  - `/customer`: Customer-facing components.
  - `/admin`: Admin dashboard components.
- `/lib`: Utility functions, hooks, and store.
- `/supabase`: Database migrations and types.

## License

[MIT](LICENSE)
