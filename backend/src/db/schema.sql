-- ============================================================
-- Vairavan Kovil - Database Schema (PostgreSQL)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ------------------------------------------------------------
-- Admin / staff users (temple office login)
-- ------------------------------------------------------------
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(30) NOT NULL DEFAULT 'staff', -- staff | admin
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Kattalai types (Uchikala, Arthajama, Archanai, etc.)
-- One row per "column" shown on the dashboard.
-- color_key maps to a design token in the frontend (morning/evening-blue/archanai)
-- ------------------------------------------------------------
CREATE TABLE kattalai_types (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(120) NOT NULL,          -- e.g. "Uchikala Kattalai"
  name_ta      VARCHAR(160),                    -- Tamil label, optional
  color_key    VARCHAR(30) NOT NULL,            -- 'morning' | 'evening-blue' | 'archanai'
  default_amount NUMERIC(10,2) DEFAULT 0,
  display_order INT NOT NULL DEFAULT 0,
  active       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Sponsors / Bookings
-- One row per devotee sponsoring a kattalai on a given date.
-- This is the data behind each orange/blue/amber pill.
-- ------------------------------------------------------------
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kattalai_type_id UUID NOT NULL REFERENCES kattalai_types(id) ON DELETE RESTRICT,
  booking_date    DATE NOT NULL,               -- the day this slot applies to
  title           VARCHAR(40),
  title_ta        VARCHAR(40),
  name            VARCHAR(160) NOT NULL,
  name_ta         VARCHAR(160),
  star            VARCHAR(60),                  -- birth star / nakshatram
  star_ta         VARCHAR(60),
  place           VARCHAR(120),
  place_ta        VARCHAR(120),
  code            VARCHAR(40),                  -- internal reference code e.g. "A/2/2"
  mobile          VARCHAR(20),
  whatsapp_number VARCHAR(20),
  whatsapp_same_as_mobile BOOLEAN DEFAULT true,
  email           VARCHAR(160),
  permanent_address TEXT,
  communication_address TEXT,
  amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  country_code    VARCHAR(10) DEFAULT '91',
  kat_type        VARCHAR(50),
  wa_status_en    VARCHAR(20),
  wa_error_en     TEXT,
  wa_status_ta    VARCHAR(20),
  wa_error_ta     TEXT,
  present         BOOLEAN NOT NULL DEFAULT false, -- the green/white "present" toggle
  status          VARCHAR(20) NOT NULL DEFAULT 'booked', -- booked | cancelled | completed
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_kattalai ON bookings(kattalai_type_id);

-- ------------------------------------------------------------
-- WhatsApp Send History (Batch logs)
-- ------------------------------------------------------------
CREATE TABLE whatsapp_send_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lang            VARCHAR(20) NOT NULL,
  target_date     DATE NOT NULL,
  total           INT DEFAULT 0,
  sent            INT DEFAULT 0,
  failed          INT DEFAULT 0,
  triggered_by    VARCHAR(60),
  error_details   JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Payments (linked 1:1 or 1:many to a booking)
-- ------------------------------------------------------------
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount          NUMERIC(10,2) NOT NULL,
  method          VARCHAR(30) DEFAULT 'cash',   -- cash | upi | card | bank_transfer
  status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | paid | failed | refunded
  transaction_ref VARCHAR(120),
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);

-- ------------------------------------------------------------
-- To-do list items (Viboothi to be sent / Reminder letters / etc.)
-- ------------------------------------------------------------
CREATE TABLE todo_lists (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(120) NOT NULL,   -- "Viboothi to be sent to", "Reminder Letter to send"
  display_order INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE todo_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_list_id UUID NOT NULL REFERENCES todo_lists(id) ON DELETE CASCADE,
  booking_id   UUID REFERENCES bookings(id) ON DELETE SET NULL, -- optional link back to a sponsor
  name         VARCHAR(160) NOT NULL,
  completed    BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_todo_items_list ON todo_items(todo_list_id);

-- ------------------------------------------------------------
-- Panchangam (Tamil almanac) - one row per calendar date
-- Powers the bottom strip. Typically imported/seeded from a
-- panchangam data source ahead of time.
-- ------------------------------------------------------------
CREATE TABLE panchangam (
  panch_date        DATE PRIMARY KEY,
  tamil_month       VARCHAR(40),     -- சித்திரை
  tamil_year        VARCHAR(40),     -- பராபவ வருடம்
  tamil_day_number  INT,             -- 29
  nalla_neram       JSONB,           -- [{start:"07:31 am", end:"09:00 am"}, ...]
  yamagandam        JSONB,
  kuligai           JSONB,
  rahu_kalam        JSONB,
  thithi            VARCHAR(60),
  thithi_time       VARCHAR(60),
  natchathiram      VARCHAR(60),
  yogam             VARCHAR(60),
  chandrashtamam    VARCHAR(60),
  kulam             VARCHAR(60),
  parigaram         VARCHAR(120),
  special_note      TEXT,
  worship_note      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Seed: default kattalai types matching the Figma design
-- ------------------------------------------------------------
INSERT INTO kattalai_types (name, name_ta, color_key, display_order) VALUES
  ('Uchikala Kattalai', 'உச்சிகால கட்டளை', 'morning', 1),
  ('Arthajama Kattalai', 'அர்த்தஜாம கட்டளை', 'evening-blue', 2),
  ('Archanai',           'அர்ச்சனை',         'archanai', 3);

INSERT INTO todo_lists (title, display_order) VALUES
  ('Viboothi to be sent to', 1),
  ('Reminder Letter to send', 2);

-- ------------------------------------------------------------
-- History Logs (Audit Trail)
-- ------------------------------------------------------------
CREATE TABLE history_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL, -- who performed the action
  action       VARCHAR(120) NOT NULL, -- e.g. 'MARKED_PRESENT', 'PRINTED_LABELS'
  details      TEXT NOT NULL,         -- readable log message
  booking_id   UUID REFERENCES bookings(id) ON DELETE SET NULL, -- optional target booking
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_history_logs_created_at ON history_logs(created_at DESC);

-- ------------------------------------------------------------
-- Edit Requests (For devotees requesting permission to edit locked fields)
-- ------------------------------------------------------------
CREATE TABLE edit_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  status       VARCHAR(20) DEFAULT 'pending', -- pending | approved | rejected
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_edit_requests_booking ON edit_requests(booking_id);

-- ------------------------------------------------------------
-- Dropdown Options (For UI-managed Title, Star, Place)
-- ------------------------------------------------------------
CREATE TABLE dropdown_options (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category     VARCHAR(30) NOT NULL, -- 'title', 'star', 'place'
  value        VARCHAR(160) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dropdown_options_category ON dropdown_options(category);

