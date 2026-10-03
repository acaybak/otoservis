-- Deneme bitişi boş kalan firmalar için geriye dönük doldurma: kayıt + 7 gün.
-- (Yönetici e-postalarına — ADMIN_EMAILS — sahip firmalar kapsama girmez.)
-- 20261002150000_add_trial_period göçünden sonra oluşturulan ve trialEndsAt
-- atanmayan kayıtlar bu sayede deneme kapsamına alınır.
UPDATE "tenants" t SET "trial_ends_at" = t."created_at" + INTERVAL '7 days'
WHERE t."trial_ends_at" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "users" u
    WHERE u."tenant_id" = t."id"
      AND LOWER(u."email") IN ('acaybak@gmail.com', 'test2@otoservis.com')
  );
