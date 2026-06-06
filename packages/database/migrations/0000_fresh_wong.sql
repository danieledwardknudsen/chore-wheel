CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"opt_in_texts" boolean DEFAULT true NOT NULL,
	"opt_in_emails" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "passkeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" bigint DEFAULT 0 NOT NULL,
	"transports" text[],
	"device_type" varchar(32),
	"backed_up" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "passkeys_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "phone_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(20) NOT NULL,
	"code" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chore_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"assignee_rule_type" varchar(20) NOT NULL,
	"static_assignee_id" uuid,
	"schedule_type" varchar(20) NOT NULL,
	"schedule_config" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chore_rule_assignees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chore_rule_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"weight" numeric(5, 4) DEFAULT '1' NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'incomplete' NOT NULL,
	"due_date" date NOT NULL,
	"assignee_id" uuid,
	"chore_rule_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "passkeys" ADD CONSTRAINT "passkeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_rules" ADD CONSTRAINT "chore_rules_static_assignee_id_users_id_fk" FOREIGN KEY ("static_assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_rule_assignees" ADD CONSTRAINT "chore_rule_assignees_chore_rule_id_chore_rules_id_fk" FOREIGN KEY ("chore_rule_id") REFERENCES "public"."chore_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_rule_assignees" ADD CONSTRAINT "chore_rule_assignees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chores" ADD CONSTRAINT "chores_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chores" ADD CONSTRAINT "chores_chore_rule_id_chore_rules_id_fk" FOREIGN KEY ("chore_rule_id") REFERENCES "public"."chore_rules"("id") ON DELETE set null ON UPDATE no action;