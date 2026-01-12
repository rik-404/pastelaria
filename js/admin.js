// Variáveis globais
let menuItems = [];
let settings = {};
let currentEditingItem = null;
let currentViewMode = 'grid'; // 'grid' ou 'list'
let filteredItems = [];

// Verificar autenticação ao carregar
function checkAuthentication() {
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
    if (isAuthenticated !== 'true') {
        window.location.href = 'login.html';
        return false;
    }
    
    // Verificar timeout (sessão de 2 horas)
    const loginTime = sessionStorage.getItem('adminLoginTime');
    if (loginTime) {
        const loginDate = new Date(loginTime);
        const now = new Date();
        const diffHours = (now - loginDate) / (1000 * 60 * 60);
        
        if (diffHours > 2) {
            // Sessão expirada
            sessionStorage.removeItem('adminAuthenticated');
            sessionStorage.removeItem('adminLoginTime');
            window.location.href = 'login.html';
            return false;
        }
    }
    
    return true;
}

// Logout
function logout() {
    sessionStorage.removeItem('adminAuthenticated');
    sessionStorage.removeItem('adminLoginTime');
    window.location.href = 'login.html';
}

// Carregar dados ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuthentication()) {
        return;
    }
    
    loadMenuItems();
    loadSettings();
    loadWhatsApp();
    setupNavigation();
    setupLogout();
});

// Configurar logout
function setupLogout() {
    // Adicionar botão de logout na navegação
    const nav = document.querySelector('.admin-nav ul');
    if (nav) {
        const logoutLi = document.createElement('li');
        logoutLi.innerHTML = `
            <a href="#" onclick="logout()" style="background: #d32f2f; color: white;">
                <i class="fas fa-sign-out-alt"></i> Sair
            </a>
        `;
        nav.appendChild(logoutLi);
    }
    
    // Logout automático após inatividade
    let inactivityTimer;
    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            alert('Sessão expirada por inatividade!');
            logout();
        }, 30 * 60 * 1000); // 30 minutos
    }
    
    // Resetar timer em qualquer atividade
    document.addEventListener('click', resetInactivityTimer);
    document.addEventListener('keypress', resetInactivityTimer);
    document.addEventListener('scroll', resetInactivityTimer);
    
    resetInactivityTimer();
}

// Configurar navegação
function setupNavigation() {
    // Navegação por seções
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetSection = link.getAttribute('data-section');
            
            // Remover classe active de todos os links e seções
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Adicionar classe active ao link e seção correspondentes
            link.classList.add('active');
            const targetSectionElement = document.getElementById(targetSection);
            if (targetSectionElement) {
                targetSectionElement.classList.add('active');
                
                // Atualizar título da página
                const pageTitle = link.querySelector('span').textContent;
                document.querySelector('.page-title').textContent = pageTitle;
            }
        });
    });
    
    // Menu toggle para mobile
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            
            // Criar overlay se não existir
            let overlay = document.querySelector('.sidebar-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay';
                overlay.addEventListener('click', () => {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('active');
                });
                document.body.appendChild(overlay);
            }
            
            overlay.classList.toggle('active');
        });
    }
    
    // Atualizar dashboard stats
    updateDashboardStats();
}

// Atualizar estatísticas do dashboard
function updateDashboardStats() {
    // Total de itens no cardápio
    const totalItems = menuItems.length;
    document.getElementById('total-items').textContent = totalItems;
    
    // Simular outros dados (em produção, viriam do backend)
    document.getElementById('total-orders').textContent = '12';
    document.getElementById('total-revenue').textContent = 'R$ 487,50';
}

// Carregar itens do menu
function loadMenuItems() {
    // Carregar do localStorage ou usar dados padrão
    const savedItems = localStorage.getItem('menuItems');
    if (savedItems) {
        menuItems = JSON.parse(savedItems);
    } else {
        // Dados padrão baseados no site principal
        menuItems = [
            {
                id: 1,
                name: 'Pastel de Carne',
                price: 12.90,
                category: 'pasteis',
                description: 'Carne moída temperada'
            },
            {
                id: 2,
                name: 'Pastel de Queijo',
                price: 11.90,
                category: 'pasteis',
                description: 'Queijo muçarela derretido'
            },
            {
                id: 3,
                name: 'Pastel de Frango',
                price: 12.90,
                category: 'pasteis',
                description: 'Frango desfiado com temperos especiais'
            },
            {
                id: 4,
                name: 'Pastel de Palmito',
                price: 13.90,
                category: 'pasteis',
                description: 'Palmito pupunha com catupiry'
            },
            {
                id: 5,
                name: 'COMBO FAMÍLIA',
                price: 99.90,
                category: 'combos',
                description: '4 Pastéis Grandes + 2 Refrigerantes 2L'
            },
            {
                id: 6,
                name: 'COMBO CASAL',
                price: 59.90,
                category: 'combos',
                description: '2 Pastéis Grandes + 1 Refrigerante 2L'
            },
            {
                id: 7,
                name: 'Refrigerante 2L',
                price: 12.00,
                category: 'bebidas',
                description: '2L - Coca-Cola, Guaraná, Fanta, etc.'
            },
            {
                id: 8,
                name: 'Suco Natural 500ml',
                price: 8.00,
                category: 'bebidas',
                description: 'Laranja, Limão, Maracujá'
            }
        ];
        saveMenuItems();
    }
    
    renderMenuItems();
}

