-- AlterTable: Add endorsement_count to graphs
ALTER TABLE "graphs" ADD COLUMN "endorsement_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: Add endorsement_count to nodes
ALTER TABLE "nodes" ADD COLUMN "endorsement_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: endorsements
CREATE TABLE "endorsements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "node_id" UUID NOT NULL,
    "graph_id" UUID NOT NULL,
    "user_id" UUID,
    "ip_hash" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "endorsements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "endorsements_graph_id_idx" ON "endorsements"("graph_id");
CREATE INDEX "endorsements_node_id_idx" ON "endorsements"("node_id");
CREATE UNIQUE INDEX "endorsements_node_id_user_id_key" ON "endorsements"("node_id", "user_id");
CREATE UNIQUE INDEX "endorsements_node_id_ip_hash_key" ON "endorsements"("node_id", "ip_hash");

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_graph_id_fkey" FOREIGN KEY ("graph_id") REFERENCES "graphs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
