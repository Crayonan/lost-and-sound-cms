import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_media_category" AS ENUM('artists', 'gallery', 'news', 'faq', 'instagram');
  CREATE TYPE "public"."enum_artists_social_links_platform" AS ENUM('instagram', 'twitter', 'facebook', 'spotify', 'soundcloud');
  CREATE TYPE "public"."enum_artists_day" AS ENUM('friday', 'saturday', 'sunday');
  CREATE TYPE "public"."enum_artists_begin_time_tz" AS ENUM('Pacific/Midway', 'Pacific/Niue', 'Pacific/Honolulu', 'Pacific/Rarotonga', 'America/Anchorage', 'Pacific/Gambier', 'America/Los_Angeles', 'America/Tijuana', 'America/Denver', 'America/Phoenix', 'America/Chicago', 'America/Guatemala', 'America/New_York', 'America/Bogota', 'America/Caracas', 'America/Santiago', 'America/Buenos_Aires', 'America/Sao_Paulo', 'Atlantic/South_Georgia', 'Atlantic/Azores', 'Atlantic/Cape_Verde', 'Europe/London', 'Europe/Berlin', 'Africa/Lagos', 'Europe/Athens', 'Africa/Cairo', 'Europe/Moscow', 'Asia/Riyadh', 'Asia/Dubai', 'Asia/Baku', 'Asia/Karachi', 'Asia/Tashkent', 'Asia/Calcutta', 'Asia/Dhaka', 'Asia/Almaty', 'Asia/Jakarta', 'Asia/Bangkok', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Seoul', 'Australia/Brisbane', 'Australia/Sydney', 'Pacific/Guam', 'Pacific/Noumea', 'Pacific/Auckland', 'Pacific/Fiji');
  CREATE TYPE "public"."enum_artists_end_time_tz" AS ENUM('Pacific/Midway', 'Pacific/Niue', 'Pacific/Honolulu', 'Pacific/Rarotonga', 'America/Anchorage', 'Pacific/Gambier', 'America/Los_Angeles', 'America/Tijuana', 'America/Denver', 'America/Phoenix', 'America/Chicago', 'America/Guatemala', 'America/New_York', 'America/Bogota', 'America/Caracas', 'America/Santiago', 'America/Buenos_Aires', 'America/Sao_Paulo', 'Atlantic/South_Georgia', 'Atlantic/Azores', 'Atlantic/Cape_Verde', 'Europe/London', 'Europe/Berlin', 'Africa/Lagos', 'Europe/Athens', 'Africa/Cairo', 'Europe/Moscow', 'Asia/Riyadh', 'Asia/Dubai', 'Asia/Baku', 'Asia/Karachi', 'Asia/Tashkent', 'Asia/Calcutta', 'Asia/Dhaka', 'Asia/Almaty', 'Asia/Jakarta', 'Asia/Bangkok', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Seoul', 'Australia/Brisbane', 'Australia/Sydney', 'Pacific/Guam', 'Pacific/Noumea', 'Pacific/Auckland', 'Pacific/Fiji');
  CREATE TYPE "public"."enum_artists_location" AS ENUM('main-stage', 'outside-stage', 'tent-area');
  CREATE TYPE "public"."enum_news_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__news_articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_pages_hero_type" AS ENUM('videoBackground', 'imageBackground', 'none');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_version_hero_type" AS ENUM('videoBackground', 'imageBackground', 'none');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_fetch_logs_status" AS ENUM('success', 'failed', 'rate_limited_user');
  CREATE TYPE "public"."enum_header_nav_items_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_footer_quick_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_footer_social_media_links_platform" AS ENUM('instagram', 'twitter', 'facebook');
  CREATE TABLE IF NOT EXISTS "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"category" "enum_media_category",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_artist_4x3_url" varchar,
  	"sizes_artist_4x3_width" numeric,
  	"sizes_artist_4x3_height" numeric,
  	"sizes_artist_4x3_mime_type" varchar,
  	"sizes_artist_4x3_filesize" numeric,
  	"sizes_artist_4x3_filename" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "artists_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_artists_social_links_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "artists" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"day" "enum_artists_day",
  	"begin_time" timestamp(3) with time zone,
  	"begin_time_tz" "enum_artists_begin_time_tz",
  	"end_time" timestamp(3) with time zone,
  	"end_time_tz" "enum_artists_end_time_tz",
  	"location" "enum_artists_location",
  	"bio" jsonb,
  	"image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "gallery_images" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"label" varchar NOT NULL,
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "news_articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"cover_image_id" integer,
  	"excerpt" varchar,
  	"published_date" timestamp(3) with time zone,
  	"category_id" integer,
  	"content" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_news_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "_news_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_cover_image_id" integer,
  	"version_excerpt" varchar,
  	"version_published_date" timestamp(3) with time zone,
  	"version_category_id" integer,
  	"version_content" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__news_articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "faq_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" jsonb NOT NULL,
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"hero_type" "enum_pages_hero_type" DEFAULT 'videoBackground',
  	"hero_heading" varchar,
  	"hero_subheading" varchar,
  	"hero_video_url" varchar,
  	"hero_background_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_hero_type" "enum__pages_v_version_hero_type" DEFAULT 'videoBackground',
  	"version_hero_heading" varchar,
  	"version_hero_subheading" varchar,
  	"version_hero_video_url" varchar,
  	"version_hero_background_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "instagram_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"instagram_post_id" varchar,
  	"shortcode" varchar,
  	"owner_username" varchar,
  	"original_image_url" varchar,
  	"local_image_id" integer,
  	"original_video_url" varchar,
  	"local_video_id" integer,
  	"caption" varchar,
  	"post_date" timestamp(3) with time zone,
  	"likes_count" numeric,
  	"comments_count" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "fetch_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"date" varchar NOT NULL,
  	"instagram_username" varchar NOT NULL,
  	"status" "enum_fetch_logs_status" NOT NULL,
  	"message" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"artists_id" integer,
  	"gallery_images_id" integer,
  	"categories_id" integer,
  	"news_articles_id" integer,
  	"faq_items_id" integer,
  	"pages_id" integer,
  	"instagram_posts_id" integer,
  	"fetch_logs_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "header_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_label" varchar NOT NULL,
  	"link_type" "enum_header_nav_items_link_type" DEFAULT 'reference',
  	"link_reference_id" integer,
  	"link_url" varchar,
  	"link_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE IF NOT EXISTS "header" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "footer_quick_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_label" varchar NOT NULL,
  	"link_type" "enum_footer_quick_links_link_type" DEFAULT 'custom',
  	"link_reference_id" integer,
  	"link_url" varchar,
  	"link_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE IF NOT EXISTS "footer_social_media_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_footer_social_media_links_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "footer" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contact_info" jsonb,
  	"copyright_text" varchar DEFAULT '© 2025 LOST & SOUND Festival. All rights reserved.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  DO $$ BEGIN
   ALTER TABLE "artists_social_links" ADD CONSTRAINT "artists_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "artists" ADD CONSTRAINT "artists_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "_news_articles_v" ADD CONSTRAINT "_news_articles_v_parent_id_news_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news_articles"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "_news_articles_v" ADD CONSTRAINT "_news_articles_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "_news_articles_v" ADD CONSTRAINT "_news_articles_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "pages" ADD CONSTRAINT "pages_hero_background_image_id_media_id_fk" FOREIGN KEY ("hero_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_hero_background_image_id_media_id_fk" FOREIGN KEY ("version_hero_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "instagram_posts" ADD CONSTRAINT "instagram_posts_local_image_id_media_id_fk" FOREIGN KEY ("local_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "instagram_posts" ADD CONSTRAINT "instagram_posts_local_video_id_media_id_fk" FOREIGN KEY ("local_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "fetch_logs" ADD CONSTRAINT "fetch_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_artists_fk" FOREIGN KEY ("artists_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gallery_images_fk" FOREIGN KEY ("gallery_images_id") REFERENCES "public"."gallery_images"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_articles_fk" FOREIGN KEY ("news_articles_id") REFERENCES "public"."news_articles"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faq_items_fk" FOREIGN KEY ("faq_items_id") REFERENCES "public"."faq_items"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_instagram_posts_fk" FOREIGN KEY ("instagram_posts_id") REFERENCES "public"."instagram_posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_fetch_logs_fk" FOREIGN KEY ("fetch_logs_id") REFERENCES "public"."fetch_logs"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "header_nav_items" ADD CONSTRAINT "header_nav_items_link_reference_id_pages_id_fk" FOREIGN KEY ("link_reference_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "header_nav_items" ADD CONSTRAINT "header_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "header" ADD CONSTRAINT "header_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "footer_quick_links" ADD CONSTRAINT "footer_quick_links_link_reference_id_pages_id_fk" FOREIGN KEY ("link_reference_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "footer_quick_links" ADD CONSTRAINT "footer_quick_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "footer_social_media_links" ADD CONSTRAINT "footer_social_media_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_artist_4x3_sizes_artist_4x3_filename_idx" ON "media" USING btree ("sizes_artist_4x3_filename");
  CREATE INDEX IF NOT EXISTS "artists_social_links_order_idx" ON "artists_social_links" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "artists_social_links_parent_id_idx" ON "artists_social_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "artists_name_idx" ON "artists" USING btree ("name");
  CREATE INDEX IF NOT EXISTS "artists_image_idx" ON "artists" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "artists_updated_at_idx" ON "artists" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "artists_created_at_idx" ON "artists" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "gallery_images_image_idx" ON "gallery_images" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "gallery_images_updated_at_idx" ON "gallery_images" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "gallery_images_created_at_idx" ON "gallery_images" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "news_articles_slug_idx" ON "news_articles" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "news_articles_cover_image_idx" ON "news_articles" USING btree ("cover_image_id");
  CREATE INDEX IF NOT EXISTS "news_articles_category_idx" ON "news_articles" USING btree ("category_id");
  CREATE INDEX IF NOT EXISTS "news_articles_updated_at_idx" ON "news_articles" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "news_articles_created_at_idx" ON "news_articles" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "news_articles__status_idx" ON "news_articles" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "_news_articles_v_parent_idx" ON "_news_articles_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_news_articles_v_version_version_slug_idx" ON "_news_articles_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_news_articles_v_version_version_cover_image_idx" ON "_news_articles_v" USING btree ("version_cover_image_id");
  CREATE INDEX IF NOT EXISTS "_news_articles_v_version_version_category_idx" ON "_news_articles_v" USING btree ("version_category_id");
  CREATE INDEX IF NOT EXISTS "_news_articles_v_version_version_updated_at_idx" ON "_news_articles_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_news_articles_v_version_version_created_at_idx" ON "_news_articles_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_news_articles_v_version_version__status_idx" ON "_news_articles_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_news_articles_v_created_at_idx" ON "_news_articles_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_news_articles_v_updated_at_idx" ON "_news_articles_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_news_articles_v_latest_idx" ON "_news_articles_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "faq_items_updated_at_idx" ON "faq_items" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "faq_items_created_at_idx" ON "faq_items" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "pages_hero_hero_background_image_idx" ON "pages" USING btree ("hero_background_image_id");
  CREATE INDEX IF NOT EXISTS "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_hero_version_hero_background_image_idx" ON "_pages_v" USING btree ("version_hero_background_image_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE UNIQUE INDEX IF NOT EXISTS "instagram_posts_instagram_post_id_idx" ON "instagram_posts" USING btree ("instagram_post_id");
  CREATE INDEX IF NOT EXISTS "instagram_posts_shortcode_idx" ON "instagram_posts" USING btree ("shortcode");
  CREATE INDEX IF NOT EXISTS "instagram_posts_local_image_idx" ON "instagram_posts" USING btree ("local_image_id");
  CREATE INDEX IF NOT EXISTS "instagram_posts_local_video_idx" ON "instagram_posts" USING btree ("local_video_id");
  CREATE INDEX IF NOT EXISTS "instagram_posts_updated_at_idx" ON "instagram_posts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "instagram_posts_created_at_idx" ON "instagram_posts" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "fetch_logs_user_idx" ON "fetch_logs" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "fetch_logs_updated_at_idx" ON "fetch_logs" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "fetch_logs_created_at_idx" ON "fetch_logs" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_artists_id_idx" ON "payload_locked_documents_rels" USING btree ("artists_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_gallery_images_id_idx" ON "payload_locked_documents_rels" USING btree ("gallery_images_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_news_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("news_articles_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_faq_items_id_idx" ON "payload_locked_documents_rels" USING btree ("faq_items_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_instagram_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("instagram_posts_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_fetch_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("fetch_logs_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "header_nav_items_order_idx" ON "header_nav_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "header_nav_items_parent_id_idx" ON "header_nav_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "header_nav_items_link_link_reference_idx" ON "header_nav_items" USING btree ("link_reference_id");
  CREATE INDEX IF NOT EXISTS "header_logo_idx" ON "header" USING btree ("logo_id");
  CREATE INDEX IF NOT EXISTS "footer_quick_links_order_idx" ON "footer_quick_links" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "footer_quick_links_parent_id_idx" ON "footer_quick_links" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "footer_quick_links_link_link_reference_idx" ON "footer_quick_links" USING btree ("link_reference_id");
  CREATE INDEX IF NOT EXISTS "footer_social_media_links_order_idx" ON "footer_social_media_links" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "footer_social_media_links_parent_id_idx" ON "footer_social_media_links" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "artists_social_links" CASCADE;
  DROP TABLE "artists" CASCADE;
  DROP TABLE "gallery_images" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "news_articles" CASCADE;
  DROP TABLE "_news_articles_v" CASCADE;
  DROP TABLE "faq_items" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "instagram_posts" CASCADE;
  DROP TABLE "fetch_logs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "header_nav_items" CASCADE;
  DROP TABLE "header" CASCADE;
  DROP TABLE "footer_quick_links" CASCADE;
  DROP TABLE "footer_social_media_links" CASCADE;
  DROP TABLE "footer" CASCADE;
  DROP TYPE "public"."enum_media_category";
  DROP TYPE "public"."enum_artists_social_links_platform";
  DROP TYPE "public"."enum_artists_day";
  DROP TYPE "public"."enum_artists_begin_time_tz";
  DROP TYPE "public"."enum_artists_end_time_tz";
  DROP TYPE "public"."enum_artists_location";
  DROP TYPE "public"."enum_news_articles_status";
  DROP TYPE "public"."enum__news_articles_v_version_status";
  DROP TYPE "public"."enum_pages_hero_type";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_hero_type";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_fetch_logs_status";
  DROP TYPE "public"."enum_header_nav_items_link_type";
  DROP TYPE "public"."enum_footer_quick_links_link_type";
  DROP TYPE "public"."enum_footer_social_media_links_platform";`)
}
