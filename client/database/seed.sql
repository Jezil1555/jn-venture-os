-- JN Venture OS — Development seed data
-- Passwords below are both: Passw0rd!
-- Change these before using anywhere but a local dev machine.

INSERT INTO users (id, name, email, password_hash, role)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Holding Admin', 'admin@jnventures.test',
   '$2b$10$c6NkYweKwasOOm6HrLldTOaUkiDwlPUpEqeDaSnoM4B3qycf1bfJK', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'Jordan Investor', 'investor@jnventures.test',
   '$2b$10$c6NkYweKwasOOm6HrLldTOaUkiDwlPUpEqeDaSnoM4B3qycf1bfJK', 'investor')
ON CONFLICT (email) DO NOTHING;

INSERT INTO companies (id, name, description, industry, status, created_by)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'Northbeam Logistics',
   'Regional last-mile delivery operator.', 'Logistics', 'active',
   '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

INSERT INTO investor_companies (investor_id, company_id, ownership_percentage, capital_committed)
VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000010', 12.5, 250000.00)
ON CONFLICT DO NOTHING;
