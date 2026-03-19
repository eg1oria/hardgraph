-- CreateTable
CREATE TABLE "stories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "author_id" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "slug" VARCHAR(300) NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" VARCHAR(500),
    "cover_url" VARCHAR(500),
    "category" VARCHAR(50) NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "field" VARCHAR(100),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "read_time" INTEGER NOT NULL DEFAULT 0,
    "graph_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_likes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "story_id" UUID NOT NULL,
    "user_id" UUID,
    "ip_hash" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "story_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "parent_id" UUID,
    "content" VARCHAR(2000) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stories_author_id_idx" ON "stories"("author_id");

-- CreateIndex
CREATE INDEX "stories_is_published_published_at_idx" ON "stories"("is_published", "published_at");

-- CreateIndex
CREATE INDEX "stories_category_idx" ON "stories"("category");

-- CreateIndex
CREATE INDEX "stories_field_idx" ON "stories"("field");

-- CreateIndex
CREATE UNIQUE INDEX "stories_author_id_slug_key" ON "stories"("author_id", "slug");

-- CreateIndex
CREATE INDEX "story_likes_story_id_idx" ON "story_likes"("story_id");

-- CreateIndex
CREATE UNIQUE INDEX "story_likes_story_id_user_id_key" ON "story_likes"("story_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "story_likes_story_id_ip_hash_key" ON "story_likes"("story_id", "ip_hash");

-- CreateIndex
CREATE INDEX "story_comments_story_id_idx" ON "story_comments"("story_id");

-- CreateIndex
CREATE INDEX "story_comments_parent_id_idx" ON "story_comments"("parent_id");

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_graph_id_fkey" FOREIGN KEY ("graph_id") REFERENCES "graphs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_likes" ADD CONSTRAINT "story_likes_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_comments" ADD CONSTRAINT "story_comments_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_comments" ADD CONSTRAINT "story_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "story_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
