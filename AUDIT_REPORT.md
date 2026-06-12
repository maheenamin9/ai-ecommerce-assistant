# Security & Feature Audit Report
**Project:** AI E-Commerce Assistant  
**Date:** 2026-06-10

---

## CRITICAL Vulnerabilities

### 1. Unauthenticated product seed/create endpoints
**File:** `server/routes/products.js` (lines 9–10)

`GET /api/products/seed` and `POST /api/products/` have no auth middleware. Anyone can call seed, which runs `Product.deleteMany({})` and wipes the entire catalog. Anyone can create arbitrary products.

**Fix:** Add `protect` middleware (and admin role check) to both routes.

---

### 2. Client-supplied `totalPrice` used directly as Stripe charge amount
**File:** `server/controllers/paymentController.js` (line 38)

`Math.round(totalPrice * 100)` where `totalPrice` comes straight from `req.body`. An attacker can set `"totalPrice": 0.01` and pay 1 cent for a $300 order.

**Fix:** Recalculate total server-side by fetching product prices from the database using the submitted `items[].product` IDs.

---

### 3. Orders are not user-scoped
**File:** `server/models/Order.js`, `server/controllers/orderController.js` (line 21)

The `Order` model has no `userId` field. `getOrders` filters only by `sessionId` (a client-supplied query param). Any authenticated user who knows another user's `sessionId` can read their orders. `getOrder` by `:id` also has no ownership check — any authenticated user can fetch any order by MongoDB ID.

**Fix:** Add `userId` to the `Order` schema, populate it at creation, and filter all order queries by `req.user._id`.

---

## HIGH Vulnerabilities

### 4. No admin/role system
There is no role distinction between customers and admins. Even if product endpoints were auth-protected, any registered user could create or modify products.

**Fix:** Add a `role` field (`customer` | `admin`) to the `User` model and an `adminOnly` middleware.

---

### 5. Stripe webhook is not idempotent
**File:** `server/controllers/paymentController.js` (line 74)

Stripe retries webhooks on timeout. On a second `payment_intent.succeeded` delivery, the code decrements stock again. If stock is now insufficient, it triggers a spurious refund on an already-fulfilled order.

**Fix:** Check `if (order.paymentStatus === 'paid') return res.json({ received: true })` at the top of the handler.

---

### 6. ReDoS via regex fallback in product search
**File:** `server/services/openaiService.js` (line 87)

The fallback builds `{ $regex: terms }` from user-influenced query terms joined with `|`. A crafted input like `(a+)+(a+)+` causes catastrophic backtracking in MongoDB.

**Fix:** Sanitize or escape regex special characters before building the fallback query.

---

### 7. `textToSpeech` has no text length limit
**File:** `server/controllers/chatController.js` (line 44)

Accepts arbitrary-length text with no cap. An attacker can send megabytes of text to incur large OpenAI TTS costs.

**Fix:** Add a hard cap (e.g., 1000 characters) and return 400 if exceeded.

---

## MEDIUM Issues

### 8. Rate limiting is IP-only
`express-rate-limit` defaults to IP-based keying. Behind corporate NAT, legitimate users get blocked by one bad actor. Attackers with rotating IPs can bypass limits entirely.

**Fix:** Key by authenticated `userId` when available, falling back to IP.

---

### 9. Reservation-to-paymentIntent link can silently fail
**File:** `server/controllers/paymentController.js` (line 47)

If TTL expires the reservation between the stock check and `Reservation.findOneAndUpdate`, the update silently fails. The `paymentIntentId` is never set, so the webhook can't clean up `reservedStock`, leaving it permanently inflated.

---

### 10. `createOrder` controller is an orphan endpoint
**File:** `server/routes/orders.js` (line 8)

`POST /api/orders` creates an order record with no `paymentIntentId` and no actual payment — a ghost order that can never be confirmed. The real order creation path lives inside `createPaymentIntent`.

**Fix:** Remove this endpoint or restrict it to internal/webhook use only.

---

### 11. Stock check fallback ignores `reservedStock`
**File:** `server/controllers/paymentController.js` (line 26)

