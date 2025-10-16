// Dashboard Charts - Gráficos Interativos
class DashboardCharts {
    constructor() {
        this.charts = {};
        this.colors = {
            primary: '#06b6d4', // ciano vibrante
            success: '#10b981', // verde esmeralda
            danger: '#ef4444',  // vermelho suave
            warning: '#f59e0b', // âmbar
            info: '#0ea5e9',    // azul-ciano
            light: '#f8f9fa',
            dark: '#0f172a'     // fundo escuro
        };
        this.gradients = {};
        this.init();
    }

    init() {
        this.createGradients();
        this.loadFinancialSummary();
        this.initSummarySparklines();
        this.initMonthlySummary();
        this.initCategoriaChart();
        this.bindEvents();
    }

    createGradients() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Gradiente para receitas
        this.gradients.success = ctx.createLinearGradient(0, 0, 0, 400);
        this.gradients.success.addColorStop(0, 'rgba(16, 185, 129, 0.85)');
        this.gradients.success.addColorStop(1, 'rgba(16, 185, 129, 0.12)');
        
        // Gradiente para despesas
        this.gradients.danger = ctx.createLinearGradient(0, 0, 0, 400);
        this.gradients.danger.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
        this.gradients.danger.addColorStop(1, 'rgba(239, 68, 68, 0.12)');
        
