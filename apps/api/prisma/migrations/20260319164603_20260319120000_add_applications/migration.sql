/*
  Warnings:

  - You are about to drop the column `cover_letter` on the `vacancy_applications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "vacancy_applications" DROP COLUMN "cover_letter",
ADD COLUMN     "coverLetter" VARCHAR(2000),
ALTER COLUMN "id" DROP DEFAULT;
