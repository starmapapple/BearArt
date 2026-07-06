# Production Checklist

1. Set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`.
2. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain.
3. Create PostgreSQL database and set `DATABASE_URL`.
4. Run `npm run migrate:postgres` to import existing JSON products, orders, and analytics events.
5. For phase 1 COD-only launch, set `PAYMENT_PROVIDER=cod_only`.
6. If Virtual Account is enabled later, choose `PAYMENT_PROVIDER=xendit` or `PAYMENT_PROVIDER=midtrans`.
7. For online payment later, add payment credentials and configure the provider webhook to `https://your-domain/api/payments/webhook`.
8. Confirm `/admin/readiness` shows all required production checks as configured.
9. Test COD order, admin order status flow, CSV export, and analytics attribution.