// Renderizar itens do menu
function renderMenuItems() {
    // Usar itens filtrados ou todos os itens
    const itemsToRender = filteredItems.length > 0 ? filteredItems : menuItems;
    
    if (currentViewMode === 'grid') {
        renderGridView(itemsToRender);
    } else {
        renderListView(itemsToRender);
    }
}

// Renderizar em modo grid
function renderGridView(items) {
    const grid = document.getElementById('menu-items-grid');
    const list = document.getElementById('menu-items-list');
    
    grid.innerHTML = '';
    list.style.display = 'none';
    grid.style.display = 'grid';
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-item-card';
        card.innerHTML = `
            <button class="delete-btn" onclick="deleteMenuItem(${item.id})" title="Excluir item">
                <i class="fas fa-trash"></i>
            </button>
            <h3>${item.name}</h3>
            <div class="price">R$ ${item.price.toFixed(2).replace('.', ',')}</div>
            <div class="description">${item.description || ''}</div>
            <div class="category-badge">${getCategoryName(item.category)}</div>
            <div class="btn-group">
                <button class="btn btn-warning btn-sm" onclick="editMenuItem(${item.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Renderizar em modo lista
function renderListView(items) {
    const grid = document.getElementById('menu-items-grid');
    const list = document.getElementById('menu-items-list');
    
    list.innerHTML = '';
    grid.style.display = 'none';
    list.style.display = 'flex';
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-item-card';
        card.innerHTML = `
            <div class="menu-item-info">
                <div class="menu-item-price">R$ ${item.price.toFixed(2).replace('.', ',')}</div>
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-category">${getCategoryName(item.category)}</div>
            </div>
            <div class="menu-item-actions">
                <button class="btn btn-warning btn-sm" onclick="editMenuItem(${item.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteMenuItem(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(card);
    });
}

// Alternar modo de visualização
function toggleViewMode() {
    const btn = document.getElementById('viewModeBtn');
    const btnText = document.getElementById('viewModeText');
    const btnIcon = btn.querySelector('i');
    
    if (currentViewMode === 'grid') {
        currentViewMode = 'list';
        btnIcon.className = 'fas fa-th';
        btnText.textContent = 'Grid';
        btn.classList.add('active');
    } else {
        currentViewMode = 'grid';
        btnIcon.className = 'fas fa-list';
        btnText.textContent = 'Lista';
        btn.classList.remove('active');
    }
    
    renderMenuItems();
}

// Pesquisar itens
function searchItems() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                             (item.description && item.description.toLowerCase().includes(searchTerm));
        const matchesCategory = !categoryFilter || item.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
    });
    
    renderMenuItems();
}

// Filtrar por categoria
function filterByCategory() {
    searchItems(); // Reutiliza a lógica de pesquisa
}

// Obter nome da categoria
function getCategoryName(category) {
    const categories = {
        'pasteis': 'Pastéis',
        'combos': 'Combos',
        'bebidas': 'Bebidas',
        'destaques': 'Destaques'
    };
    return categories[category] || category;
}

// Toggle para expandir/recolher formulário de adicionar
function toggleAddForm() {
    const form = document.getElementById('addItemForm');
    const content = document.getElementById('addFormContent');
    const toggle = document.getElementById('addFormToggle');
    
    form.classList.toggle('expanded');
    content.classList.toggle('expanded');
    toggle.classList.toggle('expanded');
}

// Adicionar novo item
function addMenuItem() {
    const name = document.getElementById('new-item-name').value.trim();
    const price = document.getElementById('new-item-price').value.trim();
    const category = document.getElementById('new-item-category').value;
    const description = document.getElementById('new-item-description').value.trim();
    
    if (!name || !price) {
        showNotification('Preencha nome e preço!', 'error');
        return;
    }
    
    // Converter preço para número
    const priceNum = parseFloat(price.replace('R$', '').replace(',', '.').trim());
    
    if (isNaN(priceNum)) {
        showNotification('Preço inválido!', 'error');
        return;
    }
    
    const newItem = {
        id: Date.now(),
        name,
        price: priceNum,
        category,
        description
    };
    
    menuItems.push(newItem);
    saveMenuItems();
    
    // Limpar formulário
    document.getElementById('new-item-name').value = '';
    document.getElementById('new-item-price').value = '';
    document.getElementById('new-item-description').value = '';
    
    // Fechar formulário após adicionar
    toggleAddForm();
    
    // Aplicar filtros atuais
    searchItems();
    
    showNotification('Item adicionado com sucesso!', 'success');
}

// Editar item
function editMenuItem(id) {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    
    // Armazenar item sendo editado
    currentEditingItem = item;
    
    // Preencher o modal com os dados do item
    document.getElementById('edit-item-name').value = item.name;
    document.getElementById('edit-item-price').value = item.price.toFixed(2).replace('.', ',');
    document.getElementById('edit-item-category').value = item.category;
    document.getElementById('edit-item-description').value = item.description || '';
    
    // Mostrar o modal
    openEditModal();
}

