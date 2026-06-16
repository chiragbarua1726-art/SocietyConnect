

# SocietyConnect Full Stack

Resident portal for society maintenance, complaints, bookings, history, help chat, and maintenance bill payments.

## What is included

- React frontend with the original resident portal UI adapted to real API calls
- Express backend with persistent JSON storage
- Complaint creation and resolution
- Maintenance bill listing and payment flow
- Razorpay integration hooks for live checkout
- Demo payment mode when Razorpay keys are not configured
- Facility booking, help chat, feedback, history export, settings, and notification state

## Project structure

- `frontend/` - Vite + React app
- `backend/` - Express API and JSON data store
- `backend/data/store.json` - sample persistent data
- `.env.example` - environment variables

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Start frontend and backend together:

```bash
npm run dev
```

4. Open:
   
url:https://societyconnect-backend.onrender.com

## Authentication

The portal is protected with JWT authentication. Residents and admins must sign in before accessing any data.

### Resident login

Use the seeded demo account at `https://societyconnect-backend.onrender.com`]:

- Email: `alex.johnson@email.com`
- Password: `resident123`

### Admin login

Access the admin panel at `https://societyconnect-backend.onrender.com`:

- Email: `admin@society.com`
- Password: `admin123`

The admin panel lets you assign technicians to complaints, add/delete bills, approve or reject facility bookings, manage schedule events, edit FAQs, and broadcast notifications to residents.

### Google Sign-In

1. Create an OAuth 2.0 **Web application** client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add `http://localhost:5173` as an authorized JavaScript origin.
3. Set `GOOGLE_CLIENT_ID` in your `.env` file.
4. Restart the dev server — the Google button will appear on the login page.

Google accounts must match the resident email registered in `backend/data/store.json`.

## Razorpay setup

Add your live or test Razorpay credentials to `.env`:

```bash
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

If these values are missing, the app automatically uses demo payment mode so you can still test the full flow locally.

## Build

```bash
npm run build
```

## Notes

- All API routes except `/api/health` and `/api/auth/*` require a valid JWT in the `Authorization: Bearer <token>` header.
- Payment verification is done on the backend through Razorpay signature validation.
- Card details are not stored in the frontend or backend.
- The backend currently uses a JSON file for persistence, which is good for demos and college projects. For production, move this to a real database and add authentication.
