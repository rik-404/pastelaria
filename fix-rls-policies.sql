-- Políticas RLS simplificadas para permitir operações básicas
-- Execute este SQL no painel Supabase (SQL Editor)

-- Remover políticas existentes
DROP POLICY IF EXISTS "Public read access for menu_items" ON menu_items;
DROP POLICY IF EXISTS "Admin write access for menu_items" ON menu_items;
DROP POLICY IF EXISTS "Public read access for settings" ON settings;
DROP POLICY IF EXISTS "Admin write access for settings" ON settings;
DROP POLICY IF EXISTS "Admin full access for orders" ON orders;

-- Criar políticas mais permissivas para desenvolvimento
CREATE POLICY "Enable all operations for menu_items" ON menu_items FOR ALL USING (true);
CREATE POLICY "Enable all operations for settings" ON settings FOR ALL USING (true);
CREATE POLICY "Enable all operations for orders" ON orders FOR ALL USING (true);

-- Inserir alguns dados de teste se a tabela estiver vazia
INSERT INTO menu_items (name, price, category, description) VALUES 
    ('Pastel de Carne', 12.90, 'pasteis', 'Carne moída temperada'),
    ('Pastel de Queijo', 11.90, 'pasteis', 'Queijo muçarela derretido'),
    ('COMBO FAMÍLIA', 99.90, 'combos', '4 Pastéis Grandes + 2 Refrigerantes 2L'),
    ('Refrigerante 2L', 12.00, 'bebidas', 'Coca-Cola, Guaraná, Fanta, etc.')
ON CONFLICT DO NOTHING;

-- Verificar dados inseridos
SELECT * FROM menu_items ORDER BY created_at DESC LIMIT 5;
