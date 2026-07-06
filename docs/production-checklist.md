# Production Checklist

1. Set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`.
2. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain.
3. Create PostgreSQL database and set `DATABASE_URL`.
4. Run `npm run migrate:postgres` to import existing JSON products, orders, and analytics events.
5. Choose `PAYMENT_PROVIDER=xendit` or `PAYMENT_PROVIDER=midtrans`.
6. Add payment credentials and webhook secret/callback token.
7. Configure the payment provider webhook to `https://your-domain/api/payments/webhook`.
8. Confirm `/admin/readiness` shows all required production checks as configured.
9. Test COD order, Virtual Account order, webhook payment success, CSV export, and analytics attribution.
