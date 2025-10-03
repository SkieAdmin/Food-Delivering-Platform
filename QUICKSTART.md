# 🚀 Quick Start Guide

Get GoCotano up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Database

1. Create MySQL database:
```sql
CREATE DATABASE food_delivery;
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Edit `.env` with your MySQL credentials:
```env
DATABASE_URL="mysql://root:password@localhost:3306/food_delivery"
SESSION_SECRET="your-secret-key"
```

## Step 3: Run Migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

## Step 4: Seed Sample Data

```bash
npm run db:seed
```

## Step 5: Start the Server

```bash
npm run dev
```

Visit: **http://localhost:3000**

## 🎉 You're Ready!

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@example.com | password123 |
| Restaurant | pizzapalace@example.com | password123 |
| Driver | driver@example.com | password123 |

## 🔑 Optional: Add API Keys

For full functionality, add these to your `.env`:

```env
# Twilio (SMS)
TWILIO_ACCOUNT_SID="your-sid"
TWILIO_AUTH_TOKEN="your-token"
TWILIO_PHONE_NUMBER="+1234567890"

# PayPal (Payments)
PAYPAL_CLIENT_ID="your-client-id"
PAYPAL_CLIENT_SECRET="your-secret"
PAYPAL_MODE="sandbox"

# Google Maps (Tracking)
GOOGLE_MAPS_API_KEY="your-api-key"
```

## 📚 Next Steps

- Browse the [full README](README.md) for detailed documentation
- Explore the code in `src/` folder
- Customize the theme in `public/css/style.css`
- Add your own restaurants and menu items

## 🆘 Issues?

- Database error? Check your MySQL connection
- Port 3000 in use? Change `PORT` in `.env`
- Need help? Check the troubleshooting section in README.md

---

**Happy coding! 🍔🚀**
