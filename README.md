# Ronda — Real Meetups. Real People.

> Small groups. Real presence. Every city. $2 to join.

## Stack

- **Next.js 14** (App Router)
- **Firebase** (Auth, Firestore, Storage)
- **Stripe** (Hosted Checkout)

## Setup in 10 minutes

### 1. Install dependencies

```bash
npm install
```

### 2. Fill in `.env.local`

Copy the template and fill in your keys:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_UIDS=your-firebase-uid-here
```

### 3. Deploy Firestore rules + indexes

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 4. Create Firestore indexes (if not using CLI)

Go to Firebase Console → Firestore → Indexes and create:

| Collection   | Fields                          |
|-------------|----------------------------------|
| events       | city ASC, time ASC, status ASC  |
| participants | user_id ASC, created_at DESC    |

### 5. Configure Stripe webhook

In Stripe Dashboard → Developers → Webhooks:

- Endpoint URL: `https://yourdomain.com/api/stripe/checkout`
- Method: `PATCH`
- Event: `checkout.session.completed`

For local testing use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/checkout
```

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Event Rules

| Rule           | Value         |
|----------------|---------------|
| Group size     | 6–9 people    |
| Capacity min   | 6 (confirmed) |
| Capacity max   | 9 (hard cap)  |
| Host fee       | $2 USD        |
| Join fee       | $2 USD        |
| Refunds        | No refunds    |

## Trust Score

| Action              | Points |
|--------------------|--------|
| Attend event        | +1     |
| No-show             | −1     |
| Host completes      | +2     |
| Host cancels late   | −2     |

## Levels: New (0–2) → Rising (3–5) → Reliable (6–10) → Trusted (11–20) → Ambassador (21+)

---

## Deploy to Vercel

```bash
vercel deploy
```

Set all `.env.local` variables in Vercel dashboard → Settings → Environment Variables.

---

## Admin

Access `/admin` with a Firebase UID listed in `NEXT_PUBLIC_ADMIN_UIDS`.

Features:
- View all events + change status
- Look up users by UID
- Manually adjust trust scores
- Monitor participant counts
