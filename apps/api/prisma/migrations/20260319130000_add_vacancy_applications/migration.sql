-- CreateTable
CREATE TABLE "vacancy_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vacancy_id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "graph_id" UUID NOT NULL,
    "cover_letter" VARCHAR(2000),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "match_score" INTEGER NOT NULL DEFAULT 0,
    "matched_skills" INTEGER NOT NULL DEFAULT 0,
    "total_required" INTEGER NOT NULL DEFAULT 0,
    "hr_note" VARCHAR(1000),
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacancy_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vacancy_applications_vacancy_id_applicant_id_key" ON "vacancy_applications"("vacancy_id", "applicant_id");

-- CreateIndex
CREATE INDEX "vacancy_applications_vacancy_id_idx" ON "vacancy_applications"("vacancy_id");

-- CreateIndex
CREATE INDEX "vacancy_applications_applicant_id_idx" ON "vacancy_applications"("applicant_id");

-- CreateIndex
CREATE INDEX "vacancy_applications_status_idx" ON "vacancy_applications"("status");

-- AddForeignKey
ALTER TABLE "vacancy_applications" ADD CONSTRAINT "vacancy_applications_vacancy_id_fkey" FOREIGN KEY ("vacancy_id") REFERENCES "vacancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancy_applications" ADD CONSTRAINT "vacancy_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancy_applications" ADD CONSTRAINT "vacancy_applications_graph_id_fkey" FOREIGN KEY ("graph_id") REFERENCES "graphs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
