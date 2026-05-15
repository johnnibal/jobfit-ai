-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateTable
CREATE TABLE "analysis_usage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "anonymous_session_id" TEXT,
    "stripe_customer_id" TEXT,
    "daily_bucket_utc" TEXT NOT NULL,
    "daily_count" INTEGER NOT NULL DEFAULT 0,
    "monthly_bucket_utc" TEXT NOT NULL,
    "monthly_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "analysis_usage_user_id_key" ON "analysis_usage"("user_id");

CREATE UNIQUE INDEX "analysis_usage_anonymous_session_id_key" ON "analysis_usage"("anonymous_session_id");

CREATE UNIQUE INDEX "analysis_usage_stripe_customer_id_key" ON "analysis_usage"("stripe_customer_id");

ALTER TABLE "analysis_usage" ADD CONSTRAINT "analysis_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