When there's no reservation, the fallback checks `stock: { $gte: quantity }` but ignores `reservedStock`. Items reserved by other active checkouts appear as available.

**Fix:** Change the check to `{ stock: { $gte: ... }, $expr: { $lte: [{ $add: ['$reservedStock', quantity] }, '$stock'] } }`.

---

### 12. JWT stored in localStorage
**File:** `client/src/store/authStore.js` (line 5)

Vulnerable to XSS exfiltration. React prevents most XSS, but third-party scripts or future vulnerabilities remain a risk.

**Fix:** Use HttpOnly cookies set by the server.

---

### 13. Raw `error.message` returned in 500 responses
**File:** `server/controllers/authController.js` (line 20)

`res.status(500).json({ error: error.message })` can leak Mongoose validation messages, connection strings, or stack details to clients.

**Fix:** Log internally, return a generic message to the client.

---

## Edge Cases / Logic Bugs

### 14. Double checkout creates orphaned orders
If the user opens checkout twice (network lag, double-click), two pending orders are created in DB for the same payment intent. Only one gets confirmed; the other stays `pending` forever.

### 15. Floating point used for currency
**Files:** `server/models/Product.js`, `server/models/Order.js`

`price: Number` uses IEEE 754. `1.1 + 2.2 = 3.3000000000000003`.

**Fix:** Store prices as integer cents.

### 16. Cart is not persisted
**File:** `client/src/store/cartStore.js`

Pure in-memory Zustand store — cart clears on page refresh. If a user has an active server-side reservation (15 min TTL) and refreshes, the reservation exists but the cart is gone.

**Fix:** Persist cart items to `localStorage`.

### 17. Context window truncation in chat
**File:** `server/controllers/chatController.js` (line 23)

`conversation.messages.slice(-10)` sends only the last 10 messages to OpenAI. In long sessions, the AI loses context (e.g., "buy the second one" when the product list is no longer in the window).

### 18. SSE stream has no server-side timeout
**File:** `server/controllers/chatController.js` (lines 28–31)

No timeout on the streaming response. If the OpenAI connection hangs indefinitely, the connection stays open and the conversation record never saves.

**Fix:** Set a timeout (e.g., 60s) and close the stream + save partial response if exceeded.

---

## Missing Features (high-value for this project type)

| Feature | Notes |
|---|---|
| **Password reset / forgot password** | No email-based recovery flow exists |
| **Email verification on register** | Accounts can be created with unverified/fake emails |
| **Order history UI** | Orders aren't linked to `userId` so no "My Orders" page is currently possible |
| **Order confirmation email** | No notification sent after successful payment |
| **Product image upload** | `Product.images[]` exists in schema but no upload endpoint or storage is wired up |
| **Review / rating submission** | Model has `rating`/`numReviews` but no write endpoint to submit reviews |
| **Admin panel** | No UI to manage products, orders, or users |
| **Wishlist / saved items** | No model or UI for it |
| **Cart persistence** | `localStorage`-backed or DB-backed cart across page refreshes/sessions |
| **Coupon / discount codes** | No promo or discount system |
| **Shipping cost calculation** | All checkouts assume free shipping |
| **Order status updates** | Orders confirm and stay `confirmed` — no shipped/delivered transitions or tracking |
| **Account lockout after N failed logins** | Rate limiter is per-IP only; targeted per-account brute force is possible |
| **Saved addresses** | Shipping address is re-entered on every checkout |
| **Product sorting options** | API only supports `createdAt: -1`; no price, rating, or relevance sort exposed |

---

## Fix Priority Order

1. Server-side `totalPrice` recalculation (payment manipulation — critical)
2. Auth + admin guard on seed/create product endpoints (data destruction)
3. `userId` on `Order` model + ownership checks on all order routes
4. Stripe webhook idempotency check
5. Regex sanitization in search fallback
6. TTS text length cap
7. Cart persistence to `localStorage`
8. Idempotent reservation-to-paymentIntent link
9. Remove or restrict orphan `POST /api/orders` endpoint
10. Per-user rate limiting for authenticated routes
