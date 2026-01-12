// Variáveis globais
let cart = [];
let editMode = false;
const CART_STORAGE_KEY = 'pastelaria_cart';
const MENU_ITEMS_STORAGE_KEY = 'pastelaria_menu_items';

// Elementos do DOM
const cartBtn = document.querySelector('.cart-btn');
const cartOverlay = document.querySelector('.cart-overlay');
const closeCartBtn = document.querySelector('.close-cart');
const cartItemsEl = document.querySelector('.cart-items');
const cartTotalEl = document.getElementById('cart-total');
const cartCountEl = document.querySelector('.cart-count');
const editModeToggle = document.getElementById('edit-mode-toggle');
const checkoutBtn = document.getElementById('checkout-whatsapp');

// Inicialização
console.log('Script carregado com sucesso!');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM totalmente carregado');
    loadCart();
    setupEventListeners();
    updateCartUI();
    
    // Carregar itens do menu salvos no localStorage, se existirem
    const savedMenuItems = localStorage.getItem(MENU_ITEMS_STORAGE_KEY);
    if (savedMenuItems) {
        // Atualizar preços dos itens do menu
        const menuItemsData = JSON.parse(savedMenuItems);
        updateMenuItems(menuItemsData);
    }
});

// Configurar event listeners
function setupEventListeners() {
    console.log('Configurando event listeners...');
    console.log('Botão de carrinho:', cartBtn);
    console.log('Botão de fechar carrinho:', closeCartBtn);
    
    // Carrinho
    cartBtn.addEventListener('click', function() {
        console.log('Abrindo carrinho');
        toggleCart();
    });
    
    closeCartBtn.addEventListener('click', function() {
        console.log('Fechando carrinho');
        toggleCart();
    });
    
    // Navegação por seções
    document.querySelectorAll('.category-btn').forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            const section = document.getElementById(category);
            if (section) {
                // Fechar o carrinho se estiver aberto
                if (cartOverlay.classList.contains('active')) {
                    toggleCart();
                }
                
                // Rolagem suave para a seção
                section.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Atualizar botão ativo
                document.querySelectorAll('.category-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });
    
    // Ações (cardápio + carrinho)
    document.addEventListener('click', (e) => {
        const plusBtn = e.target.closest('button.plus');
        const minusBtn = e.target.closest('button.minus');
        const addBtn = e.target.closest('button.btn-add');
        const addToCartBtn = e.target.closest('button.btn-add-to-cart');
        const removeAllBtn = e.target.closest('button.cart-item-remove');
 
        // Finalizar pedido
        if (e.target === checkoutBtn || e.target.closest('#checkout-whatsapp')) {
            checkout();
            return;
        }
 
        // Lixeira do carrinho: remove todos os itens iguais
        if (removeAllBtn) {
            const cartItemEl = removeAllBtn.closest('.cart-item');
            const name = cartItemEl?.dataset?.name;
            if (name) {
                removeAllFromCartByName(name);
            }
            return;
        }
 
        // Botões +/- dentro do carrinho: alteram o carrinho
        if (plusBtn || minusBtn) {
            const cartItemEl = (plusBtn || minusBtn).closest('.cart-item');
            if (cartItemEl) {
                const name = cartItemEl.dataset?.name;
                if (name) {
                    if (plusBtn) changeCartItemQuantityByName(name, +1);
                    if (minusBtn) changeCartItemQuantityByName(name, -1);
                }
                return;
            }
 
            // Botões +/- no cardápio: apenas mudam a quantidade exibida
            const menuItemEl = (plusBtn || minusBtn).closest('.menu-item, .combo-item');
            if (menuItemEl) {
                updateMenuDisplayedQuantity(menuItemEl, plusBtn ? +1 : -1);
            }
            return;
        }
 
        // Botão "Adicionar" (cardápio): adiciona a quantidade selecionada
        if (addBtn) {
            const menuItemEl = addBtn.closest('.menu-item, .combo-item');
            const qty = getMenuDisplayedQuantity(menuItemEl);
            if (!qty) {
                showNotification('Selecione a quantidade antes de adicionar.', 'error');
                return;
            }
            addToCart(menuItemEl, qty);
            setMenuDisplayedQuantity(menuItemEl, 0);
            return;
        }
 
        // Botão "Adicionar ao Carrinho" (destaques): adiciona 1 unidade
        if (addToCartBtn) {
            const highlightEl = addToCartBtn.closest('.highlight-item');
            if (highlightEl) {
                addToCart(highlightEl, 1);
            }
        }
    });
    
    // Salvar alterações nos preços
    document.addEventListener('blur', (e) => {
        if (e.target.classList.contains('item-price') && editMode) {
            saveMenuItems();
        }
    }, true);
    
    // Permitir apenas números e vírgula nos preços
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('item-price') && editMode) {
            // Formatar o valor para o padrão R$ X,XX
            let value = e.target.textContent.replace(/[^0-9,]/g, '');
            const parts = value.split(',');
            
            if (parts.length > 1) {
                // Garantir apenas 2 casas decimais
                parts[1] = parts[1].substring(0, 2);
                value = parts[0] + ',' + parts[1];
            }
            
            // Atualizar o valor formatado
            e.target.textContent = 'R$ ' + value.replace(/\./g, ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            
            // Mover o cursor para o final
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(e.target);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    });
}

// Alternar o modo de edição
function toggleEditMode() {
    editMode = !editMode;
    const prices = document.querySelectorAll('.item-price');
    
    if (editMode) {
        editModeToggle.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        editModeToggle.style.backgroundColor = '#27ae60';
        editModeToggle.style.color = 'white';
    } else {
        editModeToggle.innerHTML = '<i class="fas fa-edit"></i> Modo Edição';
        editModeToggle.style.backgroundColor = '';
        editModeToggle.style.color = '';
        saveMenuItems();
    }
    
    // Ativar/desativar edição dos preços
    prices.forEach(priceEl => {
        priceEl.contentEditable = editMode;
    });
}

// Salvar itens do menu no localStorage
function saveMenuItems() {
    const menuItems = [];
    const itemElements = document.querySelectorAll('.menu-item, .combo-item');
    
    itemElements.forEach(itemEl => {
        const name = itemEl.querySelector('h4')?.textContent || '';
        const priceText = itemEl.querySelector('.item-price')?.textContent || '';
        const price = parseFloat(priceText.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
        const category = itemEl.closest('.category')?.querySelector('h3')?.textContent || '';
        
        menuItems.push({
            name,
            price,
            category,
            description: itemEl.querySelector('p')?.textContent || ''
        });
    });
    
    localStorage.setItem(MENU_ITEMS_STORAGE_KEY, JSON.stringify(menuItems));
}

// Atualizar itens do menu com dados salvos
function updateMenuItems(menuItemsData) {
    const itemElements = document.querySelectorAll('.menu-item, .combo-item');
    
    itemElements.forEach(itemEl => {
        const name = itemEl.querySelector('h4')?.textContent.trim() || '';
        const category = itemEl.closest('.category')?.querySelector('h3')?.textContent.trim() || '';
        
        // Encontrar item correspondente nos dados salvos
        const savedItem = menuItemsData.find(item => 
            item.name === name && item.category === category
        );
        
        if (savedItem) {
            const priceEl = itemEl.querySelector('.item-price');
            if (priceEl) {
                priceEl.textContent = 'R$ ' + savedItem.price.toFixed(2).replace('.', ',');
            }
            
            const descriptionEl = itemEl.querySelector('p');
            if (descriptionEl && savedItem.description) {
                descriptionEl.textContent = savedItem.description;
            }
        }
    });
 }

function getItemDataFromElement(itemEl) {
    if (!itemEl) return null;
 
    const name = (itemEl.querySelector('h4')?.textContent || itemEl.querySelector('h3')?.textContent || '').trim();
    if (!name) return null;
 
    const priceEl = itemEl.querySelector('.item-price, .highlight-price, .discounted-price');
    const priceText = priceEl?.textContent || '';
    const price = parseFloat(priceText.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
 
    const description = (
        itemEl.querySelector('.item-description')?.textContent ||
        itemEl.querySelector('p')?.textContent ||
        itemEl.querySelector('.combo-description')?.textContent ||
        ''
    ).trim();
 
    return { name, price, description };
}

function addToCartByData(itemData, quantityToAdd = 1) {
    if (!itemData || !quantityToAdd) return;
 
    const { name, price, description } = itemData;
 
    // Verificar se o item já está no carrinho
    const existingItem = cart.find(item => item.name === name);
 
    if (existingItem) {
        existingItem.quantity += quantityToAdd;
    } else {
        cart.push({
            name,
            price,
            quantity: quantityToAdd,
            description
        });
    }
 
    saveCart();
    updateCartUI();
    showNotification('Item adicionado ao carrinho!');
}

// Adicionar item ao carrinho
function addToCart(itemEl, quantityToAdd = 1) {
    const itemData = getItemDataFromElement(itemEl);
    addToCartByData(itemData, quantityToAdd);
}

function changeCartItemQuantityByName(name, delta) {
    const existingItem = cart.find(item => item.name === name);
    if (!existingItem) return;
 
    existingItem.quantity += delta;
    if (existingItem.quantity <= 0) {
        cart = cart.filter(item => item.name !== name);
    }
 
    saveCart();
    updateCartUI();
}

function removeAllFromCartByName(name) {
    cart = cart.filter(item => item.name !== name);
    saveCart();
    updateCartUI();
}

function getMenuDisplayedQuantity(menuItemEl) {
    const qtyEl = menuItemEl?.querySelector('.item-quantity .quantity');
    const qty = parseInt(qtyEl?.textContent || '0', 10);
    return Number.isFinite(qty) ? qty : 0;
}

function setMenuDisplayedQuantity(menuItemEl, qty) {
    const qtyEl = menuItemEl?.querySelector('.item-quantity .quantity');
    if (!qtyEl) return;
    qtyEl.textContent = String(Math.max(0, qty));
}

function updateMenuDisplayedQuantity(menuItemEl, delta) {
    const current = getMenuDisplayedQuantity(menuItemEl);
    setMenuDisplayedQuantity(menuItemEl, current + delta);
}

// Atualizar a interface do carrinho
function updateCartUI() {
    // Atualizar contador do carrinho
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCountEl.textContent = totalItems;
    
    // Atualizar itens do carrinho
    cartItemsEl.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsEl.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
        cartTotalEl.textContent = 'R$ 0,00';
        return;
    }
    
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'cart-item';
        cartItemEl.dataset.name = item.name;
        cartItemEl.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>${item.description}</p>
                <div class="cart-item-quantity">
                    <button class="quantity-btn minus">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn plus">+</button>
                    <button class="cart-item-remove" title="Remover todos">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="cart-item-price">R$ ${itemTotal.toFixed(2).replace('.', ',')}</div>
        `;
        
        cartItemsEl.appendChild(cartItemEl);
    });
    
    // Atualizar total
    cartTotalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// Alternar visibilidade do carrinho
function toggleCart() {
    console.log('toggleCart chamado');
    console.log('Estado atual do carrinho (antes):', cartOverlay.classList.contains('active') ? 'aberto' : 'fechado');
    cartOverlay.classList.toggle('active');
    console.log('Estado atual do carrinho (depois):', cartOverlay.classList.contains('active') ? 'aberto' : 'fechado');
}

// Salvar carrinho no localStorage
function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

// Carregar carrinho do localStorage
function loadCart() {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Finalizar pedido via WhatsApp
function checkout() {
    if (cart.length === 0) {
        showNotification('Adicione itens ao carrinho primeiro!', 'error');
        return;
    }
    
    // Validar campos obrigatórios
    const customerName = document.getElementById('customer-name').value.trim();
    const customerNeighborhood = document.getElementById('customer-neighborhood').value;
    
    if (!customerName) {
        showNotification('Por favor, informe seu nome!', 'error');
        return;
    }
    
    if (!customerNeighborhood) {
        showNotification('Por favor, selecione seu bairro!', 'error');
        return;
    }
    
    // Número de telefone da loja (substitua pelo número correto)
    const phoneNumber = '5519992450000';
    
    // Construir mensagem
    let message = 'Olá! Gostaria de fazer um pedido:\n\n';
    let total = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const descriptionText = item.description ? ` (${item.description})` : '';
        message += `${index + 1}. ${item.quantity}x ${item.name}${descriptionText} - R$ ${itemTotal.toFixed(2).replace('.', ',')}%0A`;
    });
    
    message += `%0A*Total: R$ ${total.toFixed(2).replace('.', ',')}*%0A%0A`;
    const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
    if (selectedPaymentMethod) {
        message += `Forma de pagamento: ${selectedPaymentMethod}%0A%0A`;
    }
    message += 'Dados para entrega:%0A';
    message += `Nome: ${customerName}%0A`;
    message += `Bairro: ${customerNeighborhood}%0A`;
    message += 'Endereço: [Complemento - Rua, número, casa/apt]%0A';
    message += 'Ponto de referência: [Opcional]%0A';
    message += 'Telefone: [Seu Telefone]%0A%0A';
    message += 'Observações: [Opcional]';
    
    // Codificar a mensagem para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Abrir WhatsApp com a mensagem
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    
    // Limpar carrinho após o pedido
    cart = [];
    saveCart();
    updateCartUI();
    toggleCart();
}

// Mostrar notificação
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remover notificação após 3 segundos
    setTimeout(() => {
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }, 100);
}

// Adicionar estilos para notificações
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background-color: #27ae60;
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 2000;
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .notification.show {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
    }
    
    .notification.error {
        background-color: #e74c3c;
    }
    
    .empty-cart {
        text-align: center;
        color: var(--dark-gray);
        padding: 2rem 0;
    }
    
    .item-actions {
        display: flex;
        align-items: center;
        margin-top: 0.5rem;
    }
`;

document.head.appendChild(style);
