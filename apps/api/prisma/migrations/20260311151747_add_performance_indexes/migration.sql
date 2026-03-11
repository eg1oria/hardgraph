-- CreateIndex
CREATE INDEX "categories_graph_id_idx" ON "categories"("graph_id");

-- CreateIndex
CREATE INDEX "graphs_is_public_created_at_idx" ON "graphs"("is_public", "created_at");

-- CreateIndex
CREATE INDEX "nodes_category_id_idx" ON "nodes"("category_id");
