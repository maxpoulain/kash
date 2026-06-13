-- Add an optional institution (bank/provider) to cash-flow accounts, mirroring
-- savings_accounts.institution. Lets the unified add-account modal show the same
-- "Établissement" field for checking accounts as for savings ones.
alter table accounts add column institution text;
