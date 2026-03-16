-- AlterTable
ALTER TABLE "graphs" ADD COLUMN "forked_from_id" UUID,
ADD COLUMN "fork_count" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "graphs" ADD CONSTRAINT "graphs_forked_from_id_fkey" FOREIGN KEY ("forked_from_id") REFERENCES "graphs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
