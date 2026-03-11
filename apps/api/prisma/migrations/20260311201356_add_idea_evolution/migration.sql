-- AlterTable
ALTER TABLE "nodes" ADD COLUMN     "parent_idea_id" UUID;

-- CreateIndex
CREATE INDEX "nodes_parent_idea_id_idx" ON "nodes"("parent_idea_id");

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_parent_idea_id_fkey" FOREIGN KEY ("parent_idea_id") REFERENCES "nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
