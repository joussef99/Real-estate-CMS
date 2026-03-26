-- Add stable public UUIDs without changing existing numeric primary keys.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- users
ALTER TABLE users ADD COLUMN IF NOT EXISTS public_id TEXT;
ALTER TABLE users ALTER COLUMN public_id SET DEFAULT gen_random_uuid()::text;
UPDATE users SET public_id = gen_random_uuid()::text WHERE public_id IS NULL;
ALTER TABLE users ALTER COLUMN public_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_public_id_key ON users(public_id);

-- developers
ALTER TABLE developers ADD COLUMN IF NOT EXISTS public_id TEXT;
ALTER TABLE developers ALTER COLUMN public_id SET DEFAULT gen_random_uuid()::text;
UPDATE developers SET public_id = gen_random_uuid()::text WHERE public_id IS NULL;
ALTER TABLE developers ALTER COLUMN public_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS developers_public_id_key ON developers(public_id);

-- destinations
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS public_id TEXT;
ALTER TABLE destinations ALTER COLUMN public_id SET DEFAULT gen_random_uuid()::text;
UPDATE destinations SET public_id = gen_random_uuid()::text WHERE public_id IS NULL;
ALTER TABLE destinations ALTER COLUMN public_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS destinations_public_id_key ON destinations(public_id);

-- projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS public_id TEXT;
ALTER TABLE projects ALTER COLUMN public_id SET DEFAULT gen_random_uuid()::text;
UPDATE projects SET public_id = gen_random_uuid()::text WHERE public_id IS NULL;
ALTER TABLE projects ALTER COLUMN public_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS projects_public_id_key ON projects(public_id);

-- blogs
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS public_id TEXT;
ALTER TABLE blogs ALTER COLUMN public_id SET DEFAULT gen_random_uuid()::text;
UPDATE blogs SET public_id = gen_random_uuid()::text WHERE public_id IS NULL;
ALTER TABLE blogs ALTER COLUMN public_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS blogs_public_id_key ON blogs(public_id);

-- careers
ALTER TABLE careers ADD COLUMN IF NOT EXISTS public_id TEXT;
ALTER TABLE careers ALTER COLUMN public_id SET DEFAULT gen_random_uuid()::text;
UPDATE careers SET public_id = gen_random_uuid()::text WHERE public_id IS NULL;
ALTER TABLE careers ALTER COLUMN public_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS careers_public_id_key ON careers(public_id);

-- property_types
ALTER TABLE property_types ADD COLUMN IF NOT EXISTS public_id TEXT;
ALTER TABLE property_types ALTER COLUMN public_id SET DEFAULT gen_random_uuid()::text;
UPDATE property_types SET public_id = gen_random_uuid()::text WHERE public_id IS NULL;
ALTER TABLE property_types ALTER COLUMN public_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS property_types_public_id_key ON property_types(public_id);

-- leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS public_id TEXT;
ALTER TABLE leads ALTER COLUMN public_id SET DEFAULT gen_random_uuid()::text;
UPDATE leads SET public_id = gen_random_uuid()::text WHERE public_id IS NULL;
ALTER TABLE leads ALTER COLUMN public_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS leads_public_id_key ON leads(public_id);

-- amenities
ALTER TABLE amenities ADD COLUMN IF NOT EXISTS public_id TEXT;
ALTER TABLE amenities ALTER COLUMN public_id SET DEFAULT gen_random_uuid()::text;
UPDATE amenities SET public_id = gen_random_uuid()::text WHERE public_id IS NULL;
ALTER TABLE amenities ALTER COLUMN public_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS amenities_public_id_key ON amenities(public_id);

-- project_amenities
ALTER TABLE project_amenities ADD COLUMN IF NOT EXISTS public_id TEXT;
ALTER TABLE project_amenities ALTER COLUMN public_id SET DEFAULT gen_random_uuid()::text;
UPDATE project_amenities SET public_id = gen_random_uuid()::text WHERE public_id IS NULL;
ALTER TABLE project_amenities ALTER COLUMN public_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS project_amenities_public_id_key ON project_amenities(public_id);

-- newsletter_subscribers
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS public_id TEXT;
ALTER TABLE newsletter_subscribers ALTER COLUMN public_id SET DEFAULT gen_random_uuid()::text;
UPDATE newsletter_subscribers SET public_id = gen_random_uuid()::text WHERE public_id IS NULL;
ALTER TABLE newsletter_subscribers ALTER COLUMN public_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_public_id_key ON newsletter_subscribers(public_id);
