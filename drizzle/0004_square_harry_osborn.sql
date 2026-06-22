ALTER TABLE "debts" ADD COLUMN "kind" text;--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN "monthly_payment" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN "payment_day" integer;--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN "interest_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN "term_months" integer;--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "debt_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_debt_id_debts_id_fk" FOREIGN KEY ("debt_id") REFERENCES "public"."debts"("id") ON DELETE set null ON UPDATE no action;