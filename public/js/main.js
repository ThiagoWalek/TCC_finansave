document.addEventListener('DOMContentLoaded', function() {
    // Inicialização de tooltips e popovers do Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    const popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Animação para cards
    const animateCards = () => {
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animated');
            }, 100 * index);
        });
    };

    // Efeito de destaque para itens do menu
    const highlightActiveMenuItem = () => {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === '/' && currentPath === '/') {
                link.classList.add('active');
            } else if (href !== '/' && currentPath.startsWith(href)) {
                link.classList.add('active');
            }
        });
    };

    // Formatação de valores monetários
    const formatCurrency = () => {
        const currencyElements = document.querySelectorAll('.format-currency');
        currencyElements.forEach(element => {
            const value = parseFloat(element.textContent.replace('R$', '').trim());
            if (!isNaN(value)) {
                element.textContent = 'R$ ' + value.toFixed(2).replace('.', ',');
            }
        });
    };

    // Formatação de datas
    const formatDates = () => {
        const dateElements = document.querySelectorAll('.format-date');
        dateElements.forEach(element => {
            const date = new Date(element.textContent);
            if (!isNaN(date.getTime())) {
                element.textContent = date.toLocaleDateString('pt-BR');
            }
        });
    };

    // Efeito de scroll suave para links internos
    const smoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 70,
                        behavior: 'smooth'
                    });
                }
            });
        });
    };

    // Validação de formulários
    const validateForms = () => {
        const forms = document.querySelectorAll('.needs-validation');
        
        Array.from(forms).forEach(form => {
            form.addEventListener('submit', event => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                
                form.classList.add('was-validated');
            }, false);
        });
    };

    // Máscaras para inputs
    const applyInputMasks = () => {
        // Máscara para valores monetários
        const moneyInputs = document.querySelectorAll('.money-mask');
        moneyInputs.forEach(input => {
            input.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                value = (parseInt(value) / 100).toFixed(2);
                e.target.value = value.replace('.', ',');
            });
        });

        // Máscara para datas
        const dateInputs = document.querySelectorAll('.date-mask');
        dateInputs.forEach(input => {
            input.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 8) value = value.substring(0, 8);
                if (value.length > 4) value = value.substring(0, 4) + '-' + value.substring(4);
                if (value.length > 2) value = value.substring(0, 2) + '-' + value.substring(2);
                e.target.value = value;
            });
        });
    };

    // Efeito de contador para números
    const animateNumbers = () => {
        const numberElements = document.querySelectorAll('.animate-number');
        
        numberElements.forEach(element => {
            const finalValue = parseFloat(element.textContent);
            let startValue = 0;
            const duration = 1000;
            const increment = finalValue / (duration / 16);
            
            const timer = setInterval(() => {
                startValue += increment;
                if (startValue >= finalValue) {
                    element.textContent = finalValue.toFixed(2).replace('.', ',');
                    clearInterval(timer);
                } else {
                    element.textContent = startValue.toFixed(2).replace('.', ',');
                }
            }, 16);
        });
    };

    // Efeito de toggle para cards colapsáveis
    const setupCollapsibleCards = () => {
        const toggleButtons = document.querySelectorAll('.card-toggle');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    targetElement.classList.toggle('show');
                    this.querySelector('i').classList.toggle('fa-chevron-down');
                    this.querySelector('i').classList.toggle('fa-chevron-up');
                }
            });
        });
    };

    // Tema claro/escuro
    const setupThemeToggle = () => {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            // Verifica se há preferência salva e aplica imediatamente
            const savedTheme = localStorage.getItem('dark-theme');
            if (savedTheme === 'true') {
                document.body.classList.add('dark-theme');
                // Atualiza o ícone para o sol quando estiver no modo escuro
                const icon = themeToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                }
            }
            
            // Adiciona o evento de clique para alternar o tema
            themeToggle.addEventListener('click', function() {
                document.body.classList.toggle('dark-theme');
                const isDarkTheme = document.body.classList.contains('dark-theme');
                localStorage.setItem('dark-theme', isDarkTheme);
                
                // Atualiza o ícone
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-moon');
                    icon.classList.toggle('fa-sun');
                }
            });
        }
    };

    // Inicializa todas as funções
    animateCards();
    highlightActiveMenuItem();
    formatCurrency();
    formatDates();
    smoothScroll();
    validateForms();
    applyInputMasks();
    animateNumbers();
    setupCollapsibleCards();
    setupThemeToggle();

    // Adiciona classe para indicar que o DOM está carregado
    document.body.classList.add('dom-loaded');
});

// Função para mostrar/esconder senha
function togglePasswordVisibility(inputId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Função para confirmar exclusão
function confirmarExclusao(event, mensagem = 'Tem certeza que deseja excluir este item?') {
    if (!confirm(mensagem)) {
        event.preventDefault();
        return false;
    }
    return true;
}

// Função para formatar valores monetários em inputs
function formatarMoeda(input) {
    let valor = input.value.replace(/\D/g, '');
    valor = (parseFloat(valor) / 100).toFixed(2);
    input.value = valor.replace('.', ',');
}

// Função para calcular progresso de metas e orçamentos
function calcularProgresso(atual, meta) {
    if (!meta || meta == 0) return 0;
    const progresso = (atual / meta) * 100;
    return Math.min(progresso, 100).toFixed(0);
}