-- AlterTable
ALTER TABLE "endorsements" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "stories" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "story_comments" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "story_likes" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "vacancies" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "company" VARCHAR(200),
    "description" TEXT,
    "field" VARCHAR(100),
    "location" VARCHAR(200),
    "salary_range" VARCHAR(100),
    "skills" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vacancies_author_id_idx" ON "vacancies"("author_id");

-- CreateIndex
CREATE INDEX "vacancies_is_active_idx" ON "vacancies"("is_active");

-- AddForeignKey
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
