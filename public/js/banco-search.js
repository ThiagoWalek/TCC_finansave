/**
 * Funcionalidade de busca dinâmica de bancos
 * Integra com a API /api/bancos para fornecer sugestões em tempo real
 */

class BancoSearch {
    constructor(inputElement, listElement) {
        this.input = inputElement;
        this.list = listElement;
        this.debounceTimer = null;
        this.isVisible = false;
        
        this.init();
    }
    
    init() {
        // Eventos do input
        this.input.addEventListener('input', (e) => this.handleInput(e));
        this.input.addEventListener('focus', (e) => this.handleFocus(e));
        this.input.addEventListener('blur', (e) => this.handleBlur(e));
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Criar lista de sugestões se não existir
        if (!this.list) {
            this.createSuggestionList();
        }
        
        // Fechar lista ao clicar fora
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.list.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }
    
    createSuggestionList() {
        this.list = document.createElement('div');
        this.list.className = 'banco-suggestions';
        this.list.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        // Inserir após o input
        this.input.parentNode.style.position = 'relative';
        this.input.parentNode.appendChild(this.list);
    }
    
    handleInput(e) {
        const query = e.target.value.trim();
        
        // Debounce para evitar muitas requisições
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            if (query.length >= 2) {
                this.searchBancos(query);
            } else {
                this.hideSuggestions();
            }
        }, 300);
    }
    
    handleFocus(e) {
        const query = e.target.value.trim();
        if (query.length >= 2) {
            this.searchBancos(query);
        }
    }
    
    handleBlur(e) {
        // Delay para permitir clique nas sugestões
        setTimeout(() => {
            this.hideSuggestions();
        }, 150);
    }
    
    handleKeydown(e) {
        if (!this.isVisible) return;
        
        const items = this.list.querySelectorAll('.banco-item');
        const currentActive = this.list.querySelector('.banco-item.active');
        let activeIndex = -1;
        
        if (currentActive) {
            activeIndex = Array.from(items).indexOf(currentActive);
        }
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                activeIndex = Math.min(activeIndex + 1, items.length - 1);
                this.setActiveItem(items, activeIndex);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                activeIndex = Math.max(activeIndex - 1, -1);
                this.setActiveItem(items, activeIndex);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (currentActive) {
                    this.selectBanco(currentActive.dataset.nome);
                }
                break;
                
            case 'Escape':
                this.hideSuggestions();
                break;
        }
    }
    
    setActiveItem(items, index) {
        items.forEach(item => item.classList.remove('active'));
        if (index >= 0 && index < items.length) {
            items[index].classList.add('active');
        }
    }
    
    async searchBancos(query) {
        try {
            const response = await fetch(`/api/bancos?busca=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Erro na busca');
            
            const bancos = await response.json();
            this.displaySuggestions(bancos);
        } catch (error) {
            console.error('Erro ao buscar bancos:', error);
            this.hideSuggestions();
        }
    }
    
    displaySuggestions(bancos) {
        if (bancos.length === 0) {
            this.hideSuggestions();
            return;
        }
        
        this.list.innerHTML = bancos.map(banco => `
            <div class="banco-item" data-codigo="${banco.codigo}" data-nome="${banco.nome}">
                <div class="banco-info">
                    <span class="banco-nome">${banco.nome}</span>
                    <span class="banco-codigo">${banco.codigo}</span>
                </div>
            </div>
        `).join('');
        
        // Adicionar estilos aos itens
        const items = this.list.querySelectorAll('.banco-item');
        items.forEach(item => {
            item.style.cssText = `
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid var(--border);
                transition: background-color 0.2s;
            `;
            
            item.querySelector('.banco-info').style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            item.querySelector('.banco-nome').style.cssText = `
                color: var(--text-white);
                font-weight: 500;
            `;
            
            item.querySelector('.banco-codigo').style.cssText = `
                color: var(--text-secondary);
                font-size: 0.875rem;
                background: var(--primary);
                padding: 2px 8px;
                border-radius: 4px;
            `;
            
            // Eventos de hover e click
            item.addEventListener('mouseenter', () => {
                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                item.style.backgroundColor = 'var(--primary-hover)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = '';
            });
            
            item.addEventListener('click', () => {
                this.selectBanco(item.dataset.nome);
            });
        });
        
        // Remover borda do último item
        if (items.length > 0) {
            items[items.length - 1].style.borderBottom = 'none';
        }
        
        this.showSuggestions();
    }
    
    selectBanco(nome) {
        this.input.value = nome;
        this.hideSuggestions();
        
        // Disparar evento de mudança
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    showSuggestions() {
        this.list.style.display = 'block';
        this.isVisible = true;
    }
    
    hideSuggestions() {
        this.list.style.display = 'none';
        this.isVisible = false;
        
        // Limpar itens ativos
        const items = this.list.querySelectorAll('.banco-item');
        items.forEach(item => item.classList.remove('active'));
    }
}

// Inicializar automaticamente quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    const instituicaoInput = document.getElementById('instituicao');
    if (instituicaoInput) {
        new BancoSearch(instituicaoInput);
    }
});