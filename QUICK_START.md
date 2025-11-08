# Quick Start Guide - POS System

Get your POS system up and running in 5 minutes!

## 🚀 Step 1: Install Dependencies

```bash
cd pos-system
npm install
```

## ⚙️ Step 2: Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: POS System
   - **Database Password**: (create a strong password)
   - **Region**: Choose closest to you
4. Click "Create new project" and wait 2-3 minutes

## 🗄️ Step 3: Set Up Database

1. In Supabase dashboard, click "SQL Editor" in sidebar
2. Click "New Query"
3. Open the file `supabase-schema.sql` from your project
4. Copy ALL contents and paste into the SQL editor
5. Click "Run" or press Cmd/Ctrl + Enter
6. You should see "Success. No rows returned"

## 🔑 Step 4: Get API Credentials

1. In Supabase, go to Settings → API
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (the first key under "Project API keys")

## 📝 Step 5: Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and paste your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## ▶️ Step 6: Start Development Server

```bash
npm run dev
```

The app will open at http://localhost:5173

## 👤 Step 7: Create Your Account

1. Click "Sign Up" on the login page
2. Enter your email and password (min 6 characters)
3. Click "Sign Up"
4. You may need to verify your email (check Supabase Auth logs in development)
5. Log in with your credentials

## ✅ Step 8: Add Your First Product

1. Once logged in, you'll see the main interface
2. Click "Input Form" button at the top
3. Make sure "Products" tab is selected
4. Fill in the product form:
   - **Product Name**: Test Product (required)
   - **Category**: Accessories (optional)
   - **Base Price**: 100000 (optional)
5. Add a color variant:
   - Click one of the color swatches (e.g., "biru")
   - Set **Initial Stock**: 10
   - Leave other fields as default
   - Click "Add Color to Product"
6. Click "Save Product"

You should see a success message!

## 📊 Step 9: View Your Product

1. Click "Spreadsheet View" button at the top
2. You should see your product in the spreadsheet
3. Notice the color swatch showing stock level
4. Try the search box to filter

## 🎉 Step 10: Create Your First Order

1. Switch back to "Input Form"
2. Click "Customer Orders" tab
3. Fill in customer info:
   - **Customer Name**: John Doe
   - **Phone Number**: 081234567890
4. Add an item:
   - **Select Product**: Your test product
   - **Select Color**: The color you added
   - **Quantity**: 2
   - Click "Add Item to Order"
5. Click "Create Order"

The order will be created and stock will be automatically reserved!

## 🎯 Next Steps

Now you're ready to:
- Add more products with different colors
- Create customer orders
- View real-time stock updates
- Use the search and filter features
- Export data to Excel (coming soon)

## 📚 Learn More

- Read the full [README.md](README.md) for detailed features
- Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) to deploy to production
- View the database schema in `supabase-schema.sql`

## 🆘 Troubleshooting

### "Invalid API credentials"
- Double-check your `.env` file
- Make sure you're using the **anon** key, not service role
- Restart dev server after changing `.env`

### Products/Orders not showing
- Check if data exists in Supabase dashboard → Table Editor
- Open browser console (F12) for errors
- Make sure you ran the SQL schema

### Build errors
- Delete `node_modules` and run `npm install` again
- Make sure you're using Node.js 18+

## 🎊 You're All Set!

Your POS system is now running. Start managing your inventory and orders!

Need help? Check the README.md or contact support.

---

**Happy selling! 🛍️**
