-- CreateTable
CREATE TABLE "analysis_snapshots" (
    "analysis_id" TEXT NOT NULL,
    "result_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_snapshots_pkey" PRIMARY KEY ("analysis_id")
);
