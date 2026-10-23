-- migration-safety: contract-phase
-- The example note module was removed from the product. The expand phase has
-- already shipped, so this release removes the orphaned table.
DROP TABLE "note" CASCADE;
