# 🚀 Integração com Supabase - Guia de Configuração

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- Projeto Supabase criado
- Chaves de API do projeto

## 🔧 Configuração do Supabase

### 1. Criar Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Clique em "New Project"
4. Escolha sua organização
5. Nomeie o projeto (ex: `pastelaria-itoman`)
6. Escolha a senha do banco de dados
7. Selecione a região mais próxima
8. Aguarde a criação do projeto

### 2. Obter Chaves de API

1. No painel do seu projeto, vá para **Settings > API**
2. Copie as seguintes chaves:
   - **Project URL**: `https://SEU-PROJETO.supabase.co`
   - **anon public key**: Chave anônima
   - **service_role key**: Chave de serviço (não exponha publicamente)

### 3. Configurar o Projeto

#### 3.1 Atualizar `supabase-config.js`

Abra o arquivo `js/supabase-config.js` e substitua:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://SEU-PROJETO.supabase.co',  // ← Cole aqui sua URL
    anonKey: 'SUA-CHAVE-ANONIMA',              // ← Cole aqui sua chave anônima
    serviceRoleKey: 'SUA-CHAVE-SERVICE-ROLE'   // ← Cole aqui sua chave de serviço
};
```

#### 3.2 Criar Tabelas no Supabase

1. No painel do Supabase, vá para **SQL Editor**
2. Clique em "New query"
3. Cole o SQL abaixo e execute:

```sql
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
```

### 4. Testar a Conexão

1. Abra o painel administrativo: `http://localhost:8000/admin.html`
2. Faça login com as credenciais:
   - **Usuário**: `admin`
   - **Senha**: `pastelaria123`
3. Verifique no console se aparece:
   ```
   ✅ Usando Supabase para armazenamento
   ✅ Dados carregados do Supabase com sucesso
   ```

## 🔄 Migração de Dados

### Do LocalStorage para Supabase

Se você já tem dados no localStorage, o sistema irá:

1. Detectar dados existentes
2. Perguntar se deseja migrar
3. Migrar automaticamente:
   - Itens do menu
   - Configurações (WhatsApp, taxa de entrega, etc.)
4. Limpar o localStorage após migração bem-sucedida

### Migração Manual

Se precisar migrar manualmente:

```javascript
// No console do navegador
await supabaseService.migrateFromLocalStorage();
```

## 🎯 Funcionalidades Disponíveis

### ✅ Menu Items
- **CRUD completo**: Criar, Ler, Atualizar, Excluir
- **Busca e filtros**: Por nome, descrição e categoria
- **Sincronização**: Tempo real com site principal

### ✅ Configurações
- **WhatsApp**: Número para pedidos
- **Taxa de entrega**: Valor padrão
- **Título do site**: Nome da pastelaria

### ✅ Pedidos (Futuro)
- **Registro automático**: Via checkout
- **Status tracking**: Pendente, confirmado, entregue
- **Dados do cliente**: Endereço, telefone, observações

## 🛠️ Estrutura do Banco

### menu_items
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | SERIAL | ID único |
| name | TEXT | Nome do item |
| price | DECIMAL | Preço |
| category | TEXT | Categoria |
| description | TEXT | Descrição |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

### settings
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | SERIAL | ID único |
| key | TEXT | Chave única |
| value | TEXT | Valor |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

### orders
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | SERIAL | ID único |
| customer_name | TEXT | Nome do cliente |
| customer_phone | TEXT | Telefone |
| customer_address | TEXT | Endereço |
| items | JSONB | Itens do pedido |
| total_amount | DECIMAL | Valor total |
| status | TEXT | Status do pedido |
| created_at | TIMESTAMP | Data do pedido |

## 🔒 Segurança

### Row Level Security (RLS)
- **Leitura pública**: Qualquer um pode ler menu e configurações
- **Escrita admin**: Apenas administradores podem modificar
- **Pedidos privados**: Apenas admin pode ver pedidos

### Chaves de API
- **Anon key**: Usada no frontend (pública)
- **Service role**: Usada em operações admin (privada)

## 🚀 Deploy em Produção

### 1. Variáveis de Ambiente
Configure as variáveis no seu ambiente de produção:

```bash
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA-CHAVE-ANONIMA
```

### 2. Build e Deploy
```bash
# Build do projeto
npm run build

# Deploy para seu servidor preferido
```

### 3. Configurações de Produção
- Remova logs sensíveis
- Configure CORS no Supabase
- Monitore performance do banco

## 🐛 Troubleshooting

### Erro Comum: "Supabase não foi inicializado"
- **Causa**: SDK não carregado ou chaves incorretas
- **Solução**: Verifique se `supabase-config.js` está correto

### Erro Comum: "Permissão negada"
- **Causa**: Políticas RLS não configuradas
- **Solução**: Execute o SQL de configuração das tabelas

### Erro Comum: "Conexão falhou"
- **Causa**: URL ou chave incorretas
- **Solução**: Verifique as chaves no painel do Supabase

## 📞 Suporte

Se precisar de ajuda:

1. **Documentação Supabase**: [supabase.com/docs](https://supabase.com/docs)
2. **Console do navegador**: Verifique os logs
3. **Painel Supabase**: Verifique logs do banco

---

## ✅ Checklist Final

- [ ] Projeto Supabase criado
- [ ] Chaves de API obtidas
- [ ] `supabase-config.js` atualizado
- [ ] Tabelas criadas via SQL
- [ ] RLS configurado
- [ ] Conexão testada
- [ ] Migração de dados (se necessário)
- [ ] Funcionalidades testadas

Parabéns! 🎉 Sua pastelaria agora usa um banco de dados real!
