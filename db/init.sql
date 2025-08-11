CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "admin" (
  "admin_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" TEXT UNIQUE NOT NULL,
  "password_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "last_login" TIMESTAMP
);

CREATE TABLE "artist" (
  "artist_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE,
  "bio" TEXT
);

CREATE TABLE "artwork" (
  "artwork_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "artist_id" UUID,
  "artwork_name" TEXT,
  "year" integer,
  "description" TEXT
);

CREATE TABLE "image" (
  "image_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "artwork_id" UUID,
  "image" BYTEA,
  "filesize" integer,
  "resolution" TEXT,
  "display_order" integer
);

CREATE TABLE "category" (
  "category_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE,
  "description" TEXT
);

CREATE TABLE "tag_group" (
  "group_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "category_id" UUID,
  "name" TEXT UNIQUE,
  "description" TEXT
);

CREATE TABLE "tag" (
  "tag_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "group_id" UUID,
  "name" TEXT,
  "description" TEXT
);

CREATE TABLE "image_tags" (
  "image_id" UUID,
  "tag_id" UUID,
  PRIMARY KEY ("image_id", "tag_id")
);

ALTER TABLE "artwork" ADD FOREIGN KEY ("artist_id") REFERENCES "artist" ("artist_id");

ALTER TABLE "image" ADD FOREIGN KEY ("artwork_id") REFERENCES "artwork" ("artwork_id");

ALTER TABLE "tag_group" ADD FOREIGN KEY ("category_id") REFERENCES "category" ("category_id");

ALTER TABLE "tag" ADD FOREIGN KEY ("group_id") REFERENCES "tag_group" ("group_id");

ALTER TABLE "image_tags" ADD FOREIGN KEY ("image_id") REFERENCES "image" ("image_id");

ALTER TABLE "image_tags" ADD FOREIGN KEY ("tag_id") REFERENCES "tag" ("tag_id");
