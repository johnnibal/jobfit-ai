-- CreateTable
CREATE TABLE "pro_report_unlocks" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "stripe_checkout_session_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pro_report_unlocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pro_report_unlocks_analysis_id_key" ON "pro_report_unlocks"("analysis_id");

CREATE UNIQUE INDEX "pro_report_unlocks_stripe_checkout_session_id_key" ON "pro_report_unlocks"("stripe_checkout_session_id");
