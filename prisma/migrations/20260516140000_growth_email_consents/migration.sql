-- CreateTable
CREATE TABLE "growth_email_consents" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "consent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consent_copy_version" TEXT NOT NULL,
    "analysis_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_email_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "growth_email_consents_email_idx" ON "growth_email_consents"("email");

-- CreateIndex
CREATE INDEX "growth_email_consents_created_at_idx" ON "growth_email_consents"("created_at");
