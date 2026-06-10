-- Remove global categories (household_id IS NULL), add `type` column, migrate data.

-- 1. Add type column with default
ALTER TABLE categories ADD COLUMN type text NOT NULL DEFAULT 'expense';

-- 2. Set type for existing income categories
UPDATE categories SET type = 'income' WHERE name IN ('Salaire', 'Investissement', 'Cadeau reçu', 'Autre revenu');

-- 3. Deduplicate custom categories that share a name within the same household
DELETE FROM categories a USING categories b
WHERE a.id < b.id AND a.household_id = b.household_id AND a.name = b.name;

-- 4. Add unique constraint so ON CONFLICT works
ALTER TABLE categories ADD CONSTRAINT categories_household_name_unique UNIQUE (household_id, name);

-- 5. Duplicate global categories for each household that references them
WITH
  globals AS (SELECT id, name, icon, type FROM categories WHERE household_id IS NULL),
  refs AS (
    SELECT DISTINCT household_id, category_id
    FROM (
      SELECT household_id, category_id FROM transactions WHERE category_id IN (SELECT id FROM globals)
      UNION
      SELECT household_id, category_id FROM recurring_transactions WHERE category_id IN (SELECT id FROM globals)
      UNION
      SELECT household_id, category_id FROM spending_goals WHERE category_id IN (SELECT id FROM globals)
    ) sub
  )
INSERT INTO categories (household_id, name, icon, type)
SELECT r.household_id, g.name, g.icon, g.type
FROM refs r
JOIN globals g ON g.id = r.category_id
ON CONFLICT DO NOTHING;

-- 6. Build mapping of old global id → new local id per household
CREATE TEMP TABLE _cat_migration AS
SELECT c.id AS new_id, c.household_id, g.id AS old_id
FROM categories c
JOIN categories g ON g.name = c.name AND c.household_id IS NOT NULL AND g.household_id IS NULL;

-- 7. Update FKs
UPDATE transactions t SET category_id = m.new_id
FROM _cat_migration m WHERE t.category_id = m.old_id AND t.household_id = m.household_id;

UPDATE recurring_transactions r SET category_id = m.new_id
FROM _cat_migration m WHERE r.category_id = m.old_id AND r.household_id = m.household_id;

UPDATE spending_goals s SET category_id = m.new_id
FROM _cat_migration m WHERE s.category_id = m.old_id AND s.household_id = m.household_id;

-- 8. Drop mapping
DROP TABLE _cat_migration;

-- 9. Remove global categories
DELETE FROM categories WHERE household_id IS NULL;

-- 10. Remove is_default
ALTER TABLE categories DROP COLUMN IF EXISTS is_default;

-- 11. Enforce household_id NOT NULL since globals are gone
ALTER TABLE categories ALTER COLUMN household_id SET NOT NULL;

-- 12. Update RLS policy: remove the household_id IS NULL branch
DROP POLICY IF EXISTS "categories_select" ON categories;
CREATE POLICY "categories_select" ON categories FOR SELECT USING (
  household_id = current_household_id()
);
