# Deployment Guide for Coolify

## Persistent Storage Configuration

### Images Storage

Uploaded competition images need persistent storage to survive redeployments.

#### In Coolify:

1. Go to your application → **Storages**
2. Click **Add Storage**
3. Configure:
   - **Name**: `competition-images`
   - **Source Path**: `/app/public/images/competitions` (container path)
   - **Destination Path**: Leave default or specify a host path
   - **Mount Type**: Volume
4. Click **Save**

### Database (if using SQLite for development)

If using SQLite instead of PostgreSQL:

1. Add another storage:
   - **Name**: `database`
   - **Source Path**: `/app/prisma`
   - **Mount Type**: Volume

### Alternative: Use External Storage

For production, consider using external storage:

#### Option 1: AWS S3 / DigitalOcean Spaces

1. Install dependencies:
   ```bash
   npm install @aws-sdk/client-s3 @aws-sdk/lib-storage multer-s3
   ```

2. Update environment variables:
   ```
   S3_BUCKET_NAME=your-bucket
   S3_REGION=us-east-1
   S3_ACCESS_KEY=your-access-key
   S3_SECRET_KEY=your-secret-key
   S3_ENDPOINT=https://nyc3.digitaloceanspaces.com (for DO Spaces)
   ```

#### Option 2: Cloudinary

1. Install:
   ```bash
   npm install cloudinary multer-storage-cloudinary
   ```

2. Environment variables:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

## Environment Variables

Ensure these are set in Coolify:

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Your domain (e.g., https://rydercomps.com)
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

### Optional
- `SMTP_HOST` - Email server
- `SMTP_PORT` - Email port (587)
- `SMTP_USER` - Email username
- `SMTP_PASS` - Email password
- `ADMIN_EMAIL` - Admin email address

## Deployment Steps

1. **Connect Repository**: Use GitHub App or Personal Access Token
2. **Set Environment Variables**: Add all required variables
3. **Configure Storage**: Add persistent volume for images
4. **Deploy**: Coolify will build and deploy automatically
5. **Run Migrations**: After first deployment:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

## Post-Deployment

### Create Admin User

SSH into the container or use Coolify's terminal:

```bash
node scripts/set-admin-password.js your-email@example.com newpassword
```

### Check Logs

Monitor deployment in Coolify's Logs section for any errors.

## Troubleshooting

### Images not persisting

- Verify storage is mounted correctly in Coolify
- Check container logs for write permission errors
- Ensure `/app/public/images/competitions` directory exists

### Database connection issues

- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running and accessible
- Run migrations if needed

### Build failures

- Check Node.js version (requires 18+)
- Verify all environment variables are set
- Review build logs in Coolify
