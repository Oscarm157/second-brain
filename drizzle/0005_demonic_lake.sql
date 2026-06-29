CREATE TABLE "habit_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"habit_id" uuid,
	"key" text NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "habit_achievements_owner_habit_key_unique" UNIQUE("owner_id","habit_id","key")
);
--> statement-breakpoint
CREATE TABLE "habit_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"habit_id" uuid NOT NULL,
	"date" date NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "habit_entries_habit_date_unique" UNIQUE("habit_id","date")
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT 'check' NOT NULL,
	"color" text DEFAULT '#34d399' NOT NULL,
	"frequency" text DEFAULT 'daily' NOT NULL,
	"target_per_week" integer,
	"weekdays" jsonb,
	"target_per_day" integer DEFAULT 1 NOT NULL,
	"grace_per_week" integer DEFAULT 1 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "habit_achievements" ADD CONSTRAINT "habit_achievements_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_achievements" ADD CONSTRAINT "habit_achievements_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_entries" ADD CONSTRAINT "habit_entries_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_entries" ADD CONSTRAINT "habit_entries_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;