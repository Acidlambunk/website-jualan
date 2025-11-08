# Deployment Guide - POS System

Complete guide to deploying your POS system to production.

## Prerequisites

- Supabase project (created and configured)
- Vercel account (or Netlify)
- GitHub repository (for automatic deployments)

## Step 1: Prepare Supabase for Production

### 1.1 Create Production Database

If you haven't already:

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in project details:
   - Name: "POS System Production"
   - Database Password: (use a strong password)
   - Region: Choose closest to your users
4. Wait for project to be created (2-3 minutes)

### 1.2 Run Database Schema

1. In Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy entire contents of `supabase-schema.sql` from your project
4. Paste and click "Run"
5. Verify all tables created: Go to "Table Editor" and check tables exist

### 1.3 Configure Authentication

1. Go to "Authentication" → "Settings"
2. Site URL: Set to your production domain (or localhost for now)
3. Redirect URLs: Add your production domain
4. Email Templates: Customize confirmation and reset password emails
5. Enable email confirmations if desired

### 1.4 Get API Credentials

1. Go to "Settings" → "API"
2. Copy these values (you'll need them later):
   - Project URL (looks like: `https://xxxxx.supabase.co`)
   - `anon` `public` key (safe to use in frontend)

### 1.5 Configure Row Level Security

RLS is already enabled via the SQL script, but verify:

1. Go to "Authentication" → "Policies"
2. Check each table has policies
3. Test by creating a test user and checking data access

## Step 2: Deploy Frontend to Vercel

### 2.1 Push Code to GitHub

```bash
cd pos-system
git init
git add .
git commit -m "Initial commit - POS System"
git branch -M main
git remote add origin your-github-repo-url
git push -u origin main
```

### 2.2 Connect to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: Vite
   - Root Directory: `./` (or `pos-system` if in subdirectory)
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 2.3 Add Environment Variables

In Vercel project settings → Environment Variables:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Use the `anon` public key, NOT the service role key!

### 2.4 Deploy

1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Visit your deployment URL
4. Test the application

### 2.5 Configure Custom Domain (Optional)

1. In Vercel project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (up to 48 hours, usually minutes)

## Step 3: Update Supabase Settings

### 3.1 Update Site URL

1. Go to Supabase → Authentication → Settings
2. Set Site URL to your Vercel URL: `https://your-app.vercel.app`
3. Add Redirect URLs:
   - `https://your-app.vercel.app/**`
   - Your custom domain if configured

### 3.2 Configure CORS (if needed)

Supabase automatically handles CORS for your domain, but verify:

1. Go to Settings → API
2. Check "CORS allowed origins"
3. Add your domain if not automatically added

## Step 4: Create Production Users

### 4.1 Create Admin User

1. Visit your deployed app
2. Click "Sign Up"
3. Create first admin account
4. Verify email if required
5. Log in and test functionality

### 4.2 Configure Email Provider (Optional)

For production email delivery:

1. Go to Supabase → Authentication → Settings → SMTP
2. Choose email provider:
   - **SendGrid** (recommended)
   - **Amazon SES**
   - **Mailgun**
   - Custom SMTP
3. Configure SMTP settings
4. Test email delivery

## Step 5: Production Checklist

### Security

- [ ] Environment variables are set correctly
- [ ] Using `anon` key, not service role key in frontend
- [ ] RLS policies are enabled on all tables
- [ ] Strong passwords enforced (6+ characters)
- [ ] Email verification enabled (if desired)
- [ ] HTTPS enabled (automatic with Vercel)

### Database

- [ ] All tables created successfully
- [ ] Indexes created for performance
- [ ] Default dropdown options inserted
- [ ] Triggers working for `updated_at`
- [ ] Views created for common queries

### Application

- [ ] App loads correctly
- [ ] Login/signup working
- [ ] Products can be created
- [ ] Orders can be created
- [ ] Real-time updates working
- [ ] Spreadsheet view displays data
- [ ] Search and filter working
- [ ] Stock reservations working

### Performance

- [ ] Images optimized
- [ ] Build size reasonable (<500KB initial)
- [ ] Loading states shown
- [ ] Error messages clear
- [ ] Mobile responsive (check on phone)

## Step 6: Monitoring & Maintenance

### Set Up Monitoring

**Vercel Analytics** (built-in):
1. Go to Vercel project → Analytics
2. Enable Web Analytics
3. Monitor page views and performance

**Supabase Monitoring**:
1. Go to Supabase → Reports
2. Monitor:
   - API requests
   - Database performance
   - Auth users
   - Storage usage

### Database Backups

Supabase automatically backs up your database:
- Free tier: Daily backups, 7-day retention
- Pro tier: Daily backups, 30-day retention, point-in-time recovery

To manually backup:
1. Go to Database → Backups
2. Click "Create backup"
3. Download backup file

### Update Application

For future updates:

```bash
git add .
git commit -m "Description of changes"
git push
```

Vercel automatically deploys from Git push!

## Alternative: Deploy to Netlify

If you prefer Netlify over Vercel:

### Netlify Deployment

1. Go to https://netlify.com
2. Click "Add new site" → "Import existing project"
3. Connect to GitHub
4. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variables in Site Settings
6. Deploy!

Build settings are the same as Vercel.

## Troubleshooting Production Issues

### "Network error" or "Failed to fetch"

**Check:**
- Supabase project is not paused (free tier pauses after 7 days inactivity)
- Environment variables are correct
- CORS settings include your domain
- API keys are valid

**Fix:**
- Wake up Supabase project by visiting dashboard
- Re-deploy with correct environment variables
- Check browser console for specific errors

### Authentication not working

**Check:**
- Site URL matches your domain
- Redirect URLs include your domain
- Email templates configured
- User confirmation required setting

**Fix:**
- Update authentication URLs in Supabase
- Check spam folder for confirmation emails
- Temporarily disable email confirmation for testing

### Data not showing / RLS errors

**Check:**
- User is logged in
- RLS policies exist on all tables
- Policies allow authenticated users

**Fix:**
- Re-run `supabase-schema.sql` to recreate policies
- Check Supabase logs for policy violations
- Verify user authentication state

### Build failing on Vercel

**Check:**
- All dependencies in `package.json`
- TypeScript errors
- Build command correct
- Node version compatibility

**Fix:**
- Run `npm run build` locally first
- Fix any TypeScript errors
- Ensure all imports are correct
- Check Vercel build logs for specific error

## Production Best Practices

### Security

1. **Never commit `.env` file** - Use environment variables
2. **Use RLS policies** - Already configured
3. **Validate user input** - Client and server side
4. **Regular updates** - Keep dependencies updated
5. **Monitor access** - Check Supabase auth logs

### Performance

1. **Enable caching** - Vercel does this automatically
2. **Optimize images** - Use WebP format
3. **Lazy load** - Load components as needed
4. **Database indexes** - Already created in schema
5. **Monitor metrics** - Use Vercel Analytics

### Maintenance

1. **Regular backups** - Download monthly backups
2. **Update dependencies** - Monthly security updates
3. **Monitor errors** - Check logs weekly
4. **Test updates** - Use preview deployments
5. **Document changes** - Maintain changelog

## Cost Estimates

### Free Tier (Recommended for starting)

- **Vercel**: Free for personal/hobby projects
- **Supabase**: Free up to 500MB database, 50,000 monthly active users
- **Total**: $0/month

### Production Tier

- **Vercel Pro**: $20/month (unlimited bandwidth)
- **Supabase Pro**: $25/month (8GB database, 100,000 MAU)
- **Total**: $45/month

### When to upgrade

- More than 500MB data → Upgrade Supabase
- More than 50,000 users → Upgrade Supabase
- Need better performance → Upgrade both
- Need custom domains → Vercel Pro
- Need better support → Both Pro

## Support

After deployment:

- **Vercel Issues**: Check deployment logs
- **Supabase Issues**: Check project logs
- **Application Issues**: Check browser console
- **Database Issues**: Use Supabase SQL editor

## Success! 🎉

Your POS system is now live!

Visit your deployment URL and start using your production system.

Remember to:
1. Create your admin account
2. Add your first products
3. Test all functionality
4. Share with your team

---

**Questions?** Refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- Project README.md for usage guide
