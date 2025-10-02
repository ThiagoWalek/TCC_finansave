// Dashboard Charts - Gráficos Interativos
class DashboardCharts {
    constructor() {
        this.charts = {};
        this.colors = {
            primary: '#3a7bd5',
            success: '#28a745',
            danger: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8',
            light: '#f8f9fa',
            dark: '#343a40'
        };
        this.gradients = {};
        this.init();
    }

    init() {
        this.createGradients();
        this.loadFinancialSummary();
        this.initSaldoChart();
        this.initCategoriaChart();
        this.initComparativoChart();
        this.bindEvents();
    }

    createGradients() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Gradiente para receitas
        this.gradients.success = ctx.createLinearGradient(0, 0, 0, 400);
        this.gradients.success.addColorStop(0, 'rgba(40, 167, 69, 0.8)');
        this.gradients.success.addColorStop(1, 'rgba(40, 167, 69, 0.1)');
        
        // Gradiente para despesas
        this.gradients.danger = ctx.createLinearGradient(0, 0, 0, 400);
        this.gradients.danger.addColorStop(0, 'rgba(220, 53, 69, 0.8)');
        this.gradients.danger.addColorStop(1, 'rgba(220, 53, 69, 0.1)');
        
        // Gradiente para saldo
        this.gradients.primary = ctx.createLinearGradient(0, 0, 0, 400);
        this.gradients.primary.addColorStop(0, 'rgba(58, 123, 213, 0.8)');
        this.gradients.primary.addColorStop(1, 'rgba(58, 123, 213, 0.1)');
    }

    async loadFinancialSummary() {
        try {
            const response = await fetch('/api/dashboard/resumo-financeiro');
            const data = await response.json();
            
            // Atualizar valores nos cards
            document.getElementById('totalReceitas').textContent = 
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.receitas || 0);
            document.getElementById('totalDespesas').textContent = 
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.despesas || 0);
            document.getElementById('saldoAtual').textContent = 
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.saldo || 0);
                
        } catch (error) {
            console.error('Erro ao carregar resumo financeiro:', error);
        }
    }

    async initSaldoChart() {
        const ctx = document.getElementById('saldoChart').getContext('2d');
        
        try {
            const response = await fetch('/api/dashboard/evolucao-saldo?periodo=7');
            const data = await response.json();
            
            this.charts.saldo = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels || [],
                    datasets: [{
                        label: 'Saldo',
                        data: data.valores || [],
                        borderColor: this.colors.primary,
                        backgroundColor: this.gradients.primary,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: this.colors.primary,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: this.colors.primary,
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    return 'Saldo: ' + new Intl.NumberFormat('pt-BR', { 
                                        style: 'currency', 
                                        currency: 'BRL' 
                                    }).format(context.parsed.y);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return new Intl.NumberFormat('pt-BR', { 
                                        style: 'currency', 
                                        currency: 'BRL',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(value);
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao carregar gráfico de saldo:', error);
        }
    }

    async initCategoriaChart() {
        const ctx = document.getElementById('categoriaChart').getContext('2d');
        
        try {
            const response = await fetch('/api/dashboard/gastos-categoria');
            const data = await response.json();
            
            const colors = [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
            ];
            
            this.charts.categoria = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.categorias || [],
                    datasets: [{
                        data: data.valores || [],
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: '#fff',
                        hoverBorderWidth: 3,
                        hoverBorderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return context.label + ': ' + 
                                           new Intl.NumberFormat('pt-BR', { 
                                               style: 'currency', 
                                               currency: 'BRL' 
                                           }).format(context.parsed) + 
                                           ' (' + percentage + '%)';
                                }
                            }
                        }
                    },
                    cutout: '60%'
                }
            });
        } catch (error) {
            console.error('Erro ao carregar gráfico de categorias:', error);
        }
    }

    async initComparativoChart() {
        const ctx = document.getElementById('comparativoChart').getContext('2d');
        
        // Carregar opções de filtro
        await this.loadFilterOptions();
        
        try {
            const response = await fetch('/api/dashboard/comparativo-mensal');
            const data = await response.json();
            
            this.charts.comparativo = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.meses || [],
                    datasets: [{
                        label: 'Receitas',
                        data: data.receitas || [],
                        backgroundColor: this.colors.success,
                        borderColor: this.colors.success,
                        borderWidth: 1,
                        borderRadius: 4,
                        borderSkipped: false
                    }, {
                        label: 'Despesas',
                        data: data.despesas || [],
                        backgroundColor: this.colors.danger,
                        borderColor: this.colors.danger,
                        borderWidth: 1,
                        borderRadius: 4,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + 
                                           new Intl.NumberFormat('pt-BR', { 
                                               style: 'currency', 
                                               currency: 'BRL' 
                                           }).format(context.parsed.y);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return new Intl.NumberFormat('pt-BR', { 
                                        style: 'currency', 
                                        currency: 'BRL',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(value);
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
            
            // Atualizar indicadores de resumo
            this.updateSummaryIndicators(data);
            
        } catch (error) {
            console.error('Erro ao carregar gráfico comparativo:', error);
        }
    }

    async loadFilterOptions() {
        try {
            // Carregar categorias
            const categoriasResponse = await fetch('/api/dashboard/categorias', {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!categoriasResponse.ok) {
                throw new Error(`HTTP error! status: ${categoriasResponse.status}`);
            }
            
            const categorias = await categoriasResponse.json();
            const filtroCategoria = document.getElementById('filtroCategoria');
            
            // Limpar opções existentes (exceto a primeira)
            while (filtroCategoria.children.length > 1) {
                filtroCategoria.removeChild(filtroCategoria.lastChild);
            }
            
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria;
                option.textContent = categoria;
                filtroCategoria.appendChild(option);
            });
            
            // Carregar contas
            const contasResponse = await fetch('/api/dashboard/contas', {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!contasResponse.ok) {
                throw new Error(`HTTP error! status: ${contasResponse.status}`);
            }
            
            const contas = await contasResponse.json();
            const filtroConta = document.getElementById('filtroConta');
            
            // Limpar opções existentes (exceto a primeira)
            while (filtroConta.children.length > 1) {
                filtroConta.removeChild(filtroConta.lastChild);
            }
            
            contas.forEach(conta => {
                const option = document.createElement('option');
                option.value = conta.conta_id;
                option.textContent = conta.nome;
                filtroConta.appendChild(option);
            });
            
        } catch (error) {
            console.error('Erro ao carregar opções de filtro:', error);
        }
    }

    updateSummaryIndicators(data) {
        // Verificar se os dados são válidos
        if (!data || typeof data !== 'object') {
            console.warn('Dados inválidos para indicadores de resumo');
            return;
        }
        
        // Garantir que arrays existam e tenham dados
        const receitas = data.receitas || [];
        const despesas = data.despesas || [];
        const meses = data.meses || [];
        
        if (receitas.length === 0 || despesas.length === 0 || meses.length === 0) {
            console.warn('Arrays vazios para indicadores de resumo');
            // Limpar indicadores se não há dados
            document.getElementById('mediaReceitas').textContent = 'R$ 0,00';
            document.getElementById('mediaDespesas').textContent = 'R$ 0,00';
            document.getElementById('melhorMes').textContent = '-';
            document.getElementById('variacao').textContent = '0.0%';
            return;
        }
        
        // Calcular médias
        const mediaReceitas = receitas.reduce((a, b) => a + b, 0) / receitas.length;
        const mediaDespesas = despesas.reduce((a, b) => a + b, 0) / despesas.length;
        
        // Encontrar melhor mês (maior saldo)
        const saldos = receitas.map((receita, index) => receita - (despesas[index] || 0));
        const melhorMesIndex = saldos.indexOf(Math.max(...saldos));
        const melhorMes = meses[melhorMesIndex] || '-';
        
        // Calcular variação (último vs primeiro mês)
        const primeiroSaldo = receitas[0] - despesas[0];
        const ultimoSaldo = receitas[receitas.length - 1] - despesas[despesas.length - 1];
        const variacao = primeiroSaldo !== 0 ? ((ultimoSaldo - primeiroSaldo) / Math.abs(primeiroSaldo)) * 100 : 0;
        
        // Atualizar elementos com verificação de existência
        const mediaReceitasEl = document.getElementById('mediaReceitas');
        const mediaDespesasEl = document.getElementById('mediaDespesas');
        const melhorMesEl = document.getElementById('melhorMes');
        const variacaoEl = document.getElementById('variacao');
        
        if (mediaReceitasEl) {
            mediaReceitasEl.textContent = 
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mediaReceitas);
        }
        
        if (mediaDespesasEl) {
            mediaDespesasEl.textContent = 
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mediaDespesas);
        }
        
        if (melhorMesEl) {
            melhorMesEl.textContent = melhorMes;
        }
        
        if (variacaoEl) {
            variacaoEl.textContent = variacao.toFixed(1) + '%';
            variacaoEl.className = variacao >= 0 ? 'text-success' : 'text-danger';
        }
    }

    updateComparativoTable(data, tipo) {
        const tabelaBody = document.getElementById('tabelaBody');
        const tabelaHeader = document.getElementById('tabelaHeader');
        
        // Verificar se os elementos existem
        if (!tabelaBody || !tabelaHeader) {
            console.warn('Elementos da tabela não encontrados');
            return;
        }
        
        // Verificar se os dados são válidos
        if (!data || typeof data !== 'object') {
            console.warn('Dados inválidos para tabela comparativa');
            return;
        }
        
        // Garantir que arrays existam
        const meses = data.meses || [];
        const receitas = data.receitas || [];
        const despesas = data.despesas || [];
        const saldo = data.saldo || [];
        const gastosReais = data.gastosReais || [];
        
        // Limpar tabela
        tabelaBody.innerHTML = '';
        
        // Atualizar cabeçalho baseado no tipo
        if (tipo === 'gastos-reais') {
            tabelaHeader.innerHTML = `
                <th>Mês</th>
                <th>Orçado</th>
                <th>Real</th>
                <th>Diferença</th>
            `;
        } else if (tipo === 'saldo') {
            tabelaHeader.innerHTML = `
                <th>Mês</th>
                <th>Saldo</th>
                <th>Variação</th>
            `;
        } else {
            tabelaHeader.innerHTML = `
                <th>Mês</th>
                <th>Receitas</th>
                <th>Despesas</th>
                <th>Saldo</th>
            `;
        }
        
        // Preencher dados se existirem
        if (meses.length > 0) {
            meses.forEach((mes, index) => {
                const row = document.createElement('tr');
                
                if (tipo === 'gastos-reais') {
                    const orcado = despesas[index] || 0;
                    const real = gastosReais[index] || 0;
                    const diferenca = real - orcado;
                    
                    row.innerHTML = `
                        <td>${mes}</td>
                        <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orcado)}</td>
                        <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(real)}</td>
                        <td class="${diferenca >= 0 ? 'text-danger' : 'text-success'}">
                            ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(diferenca)}
                        </td>
                    `;
                } else if (tipo === 'saldo') {
                    const saldoAtual = saldo[index] || 0;
                    const saldoAnterior = index > 0 ? (saldo[index - 1] || 0) : 0;
                    const variacao = index > 0 && saldoAnterior !== 0 ? 
                        ((saldoAtual - saldoAnterior) / Math.abs(saldoAnterior)) * 100 : 0;
                    
                    row.innerHTML = `
                        <td>${mes}</td>
                        <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoAtual)}</td>
                        <td class="${variacao >= 0 ? 'text-success' : 'text-danger'}">
                            ${variacao.toFixed(1)}%
                        </td>
                    `;
                } else {
                    const receitaAtual = receitas[index] || 0;
                    const despesaAtual = despesas[index] || 0;
                    const saldoAtual = receitaAtual - despesaAtual;
                    
                    row.innerHTML = `
                        <td>${mes}</td>
                        <td class="text-success">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaAtual)}</td>
                        <td class="text-danger">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesaAtual)}</td>
                        <td class="${saldoAtual >= 0 ? 'text-success' : 'text-danger'}">
                            ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoAtual)}
                        </td>
                    `;
                }
                
                tabelaBody.appendChild(row);
            });
        } else {
            // Mostrar mensagem se não há dados
            const row = document.createElement('tr');
            const colSpan = tipo === 'gastos-reais' ? 4 : (tipo === 'saldo' ? 3 : 4);
            row.innerHTML = `<td colspan="${colSpan}" class="text-center text-muted">Nenhum dado disponível</td>`;
            tabelaBody.appendChild(row);
        }
    }

    bindEvents() {
        // Eventos para filtros de período do gráfico de saldo
        document.querySelectorAll('input[name="periodoSaldo"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updateSaldoChart(e.target.value);
            });
        });

        // Eventos para filtros do gráfico comparativo
        document.querySelectorAll('input[name="tipoComparativo"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updateComparativoChart();
            });
        });

        // Eventos para filtros de período do comparativo
        document.querySelectorAll('input[name="periodoComparativo"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateComparativoChart();
            });
        });

        // Eventos para filtros de categoria e conta
        document.getElementById('filtroCategoria').addEventListener('change', () => {
            this.updateComparativoChart();
        });

        document.getElementById('filtroConta').addEventListener('change', () => {
            this.updateComparativoChart();
        });

        // Evento para toggle da tabela
        document.getElementById('toggleTabela').addEventListener('click', () => {
            const tabela = document.getElementById('tabelaComparativo');
            const botao = document.getElementById('toggleTabela');
            
            if (tabela.style.display === 'none') {
                tabela.style.display = 'block';
                botao.innerHTML = '<i class="fas fa-table"></i> Ocultar Tabela';
            } else {
                tabela.style.display = 'none';
                botao.innerHTML = '<i class="fas fa-table"></i> Mostrar Tabela';
            }
        });
    }

    async updateSaldoChart(periodo) {
        try {
            const response = await fetch(`/api/dashboard/evolucao-saldo?periodo=${periodo}`);
            const data = await response.json();
            
            this.charts.saldo.data.labels = data.labels || [];
            this.charts.saldo.data.datasets[0].data = data.valores || [];
            this.charts.saldo.update('active');
        } catch (error) {
            console.error('Erro ao atualizar gráfico de saldo:', error);
        }
    }

    async updateComparativoChart() {
        try {
            // Coletar parâmetros de filtro
            const periodo = document.querySelector('input[name="periodoComparativo"]:checked')?.value || '6';
            const categoria = document.getElementById('filtroCategoria')?.value || '';
            const conta = document.getElementById('filtroConta')?.value || '';
            const tipo = document.querySelector('input[name="tipoComparativo"]:checked')?.value || 'both';
            
            // Construir URL com parâmetros
            const params = new URLSearchParams({
                periodo: periodo,
                tipo: tipo
            });
            
            if (categoria) params.append('categoria', categoria);
            if (conta) params.append('conta', conta);
            
            const response = await fetch(`/api/dashboard/comparativo-mensal?${params}`, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Verificar se os dados são válidos
            if (!data || typeof data !== 'object') {
                throw new Error('Dados inválidos recebidos da API');
            }
            
            // Garantir que arrays existam
            const meses = data.meses || [];
            const receitas = data.receitas || [];
            const despesas = data.despesas || [];
            const saldo = data.saldo || [];
            const gastosReais = data.gastosReais || [];
            
            // Atualizar datasets baseado no tipo
            if (tipo === 'saldo') {
                this.charts.comparativo.data.datasets = [{
                    label: 'Saldo',
                    data: saldo,
                    backgroundColor: this.colors.primary,
                    borderColor: this.colors.primary,
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }];
            } else if (tipo === 'gastos-reais') {
                this.charts.comparativo.data.datasets = [{
                    label: 'Orçado',
                    data: despesas,
                    backgroundColor: this.colors.warning,
                    borderColor: this.colors.warning,
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }, {
                    label: 'Real',
                    data: gastosReais,
                    backgroundColor: this.colors.danger,
                    borderColor: this.colors.danger,
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }];
            } else {
                this.charts.comparativo.data.datasets = [{
                    label: 'Receitas',
                    data: receitas,
                    backgroundColor: this.colors.success,
                    borderColor: this.colors.success,
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }, {
                    label: 'Despesas',
                    data: despesas,
                    backgroundColor: this.colors.danger,
                    borderColor: this.colors.danger,
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }];
            }
            
            this.charts.comparativo.data.labels = meses;
            this.charts.comparativo.update('active');
            
            // Atualizar indicadores de resumo
            this.updateSummaryIndicators({
                receitas: receitas,
                despesas: despesas,
                saldo: saldo,
                meses: meses,
                gastosReais: gastosReais
            });
            
            // Atualizar tabela
            this.updateComparativoTable({
                receitas: receitas,
                despesas: despesas,
                saldo: saldo,
                meses: meses,
                gastosReais: gastosReais
            }, tipo);
            
        } catch (error) {
            console.error('Erro ao atualizar gráfico comparativo:', error);
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    new DashboardCharts();
});