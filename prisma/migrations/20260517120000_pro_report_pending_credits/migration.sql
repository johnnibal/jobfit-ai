-- Pro Report “paid analysis credit” pending until first successful analyze + unlock row.

CREATE TABLE "pro_report_pending_credits" (
    "id" TEXT NOT NULL,
    "stripe_checkout_session_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "anonymous_session_id" TEXT,
    "consumed_at" TIMESTAMP(3),
    "consumed_analysis_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pro_report_pending_credits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pro_report_pending_credits_stripe_checkout_session_id_key" ON "pro_report_pending_credits"("stripe_checkout_session_id");

CREATE INDEX "pro_report_pending_credits_anonymous_session_id_idx" ON "pro_report_pending_credits"("anonymous_session_id");
