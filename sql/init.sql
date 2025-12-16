-- Create tables for barbershop booking system

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Masters table
CREATE TABLE IF NOT EXISTS masters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    client_phone VARCHAR(20) NOT NULL,
    client_name VARCHAR(100),
    service_id INTEGER NOT NULL REFERENCES services(id),
    master_id INTEGER NOT NULL REFERENCES masters(id),
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_booking UNIQUE (master_id, booking_date, booking_time)
);

-- Dialog states table (for conversation state management)
CREATE TABLE IF NOT EXISTS dialog_states (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE,
    state VARCHAR(50) NOT NULL,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admins table (whitelist)
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_master_date ON bookings(master_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_client_phone ON bookings(client_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_dialog_states_phone ON dialog_states(phone);

-- Insert initial data
INSERT INTO services (name, duration_minutes) VALUES
    ('Haircut', 30),
    ('Beard', 30),
    ('Complex', 30)
ON CONFLICT (name) DO NOTHING;

INSERT INTO masters (name, is_active) VALUES
    ('John', TRUE),
    ('Andrew', TRUE),
    ('Paul', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Example: Insert admin phone numbers (replace with actual numbers)
-- INSERT INTO admins (phone, name) VALUES
--     ('1234567890', 'Admin User')
-- ON CONFLICT (phone) DO NOTHING;
