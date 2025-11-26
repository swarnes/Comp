# 🚀 RydrComps Setup Instructions

## Quick Start Guide

### 1️⃣ Environment Setup
```bash
# Rename the template files to create your environment
cp env.local.template .env.local
cp env.production.template .env.production
```

### 2️⃣ Database Setup (PostgreSQL Required)

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL locally, then create database
createdb rydrcomps
```

**Option B: Docker PostgreSQL**
```bash
# Run PostgreSQL in Docker
docker run --name rydrcomps-db -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=rydrcomps -p 5432:5432 -d postgres
```

### 3️⃣ Initialize Database
```bash
# Push schema to database
npx prisma db push

# Seed with sample data
npx prisma db seed
```

### 4️⃣ Start Development
```bash
npm run dev
```

## 🔧 Environment Variables

Edit `.env.local` with your actual values:

- **DATABASE_URL**: Your PostgreSQL connection string
- **NEXTAUTH_SECRET**: Generate with `openssl rand -base64 32`
- **EMAIL_SERVER**: SMTP server for magic link authentication
- **STRIPE_SECRET_KEY**: Get from Stripe dashboard (test mode)

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npx prisma studio` - Open database browser
- `npx prisma db push` - Push schema changes
- `npx prisma generate` - Regenerate client

## 🌐 Pages Available

- `/` - Competition listings
- `/dashboard` - User dashboard
- `/admin` - Admin panel
- `/competition/[id]` - Competition details

## 🎯 Ready for Cursor Testing!

Your RydrComps project is now fully configured and ready for development and testing in Cursor!
