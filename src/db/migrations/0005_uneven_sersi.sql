ALTER TABLE "check_items" ADD CONSTRAINT "check_items_parent_xor" CHECK (
        (
          ("check_items"."category_id" IS NOT NULL AND "check_items"."task_id" IS NULL)
          OR
          ("check_items"."category_id" IS NULL AND "check_items"."task_id" IS NOT NULL)
        )
      );