// Abrir modal de edição
function openEditModal() {
    const modal = document.getElementById('editModal');
    modal.classList.add('show');
    
    // Focar no primeiro campo
    setTimeout(() => {
        document.getElementById('edit-item-name').focus();
    }, 100);
    
    // Adicionar evento de ESC para fechar
    document.addEventListener('keydown', handleEscapeKey);
}

// Fechar modal de edição
function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.classList.remove('show');
    currentEditingItem = null;
    
    // Remover evento de ESC
    document.removeEventListener('keydown', handleEscapeKey);
}

// Manipular tecla ESC
function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeEditModal();
    }
}

// Salvar item editado
function saveEditedItem() {
    if (!currentEditingItem) return;
    
    const name = document.getElementById('edit-item-name').value.trim();
    const price = document.getElementById('edit-item-price').value.trim();
    const category = document.getElementById('edit-item-category').value;
    const description = document.getElementById('edit-item-description').value.trim();
    
    // Validar campos obrigatórios
    if (!name || !price) {
        showNotification('Preencha nome e preço!', 'error');
        return;
    }
    
    // Converter preço para número
    const priceNum = parseFloat(price.replace('R$', '').replace(',', '.').trim());
    
    if (isNaN(priceNum)) {
        showNotification('Preço inválido!', 'error');
        return;
    }
    
    // Atualizar o item
    currentEditingItem.name = name;
    currentEditingItem.price = priceNum;
    currentEditingItem.category = category;
    currentEditingItem.description = description;
    
    // Salvar no localStorage
    saveMenuItems();
    
    // Atualizar a interface
    searchItems(); // Aplicar filtros atuais
    updateDashboardStats();
    
    // Fechar modal
    closeEditModal();
    
    // Mostrar notificação de sucesso
    showNotification('Item atualizado com sucesso!', 'success');
}

// Excluir item
function deleteMenuItem(id) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    
    menuItems = menuItems.filter(i => i.id !== id);
    saveMenuItems();
    searchItems(); // Aplicar filtros atuais
    updateDashboardStats();
    showNotification('Item excluído com sucesso!', 'success');
}

// Salvar itens no localStorage
function saveMenuItems() {
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
}

// Carregar configurações
function loadSettings() {
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
        document.getElementById('site-title').value = settings.siteTitle || '';
        document.getElementById('delivery-fee').value = settings.deliveryFee || 'R$ 5,00';
    }
}

// Salvar configurações
function saveSettings() {
    settings.siteTitle = document.getElementById('site-title').value;
    settings.deliveryFee = document.getElementById('delivery-fee').value;
    
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    showNotification('Configurações salvas com sucesso!', 'success');
}

// Carregar número do WhatsApp
function loadWhatsApp() {
    const savedWhatsApp = localStorage.getItem('whatsappNumber');
    if (savedWhatsApp) {
        document.getElementById('whatsapp-number').value = savedWhatsApp;
    } else {
        document.getElementById('whatsapp-number').value = '5519992450000';
    }
}

// Salvar número do WhatsApp
function saveWhatsApp() {
    const number = document.getElementById('whatsapp-number').value.trim();
    
    if (!number) {
        showNotification('Informe o número do WhatsApp!', 'error');
        return;
    }
    
    // Validar formato básico
    if (!/^\d{10,13}$/.test(number)) {
        showNotification('Número inválido! Use apenas números (DDD + número).', 'error');
        return;
    }
    
    localStorage.setItem('whatsappNumber', number);
    showNotification('Número do WhatsApp salvo com sucesso!', 'success');
}

// Mostrar notificação
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remover notificação após 3 segundos
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Formatar preço automaticamente
document.getElementById('new-item-price')?.addEventListener('input', (e) => {
    let value = e.target.value.replace(/[^\d,]/g, '');
    const parts = value.split(',');
    
    if (parts.length > 1) {
        parts[1] = parts[1].substring(0, 2);
        value = parts[0] + ',' + parts[1];
    }
    
    e.target.value = value;
});

// Formatar preço do modal de edição automaticamente
document.getElementById('edit-item-price')?.addEventListener('input', (e) => {
    let value = e.target.value.replace(/[^\d,]/g, '');
    const parts = value.split(',');
    
    if (parts.length > 1) {
        parts[1] = parts[1].substring(0, 2);
        value = parts[0] + ',' + parts[1];
    }
    
    e.target.value = value;
});

// Formatar taxa de entrega automaticamente
document.getElementById('delivery-fee')?.addEventListener('input', (e) => {
    let value = e.target.value.replace(/[^\d,]/g, '');
    const parts = value.split(',');
    
    if (parts.length > 1) {
        parts[1] = parts[1].substring(0, 2);
        value = parts[0] + ',' + parts[1];
    }
    
    e.target.value = value;
});

// Fechar modal ao clicar fora dele
document.getElementById('editModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'editModal') {
        closeEditModal();
    }
});
