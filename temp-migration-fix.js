// Correção da função migrateFromLocalStorage
async function migrateFromLocalStorage() {
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
