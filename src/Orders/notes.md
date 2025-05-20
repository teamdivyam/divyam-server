User Places Order ↓ Backend:

1. Create Order (status: 'pending')
2. Create Razorpay Order (or Stripe session)
3. Create Transaction (status: 'initiated')
4. Send Razorpay Order ID to Frontend ↓ Frontend opens Payment Gateway
   (Razorpay/Stripe) ↓ User Pays ↓ Webhook triggers backend
5. Update Transaction → 'successful'
6. Update Order → 'paid'
