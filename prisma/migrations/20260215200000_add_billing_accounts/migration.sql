-- CreateTable
CREATE TABLE "billing_accounts" (
    "id" TEXT NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "email" TEXT,
    "stripe_subscription_id" TEXT,
    "subscription_status" TEXT NOT NULL DEFAULT 'none',
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "last_payment_failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "billing_accounts_stripe_customer_id_key" ON "billing_accounts"("stripe_customer_id");

CREATE UNIQUE INDEX "billing_accounts_stripe_subscription_id_key" ON "billing_accounts"("stripe_subscription_id");
