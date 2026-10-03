-- Deneme süresi: kayıt tarihinden itibaren 7 gün (lisans yoksa süre dolunca
-- yeni kayıt ekleme ve bulut eşitleme kilitlenir). Yönetici e-postalarına
-- (ADMIN_EMAILS) sahip firmalar kapsama girmez.
-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "trial_ends_at" TIMESTAMP(3);

-- Mevcut firmalar için deneme süresi = kayıt + 7 gün (yönetici firmaları hariç)
UPDATE "tenants" t SET "trial_ends_at" = t."created_at" + INTERVAL '7 days'
WHERE t."trial_ends_at" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "users" u
    WHERE u."tenant_id" = t."id"
      AND LOWER(u."email") IN ('acaybak@gmail.com', 'test2@otoservis.com')
  );
