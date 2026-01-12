-- Criar tabela menu_items
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela settings
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    customer_neighborhood TEXT,
    customer_reference TEXT,
    customer_observations TEXT,
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 5.00,
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    whatsapp_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_name ON menu_items(name);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);

-- Inserir configurações padrão
INSERT INTO settings (key, value) VALUES 
    ('whatsapp_number', '5519992450000'),
    ('delivery_fee', '5.00'),
    ('site_title', 'Pastelaria Itoman')
ON CONFLICT (key) DO NOTHING;

-- Habilitar RLS (Row Level Security)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir leitura pública, escrita apenas para admin)
CREATE POLICY "Public read access for menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Admin write access for menu_items" ON menu_items FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Public read access for settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Admin write access for settings" ON settings FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admin full access for orders" ON orders FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
);