        // Gradiente para saldo (ciano)
        this.gradients.primary = ctx.createLinearGradient(0, 0, 0, 400);
        this.gradients.primary.addColorStop(0, 'rgba(6, 182, 212, 0.85)');
        this.gradients.primary.addColorStop(1, 'rgba(6, 182, 212, 0.12)');
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
        const canvas = document.getElementById('saldoChart');
        if (!canvas) return; // gráfico removido do layout
        const ctx = canvas.getContext('2d');
        
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
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: this.colors.primary,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 0,
                        pointRadius: 2,
                        pointHoverRadius: 4
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
                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
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
                                color: 'rgba(255, 255, 255, 0.08)',
                                drawBorder: false,
                                tickLength: 0
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
                    },
                    animation: {
                        duration: 500,
                        easing: 'easeOutQuart'
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
            
            const colors = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#fb7185', '#22d3ee', '#f97316'];

            // Ordenar por valor desc e agregar "Outros" após top 6; fallback "Sem dados"
            const labels = (data.categorias || []).slice();
            const values = (data.valores || []).slice();
            let pares = labels.map((l, i) => ({ label: l, value: Number(values[i] || 0) }));
            const total = pares.reduce((s, p) => s + p.value, 0);
            if (total === 0 || pares.length === 0) {
                pares = [{ label: 'Sem dados', value: 1 }];
            } else {
                pares.sort((a, b) => b.value - a.value);
                if (pares.length > 6) {
                    const top = pares.slice(0, 6);
                    const outrosValue = pares.slice(6).reduce((s, p) => s + p.value, 0);
                    if (outrosValue > 0) top.push({ label: 'Outros', value: outrosValue });
                    pares = top;
                }
            }
            
            this.charts.categoria = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: pares.map(p => p.label),
                    datasets: [{
                        data: pares.map(p => p.value),
                        backgroundColor: colors.slice(0, Math.max(1, pares.length)),
                        borderWidth: 0,
                        hoverBorderWidth: 2,
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
                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0) || 1;
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
                    cutout: '50%'
                }
            });
        } catch (error) {
            console.error('Erro ao carregar gráfico de categorias:', error);
        }
    }

    async initSummarySparklines() {
        try {
            const response = await fetch('/api/dashboard/comparativo-mensal');
            const data = await response.json();

            const meses = data.meses || [];
            const receitas = data.receitas || [];
            const despesas = data.despesas || [];
            const saldo = (data.saldo && Array.isArray(data.saldo)) ? data.saldo : receitas.map((v, i) => v - (despesas[i] || 0));

            const makeSpark = (canvasId, series, color, bgGradient) => {
                const el = document.getElementById(canvasId);
                if (!el) return null;
                const ctx = el.getContext('2d');
                return new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: meses,
                        datasets: [{
                            data: series,
                            borderColor: color,
                            backgroundColor: bgGradient,
                            borderWidth: 2,
                            tension: 0.3,
                            pointRadius: 0,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false }, tooltip: { enabled: false } },
                        scales: { x: { display: false }, y: { display: false } }
                    }
                });
            };

            this.charts.receitasSpark = makeSpark('receitasSpark', receitas, this.colors.success, this.gradients.success);
            this.charts.despesasSpark = makeSpark('despesasSpark', despesas, this.colors.danger, this.gradients.danger);
            this.charts.saldoSpark = makeSpark('saldoSpark', saldo, this.colors.primary, this.gradients.primary);

            const setTrend = (cardSelector, arr) => {
                const el = document.querySelector(cardSelector);
                if (!el || arr.length < 2) return;
                const prev = Number(arr[arr.length - 2] || 0);
                const curr = Number(arr[arr.length - 1] || 0);
                const diffPct = prev === 0 ? (curr === 0 ? 0 : 100) : ((curr - prev) / Math.abs(prev)) * 100;
                const text = (diffPct >= 0 ? '+' : '') + diffPct.toFixed(1) + '% este mês';
                const span = el.querySelector('.trend-text');
                if (span) span.textContent = text;
                el.classList.remove('positive', 'negative');
                el.classList.add(diffPct >= 0 ? 'positive' : 'negative');
            };

            setTrend('.financial-card[aria-labelledby="receitasTitle"] .financial-card-trend', receitas);
            setTrend('.financial-card[aria-labelledby="despesasTitle"] .financial-card-trend', despesas);

            const saldoTrendEl = document.querySelector('.financial-card[aria-labelledby="saldoTitle"] .financial-card-trend');
            if (saldoTrendEl && saldo.length >= 2) {
                const prev = Number(saldo[saldo.length - 2] || 0);
                const curr = Number(saldo[saldo.length - 1] || 0);
                const diff = curr - prev;
                const indicator = saldoTrendEl.querySelector('.status-indicator');
                if (indicator) {
                    indicator.classList.remove('status-green', 'status-yellow', 'status-red');
                    let cls = 'status-green';
                    if (diff < 0) {
                        const threshold = prev === 0 ? Math.abs(diff) : Math.abs(prev) * 0.05; // 5% do saldo anterior
                        cls = Math.abs(diff) < threshold ? 'status-yellow' : 'status-red';
                    }
                    indicator.classList.add(cls);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar micro gráficos do resumo:', error);
        }
    }


    async initMonthlySummary() {
        const fmtBRL = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0));
        const el = {
            contasCount: document.getElementById('summaryContasCount'),
            contasSaldo: document.getElementById('summaryContasSaldo'),
            contasTop: document.getElementById('summaryContasTop'),
            parcelasCount: document.getElementById('summaryParcelasCount'),
            parcelasList: document.getElementById('summaryParcelasList'),
            parcelasEmpty: document.getElementById('summaryParcelasEmpty'),
            recPrev: document.getElementById('budgetReceitasPrevisto'),
            recReal: document.getElementById('budgetReceitasReal'),
            recProg: document.getElementById('budgetReceitasProgress'),
            desPrev: document.getElementById('budgetDespesasPrevisto'),
            desReal: document.getElementById('budgetDespesasReal'),
            desProg: document.getElementById('budgetDespesasProgress')
        };

        try {
            // Contas
            const contasResp = await fetch('/api/dashboard/contas');
            const contas = await contasResp.json();
            const ativos = Array.isArray(contas) ? contas.filter(c => c) : [];
            const totalSaldo = ativos.reduce((s, c) => s + Number(c.saldo_atual || 0), 0);
            const top = ativos
                .slice()
                .sort((a, b) => Number(b.saldo_atual || 0) - Number(a.saldo_atual || 0))
                .slice(0, 3);

            if (el.contasCount) el.contasCount.textContent = `${ativos.length} ${ativos.length === 1 ? 'conta' : 'contas'}`;
            if (el.contasSaldo) el.contasSaldo.textContent = fmtBRL(totalSaldo);
            if (el.contasTop) {
                el.contasTop.innerHTML = '';
                top.forEach(c => {
                    const li = document.createElement('li');
                    li.className = 'summary-list-item';
                    li.innerHTML = `
                        <span class="name"><i class="fas fa-university" aria-hidden="true"></i> ${c.nome}</span>
                        <span class="value">${fmtBRL(c.saldo_atual || 0)}</span>
                    `;
                    el.contasTop.appendChild(li);
                });
            }

            // Parcelas do mês
            const parResp = await fetch('/api/dashboard/parcelas-mes');
            const parcelas = await parResp.json();
            if (el.parcelasCount) el.parcelasCount.textContent = `${parcelas.length} ${parcelas.length === 1 ? 'parcela' : 'parcelas'}`;
            if (el.parcelasList && el.parcelasEmpty) {
                el.parcelasList.innerHTML = '';
                if (parcelas.length === 0) {
                    el.parcelasEmpty.style.display = 'block';
                } else {
                    el.parcelasEmpty.style.display = 'none';
                    parcelas.slice(0, 5).forEach(p => {
                        const li = document.createElement('li');
                        li.className = 'summary-list-item';
                        const data = new Date(p.data);
                        const dataStr = data.toLocaleDateString('pt-BR');
                        li.innerHTML = `
                            <div class="left">
                                <span class="name"><i class="fas fa-file-invoice" aria-hidden="true"></i> ${p.descricao} <span class="small text-muted">(${p.parcela})</span></span>
                                <span class="date"><i class="fas fa-calendar-alt" aria-hidden="true"></i> ${dataStr}</span>
                            </div>
                            <div class="right">
                                <span class="value">${fmtBRL(p.valor)}</span>
                            </div>
                        `;
                        el.parcelasList.appendChild(li);
                    });
                }
            }

            // Orçamento mensal
            const orcResp = await fetch('/api/dashboard/orcamento-mensal');
            const orc = await orcResp.json();
            const recPrevisto = Number(orc.previstoReceitas || 0);
            const recReal = Number(orc.realReceitas || 0);
            const desPrevisto = Number(orc.previstoDespesas || 0);
            const desReal = Number(orc.realDespesas || 0);
            if (el.recPrev) el.recPrev.textContent = `Previsto: ${fmtBRL(recPrevisto)}`;
            if (el.recReal) el.recReal.textContent = `Real: ${fmtBRL(recReal)}`;
            if (el.desPrev) el.desPrev.textContent = `Previsto: ${fmtBRL(desPrevisto)}`;
            if (el.desReal) el.desReal.textContent = `Real: ${fmtBRL(desReal)}`;

            const pct = (real, prev) => {
                if (!prev || prev <= 0) return 0;
                const v = Math.min(100, Math.round((real / prev) * 100));
                return isFinite(v) ? v : 0;
            };
            const pctRec = pct(recReal, recPrevisto);
            const pctDes = pct(desReal, desPrevisto);
            if (el.recProg) {
                el.recProg.style.width = pctRec + '%';
                if (el.recProg.parentElement) {
                    el.recProg.parentElement.setAttribute('aria-valuenow', pctRec);
                    el.recProg.parentElement.setAttribute('aria-valuemin', 0);
                    el.recProg.parentElement.setAttribute('aria-valuemax', 100);
                }
            }
            if (el.desProg) {
                el.desProg.style.width = pctDes + '%';
                if (el.desProg.parentElement) {
                    el.desProg.parentElement.setAttribute('aria-valuenow', pctDes);
                    el.desProg.parentElement.setAttribute('aria-valuemin', 0);
                    el.desProg.parentElement.setAttribute('aria-valuemax', 100);
                }
            }
            if (document.getElementById('budgetReceitasPct')) {
                document.getElementById('budgetReceitasPct').textContent = `${pctRec}%`;
            }
            if (document.getElementById('budgetDespesasPct')) {
                document.getElementById('budgetDespesasPct').textContent = `${pctDes}%`;
            }
        } catch (error) {
            console.error('Erro ao carregar resumo do mês:', error);
        }
    }

    /* async loadFilterOptions() {
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
    } */

    /* updateSummaryIndicators(data) {
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
    } */

    /* updateComparativoTable(data, tipo) {
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
    } */

    bindEvents() {
        // Período do gráfico de saldo
        document.querySelectorAll('input[name="periodoSaldo"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updateSaldoChart(e.target.value);
            });
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

    /* async updateComparativoChart() { } */
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    new DashboardCharts();
});