-- AlterTable
ALTER TABLE "pro_report_unlocks" ADD COLUMN "stripe_customer_id" TEXT;

-- CreateIndex
CREATE INDEX "pro_report_unlocks_stripe_customer_id_idx" ON "pro_report_unlocks"("stripe_customer_id");

-- CreateTable
CREATE TABLE "saved_reports" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "cv_text" TEXT NOT NULL,
    "jd_text" TEXT NOT NULL,
    "result_text" TEXT NOT NULL,
    "job_title" TEXT,
    "company_name" TEXT,
    "fit_score" INTEGER,
    "tier" TEXT NOT NULL DEFAULT 'monthly_pro',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saved_reports_analysis_id_key" ON "saved_reports"("analysis_id");

-- CreateIndex
CREATE INDEX "saved_reports_stripe_customer_id_idx" ON "saved_reports"("stripe_customer_id");
