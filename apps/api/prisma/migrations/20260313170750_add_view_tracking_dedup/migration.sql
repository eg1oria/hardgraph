-- AlterTable
ALTER TABLE "profile_views" ADD COLUMN     "viewer_user_id" UUID;

-- CreateIndex
CREATE INDEX "profile_views_graph_id_viewer_ip_hash_viewed_at_idx" ON "profile_views"("graph_id", "viewer_ip_hash", "viewed_at");
