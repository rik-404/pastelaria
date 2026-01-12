// Configuração do Supabase
// SUBSTITUA COM SEUS DADOS REAIS DO SUPABASE
const SUPABASE_CONFIG = {
    url: 'https://cohrquhguscbagsuepsr.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvaHJxdWhndXNjYmFnc3VlcHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxOTk3OTcsImV4cCI6MjA4Mzc3NTc5N30.csQ1BHaMOZdIGanVigl3cu2mhHAO8pVUZ6V7f0aRfk4',
    // Para operações de admin, você pode precisar da service_role key
    // Mantenha em segredo e nunca exponha no frontend em produção
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvaHJxdWhndXNjYmFnc3VlcHNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5OTc5NywiZXhwIjoyMDgzNzc1Nzk3fQ.mqyAPaxD9a74H7F1QslwAKtJYTAe5x9sUUdMyhr4818'
};

// Verificar se o SDK já foi carregado
if (typeof window.supabase === 'undefined') {
    console.error('SDK do Supabase não encontrado. Verifique se o script foi carregado.');
} else {
    console.log('SDK do Supabase encontrado');
}

// Função para inicializar o Supabase
function initSupabase() {
    try {
        if (!window.supabase) {
            throw new Error('SDK do Supabase não está disponível');
        }
        
        // Usar a variável global do SDK em vez de criar uma nova
        const supabase = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        console.log('Supabase inicializado com sucesso');
        return supabase;
    } catch (error) {
        console.error('Erro ao inicializar Supabase:', error);
        return null;
    }
}

// Função para testar conexão
async function testSupabaseConnection(supabaseClient) {
    if (!supabaseClient) {
        console.error('Supabase não foi inicializado');
        return false;
    }
    
    try {
        const { data, error } = await supabaseClient.from('menu_items').select('count').limit(1);
        if (error) throw error;
        console.log('Conexão com Supabase bem-sucedida');
        return true;
    } catch (error) {
        console.error('Erro na conexão com Supabase:', error);
        return false;
    }
}

// Estrutura das tabelas necessárias
const TABLES = {
    menu_items: {
        columns: `
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        `,
        indexes: [
            'CREATE INDEX idx_menu_items_category ON menu_items(category)',
            'CREATE INDEX idx_menu_items_name ON menu_items(name)'
        ]
    },
    settings: {
        columns: `
            id SERIAL PRIMARY KEY,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        `,
        indexes: [
            'CREATE UNIQUE INDEX idx_settings_key ON settings(key)'
        ]
    },
    orders: {
        columns: `
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
        `,
        indexes: [
            'CREATE INDEX idx_orders_status ON orders(status)',
            'CREATE INDEX idx_orders_created_at ON orders(created_at)',
            'CREATE INDEX idx_orders_customer_phone ON orders(customer_phone)'
        ]
    }
};

// SQL para criar as tabelas (execute no painel SQL do Supabase)
const CREATE_TABLES_SQL = `
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
`;

// Exportar para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPABASE_CONFIG,
        initSupabase,
        testSupabaseConnection,
        TABLES,
        CREATE_TABLES_SQL
    };
}
