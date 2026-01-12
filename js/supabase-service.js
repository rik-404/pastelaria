// Serviço do Supabase para operações CRUD
class SupabaseService {
    constructor() {
        this.supabase = null;
        this.initialized = false;
    }

    // Inicializar serviço
    async init() {
        if (this.initialized) return true;
        
        try {
            // Verificar se o SDK do Supabase está disponível
            if (typeof window.supabase === 'undefined') {
                throw new Error('SDK do Supabase não encontrado');
            }
            
            // Verificar se a configuração está disponível
            if (typeof SUPABASE_CONFIG === 'undefined') {
                throw new Error('Configuração do Supabase não encontrada');
            }
            
            this.supabase = window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey
            );
            
            // Testar conexão
            await testSupabaseConnection(this.supabase);
            
            this.initialized = true;
            console.log('Serviço Supabase inicializado com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao inicializar serviço Supabase:', error);
            return false;
        }
    }

    // ===== OPERAÇÕES COM MENU_ITEMS =====

    // Obter todos os itens do menu
    async getMenuItems() {
        if (!this.initialized) await this.init();
        
        try {
            const { data, error } = await this.supabase
                .from('menu_items')
                .select('*')
                .order('category, name');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao obter itens do menu:', error);
            return [];
        }
    }

    // Adicionar item ao menu
    async addMenuItem(item) {
        if (!this.initialized) await this.init();
        
        try {
            const { data, error } = await this.supabase
                .from('menu_items')
                .insert([item])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao adicionar item ao menu:', error);
            throw error;
        }
    }

    // Atualizar item do menu
    async updateMenuItem(id, updates) {
        if (!this.initialized) await this.init();
        
        try {
            const { data, error } = await this.supabase
                .from('menu_items')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao atualizar item do menu:', error);
            throw error;
        }
    }

    // Excluir item do menu
    async deleteMenuItem(id) {
        if (!this.initialized) await this.init();
        
        try {
            const { error } = await this.supabase
                .from('menu_items')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao excluir item do menu:', error);
            throw error;
        }
    }

    // ===== OPERAÇÕES COM SETTINGS =====

    // Obter configuração
    async getSetting(key) {
        if (!this.initialized) await this.init();
        
        try {
            const { data, error } = await this.supabase
                .from('settings')
                .select('value')
                .eq('key', key)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            return data ? data.value : null;
        } catch (error) {
            console.error(`Erro ao obter configuração ${key}:`, error);
            return null;
        }
    }

    // Salvar configuração
    async saveSetting(key, value) {
        if (!this.initialized) await this.init();
        
        try {
            const { data, error } = await this.supabase
                .from('settings')
                .upsert({ key, value, updated_at: new Date().toISOString() })
                .select('value')
                .single();
            
            if (error) throw error;
            return data.value;
        } catch (error) {
            console.error(`Erro ao salvar configuração ${key}:`, error);
            throw error;
        }
    }

    // Obter todas as configurações
    async getAllSettings() {
        if (!this.initialized) await this.init();
        
        try {
            const { data, error } = await this.supabase
                .from('settings')
                .select('*');
            
            if (error) throw error;
            
            // Converter para objeto
            const settings = {};
            data.forEach(setting => {
                settings[setting.key] = setting.value;
            });
            
            return settings;
        } catch (error) {
            console.error('Erro ao obter configurações:', error);
            return {};
        }
    }

    // ===== OPERAÇÕES COM ORDERS =====

    // Criar pedido
    async createOrder(orderData) {
        if (!this.initialized) await this.init();
        
        try {
            const { data, error } = await this.supabase
                .from('orders')
                .insert([orderData])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao criar pedido:', error);
            throw error;
        }
    }

    // Obter pedidos
    async getOrders(limit = 50, offset = 0, status = null) {
        if (!this.initialized) await this.init();
        
        try {
            let query = this.supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            
            if (status) {
                query = query.eq('status', status);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao obter pedidos:', error);
            return [];
        }
    }

    // Atualizar status do pedido
    async updateOrderStatus(id, status) {
        if (!this.initialized) await this.init();
        
        try {
            const { data, error } = await this.supabase
                .from('orders')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao atualizar status do pedido:', error);
            throw error;
        }
    }

    // Migrar dados do localStorage para Supabase se necessário
    async migrateFromLocalStorage() {
        console.log('Iniciando migração do localStorage para Supabase...');
        
        try {
            // Migrar menu items
            const localMenuItems = localStorage.getItem('menuItems');
            if (localMenuItems) {
                const items = JSON.parse(localMenuItems);
                console.log(`Migrando ${items.length} itens do menu...`);
                
                for (const item of items) {
                    try {
                        // Verificar se o item já existe (pelo nome)
                        const { data: existing } = await this.supabase
                            .from('menu_items')
                            .select('id')
                            .eq('name', item.name)
                            .single();
                        
                        if (!existing) {
                            // Inserir apenas se não existir
                            await this.addMenuItem({
                                name: item.name,
                                price: item.price,
                                category: item.category,
                                description: item.description || ''
                            });
                            console.log(`✅ Item migrado: ${item.name}`);
                        } else {
                            console.log(`⏭️ Item já existe: ${item.name}`);
                        }
                    } catch (error) {
                        console.error(`❌ Erro ao migrar item ${item.name}:`, error);
                    }
                }
            }
            
            // Migrar configurações (com UPSERT para evitar duplicatas)
            const settings = [
                { key: 'whatsapp_number', value: localStorage.getItem('whatsappNumber') || '5519992450000' },
                { key: 'delivery_fee', value: localStorage.getItem('deliveryFee') || '5.00' },
                { key: 'site_title', value: localStorage.getItem('siteTitle') || 'Pastelaria Itoman' }
            ];
            
            for (const setting of settings) {
                try {
                    await this.saveSetting(setting.key, setting.value);
                    console.log(`✅ Configuração migrada: ${setting.key}`);
                } catch (error) {
                    // Ignorar erro de duplicata - é normal
                    if (error.code === '23505') {
                        console.log(`⏭️ Configuração já existe: ${setting.key}`);
                    } else {
                        console.error(`❌ Erro ao migrar configuração ${setting.key}:`, error);
                    }
                }
            }
            
            console.log('✅ Migração concluída com sucesso!');
            return true;
        } catch (error) {
            console.error('❌ Erro na migração:', error);
            return false;
        }
    }
}

// Criar instância global
const supabaseService = new SupabaseService();

// Exportar para uso global
window.supabaseService = supabaseService;
