ALTER TABLE "check_items" ALTER COLUMN "category_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "check_items" ADD COLUMN "task_id" uuid;--> statement-breakpoint
ALTER TABLE "check_items" ADD CONSTRAINT "check_items_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;