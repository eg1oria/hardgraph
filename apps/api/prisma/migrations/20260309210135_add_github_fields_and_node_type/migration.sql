-- AlterTable
ALTER TABLE "nodes" ADD COLUMN     "node_type" VARCHAR(30) NOT NULL DEFAULT 'skill';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "github_access_token" VARCHAR(500),
ADD COLUMN     "github_username" VARCHAR(100);
