-- ============================================================
-- Vairavan Kovil - Database Schema (MySQL)
-- ============================================================

-- ------------------------------------------------------------
-- Admin / staff users (temple office login)
-- ------------------------------------------------------------
CREATE TABLE users (
  id            VARCHAR(36) PRIMARY KEY ,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(30) NOT NULL DEFAULT 'staff',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Kattalai types (Uchikala, Arthajama, Archanai, etc.)
-- ------------------------------------------------------------
CREATE TABLE kattalai_types (
  id             VARCHAR(36) PRIMARY KEY ,
  name           VARCHAR(120) NOT NULL,
  name_ta        VARCHAR(160),
  color_key      VARCHAR(30) NOT NULL,
  default_amount DECIMAL(10,2) DEFAULT 0.00,
  display_order  INT NOT NULL DEFAULT 0,
  active         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Sponsors / Bookings
-- ------------------------------------------------------------
CREATE TABLE bookings (
  id              VARCHAR(36) PRIMARY KEY ,
  kattalai_type_id VARCHAR(36) NOT NULL,
  
  kattalai_date   INT,
  kattalai_month  INT,
  
  title           VARCHAR(40),
  title_ta        VARCHAR(40),
  name            VARCHAR(160) NOT NULL,
  name_ta         VARCHAR(160),
  star            VARCHAR(60),
  star_ta         VARCHAR(60),
  place           VARCHAR(120),
  place_ta        VARCHAR(120),
  code            VARCHAR(40),
  mobile          VARCHAR(20),
  whatsapp_number VARCHAR(20),
  whatsapp_same_as_mobile BOOLEAN DEFAULT true,
  email           VARCHAR(160),
  
  per_add_1       VARCHAR(255),
  per_add_2       VARCHAR(255),
  per_add_3       VARCHAR(255),
  comm_add_1      VARCHAR(255),
  comm_add_2      VARCHAR(255),
  comm_add_3      VARCHAR(255),
  comm_add_4      VARCHAR(255),
  
  amount          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  country_code    VARCHAR(10) DEFAULT '91',
  kat_type        VARCHAR(50),
  regn_date       VARCHAR(50),
  comments        TEXT,
  
  wa_status_en    VARCHAR(20),
  wa_error_en     TEXT,
  wa_status_ta    VARCHAR(20),
  wa_error_ta     TEXT,
  let_intimation  VARCHAR(20),
  present         BOOLEAN NOT NULL DEFAULT false,
  status          VARCHAR(20) NOT NULL DEFAULT 'booked',
  is_transferred  BOOLEAN NOT NULL DEFAULT false,
  transferred_at  TIMESTAMP NULL,
  transferred_from_name VARCHAR(160),
  transferred_from_title VARCHAR(40),
  transferred_fee_paid DECIMAL(10,2) DEFAULT 0.00,
  created_by      VARCHAR(36),
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kattalai_type_id) REFERENCES kattalai_types(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_bookings_date ON bookings(kattalai_month, kattalai_date);
CREATE INDEX idx_bookings_kattalai ON bookings(kattalai_type_id);

-- ------------------------------------------------------------
-- WhatsApp Send History (Batch logs)
-- ------------------------------------------------------------
CREATE TABLE whatsapp_send_history (
  id              VARCHAR(36) PRIMARY KEY ,
  lang            VARCHAR(20) NOT NULL,
  target_date     DATE NOT NULL,
  total           INT DEFAULT 0,
  sent            INT DEFAULT 0,
  failed          INT DEFAULT 0,
  triggered_by    VARCHAR(60),
  error_details   JSON,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Payments (linked 1:1 or 1:many to a booking)
-- ------------------------------------------------------------
CREATE TABLE payments (
  id              VARCHAR(36) PRIMARY KEY ,
  booking_id      VARCHAR(36) NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  method          VARCHAR(30) DEFAULT 'cash',
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  transaction_ref VARCHAR(120),
  paid_at         TIMESTAMP NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX idx_payments_booking ON payments(booking_id);

-- ------------------------------------------------------------
-- To-do list items (Viboothi to be sent / Reminder letters / etc.)
-- ------------------------------------------------------------
CREATE TABLE todo_lists (
  id            VARCHAR(36) PRIMARY KEY ,
  title         VARCHAR(120) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE todo_items (
  id            VARCHAR(36) PRIMARY KEY ,
  todo_list_id  VARCHAR(36) NOT NULL,
  booking_id    VARCHAR(36),
  name          VARCHAR(160) NOT NULL,
  completed     BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (todo_list_id) REFERENCES todo_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

CREATE INDEX idx_todo_items_list ON todo_items(todo_list_id);

-- ------------------------------------------------------------
-- Panchangam (Tamil almanac) - one row per calendar date
-- ------------------------------------------------------------
CREATE TABLE panchangam (
  panch_date        DATE PRIMARY KEY,
  tamil_month       VARCHAR(40),
  tamil_year        VARCHAR(40),
  tamil_day_number  INT,
  nalla_neram       JSON,
  yamagandam        JSON,
  kuligai           JSON,
  rahu_kalam        JSON,
  thithi            VARCHAR(60),
  thithi_time       VARCHAR(60),
  natchathiram      VARCHAR(60),
  yogam             VARCHAR(60),
  chandrashtamam    VARCHAR(60),
  kulam             VARCHAR(60),
  parigaram         VARCHAR(120),
  special_note      TEXT,
  worship_note      TEXT,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Seed: default kattalai types matching the Figma design
-- ------------------------------------------------------------
INSERT INTO kattalai_types (id, name, name_ta, color_key, display_order) VALUES
  (UUID(), 'Uchikala Kattalai', 'உச்சிகால கட்டளை', 'morning', 1),
  (UUID(), 'Arthajama Kattalai', 'அர்த்தஜாம கட்டளை', 'evening-blue', 2),
  (UUID(), 'Archanai',           'அர்ச்சனை',         'archanai', 3);

INSERT INTO todo_lists (id, title, display_order) VALUES
  (UUID(), 'Viboothi to be sent to', 1),
  (UUID(), 'Reminder Letter to send', 2);

-- ------------------------------------------------------------
-- History Logs (Audit Trail)
-- ------------------------------------------------------------
CREATE TABLE history_logs (
  id           VARCHAR(36) PRIMARY KEY ,
  user_id      VARCHAR(36),
  action       VARCHAR(120) NOT NULL,
  details      TEXT NOT NULL,
  booking_id   VARCHAR(36),
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

CREATE INDEX idx_history_logs_created_at ON history_logs(created_at DESC);

-- ------------------------------------------------------------
-- Edit Requests (For devotees requesting permission to edit locked fields)
-- ------------------------------------------------------------
CREATE TABLE edit_requests (
  id           VARCHAR(36) PRIMARY KEY ,
  booking_id   VARCHAR(36) NOT NULL,
  status       VARCHAR(20) DEFAULT 'pending',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX idx_edit_requests_booking ON edit_requests(booking_id);

-- ------------------------------------------------------------
-- Dropdown Options (For UI-managed Title, Star, Place)
-- ------------------------------------------------------------
CREATE TABLE dropdown_options (
  id           VARCHAR(36) PRIMARY KEY ,
  category     VARCHAR(30) NOT NULL,
  value        VARCHAR(160) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dropdown_options_category ON dropdown_options(category);

-- ------------------------------------------------------------
-- System Settings (Dynamic configuration like transfer_base_amount)
-- ------------------------------------------------------------
CREATE TABLE system_settings (
  setting_key   VARCHAR(60) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL,
  description   VARCHAR(255),
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO system_settings (setting_key, setting_value, description)
VALUES ('transfer_base_amount', '3500', 'Default base amount for 1-time account transfer')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

