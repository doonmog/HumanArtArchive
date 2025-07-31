CREATE TABLE "artist" (
  "artist_id" integer PRIMARY KEY,
  "name" TEXT UNIQUE,
  "bio" TEXT
);

CREATE TABLE "artwork" (
  "artwork_id" integer PRIMARY KEY,
  "artist_id" integer,
  "artwork_name" TEXT UNIQUE,
  "year" integer,
  "description" TEXT
);

CREATE TABLE "image" (
  "image_id" integer PRIMARY KEY,
  "artwork_id" integer,
  "image" BYTEA,
  "filesize" integer,
  "resolution" TEXT,
  "display_order" integer
);

CREATE TABLE "category" (
  "category_id" integer PRIMARY KEY,
  "name" TEXT UNIQUE,
  "description" TEXT
);

CREATE TABLE "tag_group" (
  "group_id" integer PRIMARY KEY,
  "category_id" integer,
  "name" TEXT,
  "description" TEXT
);

CREATE TABLE "tag" (
  "tag_id" integer PRIMARY KEY,
  "group_id" integer,
  "name" TEXT,
  "description" TEXT
);

CREATE TABLE "image_tags" (
  "image_id" integer,
  "tag_id" integer,
  PRIMARY KEY ("image_id", "tag_id")
);

ALTER TABLE "artwork" ADD FOREIGN KEY ("artist_id") REFERENCES "artist" ("artist_id");

ALTER TABLE "image" ADD FOREIGN KEY ("artwork_id") REFERENCES "artwork" ("artwork_id");

ALTER TABLE "tag_group" ADD FOREIGN KEY ("category_id") REFERENCES "category" ("category_id");

ALTER TABLE "tag" ADD FOREIGN KEY ("group_id") REFERENCES "tag_group" ("group_id");

ALTER TABLE "image_tags" ADD FOREIGN KEY ("image_id") REFERENCES "image" ("image_id");

ALTER TABLE "image_tags" ADD FOREIGN KEY ("tag_id") REFERENCES "tag" ("tag_id");
