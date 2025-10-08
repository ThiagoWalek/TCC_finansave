document.addEventListener('DOMContentLoaded', function() {
    // Validação de formulários
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

    // Indica que o DOM está carregado para possíveis estilos
    document.body.classList.add('dom-loaded');
});