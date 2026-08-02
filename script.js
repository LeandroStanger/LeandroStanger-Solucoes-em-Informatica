/**
 * Leandro Stanger — Soluções em Informática
 * script.js — Versão 36.55 (correção da formatação BTC/ETH no PDF)
 */
document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // 1. VARIÁVEIS GLOBAIS
    // ============================================================
    let servicosGlobais = [];
    let tipoSelecionado = 'standard';
    let soSelecionado = 'windows';
    let geradorConfigurado = false;

    // IDs dos pacotes de jogos que NUNCA devem aparecer na seção de formatação
    const IDS_PACOTES_JOGOS = [72, 73, 74];

    // Taxa de juros mensal para parcelamento (2.5% ao mês)
    const TAXA_JUROS_MENSAL = 0.025;

    // Cache das cotações (BTC e ETH)
    let cotacaoBitcoinCache = null;
    let cotacaoBitcoinTimestamp = 0;
    let cotacaoEthereumCache = null;
    let cotacaoEthereumTimestamp = 0;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

    // ============================================================
    // FUNÇÃO GLOBAL PARA OBTER COTAÇÃO DO BITCOIN (COM CACHE)
    // ============================================================
    async function obterCotacaoBitcoin() {
        const agora = Date.now();
        if (cotacaoBitcoinCache && (agora - cotacaoBitcoinTimestamp) < CACHE_DURATION) {
            return cotacaoBitcoinCache;
        }
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl');
            if (!response.ok) throw new Error('Erro ao buscar cotação BTC');
            const data = await response.json();
            if (data && data.bitcoin && data.bitcoin.brl) {
                cotacaoBitcoinCache = data.bitcoin.brl;
                cotacaoBitcoinTimestamp = agora;
                return cotacaoBitcoinCache;
            } else {
                throw new Error('Resposta inválida BTC');
            }
        } catch (error) {
            console.warn('Erro ao obter cotação do Bitcoin:', error);
            if (!cotacaoBitcoinCache) {
                cotacaoBitcoinCache = 250000.00; // fallback
            }
            return cotacaoBitcoinCache;
        }
    }

    // ============================================================
    // FUNÇÃO GLOBAL PARA OBTER COTAÇÃO DO ETHEREUM (COM CACHE)
    // ============================================================
    async function obterCotacaoEthereum() {
        const agora = Date.now();
        if (cotacaoEthereumCache && (agora - cotacaoEthereumTimestamp) < CACHE_DURATION) {
            return cotacaoEthereumCache;
        }
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=brl');
            if (!response.ok) throw new Error('Erro ao buscar cotação ETH');
            const data = await response.json();
            if (data && data.ethereum && data.ethereum.brl) {
                cotacaoEthereumCache = data.ethereum.brl;
                cotacaoEthereumTimestamp = agora;
                return cotacaoEthereumCache;
            } else {
                throw new Error('Resposta inválida ETH');
            }
        } catch (error) {
            console.warn('Erro ao obter cotação do Ethereum:', error);
            if (!cotacaoEthereumCache) {
                cotacaoEthereumCache = 8500.00; // fallback
            }
            return cotacaoEthereumCache;
        }
    }

    // ============================================================
    // 2. MENU MOBILE
    // ============================================================
    const navLinks = document.querySelector('.nav__links');
    const toggleBtn = document.querySelector('.nav__mobile-toggle');

    function toggleMenu(forceClose) {
        if (forceClose === undefined) forceClose = false;
        if (!navLinks) return;
        if (forceClose) {
            navLinks.classList.remove('nav--open');
            document.body.style.overflow = '';
            return;
        }
        const isOpen = navLinks.classList.toggle('nav--open');
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMenu();
        });
    }

    document.addEventListener('click', function(e) {
        if (!navLinks || !toggleBtn) return;
        const target = e.target;
        if (!navLinks.contains(target) && !toggleBtn.contains(target) && navLinks.classList.contains('nav--open')) {
            toggleMenu(true);
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navLinks && navLinks.classList.contains('nav--open')) {
            toggleMenu(true);
        }
    });

    // ============================================================
    // 3. SCROLL SUAVE E DESTAQUE DO LINK ATIVO
    // ============================================================
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const topo = target.offsetTop - 80;
                window.scrollTo({ top: topo, behavior: 'smooth' });
                document.querySelectorAll('.nav__link').forEach(function(link) {
                    link.classList.remove('active-link');
                });
                this.classList.add('active-link');
                if (navLinks && navLinks.classList.contains('nav--open')) {
                    toggleMenu(true);
                }
            }
        });
    });

    const sections = document.querySelectorAll('section[id]');
    const navLinksAll = document.querySelectorAll('.nav__link');

    function updateActiveLink(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinksAll.forEach(function(link) {
                    link.classList.toggle('active-link', link.getAttribute('href') === '#' + id);
                });
            }
        });
    }

    if (sections.length) {
        const observer = new IntersectionObserver(updateActiveLink, {
            root: null,
            rootMargin: '-60px 0px -60% 0px',
            threshold: 0.1
        });
        sections.forEach(function(section) {
            observer.observe(section);
        });
    }

    // ============================================================
    // 4. CARREGAR SERVIÇOS DO JSON
    // ============================================================
    function carregarServicos() {
        return fetch('servicos.json')
            .then(function(response) {
                if (!response.ok) throw new Error('Erro ao carregar JSON (status ' + response.status + ')');
                return response.json();
            })
            .then(function(data) {
                if (data && data.servicos) {
                    servicosGlobais = data.servicos;
                    renderizarTodosOsCards(servicosGlobais);
                    console.log('✅ Serviços carregados com sucesso! Total: ' + servicosGlobais.length);
                    configurarGeradorPacote();
                    return servicosGlobais;
                } else {
                    throw new Error('JSON inválido: faltando a chave "servicos"');
                }
            })
            .catch(function(error) {
                console.error('❌ Erro ao carregar serviços:', error);
                const grid = document.getElementById('servicesGrid');
                if (grid) {
                    grid.innerHTML = '<p style="color: #e6edf3; text-align: center; padding: 40px;">⚠️ Erro ao carregar os serviços. Verifique o arquivo JSON.</p>';
                }
                return [];
            });
    }

    // ============================================================
    // 5. RENDERIZAR TODOS OS CARDS (COM FILTRO PARA OCULTAR PACOTES DE JOGOS)
    // ============================================================
    function renderizarTodosOsCards(servicos) {
        const servicesGrid = document.getElementById('servicesGrid');
        if (servicesGrid) {
            servicesGrid.innerHTML = '';
            const servicosVisiveis = servicos.filter(function(s) {
                return s.exibir !== false && IDS_PACOTES_JOGOS.indexOf(s.id) === -1;
            });
            servicosVisiveis.forEach(function(servico) {
                const card = criarCardServico(servico);
                servicesGrid.appendChild(card);
            });
            aplicarPaginacao();
        }
        const formatacaoGrid = document.getElementById('formatacaoCardsGrid');
        if (formatacaoGrid) {
            renderizarTiposFormatacao(servicos);
        }
        const recoveryGrid = document.getElementById('recoveryGrid');
        if (recoveryGrid) {
            const servicosDados = servicos.filter(function(s) { return s.categoria === 'dados'; });
            recoveryGrid.innerHTML = '';
            servicosDados.forEach(function(servico) {
                const card = criarCardGrande(servico, 'dados');
                recoveryGrid.appendChild(card);
            });
        }
        const cleaningGrid = document.getElementById('cleaningGrid');
        if (cleaningGrid) {
            const servicosLimpeza = servicos.filter(function(s) {
                return (s.categoria === 'limpeza' || s.categoria === 'limpeza_destaque') && IDS_PACOTES_JOGOS.indexOf(s.id) === -1;
            });
            cleaningGrid.innerHTML = '';
            servicosLimpeza.forEach(function(servico) {
                const card = criarCardGrande(servico, 'limpeza');
                cleaningGrid.appendChild(card);
            });
        }
        iniciarContato();
    }

    // ============================================================
    // 6. RENOMEAR TÍTULOS
    // ============================================================
    function renomearTitulo(titulo, categoria, sistema) {
        if (sistema === 'biglinux') {
            return titulo;
        }
        if (categoria === 'pro' || categoria === 'educacional' || categoria === 'enterprise' || categoria === 'premium') {
            return titulo;
        }
        if (categoria === 'formatacao') {
            let novoTitulo = titulo.replace(/Formatação/g, 'Formatação Standard');
            novoTitulo = novoTitulo.replace(/Standard Standard/g, 'Standard');
            novoTitulo = novoTitulo.replace(/com Backup/g, 'Plus');
            novoTitulo = novoTitulo.replace(/Plus\s*\(/g, 'Plus (');
            novoTitulo = novoTitulo.replace(/\s+/g, ' ').trim();
            return novoTitulo;
        } else if (categoria === 'gamer') {
            if (!titulo.includes('Gamer') && !titulo.includes('Pacote de Jogos')) {
                return titulo.replace(/Formatação/g, 'Formatação Gamer');
            }
            return titulo;
        }
        return titulo;
    }

    // ============================================================
    // 7. CRIAR CARD PEQUENO (SERVIÇOS GERAIS) - SEM CRIPTO
    // ============================================================
    function criarCardServico(servico) {
        const card = document.createElement('div');
        const isFeatured = servico.badge ? ' service-card--featured' : '';
        const isMaisEscolhido = (servico.badge === '⭐ Mais escolhido') ? ' service-card--mais-escolhido' : '';
        card.className = 'service-card' + isFeatured + isMaisEscolhido;
        card.dataset.category = servico.categoria;

        const titulo = renomearTitulo(servico.titulo, servico.categoria, servico.sistema);
        const badgeHtml = servico.badge ? '<span class="service-card__badge">' + servico.badge + '</span>' : '';

        let brindesHtml = '';
        if (servico.brindes && servico.brindes.length > 0) {
            const itens = servico.brindes.map(function(item) {
                let icone = 'fa-gift';
                if (item.toLowerCase().includes('ms office') || item.toLowerCase().includes('office')) icone = 'fa-file-word';
                else if (item.toLowerCase().includes('kaspersky')) icone = 'fa-shield-halved';
                else if (item.toLowerCase().includes('softwares')) icone = 'fa-download';
                else if (item.toLowerCase().includes('suporte')) icone = 'fa-headset';
                else if (item.toLowerCase().includes('instrução')) icone = 'fa-graduation-cap';
                else if (item.toLowerCase().includes('desconto')) icone = 'fa-percent';
                else if (item.toLowerCase().includes('atendimento')) icone = 'fa-clock';
                else if (item.toLowerCase().includes('garantia')) icone = 'fa-shield-check';
                else if (item.toLowerCase().includes('impressora')) icone = 'fa-print';
                else if (item.toLowerCase().includes('limpeza')) icone = 'fa-broom';
                return '<span><i class="fa-solid ' + icone + '" style="color: var(--color-primary-light); margin-right: 4px;"></i> ' + item + '</span>';
            }).join('');
            brindesHtml = `
                <div style="margin-top: 8px; padding: 6px 10px; background: rgba(16,185,129,0.06); border-radius: 6px; border-left: 2px solid var(--color-primary-light); text-align: left; font-size: 0.75rem; color: var(--color-text-secondary);">
                    <div style="font-weight: 600; color: var(--color-primary-light); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
                        <i class="fa-solid fa-gift" style="margin-right: 4px;"></i> Brindes exclusivos
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        ${itens}
                    </div>
                </div>
            `;
        }

        let jogosHtml = '';
        if (servico.jogos && servico.jogos.length > 0) {
            const jogosItens = servico.jogos.map(function(jogo) {
                return '<div class="jogo-item"><img src="' + jogo.imagem + '" alt="Jogo" class="jogo-logo" loading="lazy" /></div>';
            }).join('');
            jogosHtml = '<div class="jogos-grid">' + jogosItens + '</div>';
        }

        card.innerHTML =
            '<div class="service-card__icon"><i class="' + servico.icone + '"></i></div>' +
            '<h3 class="service-card__title">' + titulo + '</h3>' +
            '<p class="service-card__desc">' + servico.descricao + '</p>' +
            jogosHtml +
            '<span class="service-card__price">' + servico.preco + '</span>' +
            badgeHtml +
            brindesHtml +
            '<a href="https://wa.me/5548996446508?text=' + encodeURIComponent(servico.whatsapp) + '" target="_blank" rel="noopener" class="service-card__btn btn btn--outline btn--sm">' +
            '<i class="fa-brands fa-whatsapp"></i> Falar no WhatsApp' +
            '</a>';

        return card;
    }

    // ============================================================
    // 8. MAPA DE BRINDES POR ID (fallback para compatibilidade)
    // ============================================================
    const brindesPorId = {
        29: ['MS Office - Instalação + Licenças para cada pc', '2 Instalações de Softwares (Avançado) por PC'],
        30: ['MS Office - Instalação + Licenças para cada pc', '2 Instalações de Softwares (Avançado) por PC'],
        31: ['MS Office - Instalação + Licenças para cada pc', '2 Instalações de Softwares (Avançado) por PC'],
        32: ['MS Office - Instalação + Licenças para cada pc', '2 Instalações de Softwares (Avançado) por PC'],
        33: ['MS Office - Instalação + Licenças para cada pc', '2 Instalações de Softwares (Avançado) por PC'],
        34: ['MS Office - Instalação + Licenças para cada pc', '2 Instalações de Softwares (Avançado) por PC'],
        23: ['MS Office - Instalação + Licenças para cada pc', '3 Instalações de Softwares (Avançado) por PC'],
        24: ['MS Office - Instalação + Licenças para cada pc', '3 Instalações de Softwares (Avançado) por PC'],
        25: ['MS Office - Instalação + Licenças para cada pc', '3 Instalações de Softwares (Avançado) por PC'],
        26: ['MS Office - Instalação + Licenças para cada pc', '3 Instalações de Softwares (Avançado) por PC'],
        27: ['MS Office - Instalação + Licenças para cada pc', '3 Instalações de Softwares (Avançado) por PC'],
        28: ['MS Office - Instalação + Licenças para cada pc', '3 Instalações de Softwares (Avançado) por PC'],
        20: ['3 Instalações de Softwares (Avançado) por PC'],
        21: ['3 Instalações de Softwares (Avançado) por PC'],
        22: ['3 Instalações de Softwares (Avançado) por PC'],
        57: ['MS Office - Instalação + Licenças para cada pc', 'Kaspersky Premium - Instalação + Licenças para cada pc', '5 Instalações de Softwares (Avançado) por PC', '90 dias de suporte remoto', '3 semanas de instruções', 'Instalação de Impressora para cada PC'],
        58: ['MS Office - Instalação + Licenças para cada pc', 'Kaspersky Premium - Instalação + Licenças para cada pc', '5 Instalações de Softwares (Avançado) por PC', '90 dias de suporte remoto', '3 semanas de instruções', 'Instalação de Impressora para cada PC'],
        59: ['MS Office - Instalação + Licenças para cada pc', 'Kaspersky Premium - Instalação + Licenças para cada pc', '5 Instalações de Softwares (Avançado) por PC', '90 dias de suporte remoto', '3 semanas de instruções', 'Instalação de Impressora para cada PC'],
        60: ['MS Office - Instalação + Licenças para cada pc', 'Kaspersky Premium - Instalação + Licenças para cada pc', '5 Instalações de Softwares (Avançado) por PC', '90 dias de suporte remoto', '3 semanas de instruções', 'Instalação de Impressora para cada PC'],
        61: ['MS Office - Instalação + Licenças para cada pc', 'Kaspersky Premium - Instalação + Licenças para cada pc', '5 Instalações de Softwares (Avançado) por PC', '90 dias de suporte remoto', '3 semanas de instruções', 'Instalação de Impressora para cada PC'],
        62: ['MS Office - Instalação + Licenças para cada pc', 'Kaspersky Premium - Instalação + Licenças para cada pc', '5 Instalações de Softwares (Avançado) por PC', '90 dias de suporte remoto', '3 semanas de instruções', 'Instalação de Impressora para cada PC'],
        35: ['MS Office - Instalação + Licenças para cada pc', 'Kaspersky Premium - Instalação + Licenças para cada pc', '5 Instalações de Softwares (Avançado) por PC', '90 dias de suporte remoto', '3 semanas de instruções', 'Instalação de Impressora para cada PC'],
        36: ['MS Office - Instalação + Licenças para cada pc', 'Kaspersky Premium - Instalação + Licenças para cada pc', '5 Instalações de Softwares (Avançado) por PC', '90 dias de suporte remoto', '3 semanas de instruções', 'Instalação de Impressora para cada PC'],
        37: ['MS Office - Instalação + Licenças para cada pc', 'Kaspersky Premium - Instalação + Licenças para cada pc', '5 Instalações de Softwares (Avançado) por PC', '90 dias de suporte remoto', '3 semanas de instruções', 'Instalação de Impressora para cada PC'],
        38: ['MS Office - Instalação + Licenças para cada pc', 'Kaspersky Premium - Instalação + Licenças para cada pc', '5 Instalações de Softwares (Avançado) por PC', '90 dias de suporte remoto', '3 semanas de instruções', 'Instalação de Impressora para cada PC'],
        39: ['MS Office - Instalação + Licenças para cada pc', 'Kaspersky Premium - Instalação + Licenças para cada pc', '5 Instalações de Softwares (Avançado) por PC', '90 dias de suporte remoto', '3 semanas de instruções', 'Instalação de Impressora para cada PC'],
        40: ['MS Office - Instalação + Licenças para cada pc', 'Kaspersky Premium - Instalação + Licenças para cada pc', '5 Instalações de Softwares (Avançado) por PC', '90 dias de suporte remoto', '3 semanas de instruções', 'Instalação de Impressora para cada PC'],
        51: []
    };

    const idsComBrindeSuporte = [35, 36, 37, 38, 39, 40, 57, 58, 59, 60, 61, 62];

    // ============================================================
    // 9. CRIAR CARD GRANDE (Recuperação, Formatação, Limpeza) - COM BTC E ETH
    // ============================================================
    function criarCardGrande(servico, tipo) {
        const card = document.createElement('div');
        let isPopular = false;
        if (servico.badge && (
                servico.badge === 'Mais popular' ||
                servico.badge === 'Mais completo' ||
                servico.badge === 'Mais procurado' ||
                servico.badge === 'Popular' ||
                servico.badge === 'Pro' ||
                servico.badge === 'Pro Plus' ||
                servico.badge === '⭐ Mais escolhido'
            )) {
            isPopular = true;
        }
        card.className = 'recovery-card' + (isPopular ? ' recovery-card--popular' : '');
        if (servico.badge === '⭐ Mais escolhido') {
            card.classList.add('recovery-card--mais-escolhido');
        }

        const titulo = renomearTitulo(servico.titulo, servico.categoria, servico.sistema);
        const tagHtml = servico.badge ? '<span class="recovery-card__tag">' + servico.badge + '</span>' : '';

        const priceLabel = servico.preco.includes('/GB') ? 'Apenas' : 'A partir de';

        const precoStr = servico.preco.replace(/[^0-9,]/g, '').replace(',', '.');
        const precoBase = parseFloat(precoStr) || 0;

        let brindesHtml = '';
        const brindesLista = servico.brindes || brindesPorId[servico.id] || [];
        const temSuporte = idsComBrindeSuporte.indexOf(servico.id) !== -1;

        let todosBrindes = [];
        if (brindesLista.length > 0) {
            todosBrindes = todosBrindes.concat(brindesLista);
        }
        if (temSuporte) {
            if (!todosBrindes.some(function(b) { return b.includes('suporte remoto'); })) {
                todosBrindes.push('90 dias de suporte remoto');
            }
            if (!todosBrindes.some(function(b) { return b.includes('instruções'); })) {
                todosBrindes.push('3 semanas de instruções');
            }
        }

        if (todosBrindes.length > 0) {
            const itensBrindeHtml = todosBrindes.map(function(item) {
                let icone = 'fa-gift';
                if (item.includes('MS Office')) icone = 'fa-file-word';
                else if (item.includes('Kaspersky')) icone = 'fa-shield-halved';
                else if (item.includes('Instalações de Softwares')) icone = 'fa-download';
                else if (item.includes('suporte')) icone = 'fa-headset';
                else if (item.includes('instruções')) icone = 'fa-graduation-cap';
                else if (item.includes('Desconto')) icone = 'fa-percent';
                else if (item.includes('Atendimento')) icone = 'fa-clock';
                else if (item.includes('Garantia')) icone = 'fa-shield-check';
                else if (item.includes('Impressora')) icone = 'fa-print';
                else if (item.includes('Limpeza')) icone = 'fa-broom';
                return '<span><i class="fa-solid ' + icone + '" style="color: var(--color-primary-light); margin-right: 4px;"></i> ' + item + '</span>';
            }).join('');

            brindesHtml =
                '<div style="margin-top: 12px; padding: 10px 12px; background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04)); border-radius: 8px; border-left: 4px solid var(--color-primary-light); text-align: left;">' +
                '<div style="font-weight: 600; color: var(--color-primary-light); font-size: 0.85rem; margin-bottom: 4px;"><i class="fa-solid fa-gift" style="margin-right: 6px;"></i> Brindes exclusivos</div>' +
                '<div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.8rem; color: var(--color-text-secondary);">' +
                itensBrindeHtml +
                '</div>' +
                '</div>';
        }

        // ============================================================
        // HTML DE PAGAMENTO COM QUATRO OPÇÕES (À VISTA, PARCELADO, BTC, ETH)
        // ============================================================
        let paymentHtml = '';
        if (tipo === 'formatacao' || tipo === 'dados' || tipo === 'limpeza') {
            paymentHtml = `
                <div class="payment-options">
                    <div class="payment-toggle">
                        <button class="payment-btn payment-btn--active" data-payment="cash">À Vista</button>
                        <button class="payment-btn" data-payment="installment">Parcelado</button>
                        <button class="payment-btn" data-payment="bitcoin"><i class="fa-brands fa-bitcoin"></i> BTC</button>
                        <button class="payment-btn" data-payment="ethereum"><i class="fa-brands fa-ethereum"></i> ETH</button>
                    </div>
                    <div class="installment-options" style="display: none;">
                        <label for="installment-count">Número de Parcelas:</label>
                        <select class="installment-select">
                            <option value="2">2x</option>
                            <option value="3">3x</option>
                            <option value="4">4x</option>
                            <option value="5">5x</option>
                            <option value="6">6x</option>
                            <option value="7">7x</option>
                            <option value="8">8x</option>
                            <option value="9">9x</option>
                            <option value="10">10x</option>
                            <option value="11">11x</option>
                            <option value="12">12x</option>
                        </select>
                    </div>
                    <div class="payment-display">
                        <span class="payment-total">${formatarMoeda(precoBase)}</span>
                        <span class="payment-detail">à vista</span>
                    </div>
                </div>
            `;
        }

        card.innerHTML =
            '<div class="recovery-card__header">' +
            '<span class="recovery-card__icon"><i class="' + servico.icone + '"></i></span>' +
            '<h3>' + titulo + '</h3>' +
            tagHtml +
            '</div>' +
            '<div class="recovery-card__body">' +
            '<p class="recovery-card__price-label">' + priceLabel + '</p>' +
            '<span class="recovery-card__price" style="display: none;">' + servico.preco + '</span>' +
            paymentHtml +
            '<p class="recovery-card__info">' + servico.descricao + '</p>' +
            brindesHtml +
            '</div>' +
            '<div class="recovery-card__footer">' +
            '<a href="#" class="btn btn--primary btn--sm btn-contratar">' +
            (servico.categoria === 'dados' ? 'Solicitar' : 'Contratar') +
            '</a>' +
            '</div>';

        configurarPagamentoCard(card, precoBase, titulo, servico);
        configurarBotaoContratar(card, titulo, servico);

        return card;
    }

    // ============================================================
    // 10. FUNÇÕES DE PARCELAMENTO E PAGAMENTO (COM BTC E ETH NOS CARDS)
    // ============================================================
    function calcularParcelamento(valorTotal, numParcelas, taxaJuros) {
        if (numParcelas === 1) {
            return {
                valorParcela: valorTotal,
                valorTotalParcelado: valorTotal,
                jurosTotal: 0
            };
        }

        const i = taxaJuros || TAXA_JUROS_MENSAL;
        const n = numParcelas;
        const fator = Math.pow(1 + i, n);
        const valorParcela = valorTotal * (i * fator) / (fator - 1);
        const valorParcelaArredondado = Math.round(valorParcela * 100) / 100;
        const valorTotalParcelado = Math.round(valorParcelaArredondado * n * 100) / 100;
        const jurosTotal = Math.round((valorTotalParcelado - valorTotal) * 100) / 100;

        return {
            valorParcela: valorParcelaArredondado,
            valorTotalParcelado: valorTotalParcelado,
            jurosTotal: jurosTotal
        };
    }

    function formatarMoeda(valor) {
        return 'R$ ' + valor.toFixed(2).replace('.', ',');
    }

    function formatarBitcoin(valorBTC) {
        return '₿ ' + valorBTC.toFixed(8);
    }

    function formatarEthereum(valorETH) {
        return 'Ξ ' + valorETH.toFixed(6);
    }

    function atualizarPrecoCard(card, precoBase) {
        const paymentDisplay = card.querySelector('.payment-display');
        if (!paymentDisplay) return;

        const totalElement = paymentDisplay.querySelector('.payment-total');
        const detailElement = paymentDisplay.querySelector('.payment-detail');
        const activeBtn = card.querySelector('.payment-btn.payment-btn--active');
        const isInstallment = activeBtn && activeBtn.dataset.payment === 'installment';
        const isBitcoin = activeBtn && activeBtn.dataset.payment === 'bitcoin';
        const isEthereum = activeBtn && activeBtn.dataset.payment === 'ethereum';
        const installmentSelect = card.querySelector('.installment-select');

        let valorTotal = precoBase;
        let detailText = 'à vista';

        if (isInstallment && installmentSelect) {
            const numParcelas = parseInt(installmentSelect.value);
            const resultado = calcularParcelamento(precoBase, numParcelas);
            valorTotal = resultado.valorTotalParcelado;
            detailText = numParcelas + 'x de ' + formatarMoeda(resultado.valorParcela) + ' (juros: ' + formatarMoeda(resultado.jurosTotal) + ')';
        } else if (isBitcoin) {
            const valorBTC = parseFloat(card.dataset.bitcoinValue) || 0;
            if (valorBTC > 0) {
                detailText = formatarBitcoin(valorBTC) + ' (cotação atual)';
            } else {
                detailText = 'carregando cotação...';
            }
        } else if (isEthereum) {
            const valorETH = parseFloat(card.dataset.ethereumValue) || 0;
            if (valorETH > 0) {
                detailText = formatarEthereum(valorETH) + ' (cotação atual)';
            } else {
                detailText = 'carregando cotação...';
            }
        }

        if (totalElement) {
            totalElement.textContent = formatarMoeda(valorTotal);
        }
        if (detailElement) {
            detailElement.textContent = detailText;
        }
    }

    function configurarPagamentoCard(card, precoBase, titulo, servico) {
        const toggleButtons = card.querySelectorAll('.payment-btn');
        const installmentOptions = card.querySelector('.installment-options');
        const installmentSelect = card.querySelector('.installment-select');

        if (!toggleButtons.length) return;

        toggleButtons.forEach(function(btn) {
            btn.addEventListener('click', async function() {
                toggleButtons.forEach(function(b) { b.classList.remove('payment-btn--active'); });
                this.classList.add('payment-btn--active');

                const metodo = this.dataset.payment;

                if (metodo === 'installment' && installmentOptions) {
                    installmentOptions.style.display = 'flex';
                } else if (installmentOptions) {
                    installmentOptions.style.display = 'none';
                }

                if (metodo === 'bitcoin') {
                    try {
                        const cotacao = await obterCotacaoBitcoin();
                        const valorBTC = precoBase / cotacao;
                        card.dataset.bitcoinValue = valorBTC;
                        atualizarPrecoCard(card, precoBase);
                    } catch (error) {
                        console.error('Erro ao buscar cotação BTC:', error);
                        alert('Não foi possível obter a cotação do Bitcoin. Tente novamente.');
                        toggleButtons.forEach(function(b) { b.classList.remove('payment-btn--active'); });
                        const btnCash = card.querySelector('.payment-btn[data-payment="cash"]');
                        if (btnCash) btnCash.classList.add('payment-btn--active');
                        if (installmentOptions) installmentOptions.style.display = 'none';
                        atualizarPrecoCard(card, precoBase);
                    }
                } else if (metodo === 'ethereum') {
                    try {
                        const cotacao = await obterCotacaoEthereum();
                        const valorETH = precoBase / cotacao;
                        card.dataset.ethereumValue = valorETH;
                        atualizarPrecoCard(card, precoBase);
                    } catch (error) {
                        console.error('Erro ao buscar cotação ETH:', error);
                        alert('Não foi possível obter a cotação do Ethereum. Tente novamente.');
                        toggleButtons.forEach(function(b) { b.classList.remove('payment-btn--active'); });
                        const btnCash = card.querySelector('.payment-btn[data-payment="cash"]');
                        if (btnCash) btnCash.classList.add('payment-btn--active');
                        if (installmentOptions) installmentOptions.style.display = 'none';
                        atualizarPrecoCard(card, precoBase);
                    }
                } else {
                    // cash ou installment
                    atualizarPrecoCard(card, precoBase);
                }
            });
        });

        if (installmentSelect) {
            installmentSelect.addEventListener('change', function() {
                const isInstallmentActive = card.querySelector('.payment-btn[data-payment="installment"]')?.classList.contains('payment-btn--active');
                if (isInstallmentActive) {
                    atualizarPrecoCard(card, precoBase);
                }
            });
        }

        atualizarPrecoCard(card, precoBase);
    }

    function configurarBotaoContratar(card, titulo, servico) {
        const btn = card.querySelector('.btn-contratar');
        if (!btn) return;

        btn.addEventListener('click', function(e) {
            e.preventDefault();

            const totalElement = card.querySelector('.payment-total');
            const detailElement = card.querySelector('.payment-detail');
            const totalTexto = totalElement ? totalElement.textContent : servico.preco;
            const detalheTexto = detailElement ? detailElement.textContent : '';
            const activeBtn = card.querySelector('.payment-btn.payment-btn--active');
            const metodo = activeBtn ? activeBtn.dataset.payment : 'cash';

            let mensagem = 'Olá! Gostaria de contratar o serviço "' + titulo + '"';
            if (metodo === 'bitcoin') {
                const valorBTC = card.dataset.bitcoinValue ? formatarBitcoin(parseFloat(card.dataset.bitcoinValue)) : '';
                mensagem += ' no valor de ' + totalTexto + ' (' + detalheTexto + ') em Bitcoin.';
                if (valorBTC) {
                    mensagem += ' Equivale a ' + valorBTC + '.';
                }
            } else if (metodo === 'ethereum') {
                const valorETH = card.dataset.ethereumValue ? formatarEthereum(parseFloat(card.dataset.ethereumValue)) : '';
                mensagem += ' no valor de ' + totalTexto + ' (' + detalheTexto + ') em Ethereum.';
                if (valorETH) {
                    mensagem += ' Equivale a ' + valorETH + '.';
                }
            } else {
                mensagem += ' no valor de ' + totalTexto + ' (' + detalheTexto + ').';
            }
            const url = 'https://wa.me/5548996446508?text=' + encodeURIComponent(mensagem);
            window.open(url, '_blank');
        });
    }

    // ============================================================
    // 11. PAGINAÇÃO (restaurada - 12 cards por vez)
    // ============================================================
    function aplicarPaginacao() {
        const grid = document.getElementById('servicesGrid');
        if (!grid) return;

        const cards = grid.querySelectorAll('.service-card');
        const cardsVisiveis = [];
        cards.forEach(function(card) {
            if (card.style.display !== 'none') {
                cardsVisiveis.push(card);
            }
        });

        const btnContainer = document.getElementById('btnVerTodosContainer');
        if (btnContainer) {
            btnContainer.remove();
        }

        if (cardsVisiveis.length > 12) {
            for (let i = 12; i < cardsVisiveis.length; i++) {
                cardsVisiveis[i].style.display = 'none';
            }

            const container = document.createElement('div');
            container.id = 'btnVerTodosContainer';
            container.style.textAlign = 'center';
            container.style.marginTop = '32px';

            const btn = document.createElement('button');
            btn.className = 'btn btn--primary';
            btn.textContent = 'Ver todos os ' + cardsVisiveis.length + ' serviços';
            btn.addEventListener('click', function() {
                cardsVisiveis.forEach(function(card) {
                    card.style.display = 'flex';
                });
                container.remove();
            });

            container.appendChild(btn);
            grid.parentNode.insertBefore(container, grid.nextSibling);
        } else {
            cardsVisiveis.forEach(function(card) {
                card.style.display = 'flex';
            });
        }
    }

    // ============================================================
    // 12. FILTROS PRINCIPAIS (com suporte a limpeza_destaque)
    // ============================================================
    function configurarFiltros() {
        const filterTabs = document.querySelectorAll('#filterTabs .filter-tab');
        const servicesGrid = document.getElementById('servicesGrid');

        if (!servicesGrid) return;

        const categoriasFormatacao = ['formatacao', 'pro', 'educacional', 'enterprise', 'premium'];

        function filterServices(category) {
            const cards = servicesGrid.querySelectorAll('.service-card');
            cards.forEach(function(card) {
                const cardCategory = card.dataset.category;
                let mostrar = false;
                if (category === 'all') {
                    mostrar = true;
                } else if (category === 'formatacao') {
                    if (categoriasFormatacao.indexOf(cardCategory) !== -1) {
                        mostrar = true;
                    }
                } else if (category === 'limpeza') {
                    if (cardCategory === 'limpeza' || cardCategory === 'limpeza_destaque') {
                        mostrar = true;
                    }
                } else {
                    if (cardCategory === category) {
                        mostrar = true;
                    }
                }
                card.style.display = mostrar ? 'flex' : 'none';
            });
            aplicarPaginacao();
        }

        filterTabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                filterTabs.forEach(function(t) { t.classList.remove('filter-tab--active'); });
                this.classList.add('filter-tab--active');
                const filter = this.dataset.filter;
                filterServices(filter);
            });
        });

        filterServices('all');
    }

    // ============================================================
    // 13. RENDERIZAR TIPOS DE FORMAÇÃO (COM EXCLUSÃO EXPLÍCITA DOS PACOTES DE JOGOS)
    // ============================================================
    function renderizarTiposFormatacao(servicos) {
        if (!servicos || servicos.length === 0) return;

        const servicosFormatacao = servicos.filter(function(s) {
            return (s.categoria === 'formatacao' || s.categoria === 'pro' || s.categoria === 'educacional' || s.categoria === 'gamer' || s.categoria === 'enterprise' || s.categoria === 'premium')
                && s.exibir !== false
                && IDS_PACOTES_JOGOS.indexOf(s.id) === -1;
        });

        servicosFormatacao.forEach(function(s) {
            if (!s.sistema) {
                const tituloLower = s.titulo.toLowerCase();
                if (tituloLower.includes('windows')) s.sistema = 'windows';
                else if (tituloLower.includes('linux')) s.sistema = 'linux';
                else if (tituloLower.includes('mac')) s.sistema = 'mac';
                else if (tituloLower.includes('steam machine')) s.sistema = 'steam-machine';
                else if (tituloLower.includes('steam deck')) s.sistema = 'steam-deck';
                else s.sistema = 'windows';
            }
        });

        const tipo = tipoSelecionado || 'standard';
        const so = soSelecionado || 'windows';

        atualizarFormatacao(servicosFormatacao, tipo, so);
    }

    // ============================================================
    // 14. ATUALIZAR FORMAÇÃO (com filtro extra para pacotes de jogos)
    // ============================================================
    function atualizarFormatacao(servicos, tipo, so) {
        let servicosFiltrados = [];
        if (tipo === 'go') {
            servicosFiltrados = servicos.filter(function(s) {
                return s.categoria === 'formatacao' && s.sistema === 'biglinux' && s.exibir !== false && IDS_PACOTES_JOGOS.indexOf(s.id) === -1;
            });
        } else if (tipo === 'standard') {
            servicosFiltrados = servicos.filter(function(s) {
                return s.categoria === 'formatacao' && s.sistema !== 'biglinux' && s.exibir !== false && IDS_PACOTES_JOGOS.indexOf(s.id) === -1;
            });
        } else if (tipo === 'educacional') {
            servicosFiltrados = servicos.filter(function(s) {
                return s.categoria === 'educacional' && s.exibir !== false && IDS_PACOTES_JOGOS.indexOf(s.id) === -1;
            });
        } else if (tipo === 'pro') {
            servicosFiltrados = servicos.filter(function(s) {
                return s.categoria === 'pro' && s.exibir !== false && IDS_PACOTES_JOGOS.indexOf(s.id) === -1;
            });
        } else if (tipo === 'gamer') {
            servicosFiltrados = servicos.filter(function(s) {
                return s.categoria === 'gamer' && s.exibir !== false && IDS_PACOTES_JOGOS.indexOf(s.id) === -1;
            });
        } else if (tipo === 'enterprise') {
            servicosFiltrados = servicos.filter(function(s) {
                return s.categoria === 'enterprise' && s.exibir !== false && IDS_PACOTES_JOGOS.indexOf(s.id) === -1;
            });
        } else if (tipo === 'premium') {
            servicosFiltrados = servicos.filter(function(s) {
                return s.categoria === 'premium' && s.exibir !== false && IDS_PACOTES_JOGOS.indexOf(s.id) === -1;
            });
        }

        servicosFiltrados = servicosFiltrados.map(function(s) {
            const novoTitulo = renomearTitulo(s.titulo, s.categoria, s.sistema);
            return { ...s, titulo: novoTitulo };
        });

        const descricaoEl = document.getElementById('tipoFormatacaoDescricao');
        const section = document.querySelector('.tipos-formatacao-section');
        if (descricaoEl) {
            let descricaoBase = '';
            if (tipo === 'go') {
                descricaoBase = '<strong>Formatação Go</strong> — Sistema Big Linux otimizado para baixo custo e desempenho. Ideal para computadores com recursos limitados. Inclui drivers e ferramentas essenciais.';
                if (section) section.className = 'tipos-formatacao-section fundo-go';
            } else if (tipo === 'standard') {
                descricaoBase = '<strong>Formatação Standard</strong> — Instalação limpa do sistema operacional com drivers essenciais e configurações padrão. Versão <strong>Plus</strong> disponível com backup completo dos seus dados.';
                if (section) section.className = 'tipos-formatacao-section fundo-standard';
            } else if (tipo === 'educacional') {
                descricaoBase = '<strong>Formatação Educacional</strong> — Sistemas otimizados para estudos, com softwares educacionais, Office, ferramentas de produtividade e controle parental disponível. Versão <strong>Plus</strong> com backup e configurações personalizadas.';
                if (section) section.className = 'tipos-formatacao-section fundo-educacional';
            } else if (tipo === 'pro') {
                descricaoBase = '<strong>Formatação Pro</strong> — Sistemas otimizados para uso profissional, edição de imagens, gravação de tela, streaming e produtividade. Configurações de desempenho e estabilidade. Versão <strong>Pro Plus</strong> com backup completo.';
                if (section) section.className = 'tipos-formatacao-section fundo-pro';
            } else if (tipo === 'gamer') {
                descricaoBase = '<strong>Formatação Gamer</strong> — Sistema otimizado para jogos com tweaks de desempenho, drivers atualizados e configurações de baixa latência. Máxima performance para seus jogos!';
                if (section) section.className = 'tipos-formatacao-section fundo-gamer';
            } else if (tipo === 'enterprise') {
                descricaoBase = '<strong>Formatação Enterprise</strong> — Pacotes corporativos para formatação de múltiplos computadores desktop. Ideal para empresas que precisam de padronização e eficiência em escala. Escolha entre planos para até 10, 15 ou 20 PCs, com opções para Windows Enterprise e Linux Desktop. <strong>Exclusivo para estações de trabalho, não para servidores.</strong>';
                if (section) section.className = 'tipos-formatacao-section fundo-enterprise';
            } else if (tipo === 'premium') {
                descricaoBase =
                    '<strong>Formatação Premium</strong> — Pacotes de alto desempenho para empresas que exigem o máximo em estabilidade e produtividade. Escolha entre planos para 1, 3 ou 5 PCs, com opções para Windows Enterprise e Linux Desktop otimizados. ' +
                    '<strong>Exclusivo para estações de trabalho, não para servidores.</strong>';
                if (section) section.className = 'tipos-formatacao-section fundo-premium';
            }
            descricaoEl.innerHTML = descricaoBase;
        }

        const geradorBtn = document.getElementById('abrirGeradorBtn');
        if (geradorBtn) {
            geradorBtn.style.display = (tipo === 'go') ? 'none' : 'inline-flex';
        }

        const mensagemCorp = document.getElementById('mensagemPlanosCorporativos');
        if (mensagemCorp) {
            mensagemCorp.style.display = (tipo === 'enterprise') ? 'block' : 'none';
        }

        const soFilterTabs = document.getElementById('soFilterTabs');
        if (tipo === 'go') {
            if (soFilterTabs) soFilterTabs.innerHTML = '';
        } else {
            const sistemas = [];
            servicosFiltrados.forEach(function(s) {
                if (s.sistema && s.sistema !== 'outros' && sistemas.indexOf(s.sistema) === -1) {
                    sistemas.push(s.sistema);
                }
            });
            if (sistemas.length === 0) sistemas.push('windows');

            const ordem = ['windows', 'linux', 'mac', 'steam-machine', 'steam-deck'];
            sistemas.sort(function(a, b) { return ordem.indexOf(a) - ordem.indexOf(b); });

            if (sistemas.indexOf(so) === -1) {
                soSelecionado = sistemas[0];
            }

            if (soFilterTabs) {
                soFilterTabs.innerHTML = '';
                sistemas.forEach(function(sistema) {
                    const btn = document.createElement('button');
                    btn.className = 'filter-tab' + (sistema === soSelecionado ? ' filter-tab--active' : '');
                    btn.dataset.so = sistema;
                    if (sistema === 'windows') {
                        btn.innerHTML = '<i class="fa-brands fa-windows"></i> Windows';
                    } else if (sistema === 'linux') {
                        btn.innerHTML = '<i class="fa-brands fa-linux"></i> Linux';
                    } else if (sistema === 'mac') {
                        btn.innerHTML = '<i class="fa-brands fa-apple"></i> Mac OS';
                    } else if (sistema === 'steam-machine') {
                        btn.innerHTML = '<i class="fa-brands fa-steam"></i> Steam Machine';
                    } else if (sistema === 'steam-deck') {
                        btn.innerHTML = '<i class="fa-brands fa-steam"></i> Steam Deck';
                    } else {
                        btn.textContent = sistema.charAt(0).toUpperCase() + sistema.slice(1);
                    }
                    btn.addEventListener('click', function() {
                        soSelecionado = this.dataset.so;
                        const allBtns = soFilterTabs.querySelectorAll('.filter-tab');
                        allBtns.forEach(function(b) { b.classList.remove('filter-tab--active'); });
                        this.classList.add('filter-tab--active');
                        atualizarFormatacao(servicos, tipo, soSelecionado);
                        const pacoteSOModal = document.getElementById('pacoteSOModal');
                        if (pacoteSOModal && typeof atualizarIconeSO === 'function') {
                            atualizarIconeSO(soSelecionado);
                        }
                    });
                    soFilterTabs.appendChild(btn);
                });
            }
        }

        let cardsFiltrados = [];
        if (tipo === 'go') {
            cardsFiltrados = servicosFiltrados;
        } else {
            cardsFiltrados = servicosFiltrados.filter(function(s) {
                return s.sistema === soSelecionado;
            });
        }

        const grid = document.getElementById('formatacaoCardsGrid');
        if (grid) {
            grid.innerHTML = '';
            cardsFiltrados.forEach(function(servico) {
                const card = criarCardGrande(servico, 'formatacao');
                grid.appendChild(card);
            });
            if (cardsFiltrados.length === 0) {
                grid.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center; padding: 40px;">Nenhum serviço disponível para este sistema operacional.</p>';
            }
        }
    }

    // ============================================================
    // 15. TABS DE TIPO
    // ============================================================
    document.addEventListener('click', function(e) {
        const target = e.target.closest('#tipoFormatacaoTabs .filter-tab');
        if (target) {
            const tabs = document.querySelectorAll('#tipoFormatacaoTabs .filter-tab');
            tabs.forEach(function(t) { t.classList.remove('filter-tab--active'); });
            target.classList.add('filter-tab--active');
            tipoSelecionado = target.dataset.tipo;
            if (tipoSelecionado !== 'go') {
                soSelecionado = 'windows';
            } else {
                soSelecionado = null;
            }
            if (servicosGlobais && servicosGlobais.length > 0) {
                renderizarTiposFormatacao(servicosGlobais);
                if (typeof preencherTipoSelect === 'function') {
                    preencherTipoSelect();
                }
            }
        }
    });

    // ============================================================
    // 16. FUNÇÃO DE DESCONTO ESCALONADO
    // ============================================================
    function calcularDesconto(qtd) {
        if (qtd === 1) return 0;
        if (qtd === 2) return 0.01;
        if (qtd >= 3 && qtd <= 4) return 0.03;
        if (qtd >= 5 && qtd <= 14) return 0.07;
        if (qtd >= 15 && qtd <= 24) return 0.09;
        if (qtd >= 25 && qtd <= 34) return 0.11;
        if (qtd >= 35 && qtd <= 44) return 0.13;
        if (qtd >= 45 && qtd <= 54) return 0.17;
        if (qtd >= 55 && qtd <= 64) return 0.19;
        if (qtd >= 65 && qtd <= 84) return 0.21;
        if (qtd >= 85 && qtd <= 104) return 0.23;
        if (qtd >= 105 && qtd <= 124) return 0.27;
        if (qtd >= 125 && qtd <= 144) return 0.29;
        if (qtd >= 145) return 0.31;
        return 0;
    }

    function formatarPorcentagem(valor) {
        return (valor * 100).toFixed(0) + '%';
    }

    // ============================================================
    // 17. GERADOR DE PACOTE (VERSÃO 36.55 - PDF CORRIGIDO)
    // ============================================================
    function configurarGeradorPacote() {
        if (geradorConfigurado) return;

        const abrirGeradorBtn = document.getElementById('abrirGeradorBtn');
        const modal = document.getElementById('geradorModal');
        const modalOverlay = document.getElementById('modalOverlay');
        const modalClose = document.getElementById('modalClose');
        const pacoteTipoModal = document.getElementById('pacoteTipoModal');
        const pacoteSOModal = document.getElementById('pacoteSOModal');
        const pacoteQuantidadeModal = document.getElementById('pacoteQuantidadeModal');
        const calcularPacoteBtn = document.getElementById('calcularPacoteBtn');
        const pacoteResultadoModal = document.getElementById('pacoteResultadoModal');
        const baseInfoModal = document.getElementById('baseInfoModal');
        const soIcon = document.getElementById('soIcon');
        const tipoIcon = document.getElementById('tipoIcon');

        // Variáveis para controle de nível de jogos (com setas)
        let jogosNivelAtual = 'nivel1';
        let jogosSetaEsq = null;
        let jogosSetaDir = null;
        let jogosNivelLabel = null;
        let jogosNivelContainer = null;

        // Referências para os campos de serviços opcionais
        let limpezaContainer = null;
        let limpezaInput = null;
        let limpezaQtdInput = null;
        let limpezaIndicador = null;
        let limpezaBtnEsquerdo = null;
        let limpezaBtnDireito = null;
        let limpezaQtdWrapper = null;

        let antivirusContainer = null;
        let antivirusQtdInput = null;
        let antivirusSelect = null;
        let antivirusOutroInput = null;
        let antivirusLabelPreco = null;

        let officeContainer = null;
        let officeQtdInput = null;
        let officeSelect = null;
        let officeLabelPreco = null;

        let impressoraContainer = null;
        let impressoraQtdInput = null;
        let impressoraLabelPreco = null;
        let impressoraIndicador = null;
        let impressoraBtnEsquerdo = null;
        let impressoraBtnDireito = null;
        let impressoraQtdWrapper = null;

        let jogosContainer = null;
        let jogosQtdInput = null;
        let jogosIndicador = null;
        let jogosBtnEsquerdo = null;
        let jogosBtnDireito = null;
        let jogosQtdWrapper = null;
        let jogosDescricaoContainer = null;
        let jogosNivelBrinde = null;
        let jogosAtualizarEstado = null;

        let precoLimpeza = 120.00;
        let precoAntivirus = 0.00;
        let precoOffice = 139.90;
        let precoImpressora = 59.90;

        const precosJogos = {
            'nivel1': 59.90,
            'nivel2': 79.90,
            'nivel3': 99.90
        };

        const precosAntivirus = {
            'gratuito': 0.00,
            '360-total-security': 0.00,
            'avg-free': 0.00,
            'avast-free': 0.00,
            'avira-free': 0.00,
            'kaspersky-standard': 99.90,
            'kaspersky-plus': 119.00,
            'kaspersky-premium': 199.90,
            'outro': 0.00
        };

        const precosOffice = {
            'gratuito': 0.00,
            'office': 139.90,
            'libreoffice': 0.00,
            'wps': 0.00,
            'onlyoffice': 0.00
        };

        const brindeJogosMap = {
            1: 'nivel1',
            2: 'nivel2',
            9: 'nivel2',
            12: 'nivel3',
            13: 'nivel3',
            14: 'nivel3',
            15: 'nivel3',
            16: 'nivel3',
            17: 'nivel3',
            18: 'nivel3',
            19: 'nivel3',
            20: 'nivel3',
            21: 'nivel3',
            22: 'nivel3'
        };

        if (!abrirGeradorBtn || !modal || !pacoteTipoModal || !pacoteSOModal || !pacoteQuantidadeModal || !calcularPacoteBtn) {
            console.warn('Elementos do gerador de pacote não encontrados. Aguardando...');
            return;
        }

        geradorConfigurado = true;

        modal.style.display = 'none';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        const modalContent = document.querySelector('.modal-content--pacote');
        if (modalContent) {
            modalContent.style.maxHeight = '90vh';
            modalContent.style.overflowY = 'auto';
            modalContent.style.padding = '0';
        }

        let metodoPagamento = 'cash';
        let numParcelasSelecionadas = 2;
        let cotacaoBTC = null;
        let cotacaoETH = null;

        // ============================================================
        // FUNÇÃO AUXILIAR PARA CRIAR INPUT COM BOTÕES + E -
        // ============================================================
        function criarInputComBotoes(input, minVal, maxVal, step) {
            const wrapper = input.closest('.pacote-modal__input-wrapper');
            if (!wrapper) return;

            const existingBtns = wrapper.querySelectorAll('.pacote-modal__btn-step');
            existingBtns.forEach(function(btn) { btn.remove(); });

            wrapper.classList.add('pacote-modal__input-wrapper--with-buttons');

            const btnMinus = document.createElement('button');
            btnMinus.type = 'button';
            btnMinus.className = 'pacote-modal__btn-step pacote-modal__btn-step--minus';
            btnMinus.innerHTML = '<i class="fa-solid fa-minus"></i>';
            btnMinus.setAttribute('aria-label', 'Diminuir');

            const btnPlus = document.createElement('button');
            btnPlus.type = 'button';
            btnPlus.className = 'pacote-modal__btn-step pacote-modal__btn-step--plus';
            btnPlus.innerHTML = '<i class="fa-solid fa-plus"></i>';
            btnPlus.setAttribute('aria-label', 'Aumentar');

            wrapper.insertBefore(btnMinus, input);
            wrapper.appendChild(btnPlus);

            function atualizarValor(delta) {
                const valorAtual = parseInt(input.value) || 0;
                const max = parseInt(input.getAttribute('max')) || maxVal;
                const min = parseInt(input.getAttribute('min')) || minVal;
                const novoValor = Math.min(Math.max(valorAtual + delta, min), max);
                input.value = novoValor;
                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
                const changeEvent = new Event('change', { bubbles: true });
                input.dispatchEvent(changeEvent);
            }

            btnMinus.addEventListener('click', function(e) {
                e.preventDefault();
                if (!input.disabled) atualizarValor(-1);
            });

            btnPlus.addEventListener('click', function(e) {
                e.preventDefault();
                if (!input.disabled) atualizarValor(1);
            });

            const observer = new MutationObserver(function() {
                let maxAttr = input.getAttribute('max');
                if (maxAttr !== null) {
                    maxVal = parseInt(maxAttr) || 0;
                }
                const current = parseInt(input.value) || 0;
                if (current > maxVal) {
                    input.value = maxVal;
                }
                if (input.dataset.brinde === 'true' && input.dataset.automatico === 'true') {
                    const qtdTotal = parseInt(pacoteQuantidadeModal.value) || 0;
                    if (input.value != qtdTotal) {
                        input.value = qtdTotal;
                    }
                }
            });
            observer.observe(input, { attributes: true, attributeFilter: ['max', 'value'] });

            input.addEventListener('change', function() {
                const current = parseInt(this.value) || 0;
                const max = parseInt(this.getAttribute('max')) || maxVal;
                const min = parseInt(this.getAttribute('min')) || minVal;
                if (current > max) this.value = max;
                if (current < min) this.value = min;
            });
        }

        // ============================================================
        // FUNÇÃO AUXILIAR: OBTER JOGOS POR NÍVEL
        // ============================================================
        function obterJogosPorNivel(nivel) {
            const idMap = {
                'nivel1': 72,
                'nivel2': 73,
                'nivel3': 74
            };
            const id = idMap[nivel];
            if (!id) return [];
            const servico = servicosGlobais.find(function(s) { return s.id === id; });
            return servico && servico.jogos ? servico.jogos : [];
        }

        // ============================================================
        // FUNÇÕES DE VERIFICAÇÃO DE BRINDE
        // ============================================================
        function servicoTemBrindeAntivirus(tipo, so) {
            const resultado = obterServicoBase(tipo, so);
            const servico = resultado.servico;
            if (!servico) return false;
            const brindes = servico.brindes || brindesPorId[servico.id] || [];
            return brindes.some(function(item) {
                return item.toLowerCase().includes('kaspersky') || item.toLowerCase().includes('antivírus');
            });
        }

        function servicoTemBrindeOffice(tipo, so) {
            const resultado = obterServicoBase(tipo, so);
            const servico = resultado.servico;
            if (!servico) return false;
            const brindes = servico.brindes || brindesPorId[servico.id] || [];
            return brindes.some(function(item) {
                return item.toLowerCase().includes('ms office') || item.toLowerCase().includes('office');
            });
        }

        function servicoTemBrindeImpressora(tipo, so) {
            const resultado = obterServicoBase(tipo, so);
            const servico = resultado.servico;
            if (!servico) return false;
            const brindes = servico.brindes || brindesPorId[servico.id] || [];
            return brindes.some(function(item) {
                return item.toLowerCase().includes('impressora');
            });
        }

        function servicoTemBrindeLimpeza(tipo, so) {
            const resultado = obterServicoBase(tipo, so);
            const servico = resultado.servico;
            if (!servico) return false;
            const brindes = servico.brindes || brindesPorId[servico.id] || [];
            return brindes.some(function(item) {
                return item.toLowerCase().includes('limpeza');
            });
        }

        // ============================================================
        // FUNÇÃO PARA ATUALIZAR A UI DO NÍVEL (setas e label)
        // ============================================================
        function atualizarNivelUI() {
            if (!jogosNivelLabel) return;
            const niveis = ['nivel1', 'nivel2', 'nivel3'];
            const idx = niveis.indexOf(jogosNivelAtual);
            if (idx === -1) idx = 0;
            const nomes = { 'nivel1': 'Nível 1', 'nivel2': 'Nível 2', 'nivel3': 'Nível 3' };
            jogosNivelLabel.textContent = nomes[jogosNivelAtual] || 'Nível 1';
            if (jogosSetaEsq) {
                jogosSetaEsq.style.visibility = (idx === 0) ? 'hidden' : 'visible';
            }
            if (jogosSetaDir) {
                jogosSetaDir.style.visibility = (idx === niveis.length - 1) ? 'hidden' : 'visible';
            }
            if (jogosIndicador && jogosIndicador.textContent === 'Sim') {
                atualizarDescricaoJogos();
            }
            atualizarPrecoJogosLabel();
        }

        // ============================================================
        // FUNÇÃO PARA ATUALIZAR STATUS DE BRINDE DO PACOTE DE JOGOS
        // ============================================================
        function atualizarStatusBrindeJogos() {
            if (!jogosIndicador || !jogosQtdInput) return;
            if (jogosIndicador.textContent !== 'Sim') {
                jogosQtdInput.dataset.brinde = 'false';
                jogosQtdInput.dataset.automatico = 'false';
                return;
            }
            const isBrinde = (jogosNivelBrinde && jogosNivelAtual === jogosNivelBrinde);
            jogosQtdInput.dataset.brinde = isBrinde ? 'true' : 'false';
            jogosQtdInput.dataset.automatico = isBrinde ? 'true' : 'false';
            if (isBrinde) {
                const qtdTotal = parseInt(pacoteQuantidadeModal.value) || 0;
                jogosQtdInput.value = qtdTotal;
                jogosQtdInput.max = qtdTotal;
                jogosQtdInput.disabled = (qtdTotal === 0);
            } else {
                const currentVal = parseInt(jogosQtdInput.value) || 0;
                const maxVal = parseInt(pacoteQuantidadeModal.value) || 0;
                if (currentVal > maxVal) jogosQtdInput.value = maxVal;
                jogosQtdInput.max = maxVal;
                jogosQtdInput.disabled = (maxVal === 0);
            }
            atualizarPrecoJogosLabel();
        }

        // ============================================================
        // FUNÇÃO PARA RESETAR O CAMPO DE JOGOS (estado "Não")
        // ============================================================
        function resetarCampoJogos() {
            if (!jogosContainer) return;
            jogosNivelBrinde = null;
            if (jogosIndicador) {
                jogosIndicador.textContent = 'Não';
                jogosBtnEsquerdo.style.visibility = 'hidden';
                jogosBtnDireito.style.visibility = 'visible';
                jogosQtdWrapper.style.display = 'flex';
                if (jogosDescricaoContainer) jogosDescricaoContainer.style.display = 'none';
                jogosQtdInput.disabled = true;
                jogosQtdInput.value = 0;
                jogosQtdInput.dataset.brinde = 'false';
                jogosQtdInput.dataset.automatico = 'false';
                jogosBtnEsquerdo.disabled = false;
                jogosBtnDireito.disabled = false;
                if (jogosSetaEsq) { jogosSetaEsq.disabled = true; }
                if (jogosSetaDir) { jogosSetaDir.disabled = true; }
                if (jogosNivelContainer) {
                    jogosNivelContainer.style.opacity = '0.5';
                    jogosNivelContainer.style.borderColor = 'var(--color-border)';
                }
            }
            atualizarPrecoJogosLabel();
        }

        // ============================================================
        // FUNÇÃO PARA ATIVAR O TOGGLE (chamada de fora)
        // ============================================================
        function ativarToggleJogos(estado, definirNivel) {
            if (estado === 1) {
                jogosIndicador.textContent = 'Sim';
                jogosBtnEsquerdo.style.visibility = 'visible';
                jogosBtnDireito.style.visibility = 'hidden';
                jogosSetaEsq.disabled = false;
                jogosSetaDir.disabled = false;
                jogosNivelContainer.style.opacity = '1';
                jogosNivelContainer.style.borderColor = 'var(--color-border-light)';
                jogosQtdWrapper.style.display = 'flex';

                if (definirNivel) {
                    jogosNivelAtual = jogosNivelBrinde || 'nivel1';
                    atualizarNivelUI();
                }
                atualizarStatusBrindeJogos();
                atualizarDescricaoJogos();
            } else {
                jogosIndicador.textContent = 'Não';
                jogosBtnEsquerdo.style.visibility = 'hidden';
                jogosBtnDireito.style.visibility = 'visible';
                jogosSetaEsq.disabled = true;
                jogosSetaDir.disabled = true;
                jogosNivelContainer.style.opacity = '0.5';
                jogosNivelContainer.style.borderColor = 'var(--color-border)';
                jogosQtdInput.disabled = true;
                jogosQtdInput.value = 0;
                jogosQtdInput.dataset.brinde = 'false';
                jogosQtdInput.dataset.automatico = 'false';
                if (jogosDescricaoContainer) jogosDescricaoContainer.style.display = 'none';
                atualizarPrecoJogosLabel();
            }
        }

        // ============================================================
        // FUNÇÃO PARA APLICAR BRINDE DE JOGOS (INTELIGENTE)
        // ============================================================
        function aplicarBrindeJogos() {
            if (!jogosContainer) return;
            const resultado = obterServicoBase(pacoteTipoModal.value, pacoteSOModal.value);
            const servicoBase = resultado.servico;
            const nivel = servicoBase ? brindeJogosMap[servicoBase.id] : null;
            jogosNivelBrinde = nivel || null;

            if (nivel) {
                if (jogosIndicador.textContent === 'Não') {
                    ativarToggleJogos(1, true);
                } else {
                    atualizarStatusBrindeJogos();
                }
            } else {
                jogosNivelBrinde = null;
                if (jogosIndicador.textContent === 'Sim') {
                    atualizarStatusBrindeJogos();
                }
            }
            atualizarNivelUI();
        }

        // ============================================================
        // FUNÇÃO PARA DEFINIR OS SERVIÇOS AUTOMATICAMENTE (BRINDES)
        // ============================================================
        function definirServicosAutomaticos(tipo, so) {
            const qtdTotal = parseInt(pacoteQuantidadeModal.value) || 1;

            if (antivirusSelect && antivirusQtdInput) {
                const isPremiumOuEnterprise = (tipo === 'premium' || tipo === 'enterprise');

                if (isPremiumOuEnterprise) {
                    antivirusSelect.value = 'kaspersky-premium';
                    antivirusQtdInput.max = qtdTotal;
                    antivirusQtdInput.value = qtdTotal;
                    antivirusQtdInput.disabled = false;
                    if (antivirusOutroInput) antivirusOutroInput.style.display = 'none';
                    antivirusQtdInput.dataset.automatico = 'true';
                    antivirusQtdInput.dataset.brinde = 'true';
                } else {
                    const temBrindeAV = servicoTemBrindeAntivirus(tipo, so);
                    if (temBrindeAV) {
                        antivirusSelect.value = 'gratuito';
                        antivirusQtdInput.max = qtdTotal;
                        antivirusQtdInput.value = qtdTotal;
                        antivirusQtdInput.disabled = false;
                        if (antivirusOutroInput) antivirusOutroInput.style.display = 'none';
                        antivirusQtdInput.dataset.automatico = 'true';
                        antivirusQtdInput.dataset.brinde = 'true';
                    } else {
                        const valorAtual = parseInt(antivirusQtdInput.value) || 0;
                        if (valorAtual > qtdTotal) antivirusQtdInput.value = qtdTotal;
                        antivirusQtdInput.max = qtdTotal;
                        if (qtdTotal === 0) {
                            antivirusQtdInput.value = 0;
                            antivirusQtdInput.disabled = true;
                        } else {
                            antivirusQtdInput.disabled = false;
                        }
                        antivirusQtdInput.dataset.automatico = 'false';
                        antivirusQtdInput.dataset.brinde = 'false';
                    }
                }
                atualizarPrecoAntivirusLabel();
            }

            if (officeSelect && officeQtdInput) {
                const tiposComBrindeOffice = ['pro', 'educacional', 'premium', 'enterprise'];
                const temBrindeOffice = (tiposComBrindeOffice.indexOf(tipo) !== -1) || servicoTemBrindeOffice(tipo, so);

                if (temBrindeOffice) {
                    officeSelect.value = 'office';
                    officeQtdInput.max = qtdTotal;
                    officeQtdInput.value = qtdTotal;
                    officeQtdInput.disabled = false;
                    officeQtdInput.dataset.automatico = 'true';
                    officeQtdInput.dataset.brinde = 'true';
                } else {
                    const valorAtualOffice = parseInt(officeQtdInput.value) || 0;
                    if (valorAtualOffice > qtdTotal) officeQtdInput.value = qtdTotal;
                    officeQtdInput.max = qtdTotal;
                    if (qtdTotal === 0) {
                        officeQtdInput.value = 0;
                        officeQtdInput.disabled = true;
                    } else {
                        officeQtdInput.disabled = false;
                    }
                    officeQtdInput.dataset.automatico = 'false';
                    officeQtdInput.dataset.brinde = 'false';
                }
                atualizarPrecoOfficeLabel();
            }

            if (impressoraContainer && impressoraBtnEsquerdo && impressoraBtnDireito && impressoraIndicador && impressoraQtdInput) {
                const isPremiumOuEnterprise = (tipo === 'premium' || tipo === 'enterprise');
                const temBrindeImpressora = isPremiumOuEnterprise || servicoTemBrindeImpressora(tipo, so);

                if (temBrindeImpressora) {
                    impressoraIndicador.textContent = 'Sim';
                    impressoraBtnEsquerdo.style.visibility = 'visible';
                    impressoraBtnDireito.style.visibility = 'hidden';
                    impressoraQtdInput.value = qtdTotal;
                    impressoraQtdInput.max = qtdTotal;
                    impressoraQtdInput.disabled = false;
                    impressoraQtdWrapper.style.display = 'flex';
                    impressoraQtdInput.dataset.brinde = 'true';
                    impressoraQtdInput.dataset.automatico = 'true';
                } else {
                    impressoraIndicador.textContent = 'Não';
                    impressoraBtnEsquerdo.style.visibility = 'hidden';
                    impressoraBtnDireito.style.visibility = 'visible';
                    impressoraQtdInput.value = 0;
                    impressoraQtdInput.max = qtdTotal;
                    impressoraQtdInput.disabled = true;
                    impressoraQtdWrapper.style.display = 'none';
                    impressoraQtdInput.dataset.brinde = 'false';
                    impressoraQtdInput.dataset.automatico = 'false';
                }
                atualizarPrecoImpressoraLabel();
            }

            if (limpezaContainer && limpezaBtnEsquerdo && limpezaBtnDireito && limpezaIndicador && limpezaQtdInput) {
                const temBrindeLimpeza = servicoTemBrindeLimpeza(tipo, so);

                if (temBrindeLimpeza) {
                    limpezaIndicador.textContent = 'Sim';
                    limpezaBtnEsquerdo.style.visibility = 'visible';
                    limpezaBtnDireito.style.visibility = 'hidden';
                    limpezaQtdInput.value = qtdTotal;
                    limpezaQtdInput.max = qtdTotal;
                    limpezaQtdInput.disabled = false;
                    limpezaQtdWrapper.style.display = 'flex';
                    limpezaQtdInput.dataset.brinde = 'true';
                    limpezaQtdInput.dataset.automatico = 'true';
                } else {
                    limpezaIndicador.textContent = 'Não';
                    limpezaBtnEsquerdo.style.visibility = 'hidden';
                    limpezaBtnDireito.style.visibility = 'visible';
                    limpezaQtdInput.value = 0;
                    limpezaQtdInput.max = qtdTotal;
                    limpezaQtdInput.disabled = true;
                    limpezaQtdWrapper.style.display = 'none';
                    limpezaQtdInput.dataset.brinde = 'false';
                    limpezaQtdInput.dataset.automatico = 'false';
                }
                atualizarPrecoLimpezaLabel();
            }

            aplicarBrindeJogos();
        }

        // ============================================================
        // FUNÇÃO PARA ATUALIZAR A DESCRIÇÃO DOS JOGOS
        // ============================================================
        function atualizarDescricaoJogos() {
            if (!jogosDescricaoContainer) return;
            const nivel = jogosNivelAtual || 'nivel1';
            const jogos = obterJogosPorNivel(nivel);
            if (jogos.length === 0) {
                jogosDescricaoContainer.innerHTML = '';
                jogosDescricaoContainer.style.display = 'none';
                return;
            }
            let html = '<div class="jogos-descricao-grid">';
            jogos.forEach(function(jogo) {
                html += '<div class="jogo-descricao-item"><img src="' + jogo.imagem + '" alt="Jogo" loading="lazy" /></div>';
            });
            html += '</div>';
            jogosDescricaoContainer.innerHTML = html;
            jogosDescricaoContainer.style.display = (jogosIndicador.textContent === 'Sim') ? 'block' : 'none';
        }

        // ============================================================
        // FUNÇÃO PARA CRIAR O CAMPO DE PACOTE DE JOGOS (COM SETAS MODERNAS)
        // ============================================================
        function criarCampoJogos() {
            const existingContainer = document.getElementById('jogosContainer');
            if (existingContainer) existingContainer.remove();

            jogosContainer = document.createElement('div');
            jogosContainer.id = 'jogosContainer';
            jogosContainer.className = 'pacote-modal__field pacote-modal__field--center';
            jogosContainer.style.marginTop = '16px';

            const label = document.createElement('label');
            label.id = 'jogosLabel';
            label.innerHTML = '<i class="fa-solid fa-gamepad" style="color: var(--color-primary-light);"></i> Pacote de Jogos';
            jogosContainer.appendChild(label);

            // Toggle Sim/Não
            const toggleContainer = document.createElement('div');
            toggleContainer.className = 'pacote-modal__toggle-container';
            toggleContainer.style.display = 'flex';
            toggleContainer.style.alignItems = 'center';
            toggleContainer.style.justifyContent = 'center';
            toggleContainer.style.gap = '16px';
            toggleContainer.style.marginBottom = '8px';

            const btnEsquerdo = document.createElement('button');
            btnEsquerdo.type = 'button';
            btnEsquerdo.className = 'pacote-modal__toggle-btn';
            btnEsquerdo.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
            btnEsquerdo.style.visibility = 'hidden';
            btnEsquerdo.setAttribute('aria-label', 'Não');
            jogosBtnEsquerdo = btnEsquerdo;

            const indicador = document.createElement('span');
            indicador.className = 'pacote-modal__toggle-indicator';
            indicador.textContent = 'Não';
            jogosIndicador = indicador;

            const btnDireito = document.createElement('button');
            btnDireito.type = 'button';
            btnDireito.className = 'pacote-modal__toggle-btn';
            btnDireito.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
            btnDireito.style.visibility = 'visible';
            btnDireito.setAttribute('aria-label', 'Sim');
            jogosBtnDireito = btnDireito;

            toggleContainer.appendChild(btnEsquerdo);
            toggleContainer.appendChild(indicador);
            toggleContainer.appendChild(btnDireito);
            jogosContainer.appendChild(toggleContainer);

            // Controle de Nível com setas
            const nivelContainer = document.createElement('div');
            nivelContainer.className = 'pacote-modal__nivel-container';
            nivelContainer.style.display = 'flex';
            nivelContainer.style.alignItems = 'center';
            nivelContainer.style.justifyContent = 'center';
            nivelContainer.style.gap = '16px';
            nivelContainer.style.margin = '8px auto 8px';
            nivelContainer.style.maxWidth = '280px';
            nivelContainer.style.padding = '6px 12px';
            nivelContainer.style.background = 'rgba(255,255,255,0.02)';
            nivelContainer.style.borderRadius = '50px';
            nivelContainer.style.border = '1px solid var(--color-border)';
            nivelContainer.style.transition = 'opacity 0.2s, border-color 0.2s';

            const setaEsq = document.createElement('button');
            setaEsq.type = 'button';
            setaEsq.className = 'pacote-modal__toggle-btn';
            setaEsq.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
            setaEsq.style.visibility = 'hidden';
            setaEsq.setAttribute('aria-label', 'Nível anterior');
            setaEsq.disabled = true;
            jogosSetaEsq = setaEsq;

            const nivelLabel = document.createElement('span');
            nivelLabel.className = 'pacote-modal__toggle-indicator';
            nivelLabel.textContent = 'Nível 1';
            nivelLabel.style.minWidth = '70px';
            nivelLabel.style.fontWeight = '700';
            nivelLabel.style.color = 'var(--color-text)';
            jogosNivelLabel = nivelLabel;

            const setaDir = document.createElement('button');
            setaDir.type = 'button';
            setaDir.className = 'pacote-modal__toggle-btn';
            setaDir.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
            setaDir.style.visibility = 'hidden';
            setaDir.setAttribute('aria-label', 'Próximo nível');
            setaDir.disabled = true;
            jogosSetaDir = setaDir;

            nivelContainer.appendChild(setaEsq);
            nivelContainer.appendChild(nivelLabel);
            nivelContainer.appendChild(setaDir);
            jogosContainer.appendChild(nivelContainer);
            jogosNivelContainer = nivelContainer;

            // Campo de quantidade
            const qtdWrapper = document.createElement('div');
            qtdWrapper.className = 'pacote-modal__input-wrapper';
            qtdWrapper.style.maxWidth = '280px';
            qtdWrapper.style.margin = '0 auto';

            const qtdIcon = document.createElement('i');
            qtdIcon.className = 'pacote-modal__input-icon fa-solid fa-computer';
            qtdWrapper.appendChild(qtdIcon);

            const qtdInput = document.createElement('input');
            qtdInput.type = 'number';
            qtdInput.id = 'jogosQuantidade';
            qtdInput.className = 'pacote-modal__input';
            qtdInput.value = '0';
            qtdInput.min = '0';
            qtdInput.max = '0';
            qtdInput.step = '1';
            qtdInput.disabled = true;
            qtdWrapper.appendChild(qtdInput);
            jogosContainer.appendChild(qtdWrapper);
            jogosQtdWrapper = qtdWrapper;
            jogosQtdInput = qtdInput;

            const helpText = document.createElement('small');
            helpText.style.color = 'var(--color-text-muted)';
            helpText.style.fontSize = '0.8rem';
            helpText.style.marginTop = '4px';
            helpText.style.display = 'block';
            helpText.textContent = 'Quantos PCs receberão o pacote de jogos (0 = nenhum)';
            jogosContainer.appendChild(helpText);

            // Container para descrição dos jogos
            const descContainer = document.createElement('div');
            descContainer.id = 'jogosDescricaoContainer';
            descContainer.style.display = 'none';
            descContainer.style.marginTop = '10px';
            descContainer.style.width = '100%';
            descContainer.style.overflowX = 'auto';
            descContainer.style.padding = '8px';
            descContainer.style.background = 'rgba(255,255,255,0.02)';
            descContainer.style.borderRadius = 'var(--radius-sm)';
            descContainer.style.border = '1px solid var(--color-border)';
            jogosContainer.appendChild(descContainer);
            jogosDescricaoContainer = descContainer;

            // Inserir após Limpeza
            const limpezaField = document.getElementById('limpezaContainer');
            if (limpezaField) {
                limpezaField.parentNode.insertBefore(jogosContainer, limpezaField.nextSibling);
            } else {
                const body = document.querySelector('.pacote-modal__body');
                if (body) body.appendChild(jogosContainer);
            }

            // ---------- FUNÇÃO PARA ATUALIZAR ESTADO (habilitar/desabilitar) ----------
            function atualizarEstadoJogos(estado) {
                if (estado === 1) {
                    indicador.textContent = 'Sim';
                    btnEsquerdo.style.visibility = 'visible';
                    btnDireito.style.visibility = 'hidden';
                    setaEsq.disabled = false;
                    setaDir.disabled = false;
                    nivelContainer.style.opacity = '1';
                    nivelContainer.style.borderColor = 'var(--color-border-light)';
                    qtdInput.disabled = false;
                    qtdWrapper.style.display = 'flex';
                    let qtdTotal = parseInt(pacoteQuantidadeModal.value) || 0;
                    qtdInput.max = qtdTotal;
                    if (parseInt(qtdInput.value) === 0 || parseInt(qtdInput.value) > qtdTotal) {
                        qtdInput.value = qtdTotal;
                    }
                    if (jogosNivelBrinde) {
                        qtdInput.dataset.brinde = 'true';
                        qtdInput.dataset.automatico = 'true';
                        qtdInput.value = qtdTotal;
                        qtdInput.max = qtdTotal;
                    } else {
                        qtdInput.dataset.brinde = 'false';
                        qtdInput.dataset.automatico = 'false';
                    }
                    atualizarDescricaoJogos();
                } else {
                    indicador.textContent = 'Não';
                    btnEsquerdo.style.visibility = 'hidden';
                    btnDireito.style.visibility = 'visible';
                    setaEsq.disabled = true;
                    setaDir.disabled = true;
                    nivelContainer.style.opacity = '0.5';
                    nivelContainer.style.borderColor = 'var(--color-border)';
                    qtdInput.disabled = true;
                    qtdInput.value = 0;
                    qtdInput.dataset.brinde = 'false';
                    qtdInput.dataset.automatico = 'false';
                    if (jogosDescricaoContainer) jogosDescricaoContainer.style.display = 'none';
                }
                atualizarPrecoJogosLabel();
            }

            // Armazena a função para uso externo
            jogosAtualizarEstado = atualizarEstadoJogos;

            // Eventos das setas de nível
            setaEsq.addEventListener('click', function() {
                const niveis = ['nivel1', 'nivel2', 'nivel3'];
                const idx = niveis.indexOf(jogosNivelAtual);
                if (idx > 0) {
                    jogosNivelAtual = niveis[idx - 1];
                    atualizarNivelUI();
                    atualizarStatusBrindeJogos();
                }
            });

            setaDir.addEventListener('click', function() {
                const niveis = ['nivel1', 'nivel2', 'nivel3'];
                const idx = niveis.indexOf(jogosNivelAtual);
                if (idx < niveis.length - 1) {
                    jogosNivelAtual = niveis[idx + 1];
                    atualizarNivelUI();
                    atualizarStatusBrindeJogos();
                }
            });

            // Eventos dos botões toggle
            btnDireito.onclick = function() {
                ativarToggleJogos(1, false);
                const event = new Event('change', { bubbles: true });
                qtdInput.dispatchEvent(event);
            };

            btnEsquerdo.onclick = function() {
                ativarToggleJogos(0, false);
                const event = new Event('change', { bubbles: true });
                qtdInput.dispatchEvent(event);
            };

            // Evento de quantidade
            qtdInput.addEventListener('input', function() {
                const qtdTotal = parseInt(pacoteQuantidadeModal.value) || 0;
                let valor = parseInt(this.value) || 0;
                if (valor > qtdTotal) this.value = qtdTotal;
                if (valor < 0) this.value = 0;
                atualizarPrecoJogosLabel();
            });

            qtdInput.addEventListener('change', function() {
                const qtdTotal = parseInt(pacoteQuantidadeModal.value) || 0;
                let valor = parseInt(this.value) || 0;
                if (valor > qtdTotal) this.value = qtdTotal;
                if (valor < 0) this.value = 0;
                atualizarPrecoJogosLabel();
            });

            pacoteQuantidadeModal.addEventListener('change', function() {
                const qtdTotal = parseInt(this.value) || 0;
                qtdInput.max = qtdTotal;
                if (indicador.textContent === 'Sim') {
                    if (parseInt(qtdInput.value) > qtdTotal) qtdInput.value = qtdTotal;
                    if (qtdTotal === 0) {
                        ativarToggleJogos(0, false);
                    } else {
                        qtdInput.disabled = false;
                    }
                }
                atualizarPrecoJogosLabel();
                if (jogosNivelBrinde && indicador.textContent === 'Sim') {
                    jogosQtdInput.value = qtdTotal;
                    jogosQtdInput.max = qtdTotal;
                }
            });

            pacoteQuantidadeModal.addEventListener('input', function() {
                const qtdTotal = parseInt(this.value) || 0;
                qtdInput.max = qtdTotal;
                if (indicador.textContent === 'Sim') {
                    if (parseInt(qtdInput.value) > qtdTotal) qtdInput.value = qtdTotal;
                    if (qtdTotal === 0) {
                        ativarToggleJogos(0, false);
                    } else {
                        qtdInput.disabled = false;
                    }
                }
                atualizarPrecoJogosLabel();
                if (jogosNivelBrinde && indicador.textContent === 'Sim') {
                    jogosQtdInput.value = qtdTotal;
                    jogosQtdInput.max = qtdTotal;
                }
            });

            // Inicializa como "Não" (desabilitado)
            jogosNivelAtual = 'nivel1';
            jogosNivelBrinde = null;
            atualizarEstadoJogos(0);

            setTimeout(function() {
                criarInputComBotoes(qtdInput, 0, parseInt(qtdInput.max) || 0, 1);
            }, 50);
        }

        // ============================================================
        // ATUALIZA LABEL DO PACOTE DE JOGOS
        // ============================================================
        function atualizarPrecoJogosLabel() {
            const label = document.getElementById('jogosLabel');
            if (!label) return;

            const qtd = parseInt(jogosQtdInput.value) || 0;
            const estado = (jogosIndicador.textContent === 'Sim') ? 1 : 0;
            const nivel = jogosNivelAtual || 'nivel1';
            const preco = precosJogos[nivel] || 0;

            const nomeNivel = { 'nivel1': 'Nível 1', 'nivel2': 'Nível 2', 'nivel3': 'Nível 3' }[nivel];

            const isBrinde = (estado === 1 && qtd > 0 && jogosNivelBrinde && nivel === jogosNivelBrinde);

            let texto = '<i class="fa-solid fa-gamepad" style="color: var(--color-primary-light);"></i> Pacote de Jogos';

            if (isBrinde) {
                texto += ' <span style="color: var(--color-primary-light); font-weight: 700;"><i class="fa-solid fa-gift"></i> Brinde!</span>';
                texto += ' (' + nomeNivel + ' - ' + qtd + ' PC' + (qtd > 1 ? 's' : '') + ' incluso' + (qtd > 1 ? 's' : '') + ')';
            } else if (estado === 1 && qtd > 0) {
                const total = preco * qtd;
                texto += ' (' + nomeNivel + ' – R$ ' + preco.toFixed(2).replace('.', ',') + ' x ' + qtd + ' = R$ ' + total.toFixed(2).replace('.', ',') + ')';
            } else {
                texto += ' (' + nomeNivel + ' – R$ ' + preco.toFixed(2).replace('.', ',') + ' por PC)';
            }
            label.innerHTML = texto;
        }

        // ============================================================
        // FUNÇÃO PARA CRIAR O CAMPO DE LIMPEZA (COM TOGGLE)
        // ============================================================
        function criarCampoLimpeza() {
            const servicoLimpeza = servicosGlobais.find(function(s) { return s.id === 49; });
            if (servicoLimpeza) {
                const precoStr = servicoLimpeza.preco.replace(/[^0-9,]/g, '').replace(',', '.');
                const precoParsed = parseFloat(precoStr);
                if (!isNaN(precoParsed)) {
                    precoLimpeza = precoParsed;
                }
            }

            const existingContainer = document.getElementById('limpezaContainer');
            if (existingContainer) existingContainer.remove();

            limpezaContainer = document.createElement('div');
            limpezaContainer.id = 'limpezaContainer';
            limpezaContainer.className = 'pacote-modal__field pacote-modal__field--center';
            limpezaContainer.style.marginTop = '16px';

            const label = document.createElement('label');
            label.id = 'limpezaLabel';
            label.innerHTML = '<i class="fa-solid fa-broom" style="color: var(--color-primary-light);"></i> Limpeza (R$ ' + precoLimpeza.toFixed(2).replace('.', ',') + ' por PC)';
            limpezaContainer.appendChild(label);

            const toggleContainer = document.createElement('div');
            toggleContainer.className = 'pacote-modal__toggle-container';
            toggleContainer.style.display = 'flex';
            toggleContainer.style.alignItems = 'center';
            toggleContainer.style.justifyContent = 'center';
            toggleContainer.style.gap = '16px';
            toggleContainer.style.marginBottom = '8px';

            const btnEsquerdo = document.createElement('button');
            btnEsquerdo.type = 'button';
            btnEsquerdo.className = 'pacote-modal__toggle-btn';
            btnEsquerdo.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
            btnEsquerdo.style.visibility = 'hidden';
            btnEsquerdo.setAttribute('aria-label', 'Não');
            limpezaBtnEsquerdo = btnEsquerdo;

            const indicador = document.createElement('span');
            indicador.className = 'pacote-modal__toggle-indicator';
            indicador.textContent = 'Não';
            limpezaIndicador = indicador;

            const btnDireito = document.createElement('button');
            btnDireito.type = 'button';
            btnDireito.className = 'pacote-modal__toggle-btn';
            btnDireito.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
            btnDireito.style.visibility = 'visible';
            btnDireito.setAttribute('aria-label', 'Sim');
            limpezaBtnDireito = btnDireito;

            toggleContainer.appendChild(btnEsquerdo);
            toggleContainer.appendChild(indicador);
            toggleContainer.appendChild(btnDireito);
            limpezaContainer.appendChild(toggleContainer);

            const qtdWrapper = document.createElement('div');
            qtdWrapper.className = 'pacote-modal__input-wrapper';
            qtdWrapper.style.display = 'none';
            qtdWrapper.style.maxWidth = '280px';
            qtdWrapper.style.margin = '0 auto';

            const qtdIcon = document.createElement('i');
            qtdIcon.className = 'pacote-modal__input-icon fa-solid fa-computer';
            qtdWrapper.appendChild(qtdIcon);

            const qtdInput = document.createElement('input');
            qtdInput.type = 'number';
            qtdInput.id = 'limpezaQuantidade';
            qtdInput.className = 'pacote-modal__input';
            qtdInput.value = '0';
            qtdInput.min = '0';
            qtdInput.max = '0';
            qtdInput.step = '1';
            qtdInput.disabled = true;
            qtdWrapper.appendChild(qtdInput);
            limpezaContainer.appendChild(qtdWrapper);
            limpezaQtdWrapper = qtdWrapper;
            limpezaQtdInput = qtdInput;

            const helpText = document.createElement('small');
            helpText.style.color = 'var(--color-text-muted)';
            helpText.style.fontSize = '0.8rem';
            helpText.style.marginTop = '4px';
            helpText.style.display = 'block';
            helpText.textContent = 'Quantos PCs receberão a limpeza (0 = nenhum)';
            limpezaContainer.appendChild(helpText);

            const quantidadeField = pacoteQuantidadeModal.closest('.pacote-modal__field');
            if (quantidadeField) {
                quantidadeField.parentNode.insertBefore(limpezaContainer, quantidadeField.nextSibling);
            } else {
                const body = document.querySelector('.pacote-modal__body');
                if (body) body.appendChild(limpezaContainer);
            }

            function atualizarEstadoLimpeza(estado) {
                if (estado === 1) {
                    indicador.textContent = 'Sim';
                    btnEsquerdo.style.visibility = 'visible';
                    btnDireito.style.visibility = 'hidden';
                    qtdWrapper.style.display = 'flex';
                    qtdInput.disabled = false;
                    const qtdTotal = parseInt(pacoteQuantidadeModal.value) || 0;
                    qtdInput.max = qtdTotal;
                    if (parseInt(qtdInput.value) === 0 || parseInt(qtdInput.value) > qtdTotal) {
                        qtdInput.value = qtdTotal;
                    }
                } else {
                    indicador.textContent = 'Não';
                    btnEsquerdo.style.visibility = 'hidden';
                    btnDireito.style.visibility = 'visible';
                    qtdWrapper.style.display = 'none';
                    qtdInput.disabled = true;
                    qtdInput.value = 0;
                }
                atualizarPrecoLimpezaLabel();
            }

            btnDireito.addEventListener('click', function() {
                atualizarEstadoLimpeza(1);
                const event = new Event('change', { bubbles: true });
                qtdInput.dispatchEvent(event);
            });

            btnEsquerdo.addEventListener('click', function() {
                atualizarEstadoLimpeza(0);
                const event = new Event('change', { bubbles: true });
                qtdInput.dispatchEvent(event);
            });

            qtdInput.addEventListener('input', function() {
                const qtdTotal = parseInt(pacoteQuantidadeModal.value) || 0;
                let valor = parseInt(this.value) || 0;
                if (valor > qtdTotal) this.value = qtdTotal;
                if (valor < 0) this.value = 0;
                atualizarPrecoLimpezaLabel();
            });

            qtdInput.addEventListener('change', function() {
                const qtdTotal = parseInt(pacoteQuantidadeModal.value) || 0;
                let valor = parseInt(this.value) || 0;
                if (valor > qtdTotal) this.value = qtdTotal;
                if (valor < 0) this.value = 0;
                atualizarPrecoLimpezaLabel();
            });

            pacoteQuantidadeModal.addEventListener('change', function() {
                const qtdTotal = parseInt(this.value) || 0;
                qtdInput.max = qtdTotal;
                if (indicador.textContent === 'Sim') {
                    if (parseInt(qtdInput.value) > qtdTotal) qtdInput.value = qtdTotal;
                    if (qtdTotal === 0) {
                        qtdInput.value = 0;
                        qtdInput.disabled = true;
                        qtdWrapper.style.display = 'none';
                        indicador.textContent = 'Não';
                        btnEsquerdo.style.visibility = 'hidden';
                        btnDireito.style.visibility = 'visible';
                    } else {
                        qtdInput.disabled = false;
                        qtdWrapper.style.display = 'flex';
                    }
                }
                atualizarPrecoLimpezaLabel();
            });

            pacoteQuantidadeModal.addEventListener('input', function() {
                const qtdTotal = parseInt(this.value) || 0;
                qtdInput.max = qtdTotal;
                if (indicador.textContent === 'Sim') {
                    if (parseInt(qtdInput.value) > qtdTotal) qtdInput.value = qtdTotal;
                    if (qtdTotal === 0) {
                        qtdInput.value = 0;
                        qtdInput.disabled = true;
                        qtdWrapper.style.display = 'none';
                        indicador.textContent = 'Não';
                        btnEsquerdo.style.visibility = 'hidden';
                        btnDireito.style.visibility = 'visible';
                    } else {
                        qtdInput.disabled = false;
                        qtdWrapper.style.display = 'flex';
                    }
                }
                atualizarPrecoLimpezaLabel();
            });

            atualizarEstadoLimpeza(0);
            setTimeout(function() {
                criarInputComBotoes(qtdInput, 0, parseInt(qtdInput.max) || 0, 1);
            }, 50);
        }

        // ============================================================
        // ATUALIZA LABEL DA LIMPEZA (COM INDICAÇÃO DE BRINDE)
        // ============================================================
        function atualizarPrecoLimpezaLabel() {
            const label = document.getElementById('limpezaLabel');
            if (!label) return;
            const qtd = parseInt(limpezaQtdInput.value) || 0;
            const estado = (limpezaIndicador.textContent === 'Sim') ? 1 : 0;
            const isBrinde = (limpezaQtdInput.dataset.brinde === 'true');

            let texto = '<i class="fa-solid fa-broom" style="color: var(--color-primary-light);"></i> Limpeza';

            if (isBrinde && estado === 1 && qtd > 0) {
                texto += ' <span style="color: var(--color-primary-light); font-weight: 700;"><i class="fa-solid fa-gift"></i> Brinde!</span>';
                texto += ' (' + qtd + ' PC' + (qtd > 1 ? 's' : '') + ' incluído' + (qtd > 1 ? 's' : '') + ')';
            } else if (estado === 1 && qtd > 0) {
                const total = precoLimpeza * qtd;
                texto += ' (R$ ' + precoLimpeza.toFixed(2).replace('.', ',') + ' x ' + qtd + ' = R$ ' + total.toFixed(2).replace('.', ',') + ')';
            } else {
                texto += ' (R$ ' + precoLimpeza.toFixed(2).replace('.', ',') + ' por PC)';
            }
            label.innerHTML = texto;
        }

        // ============================================================
        // FUNÇÃO PARA CRIAR O CAMPO DE IMPRESSORA (COM TOGGLE)
        // ============================================================
        function criarCampoImpressora() {
            const existingContainer = document.getElementById('impressoraContainer');
            if (existingContainer) existingContainer.remove();

            impressoraContainer = document.createElement('div');
            impressoraContainer.id = 'impressoraContainer';
            impressoraContainer.className = 'pacote-modal__field pacote-modal__field--center';
            impressoraContainer.style.marginTop = '16px';

            const label = document.createElement('label');
            label.id = 'impressoraLabel';
            label.innerHTML = '<i class="fa-solid fa-print" style="color: var(--color-primary-light);"></i> Instalação de Impressora (R$ ' + precoImpressora.toFixed(2).replace('.', ',') + ' por PC)';
            impressoraContainer.appendChild(label);

            const toggleContainer = document.createElement('div');
            toggleContainer.className = 'pacote-modal__toggle-container';
            toggleContainer.style.display = 'flex';
            toggleContainer.style.alignItems = 'center';
            toggleContainer.style.justifyContent = 'center';
            toggleContainer.style.gap = '16px';
            toggleContainer.style.marginBottom = '8px';

            const btnEsquerdo = document.createElement('button');
            btnEsquerdo.type = 'button';
            btnEsquerdo.className = 'pacote-modal__toggle-btn';
            btnEsquerdo.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
            btnEsquerdo.style.visibility = 'hidden';
            btnEsquerdo.setAttribute('aria-label', 'Não');
            impressoraBtnEsquerdo = btnEsquerdo;

            const indicador = document.createElement('span');
            indicador.className = 'pacote-modal__toggle-indicator';
            indicador.textContent = 'Não';
            impressoraIndicador = indicador;

            const btnDireito = document.createElement('button');
            btnDireito.type = 'button';
            btnDireito.className = 'pacote-modal__toggle-btn';
            btnDireito.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
            btnDireito.style.visibility = 'visible';
            btnDireito.setAttribute('aria-label', 'Sim');
            impressoraBtnDireito = btnDireito;

            toggleContainer.appendChild(btnEsquerdo);
            toggleContainer.appendChild(indicador);
            toggleContainer.appendChild(btnDireito);
            impressoraContainer.appendChild(toggleContainer);

            const qtdWrapper = document.createElement('div');
            qtdWrapper.className = 'pacote-modal__input-wrapper';
            qtdWrapper.style.display = 'none';
            qtdWrapper.style.maxWidth = '280px';
            qtdWrapper.style.margin = '0 auto';

            const qtdIcon = document.createElement('i');
            qtdIcon.className = 'pacote-modal__input-icon fa-solid fa-computer';
            qtdWrapper.appendChild(qtdIcon);

            const qtdInput = document.createElement('input');
            qtdInput.type = 'number';
            qtdInput.id = 'impressoraQuantidade';
            qtdInput.className = 'pacote-modal__input';
            qtdInput.value = '0';
            qtdInput.min = '0';
            qtdInput.max = '0';
            qtdInput.step = '1';
            qtdInput.disabled = true;
            qtdWrapper.appendChild(qtdInput);
            impressoraContainer.appendChild(qtdWrapper);
            impressoraQtdWrapper = qtdWrapper;
            impressoraQtdInput = qtdInput;

            const helpText = document.createElement('small');
            helpText.style.color = 'var(--color-text-muted)';
            helpText.style.fontSize = '0.8rem';
            helpText.style.marginTop = '4px';
            helpText.style.display = 'block';
            helpText.textContent = 'Quantos PCs receberão a instalação da impressora (0 = nenhum)';
            impressoraContainer.appendChild(helpText);

            const officeField = document.getElementById('officeContainer');
            if (officeField) {
                officeField.parentNode.insertBefore(impressoraContainer, officeField.nextSibling);
            } else {
                const limpezaField = document.getElementById('limpezaContainer');
                if (limpezaField) {
                    limpezaField.parentNode.insertBefore(impressoraContainer, limpezaField.nextSibling);
                } else {
                    const body = document.querySelector('.pacote-modal__body');
                    if (body) body.appendChild(impressoraContainer);
                }
            }

            function atualizarEstadoImpressora(estado) {
                if (estado === 1) {
                    indicador.textContent = 'Sim';
                    btnEsquerdo.style.visibility = 'visible';
                    btnDireito.style.visibility = 'hidden';
                    qtdWrapper.style.display = 'flex';
                    qtdInput.disabled = false;
                    const qtdTotal = parseInt(pacoteQuantidadeModal.value) || 0;
                    qtdInput.max = qtdTotal;
                    if (parseInt(qtdInput.value) === 0 || parseInt(qtdInput.value) > qtdTotal) {
                        qtdInput.value = qtdTotal;
                    }
                } else {
                    indicador.textContent = 'Não';
                    btnEsquerdo.style.visibility = 'hidden';
                    btnDireito.style.visibility = 'visible';
                    qtdWrapper.style.display = 'none';
                    qtdInput.disabled = true;
                    qtdInput.value = 0;
                }
                atualizarPrecoImpressoraLabel();
            }

            btnDireito.addEventListener('click', function() {
                atualizarEstadoImpressora(1);
                const event = new Event('change', { bubbles: true });
                qtdInput.dispatchEvent(event);
            });

            btnEsquerdo.addEventListener('click', function() {
                atualizarEstadoImpressora(0);
                const event = new Event('change', { bubbles: true });
                qtdInput.dispatchEvent(event);
            });

            qtdInput.addEventListener('input', function() {
                const qtdTotal = parseInt(pacoteQuantidadeModal.value) || 0;
                let valor = parseInt(this.value) || 0;
                if (valor > qtdTotal) this.value = qtdTotal;
                if (valor < 0) this.value = 0;
                atualizarPrecoImpressoraLabel();
            });

            qtdInput.addEventListener('change', function() {
                const qtdTotal = parseInt(pacoteQuantidadeModal.value) || 0;
                let valor = parseInt(this.value) || 0;
                if (valor > qtdTotal) this.value = qtdTotal;
                if (valor < 0) this.value = 0;
                atualizarPrecoImpressoraLabel();
            });

            pacoteQuantidadeModal.addEventListener('change', function() {
                const qtdTotal = parseInt(this.value) || 0;
                qtdInput.max = qtdTotal;
                if (indicador.textContent === 'Sim') {
                    if (parseInt(qtdInput.value) > qtdTotal) qtdInput.value = qtdTotal;
                    if (qtdTotal === 0) {
                        qtdInput.value = 0;
                        qtdInput.disabled = true;
                        qtdWrapper.style.display = 'none';
                        indicador.textContent = 'Não';
                        btnEsquerdo.style.visibility = 'hidden';
                        btnDireito.style.visibility = 'visible';
                    } else {
                        qtdInput.disabled = false;
                        qtdWrapper.style.display = 'flex';
                    }
                }
                atualizarPrecoImpressoraLabel();
            });

            pacoteQuantidadeModal.addEventListener('input', function() {
                const qtdTotal = parseInt(this.value) || 0;
                qtdInput.max = qtdTotal;
                if (indicador.textContent === 'Sim') {
                    if (parseInt(qtdInput.value) > qtdTotal) qtdInput.value = qtdTotal;
                    if (qtdTotal === 0) {
                        qtdInput.value = 0;
                        qtdInput.disabled = true;
                        qtdWrapper.style.display = 'none';
                        indicador.textContent = 'Não';
                        btnEsquerdo.style.visibility = 'hidden';
                        btnDireito.style.visibility = 'visible';
                    } else {
                        qtdInput.disabled = false;
                        qtdWrapper.style.display = 'flex';
                    }
                }
                atualizarPrecoImpressoraLabel();
            });

            atualizarEstadoImpressora(0);
            setTimeout(function() {
                criarInputComBotoes(qtdInput, 0, parseInt(qtdInput.max) || 0, 1);
            }, 50);
        }

        // ============================================================
        // ATUALIZA LABEL DA IMPRESSORA (COM INDICAÇÃO DE BRINDE)
        // ============================================================
        function atualizarPrecoImpressoraLabel() {
            const label = document.getElementById('impressoraLabel');
            if (!label) return;
            const qtd = parseInt(impressoraQtdInput.value) || 0;
            const estado = (impressoraIndicador.textContent === 'Sim') ? 1 : 0;
            const isBrinde = (impressoraQtdInput.dataset.brinde === 'true');

            let texto = '<i class="fa-solid fa-print" style="color: var(--color-primary-light);"></i> Instalação de Impressora';

            if (isBrinde && estado === 1 && qtd > 0) {
                texto += ' <span style="color: var(--color-primary-light); font-weight: 700;"><i class="fa-solid fa-gift"></i> Brinde!</span>';
                texto += ' (' + qtd + ' PC' + (qtd > 1 ? 's' : '') + ' incluído' + (qtd > 1 ? 's' : '') + ')';
            } else if (estado === 1 && qtd > 0) {
                const total = precoImpressora * qtd;
                texto += ' (R$ ' + precoImpressora.toFixed(2).replace('.', ',') + ' x ' + qtd + ' = R$ ' + total.toFixed(2).replace('.', ',') + ')';
            } else {
                texto += ' (R$ ' + precoImpressora.toFixed(2).replace('.', ',') + ' por PC)';
            }
            label.innerHTML = texto;
        }

        // ============================================================
        // FUNÇÃO PARA CRIAR O CAMPO DE ANTIVÍRUS (COM ORDEM: GRATUITOS PRIMEIRO)
        // ============================================================
        function criarCampoAntivirus() {
            const existingContainer = document.getElementById('antivirusContainer');
            if (existingContainer) existingContainer.remove();

            antivirusContainer = document.createElement('div');
            antivirusContainer.id = 'antivirusContainer';
            antivirusContainer.className = 'pacote-modal__field';
            antivirusContainer.style.marginTop = '16px';

            antivirusLabelPreco = document.createElement('label');
            antivirusLabelPreco.innerHTML = '<i class="fa-solid fa-shield-halved" style="color: var(--color-primary-light);"></i> Antivírus (R$ 0,00 por PC)';
            antivirusContainer.appendChild(antivirusLabelPreco);

            const selectWrapper = document.createElement('div');
            selectWrapper.className = 'pacote-modal__select-wrapper';
            selectWrapper.style.marginBottom = '8px';

            const selectIcon = document.createElement('i');
            selectIcon.className = 'pacote-modal__select-icon fa-solid fa-shield-halved';
            selectWrapper.appendChild(selectIcon);

            antivirusSelect = document.createElement('select');
            antivirusSelect.className = 'pacote-modal__select';
            antivirusSelect.id = 'antivirusSelect';

            const opcoes = [
                { value: 'gratuito', label: 'Antivírus Gratuito' },
                { value: '360-total-security', label: '360 Total Security Free' },
                { value: 'avg-free', label: 'AVG Antivirus Free' },
                { value: 'avast-free', label: 'Avast Free Antivirus' },
                { value: 'avira-free', label: 'Avira Free Security' },
                { value: 'kaspersky-standard', label: 'Kaspersky Standard – R$ 99,90' },
                { value: 'kaspersky-plus', label: 'Kaspersky Plus – R$ 119,00' },
                { value: 'kaspersky-premium', label: 'Kaspersky Premium – R$ 199,90' },
                { value: 'outro', label: 'Outro (especificar)' }
            ];

            opcoes.forEach(function(op) {
                const option = document.createElement('option');
                option.value = op.value;
                option.textContent = op.label;
                antivirusSelect.appendChild(option);
            });

            selectWrapper.appendChild(antivirusSelect);
            antivirusContainer.appendChild(selectWrapper);

            antivirusOutroInput = document.createElement('input');
            antivirusOutroInput.type = 'text';
            antivirusOutroInput.id = 'antivirusOutro';
            antivirusOutroInput.className = 'pacote-modal__input';
            antivirusOutroInput.placeholder = 'Digite o nome do antivírus';
            antivirusOutroInput.style.display = 'none';
            antivirusOutroInput.style.marginTop = '4px';
            antivirusContainer.appendChild(antivirusOutroInput);

            const qtdWrapper = document.createElement('div');
            qtdWrapper.className = 'pacote-modal__input-wrapper';
            const qtdIcon = document.createElement('i');
            qtdIcon.className = 'pacote-modal__input-icon fa-solid fa-computer';
            qtdWrapper.appendChild(qtdIcon);

            antivirusQtdInput = document.createElement('input');
            antivirusQtdInput.type = 'number';
            antivirusQtdInput.id = 'antivirusQuantidade';
            antivirusQtdInput.className = 'pacote-modal__input';
            antivirusQtdInput.value = '1';
            antivirusQtdInput.min = '0';
            antivirusQtdInput.max = '0';
            antivirusQtdInput.step = '1';
            qtdWrapper.appendChild(antivirusQtdInput);
            antivirusContainer.appendChild(qtdWrapper);

            const helpText = document.createElement('small');
            helpText.style.color = 'var(--color-text-muted)';
            helpText.style.fontSize = '0.8rem';
            helpText.style.marginTop = '4px';
            helpText.style.display = 'block';
            helpText.textContent = 'Quantos PCs receberão o antivírus (0 = nenhum)';
            antivirusContainer.appendChild(helpText);

            const jogosField = document.getElementById('jogosContainer');
            if (jogosField) {
                jogosField.parentNode.insertBefore(antivirusContainer, jogosField.nextSibling);
            } else {
                const limpezaField = document.getElementById('limpezaContainer');
                if (limpezaField) {
                    limpezaField.parentNode.insertBefore(antivirusContainer, limpezaField.nextSibling);
                } else {
                    const body = document.querySelector('.pacote-modal__body');
                    if (body) body.appendChild(antivirusContainer);
                }
            }

            antivirusSelect.addEventListener('change', function() {
                if (this.value === 'outro') {
                    antivirusOutroInput.style.display = 'block';
                } else {
                    antivirusOutroInput.style.display = 'none';
                }
                if (antivirusQtdInput) {
                    antivirusQtdInput.dataset.automatico = 'false';
                    antivirusQtdInput.dataset.brinde = 'false';
                }
                atualizarPrecoAntivirusLabel();
                atualizarLimiteAntivirus();
            });

            antivirusQtdInput.addEventListener('input', function() {
                const qtdTotal = parseInt(pacoteQuantidadeModal.value) || 0;
                let valor = parseInt(this.value) || 0;
                if (valor > qtdTotal) this.value = qtdTotal;
                if (valor < 0) this.value = 0;
                this.dataset.automatico = 'false';
                this.dataset.brinde = 'false';
                atualizarPrecoAntivirusLabel();
            });

            antivirusQtdInput.addEventListener('change', function() {
                const qtdTotal = parseInt(pacoteQuantidadeModal.value) || 0;
                let valor = parseInt(this.value) || 0;
                if (valor > qtdTotal) this.value = qtdTotal;
                if (valor < 0) this.value = 0;
                this.dataset.automatico = 'false';
                this.dataset.brinde = 'false';
                atualizarPrecoAntivirusLabel();
            });

            pacoteQuantidadeModal.addEventListener('change', function() {
                const qtdTotal = parseInt(this.value) || 0;
                if (antivirusQtdInput && antivirusQtdInput.dataset.automatico === 'true') {
                    antivirusQtdInput.value = qtdTotal;
                    antivirusQtdInput.max = qtdTotal;
                    if (qtdTotal === 0) {
                        antivirusQtdInput.disabled = true;
                        antivirusQtdInput.value = 0;
                    } else {
                        antivirusQtdInput.disabled = false;
                    }
                    atualizarPrecoAntivirusLabel();
                } else {
                    atualizarLimiteAntivirus();
                    atualizarPrecoAntivirusLabel();
                }
            });

            pacoteQuantidadeModal.addEventListener('input', function() {
                const qtdTotal = parseInt(this.value) || 0;
                if (antivirusQtdInput && antivirusQtdInput.dataset.automatico === 'true') {
                    antivirusQtdInput.value = qtdTotal;
                    antivirusQtdInput.max = qtdTotal;
                    if (qtdTotal === 0) {
                        antivirusQtdInput.disabled = true;
                        antivirusQtdInput.value = 0;
                    } else {
                        antivirusQtdInput.disabled = false;
                    }
                    atualizarPrecoAntivirusLabel();
                } else {
                    atualizarLimiteAntivirus();
                    atualizarPrecoAntivirusLabel();
                }
            });

            antivirusOutroInput.addEventListener('input', function() {});

            antivirusSelect.value = 'gratuito';
            antivirusQtdInput.value = 1;
            antivirusQtdInput.dataset.automatico = 'false';
            antivirusQtdInput.dataset.brinde = 'false';
            atualizarPrecoAntivirusLabel();
            atualizarLimiteAntivirus();

            setTimeout(function() {
                criarInputComBotoes(antivirusQtdInput, 0, parseInt(antivirusQtdInput.max) || 0, 1);
            }, 50);
        }

        function atualizarLimiteAntivirus() {
            if (!antivirusQtdInput) return;
            const qtdTotal = parseInt(pacoteQuantidadeModal.value) || 0;
            antivirusQtdInput.max = qtdTotal;
            const valorAtual = parseInt(antivirusQtdInput.value) || 0;
            if (valorAtual > qtdTotal) antivirusQtdInput.value = qtdTotal;
            if (qtdTotal === 0) {
                antivirusQtdInput.value = 0;
                antivirusQtdInput.disabled = true;
            } else {
                antivirusQtdInput.disabled = false;
            }
        }

        function atualizarPrecoAntivirusLabel() {
            if (!antivirusSelect || !antivirusLabelPreco) return;
            const selected = antivirusSelect.value;
            const preco = precosAntivirus[selected] || 0;
            precoAntivirus = preco;

            const qtd = parseInt(antivirusQtdInput.value) || 0;
            const isBrinde = (antivirusQtdInput.dataset.brinde === 'true');
            const isAutomatico = (antivirusQtdInput.dataset.automatico === 'true');

            const nomeExibicao = {
                'gratuito': 'Antivírus Gratuito',
                '360-total-security': '360 Total Security Free',
                'avg-free': 'AVG Antivirus Free',
                'avast-free': 'Avast Free Antivirus',
                'avira-free': 'Avira Free Security',
                'kaspersky-standard': 'Kaspersky Standard',
                'kaspersky-plus': 'Kaspersky Plus',
                'kaspersky-premium': 'Kaspersky Premium'
            };

            let exibirBrinde = false;
            if (isBrinde && isAutomatico && (selected === 'kaspersky-premium' || selected === 'gratuito')) {
                exibirBrinde = true;
            }

            let labelText = '<i class="fa-solid fa-shield-halved" style="color: var(--color-primary-light);"></i> Antivírus';
            if (exibirBrinde) {
                labelText += ' <span style="color: var(--color-primary-light); font-weight: 700;"><i class="fa-solid fa-gift"></i> Brinde!</span>';
                if (qtd > 0) {
                    labelText += ' (' + (selected === 'kaspersky-premium' ? 'Kaspersky Premium' : 'Antivírus Gratuito') + ' para ' + qtd + ' PC' + (qtd > 1 ? 's' : '') + ')';
                }
            } else if (qtd > 0) {
                const nome = nomeExibicao[selected] || 'Antivírus';
                const total = preco * qtd;
                if (preco === 0) {
                    labelText += ' (' + nome + ' - Gratuito)';
                } else {
                    labelText += ' (' + nome + ' – R$ ' + preco.toFixed(2).replace('.', ',') + ' x ' + qtd + ' = R$ ' + total.toFixed(2).replace('.', ',') + ')';
                }
            } else {
                const nome = nomeExibicao[selected] || 'Antivírus';
                if (preco === 0) {
                    labelText += ' (' + nome + ' - Gratuito)';
                } else {
                    labelText += ' (' + nome + ' – R$ ' + preco.toFixed(2).replace('.', ',') + ' por PC)';
                }
            }
            antivirusLabelPreco.innerHTML = labelText;
        }

        // ============================================================
        // FUNÇÃO PARA CRIAR O CAMPO DE OFFICE (COM NOVAS OPÇÕES GRATUITAS)
        // ============================================================
        function criarCampoOffice() {
            const existingContainer = document.getElementById('officeContainer');
            if (existingContainer) existingContainer.remove();

            officeContainer = document.createElement('div');
            officeContainer.id = 'officeContainer';
            officeContainer.className = 'pacote-modal__field';
            officeContainer.style.marginTop = '16px';

            officeLabelPreco = document.createElement('label');
            officeLabelPreco.innerHTML = '<i class="fa-solid fa-file-word" style="color: var(--color-primary-light);"></i> Pacote Office (R$ ' + precoOffice.toFixed(2).replace('.', ',') + ' por PC)';
            officeContainer.appendChild(officeLabelPreco);

            const selectWrapper = document.createElement('div');
            selectWrapper.className = 'pacote-modal__select-wrapper';
            selectWrapper.style.marginBottom = '8px';

            const selectIcon = document.createElement('i');
            selectIcon.className = 'pacote-modal__select-icon fa-solid fa-file-word';
            selectWrapper.appendChild(selectIcon);

            officeSelect = document.createElement('select');
            officeSelect.className = 'pacote-modal__select';
            officeSelect.id = 'officeSelect';

            const opcoesOffice = [
                { value: 'gratuito', label: 'Pacote Office Gratuito' },
                { value: 'libreoffice', label: 'LibreOffice (Gratuito)' },
                { value: 'wps', label: 'WPS Office (Gratuito)' },
                { value: 'onlyoffice', label: 'OnlyOffice (Gratuito)' },
                { value: 'office', label: 'Pacote Office com Licença – R$ 139,90' }
            ];

            opcoesOffice.forEach(function(op) {
                const option = document.createElement('option');
                option.value = op.value;
                option.textContent = op.label;
                officeSelect.appendChild(option);
            });

            selectWrapper.appendChild(officeSelect);
            officeContainer.appendChild(selectWrapper);

            const qtdWrapper = document.createElement('div');
            qtdWrapper.className = 'pacote-modal__input-wrapper';
            const qtdIcon = document.createElement('i');
            qtdIcon.className = 'pacote-modal__input-icon fa-solid fa-computer';
            qtdWrapper.appendChild(qtdIcon);

            officeQtdInput = document.createElement('input');
            officeQtdInput.type = 'number';
            officeQtdInput.id = 'officeQuantidade';
            officeQtdInput.className = 'pacote-modal__input';
            officeQtdInput.value = '1';
            officeQtdInput.min = '0';
            officeQtdInput.max = '0';
            officeQtdInput.step = '1';
            qtdWrapper.appendChild(officeQtdInput);
            officeContainer.appendChild(qtdWrapper);

            const helpText = document.createElement('small');
            helpText.style.color = 'var(--color-text-muted)';
            helpText.style.fontSize = '0.8rem';
            helpText.style.marginTop = '4px';
            helpText.style.display = 'block';
            helpText.textContent = 'Quantos PCs receberão o Pacote Office (0 = nenhum)';
            officeContainer.appendChild(helpText);

            const antivirusField = document.getElementById('antivirusContainer');
            if (antivirusField) {
                antivirusField.parentNode.insertBefore(officeContainer, antivirusField.nextSibling);
            } else {
                const body = document.querySelector('.pacote-modal__body');
                if (body) body.appendChild(officeContainer);
            }

            officeSelect.addEventListener('change', function() {
                if (officeQtdInput) {
                    officeQtdInput.dataset.automatico = 'false';
                    officeQtdInput.dataset.brinde = 'false';
                }
                atualizarPrecoOfficeLabel();
                atualizarLimiteOffice();
            });

            officeQtdInput.addEventListener('input', function() {
                const qtdTotal = parseInt(pacoteQuantidadeModal.value) || 0;
                let valor = parseInt(this.value) || 0;
                if (valor > qtdTotal) this.value = qtdTotal;
                if (valor < 0) this.value = 0;
                this.dataset.automatico = 'false';
                this.dataset.brinde = 'false';
                atualizarPrecoOfficeLabel();
            });

            officeQtdInput.addEventListener('change', function() {
                const qtdTotal = parseInt(pacoteQuantidadeModal.value) || 0;
                let valor = parseInt(this.value) || 0;
                if (valor > qtdTotal) this.value = qtdTotal;
                if (valor < 0) this.value = 0;
                this.dataset.automatico = 'false';
                this.dataset.brinde = 'false';
                atualizarPrecoOfficeLabel();
            });

            pacoteQuantidadeModal.addEventListener('change', function() {
                const qtdTotal = parseInt(this.value) || 0;
                if (officeQtdInput && officeQtdInput.dataset.automatico === 'true') {
                    officeQtdInput.value = qtdTotal;
                    officeQtdInput.max = qtdTotal;
                    if (qtdTotal === 0) {
                        officeQtdInput.disabled = true;
                        officeQtdInput.value = 0;
                    } else {
                        officeQtdInput.disabled = false;
                    }
                    atualizarPrecoOfficeLabel();
                } else {
                    atualizarLimiteOffice();
                    atualizarPrecoOfficeLabel();
                }
                if (antivirusQtdInput && antivirusQtdInput.dataset.automatico === 'true') {
                    antivirusQtdInput.value = qtdTotal;
                    antivirusQtdInput.max = qtdTotal;
                    if (qtdTotal === 0) {
                        antivirusQtdInput.disabled = true;
                        antivirusQtdInput.value = 0;
                    } else {
                        antivirusQtdInput.disabled = false;
                    }
                    atualizarPrecoAntivirusLabel();
                }
            });

            pacoteQuantidadeModal.addEventListener('input', function() {
                const qtdTotal = parseInt(this.value) || 0;
                if (officeQtdInput && officeQtdInput.dataset.automatico === 'true') {
                    officeQtdInput.value = qtdTotal;
                    officeQtdInput.max = qtdTotal;
                    if (qtdTotal === 0) {
                        officeQtdInput.disabled = true;
                        officeQtdInput.value = 0;
                    } else {
                        officeQtdInput.disabled = false;
                    }
                    atualizarPrecoOfficeLabel();
                } else {
                    atualizarLimiteOffice();
                    atualizarPrecoOfficeLabel();
                }
                if (antivirusQtdInput && antivirusQtdInput.dataset.automatico === 'true') {
                    antivirusQtdInput.value = qtdTotal;
                    antivirusQtdInput.max = qtdTotal;
                    if (qtdTotal === 0) {
                        antivirusQtdInput.disabled = true;
                        antivirusQtdInput.value = 0;
                    } else {
                        antivirusQtdInput.disabled = false;
                    }
                    atualizarPrecoAntivirusLabel();
                }
            });

            officeSelect.value = 'gratuito';
            officeQtdInput.value = 1;
            officeQtdInput.dataset.automatico = 'false';
            officeQtdInput.dataset.brinde = 'false';
            atualizarPrecoOfficeLabel();
            atualizarLimiteOffice();

            setTimeout(function() {
                criarInputComBotoes(officeQtdInput, 0, parseInt(officeQtdInput.max) || 0, 1);
            }, 50);
        }

        function atualizarLimiteOffice() {
            if (!officeQtdInput) return;
            const qtdTotal = parseInt(pacoteQuantidadeModal.value) || 0;
            officeQtdInput.max = qtdTotal;
            const valorAtual = parseInt(officeQtdInput.value) || 0;
            if (valorAtual > qtdTotal) officeQtdInput.value = qtdTotal;
            if (qtdTotal === 0) {
                officeQtdInput.value = 0;
                officeQtdInput.disabled = true;
            } else {
                officeQtdInput.disabled = false;
            }
        }

        function atualizarPrecoOfficeLabel() {
            if (!officeSelect || !officeLabelPreco) return;
            const selected = officeSelect.value;
            const preco = precosOffice[selected] || 0;
            precoOffice = preco;

            const qtd = parseInt(officeQtdInput.value) || 0;
            const isBrinde = (officeQtdInput.dataset.brinde === 'true');
            const isAutomatico = (officeQtdInput.dataset.automatico === 'true');

            const nomesOffice = {
                'gratuito': 'Pacote Office Gratuito',
                'libreoffice': 'LibreOffice (Gratuito)',
                'wps': 'WPS Office (Gratuito)',
                'onlyoffice': 'OnlyOffice (Gratuito)',
                'office': 'Pacote Office com Licença'
            };

            let exibirBrinde = false;
            if (isBrinde && isAutomatico && selected === 'office') {
                exibirBrinde = true;
            }

            let labelText = '<i class="fa-solid fa-file-word" style="color: var(--color-primary-light);"></i> Pacote Office';
            if (exibirBrinde) {
                labelText += ' <span style="color: var(--color-primary-light); font-weight: 700;"><i class="fa-solid fa-gift"></i> Brinde!</span>';
                if (qtd > 0) {
                    labelText += ' (Pacote Office com Licença para ' + qtd + ' PC' + (qtd > 1 ? 's' : '') + ')';
                }
            } else if (qtd > 0) {
                const nome = nomesOffice[selected] || 'Pacote Office';
                const total = preco * qtd;
                if (preco === 0) {
                    labelText += ' (' + nome + ')';
                } else {
                    labelText += ' (' + nome + ' – R$ ' + preco.toFixed(2).replace('.', ',') + ' x ' + qtd + ' = R$ ' + total.toFixed(2).replace('.', ',') + ')';
                }
            } else {
                const nome = nomesOffice[selected] || 'Pacote Office';
                if (preco === 0) {
                    labelText += ' (' + nome + ')';
                } else {
                    labelText += ' (R$ ' + preco.toFixed(2).replace('.', ',') + ' por PC)';
                }
            }
            officeLabelPreco.innerHTML = labelText;
        }

        // ============================================================
        // FUNÇÃO PARA OBTER O SERVIÇO BASE
        // ============================================================
        function obterServicoBase(tipo, so) {
            let categoriaBase = tipo;
            if (tipo === 'enterprise') categoriaBase = 'premium';

            const servicosCategoria = servicosGlobais.filter(function(s) {
                if (categoriaBase === 'go') {
                    return s.categoria === 'formatacao' && s.sistema === 'biglinux';
                } else if (categoriaBase === 'standard') {
                    return s.categoria === 'formatacao' && s.sistema !== 'biglinux';
                } else {
                    return s.categoria === categoriaBase;
                }
            });

            const servicosSO = servicosCategoria.filter(function(s) {
                return s.sistema === so;
            });

            if (servicosSO.length === 0) {
                return { servico: servicosCategoria[0] || null, descricaoBase: 'Nenhum serviço encontrado' };
            }

            let servicoSelecionado = null;
            let descricaoBase = '';

            const maisEscolhido = servicosSO.filter(function(s) {
                return s.badge === '⭐ Mais escolhido';
            });
            if (maisEscolhido.length > 0) {
                servicoSelecionado = maisEscolhido[0];
                descricaoBase = 'Formatação ' + nomeTipoExibicao[tipo] + ' (mais escolhido)';
            } else {
                const plus = servicosSO.filter(function(s) {
                    return s.titulo.toLowerCase().includes('plus');
                });
                if (plus.length > 0) {
                    servicoSelecionado = plus[0];
                    descricaoBase = 'Formatação ' + nomeTipoExibicao[tipo] + ' (Plus)';
                } else {
                    servicoSelecionado = servicosSO[0];
                    descricaoBase = 'Formatação ' + nomeTipoExibicao[tipo];
                }
            }

            return {
                servico: servicoSelecionado,
                descricaoBase: descricaoBase
            };
        }

        // ============================================================
        // CONFIGURA BOTÕES DE PAGAMENTO DO GERADOR (COM BTC E ETH)
        // ============================================================
        function configurarPagamentoGerador() {
            const toggleContainer = document.querySelector('.pacote-modal__payment .payment-toggle');
            if (!toggleContainer) return;

            toggleContainer.innerHTML = '';

            const cashBtn = document.createElement('button');
            cashBtn.className = 'payment-btn payment-btn--active';
            cashBtn.dataset.payment = 'cash';
            cashBtn.innerHTML = 'À Vista';
            toggleContainer.appendChild(cashBtn);

            const installmentBtn = document.createElement('button');
            installmentBtn.className = 'payment-btn';
            installmentBtn.dataset.payment = 'installment';
            installmentBtn.innerHTML = 'Parcelado';
            toggleContainer.appendChild(installmentBtn);

            const bitcoinBtn = document.createElement('button');
            bitcoinBtn.className = 'payment-btn';
            bitcoinBtn.dataset.payment = 'bitcoin';
            bitcoinBtn.innerHTML = '<i class="fa-brands fa-bitcoin"></i> BTC';
            toggleContainer.appendChild(bitcoinBtn);

            const ethereumBtn = document.createElement('button');
            ethereumBtn.className = 'payment-btn';
            ethereumBtn.dataset.payment = 'ethereum';
            ethereumBtn.innerHTML = '<i class="fa-brands fa-ethereum"></i> ETH';
            toggleContainer.appendChild(ethereumBtn);

            const allPaymentBtns = toggleContainer.querySelectorAll('.payment-btn');
            const installmentOptions = document.getElementById('pacoteInstallmentOptions');

            allPaymentBtns.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    allPaymentBtns.forEach(function(b) { b.classList.remove('payment-btn--active'); });
                    this.classList.add('payment-btn--active');

                    const paymentMethod = this.dataset.payment;
                    if (paymentMethod === 'installment') {
                        if (installmentOptions) installmentOptions.style.display = 'flex';
                        metodoPagamento = 'installment';
                    } else if (paymentMethod === 'bitcoin') {
                        if (installmentOptions) installmentOptions.style.display = 'none';
                        metodoPagamento = 'bitcoin';
                        if (!cotacaoBTC) {
                            obterCotacaoBitcoin().then(function(cotacao) {
                                cotacaoBTC = cotacao;
                                const resultado = pacoteResultadoModal;
                                if (resultado && resultado.style.display !== 'none') {
                                    calcularPacoteBtn.click();
                                }
                            });
                        } else {
                            const resultado = pacoteResultadoModal;
                            if (resultado && resultado.style.display !== 'none') {
                                calcularPacoteBtn.click();
                            }
                        }
                    } else if (paymentMethod === 'ethereum') {
                        if (installmentOptions) installmentOptions.style.display = 'none';
                        metodoPagamento = 'ethereum';
                        if (!cotacaoETH) {
                            obterCotacaoEthereum().then(function(cotacao) {
                                cotacaoETH = cotacao;
                                const resultado = pacoteResultadoModal;
                                if (resultado && resultado.style.display !== 'none') {
                                    calcularPacoteBtn.click();
                                }
                            });
                        } else {
                            const resultado = pacoteResultadoModal;
                            if (resultado && resultado.style.display !== 'none') {
                                calcularPacoteBtn.click();
                            }
                        }
                    } else {
                        if (installmentOptions) installmentOptions.style.display = 'none';
                        metodoPagamento = 'cash';
                    }
                });
            });

            const installmentSelect = document.getElementById('pacoteInstallmentCount');
            if (installmentSelect) {
                installmentSelect.addEventListener('change', function() {
                    numParcelasSelecionadas = parseInt(this.value) || 2;
                    if (metodoPagamento === 'installment') {
                        const resultado = pacoteResultadoModal;
                        if (resultado && resultado.style.display !== 'none') {
                            calcularPacoteBtn.click();
                        }
                    }
                });
            }

            cashBtn.classList.add('payment-btn--active');
            installmentBtn.classList.remove('payment-btn--active');
            bitcoinBtn.classList.remove('payment-btn--active');
            ethereumBtn.classList.remove('payment-btn--active');
            if (installmentOptions) installmentOptions.style.display = 'none';
            metodoPagamento = 'cash';
        }

        // ============================================================
        // ABRIR MODAL
        // ============================================================
        function abrirModal() {
            if (!modal) return;
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            window.preencherTipoSelect();
            if (pacoteResultadoModal) {
                pacoteResultadoModal.innerHTML = '';
                pacoteResultadoModal.style.display = 'none';
            }

            pacoteQuantidadeModal.value = 1;

            criarCampoLimpeza();
            criarCampoJogos();
            criarCampoAntivirus();
            criarCampoOffice();
            criarCampoImpressora();

            const tipo = pacoteTipoModal.value;
            const so = pacoteSOModal.value;
            definirServicosAutomaticos(tipo, so);

            window.atualizarBaseInfo(tipo, so);
            window.atualizarIconeSO(so);
            window.atualizarIconeTipo(tipo);

            configurarPagamentoGerador();
            cotacaoBTC = null;
            cotacaoETH = null;

            setTimeout(function() {
                criarInputComBotoes(pacoteQuantidadeModal, 1, 150, 1);
            }, 50);
        }

        // ============================================================
        // FECHAR MODAL
        // ============================================================
        function fecharModal() {
            if (!modal) return;
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }

        abrirGeradorBtn.addEventListener('click', abrirModal);
        modalClose.addEventListener('click', fecharModal);
        modalOverlay.addEventListener('click', fecharModal);
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
                fecharModal();
            }
        });

        // ============================================================
        // VARIÁVEIS AUXILIARES (CONSTANTES)
        // ============================================================
        const iconesSO = {
            'windows': 'fa-windows',
            'linux': 'fa-linux',
            'mac': 'fa-apple',
            'steam-machine': 'fa-steam',
            'steam-deck': 'fa-steam',
            'biglinux': 'fa-arch-linux'
        };

        const nomeSO = {
            'windows': 'Windows',
            'linux': 'Linux',
            'mac': 'Mac OS',
            'steam-machine': 'Steam Machine',
            'steam-deck': 'Steam Deck',
            'biglinux': 'Big Linux'
        };

        const nomeTipoExibicao = {
            'standard': 'Standard',
            'educacional': 'Educacional',
            'pro': 'Pro',
            'gamer': 'Gamer',
            'premium': 'Premium',
            'enterprise': 'Enterprise'
        };

        window.atualizarIconeTipo = function(tipo) {
            if (!tipoIcon) return;
            const iconesTipo = {
                'standard': 'fa-desktop',
                'educacional': 'fa-graduation-cap',
                'pro': 'fa-briefcase',
                'gamer': 'fa-gamepad',
                'premium': 'fa-crown',
                'enterprise': 'fa-building'
            };
            const icone = iconesTipo[tipo] || 'fa-desktop';
            tipoIcon.className = 'pacote-modal__select-icon fa-solid ' + icone;
            void tipoIcon.offsetWidth;
        };

        window.atualizarIconeSO = function(so) {
            if (!soIcon) return;
            const familiasSO = {
                'windows': 'fa-brands',
                'linux': 'fa-brands',
                'mac': 'fa-brands',
                'steam-machine': 'fa-brands',
                'steam-deck': 'fa-brands',
                'biglinux': 'fa-brands'
            };
            const icone = iconesSO[so] || 'fa-desktop';
            const familia = familiasSO[so] || 'fa-solid';
            soIcon.className = 'pacote-modal__select-icon ' + familia + ' ' + icone;
            void soIcon.offsetWidth;
        };

        window.popularSistemasOperacionais = function(tipo) {
            if (!pacoteSOModal) return;
            let categoriaBase = tipo;
            if (tipo === 'enterprise') categoriaBase = 'premium';

            const servicosDoTipo = servicosGlobais.filter(function(s) {
                if (categoriaBase === 'go') {
                    return s.categoria === 'formatacao' && s.sistema === 'biglinux';
                } else if (categoriaBase === 'standard') {
                    return s.categoria === 'formatacao' && s.sistema !== 'biglinux';
                } else {
                    return s.categoria === categoriaBase;
                }
            });

            const sistemas = [];
            servicosDoTipo.forEach(function(s) {
                if (s.sistema && s.sistema !== 'outros' && sistemas.indexOf(s.sistema) === -1) {
                    sistemas.push(s.sistema);
                }
            });

            const ordem = ['windows', 'linux', 'mac', 'steam-machine', 'steam-deck', 'biglinux'];
            sistemas.sort(function(a, b) { return ordem.indexOf(a) - ordem.indexOf(b); });

            if (sistemas.length === 0) sistemas.push('windows');

            pacoteSOModal.innerHTML = '';
            sistemas.forEach(function(sistema) {
                const option = document.createElement('option');
                option.value = sistema;
                option.textContent = nomeSO[sistema] || sistema.charAt(0).toUpperCase() + sistema.slice(1);
                pacoteSOModal.appendChild(option);
            });

            if (sistemas.indexOf(soSelecionado) !== -1) {
                pacoteSOModal.value = soSelecionado;
            } else {
                pacoteSOModal.value = sistemas[0];
            }

            window.atualizarIconeSO(pacoteSOModal.value);
            window.atualizarBaseInfo(tipo, pacoteSOModal.value);
            if (typeof definirServicosAutomaticos === 'function') {
                definirServicosAutomaticos(tipo, pacoteSOModal.value);
            }
        };

        window.atualizarBaseInfo = function(tipo, so) {
            if (!baseInfoModal) return;
            const resultado = obterServicoBase(tipo, so);
            if (resultado.servico) {
                const precoStr = resultado.servico.preco.replace(/[^0-9,]/g, '').replace(',', '.');
                const precoBase = parseFloat(precoStr);
                if (!isNaN(precoBase)) {
                    baseInfoModal.innerHTML = 'Base utilizada: <strong>' + resultado.descricaoBase + '</strong> — ' +
                        resultado.servico.preco + ' por PC';
                } else {
                    baseInfoModal.innerHTML = 'Base utilizada: <strong>' + resultado.descricaoBase + '</strong>';
                }
            } else {
                baseInfoModal.innerHTML = '⚠️ Nenhum serviço base encontrado.';
            }
        };

        window.preencherTipoSelect = function() {
            if (!pacoteTipoModal) return;
            let tipoAtual = tipoSelecionado;
            if (tipoAtual === 'go') tipoAtual = 'standard';
            let optionExists = false;
            for (let i = 0; i < pacoteTipoModal.options.length; i++) {
                if (pacoteTipoModal.options[i].value === tipoAtual) {
                    optionExists = true;
                    break;
                }
            }
            if (optionExists) {
                pacoteTipoModal.value = tipoAtual;
            } else {
                pacoteTipoModal.value = 'standard';
            }
            window.atualizarIconeTipo(pacoteTipoModal.value);
            window.popularSistemasOperacionais(pacoteTipoModal.value);
        };

        pacoteTipoModal.addEventListener('change', function() {
            const tipo = this.value;
            window.atualizarIconeTipo(tipo);
            window.popularSistemasOperacionais(tipo);
            if (pacoteResultadoModal) {
                pacoteResultadoModal.innerHTML = '';
                pacoteResultadoModal.style.display = 'none';
            }
            const so = pacoteSOModal.value;
            definirServicosAutomaticos(tipo, so);
            cotacaoBTC = null;
            cotacaoETH = null;
        });

        pacoteSOModal.addEventListener('change', function() {
            const tipo = pacoteTipoModal.value;
            const so = this.value;
            window.atualizarIconeSO(so);
            window.atualizarBaseInfo(tipo, so);
            if (pacoteResultadoModal) {
                pacoteResultadoModal.innerHTML = '';
                pacoteResultadoModal.style.display = 'none';
            }
            definirServicosAutomaticos(tipo, so);
            cotacaoBTC = null;
            cotacaoETH = null;
        });

        // ============================================================
        // FUNÇÃO PARA GERAR PDF (COM BTC E ETH CORRIGIDOS)
        // ============================================================
        function gerarPDF(dados) {
            try {
                if (typeof window.jspdf === 'undefined' && typeof jspdf === 'undefined') {
                    throw new Error('A biblioteca jsPDF não foi carregada.');
                }

                const jsPDFLib = window.jspdf || jspdf;
                const doc = new jsPDFLib.jsPDF('p', 'mm', 'a4');
                const pageWidth = 210;
                const margin = 18;
                let currentY = 20;

                const corPrimaria = [16, 185, 129];
                const corTexto = [30, 30, 30];
                const corTextoClaro = [100, 100, 100];
                const corLinhaAlternada = [250, 250, 250];
                const corFundoCard = [245, 245, 245];

                doc.setFontSize(24);
                doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
                doc.setFont('helvetica', 'bold');
                doc.text('Leandro Stanger', pageWidth / 2, currentY, { align: 'center' });
                currentY += 8;

                doc.setFontSize(13);
                doc.setTextColor(corTextoClaro[0], corTextoClaro[1], corTextoClaro[2]);
                doc.setFont('helvetica', 'normal');
                doc.text('Soluções em Informática', pageWidth / 2, currentY, { align: 'center' });
                currentY += 10;

                doc.setDrawColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
                doc.setLineWidth(0.5);
                doc.line(margin + 20, currentY, pageWidth - margin - 20, currentY);
                currentY += 2;
                doc.line(margin + 10, currentY, pageWidth - margin - 10, currentY);
                currentY += 14;

                doc.setFontSize(20);
                doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
                doc.setFont('helvetica', 'bold');
                doc.text('ORÇAMENTO DE FORMAÇÃO', pageWidth / 2, currentY, { align: 'center' });
                currentY += 8;

                const numOrcamento = 'ORC-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9999) + 1000).padStart(4, '0');
                doc.setFontSize(9);
                doc.setTextColor(corTextoClaro[0], corTextoClaro[1], corTextoClaro[2]);
                doc.setFont('helvetica', 'normal');
                doc.text('Nº ' + numOrcamento, pageWidth / 2, currentY, { align: 'center' });
                currentY += 5;

                const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
                const dataValidade = new Date();
                dataValidade.setDate(dataValidade.getDate() + 7);
                const dataValidadeStr = dataValidade.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

                doc.setFontSize(9);
                doc.setTextColor(corTextoClaro[0], corTextoClaro[1], corTextoClaro[2]);
                doc.text('Emissão: ' + dataAtual, pageWidth - margin, currentY, { align: 'right' });
                doc.text('Validade: ' + dataValidadeStr, pageWidth - margin, currentY + 5, { align: 'right' });
                currentY += 14;

                const cardHeight = 32;
                doc.setFillColor(corFundoCard[0], corFundoCard[1], corFundoCard[2]);
                doc.roundedRect(margin, currentY, pageWidth - (margin * 2), cardHeight, 4, 4, 'F');
                doc.setDrawColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
                doc.setLineWidth(0.5);
                doc.roundedRect(margin, currentY, pageWidth - (margin * 2), cardHeight, 4, 4, 'D');

                doc.setFontSize(12);
                doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
                doc.setFont('helvetica', 'bold');
                const linha1 = dados.tipo + ' • ' + dados.so;
                doc.text(linha1, pageWidth / 2, currentY + 9, { align: 'center' });

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                let linha2 = dados.qtd + ' PC' + (dados.qtd > 1 ? 's' : '');
                if (dados.valorUnitario) {
                    linha2 += ' • R$ ' + dados.valorUnitario.toFixed(2).replace('.', ',') + ' cada';
                }
                doc.text(linha2, pageWidth / 2, currentY + 19, { align: 'center' });

                if (dados.desconto) {
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
                    doc.text('DESCONTO APLICADO: ' + dados.desconto, pageWidth / 2, currentY + 29, { align: 'center' });
                }

                currentY += cardHeight + 8;

                const tableData = [
                    ['Item', 'Quantidade', 'Valor Unitário', 'Total']
                ];

                const addRow = function(item, qtd, unitario, total) {
                    tableData.push([
                        item,
                        qtd,
                        'R$ ' + unitario.toFixed(2).replace('.', ','),
                        'R$ ' + total.toFixed(2).replace('.', ',')
                    ]);
                };

                const totalFormatacao = dados.totalFormatacao || 0;
                const precoBase = dados.valorUnitario || 0;
                const descontoAplicado = dados.desconto ? parseFloat(dados.desconto) / 100 : 0;
                const totalOriginal = dados.totalOriginal || totalFormatacao;

                addRow('Formatação (' + dados.tipo + ')', dados.qtd + ' PC' + (dados.qtd > 1 ? 's' : ''), precoBase, totalFormatacao);

                if (dados.limpezaQtd > 0) {
                    const totalLimpeza = dados.limpezaTotal || 0;
                    const precoLimpeza = (totalLimpeza / dados.limpezaQtd) || 0;
                    addRow('Limpeza Interna', dados.limpezaQtd + ' PC' + (dados.limpezaQtd > 1 ? 's' : ''), precoLimpeza, totalLimpeza);
                }

                if (dados.antivirusQtd > 0) {
                    const totalAntivirus = dados.antivirusTotal || 0;
                    const precoAntivirus = (totalAntivirus / dados.antivirusQtd) || 0;
                    addRow('Antivírus (' + dados.antivirusNome + ')', dados.antivirusQtd + ' PC' + (dados.antivirusQtd > 1 ? 's' : ''), precoAntivirus, totalAntivirus);
                }

                if (dados.officeQtd > 0) {
                    const totalOffice = dados.officeTotal || 0;
                    const precoOffice = (totalOffice / dados.officeQtd) || 0;
                    addRow('Pacote Office (' + dados.officeNome + ')', dados.officeQtd + ' PC' + (dados.officeQtd > 1 ? 's' : ''), precoOffice, totalOffice);
                }

                if (dados.impressoraQtd > 0) {
                    const totalImpressora = dados.impressoraTotal || 0;
                    const precoImpressora = (totalImpressora / dados.impressoraQtd) || 0;
                    const labelImp = dados.impressoraBrinde ? 'Instalação Impressora (Brinde)' : 'Instalação Impressora';
                    addRow(labelImp, dados.impressoraQtd + ' PC' + (dados.impressoraQtd > 1 ? 's' : ''), precoImpressora, totalImpressora);
                }

                if (dados.jogosQtd > 0) {
                    const totalJogos = dados.jogosTotal || 0;
                    const precoJogos = (totalJogos / dados.jogosQtd) || 0;
                    const labelJogos = dados.jogosNivel ? 'Pacote de Jogos ' + dados.jogosNivel : 'Pacote de Jogos';
                    addRow(labelJogos, dados.jogosQtd + ' PC' + (dados.jogosQtd > 1 ? 's' : ''), precoJogos, totalJogos);
                }

                let subtotal = totalOriginal;
                tableData.push(['', '', 'Subtotal', 'R$ ' + subtotal.toFixed(2).replace('.', ',')]);

                if (descontoAplicado > 0) {
                    const valorDesconto = subtotal * descontoAplicado;
                    const subtotalComDesconto = subtotal - valorDesconto;
                    tableData.push(['', '', 'Desconto (' + (descontoAplicado * 100).toFixed(0) + '%)', '- R$ ' + valorDesconto.toFixed(2).replace('.', ',')]);
                    tableData.push(['', '', 'Total com Desconto', 'R$ ' + subtotalComDesconto.toFixed(2).replace('.', ',')]);
                } else {
                    tableData.push(['', '', 'Total', 'R$ ' + subtotal.toFixed(2).replace('.', ',')]);
                }

                let formaPagamento = 'À Vista';
                let detalheFinal = '';
                if (dados.isInstallment) {
                    formaPagamento = 'Parcelado em ' + dados.numParcelas + 'x';
                    detalheFinal = 'Valor Final: R$ ' + dados.valorFinal.toFixed(2).replace('.', ',') + ' (com juros)';
                } else if (dados.isBitcoin) {
                    formaPagamento = 'Bitcoin';
                    // Usa o valor numérico e formata com BTC
                    const valorBTC = typeof dados.valorBTC === 'number' ? dados.valorBTC.toFixed(8) : '0.00000000';
                    const cotacao = typeof dados.cotacaoBTC === 'number' ? 'R$ ' + dados.cotacaoBTC.toFixed(2).replace('.', ',') : '--';
                    detalheFinal = 'Valor em BTC: ' + valorBTC + ' (cotação: ' + cotacao + '/BTC)';
                } else if (dados.isEthereum) {
                    formaPagamento = 'Ethereum';
                    const valorETH = typeof dados.valorETH === 'number' ? dados.valorETH.toFixed(6) : '0.000000';
                    const cotacao = typeof dados.cotacaoETH === 'number' ? 'R$ ' + dados.cotacaoETH.toFixed(2).replace('.', ',') : '--';
                    detalheFinal = 'Valor em ETH: ' + valorETH + ' (cotação: ' + cotacao + '/ETH)';
                } else {
                    formaPagamento = 'À Vista';
                    detalheFinal = 'Valor Final: R$ ' + dados.valorFinal.toFixed(2).replace('.', ',');
                }

                tableData.push(['', '', 'Forma de Pagamento', formaPagamento]);
                if (detalheFinal) {
                    tableData.push(['', '', '', detalheFinal]);
                }

                doc.autoTable({
                    startY: currentY,
                    head: [tableData[0]],
                    body: tableData.slice(1),
                    theme: 'plain',
                    styles: {
                        font: 'helvetica',
                        fontSize: 8.5,
                        textColor: [corTexto[0], corTexto[1], corTexto[2]],
                        cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
                        lineColor: [200, 200, 200],
                        lineWidth: 0.2,
                        fillColor: [255, 255, 255],
                    },
                    headStyles: {
                        fillColor: [corPrimaria[0], corPrimaria[1], corPrimaria[2]],
                        textColor: [255, 255, 255],
                        fontSize: 9,
                        fontStyle: 'bold',
                        halign: 'center',
                    },
                    columnStyles: {
                        0: { cellWidth: 50, halign: 'left' },
                        1: { cellWidth: 30, halign: 'center' },
                        2: { cellWidth: 40, halign: 'right' },
                        3: { cellWidth: 45, halign: 'right' },
                    },
                    alternateRowStyles: {
                        fillColor: [corLinhaAlternada[0], corLinhaAlternada[1], corLinhaAlternada[2]],
                    },
                    didParseCell: function(data) {
                        if (data.section === 'body') {
                            const cellText = data.cell.raw;
                            if (typeof cellText === 'string') {
                                if (cellText.includes('Total') || cellText.includes('Valor Final') || cellText.includes('Subtotal')) {
                                    data.cell.styles.fontStyle = 'bold';
                                    data.cell.styles.textColor = [corPrimaria[0], corPrimaria[1], corPrimaria[2]];
                                }
                                if (cellText.includes('Valor Final') || cellText.includes('Total') || cellText.includes('Bitcoin') || cellText.includes('Ethereum')) {
                                    data.cell.styles.fontSize = 10;
                                }
                            }
                        }
                    },
                    margin: { left: margin, right: margin },
                    pageBreak: 'auto',
                });

                let finalY = doc.lastAutoTable.finalY + 6;

                if (dados.brindes && dados.brindes.length > 0) {
                    const boxY = finalY;
                    const boxHeight = 12 + (dados.brindes.length * 7);
                    doc.setFillColor(corFundoCard[0], corFundoCard[1], corFundoCard[2]);
                    doc.roundedRect(margin, boxY, pageWidth - (margin * 2), boxHeight, 4, 4, 'F');
                    doc.setDrawColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
                    doc.setLineWidth(0.3);
                    doc.roundedRect(margin, boxY, pageWidth - (margin * 2), boxHeight, 4, 4, 'D');

                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
                    doc.text('BRINDES INCLUSOS', margin + 10, boxY + 7);

                    let brindeY = boxY + 13;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8.5);
                    doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
                    dados.brindes.forEach(function(brinde) {
                        const texto = '• ' + brinde;
                        const maxWidth = pageWidth - (margin * 2) - 20;
                        const lines = doc.splitTextToSize(texto, maxWidth);
                        doc.text(lines, margin + 14, brindeY);
                        brindeY += (lines.length * 5) + 2;
                    });
                    finalY = boxY + boxHeight + 8;
                } else {
                    finalY = finalY + 4;
                }

                doc.setFontSize(8.5);
                doc.setTextColor(corTextoClaro[0], corTextoClaro[1], corTextoClaro[2]);
                doc.setFont('helvetica', 'normal');
                let obs = 'Este orçamento é válido por 7 dias a partir da data de emissão.';
                obs += ' Os preços e condições podem ser alterados sem aviso prévio.';
                obs += ' Para contratação, entre em contato pelo WhatsApp (48) 99644-6508.';
                const obsLines = doc.splitTextToSize(obs, pageWidth - (margin * 2));
                doc.text(obsLines, margin, finalY);
                finalY += (obsLines.length * 5) + 6;

                doc.setFontSize(9);
                doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
                doc.setFont('helvetica', 'italic');
                doc.text('Agradecemos pela preferência!', pageWidth / 2, finalY, { align: 'center' });
                finalY += 8;

                let footerY = Math.max(finalY + 10, 270);
                if (footerY > 285) {
                    doc.addPage();
                    footerY = 20;
                }
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.3);
                doc.line(margin, footerY, pageWidth - margin, footerY);

                doc.setFontSize(7.5);
                doc.setTextColor(corTextoClaro[0], corTextoClaro[1], corTextoClaro[2]);
                doc.setFont('helvetica', 'normal');
                doc.text('Leandro Stanger Soluções em Informática', pageWidth / 2, footerY + 5, { align: 'center' });
                doc.text('Rua Francisco Ronchi, Nº 280 - Caravaggio, Nova Veneza - SC', pageWidth / 2, footerY + 9, { align: 'center' });
                doc.text('WhatsApp: (48) 99644-6508  •  E-mail: contato@leandrostanger.com.br', pageWidth / 2, footerY + 13, { align: 'center' });

                const dataArquivo = new Date();
                const dia = String(dataArquivo.getDate()).padStart(2, '0');
                const mes = String(dataArquivo.getMonth() + 1).padStart(2, '0');
                const ano = dataArquivo.getFullYear();
                const nomeArquivo = 'Orcamento_de_formatacao_' + dia + '_' + mes + '_' + ano + '.pdf';
                doc.save(nomeArquivo);

            } catch (error) {
                console.error('Erro ao gerar PDF:', error);
                alert('Não foi possível gerar o PDF. ' + error.message);
            }
        }

        // ============================================================
        // CALCULAR PACOTE (COM BTC E ETH)
        // ============================================================
        calcularPacoteBtn.addEventListener('click', async function() {
            let tipo = pacoteTipoModal.value;
            let so = pacoteSOModal.value;
            let qtd = parseInt(pacoteQuantidadeModal.value) || 1;
            if (qtd < 1) qtd = 1;
            if (qtd > 150) qtd = 150;
            pacoteQuantidadeModal.value = qtd;

            let qtdLimpeza = 0;
            if (limpezaQtdInput && limpezaIndicador && limpezaIndicador.textContent === 'Sim') {
                qtdLimpeza = parseInt(limpezaQtdInput.value) || 0;
                if (qtdLimpeza > qtd) qtdLimpeza = qtd;
                if (qtdLimpeza < 0) qtdLimpeza = 0;
            }

            let qtdAntivirus = 0;
            let antivirusNome = 'Antivírus Gratuito';
            let precoAntivirusSelecionado = 0;

            if (antivirusQtdInput) {
                qtdAntivirus = parseInt(antivirusQtdInput.value) || 0;
                if (qtdAntivirus > qtd) qtdAntivirus = qtd;
                if (qtdAntivirus < 0) qtdAntivirus = 0;
            }

            if (antivirusSelect) {
                const selectedVal = antivirusSelect.value;
                const mapaNomes = {
                    'gratuito': 'Antivírus Gratuito',
                    '360-total-security': '360 Total Security Free',
                    'avg-free': 'AVG Antivirus Free',
                    'avast-free': 'Avast Free Antivirus',
                    'avira-free': 'Avira Free Security',
                    'kaspersky-standard': 'Kaspersky Standard',
                    'kaspersky-plus': 'Kaspersky Plus',
                    'kaspersky-premium': 'Kaspersky Premium'
                };

                if (selectedVal === 'outro' && antivirusOutroInput) {
                    antivirusNome = antivirusOutroInput.value.trim() || 'Outro antivírus';
                    precoAntivirusSelecionado = 0;
                } else {
                    antivirusNome = mapaNomes[selectedVal] || 'Antivírus';
                    precoAntivirusSelecionado = precosAntivirus[selectedVal] || 0;
                }
            }

            if (antivirusQtdInput && antivirusQtdInput.dataset.brinde === 'true' && antivirusSelect.value === 'kaspersky-premium') {
                precoAntivirusSelecionado = 0;
                antivirusNome = 'Kaspersky Premium (Brinde)';
            }
            if (antivirusQtdInput && antivirusQtdInput.dataset.brinde === 'true' && antivirusSelect.value === 'gratuito') {
                precoAntivirusSelecionado = 0;
                antivirusNome = 'Antivírus Gratuito (Brinde)';
            }

            const precoAntivirusAtual = precoAntivirusSelecionado;

            let qtdOffice = 0;
            let officeNome = 'Pacote Office Gratuito';
            let precoOfficeSelecionado = 0;

            if (officeQtdInput) {
                qtdOffice = parseInt(officeQtdInput.value) || 0;
                if (qtdOffice > qtd) qtdOffice = qtd;
                if (qtdOffice < 0) qtdOffice = 0;
            }

            if (officeSelect) {
                const selectedOffice = officeSelect.value;
                const nomesOfficeMap = {
                    'gratuito': 'Pacote Office Gratuito',
                    'libreoffice': 'LibreOffice (Gratuito)',
                    'wps': 'WPS Office (Gratuito)',
                    'onlyoffice': 'OnlyOffice (Gratuito)',
                    'office': 'Pacote Office com Licença'
                };
                officeNome = nomesOfficeMap[selectedOffice] || 'Pacote Office';
                precoOfficeSelecionado = precosOffice[selectedOffice] || 0;
            }

            if (officeQtdInput && officeQtdInput.dataset.brinde === 'true' && officeSelect.value === 'office') {
                precoOfficeSelecionado = 0;
                officeNome = 'Pacote Office com Licença (Brinde)';
            }

            const precoOfficeAtual = precoOfficeSelecionado;

            let qtdImpressora = 0;
            let impressoraBrinde = false;
            if (impressoraQtdInput && impressoraIndicador && impressoraIndicador.textContent === 'Sim') {
                qtdImpressora = parseInt(impressoraQtdInput.value) || 0;
                if (qtdImpressora > qtd) qtdImpressora = qtd;
                if (qtdImpressora < 0) qtdImpressora = 0;
                const temBrinde = servicoTemBrindeImpressora(tipo, so) || (tipo === 'premium' || tipo === 'enterprise');
                impressoraBrinde = (impressoraQtdInput.dataset.brinde === 'true') || temBrinde;
            }

            let qtdJogos = 0;
            let jogosNivel = 'Nível 1';
            let precoJogosSelecionado = 0;
            let isJogosBrinde = false;
            if (jogosQtdInput && jogosIndicador && jogosIndicador.textContent === 'Sim') {
                qtdJogos = parseInt(jogosQtdInput.value) || 0;
                if (qtdJogos > qtd) qtdJogos = qtd;
                if (qtdJogos < 0) qtdJogos = 0;
                const nivel = jogosNivelAtual || 'nivel1';
                jogosNivel = { 'nivel1': 'Nível 1', 'nivel2': 'Nível 2', 'nivel3': 'Nível 3' }[nivel] || 'Nível 1';
                isJogosBrinde = (jogosNivelBrinde && nivel === jogosNivelBrinde);
                if (isJogosBrinde) {
                    precoJogosSelecionado = 0;
                } else {
                    precoJogosSelecionado = precosJogos[nivel] || 0;
                }
            }

            const resultadoBase = obterServicoBase(tipo, so);
            const servicoBase = resultadoBase.servico;
            if (!servicoBase) {
                alert('Nenhum serviço encontrado para este tipo e sistema operacional.');
                return;
            }

            const precoStr = servicoBase.preco.replace(/[^0-9,]/g, '').replace(',', '.');
            const precoBase = parseFloat(precoStr);
            if (isNaN(precoBase)) {
                alert('Erro ao ler o preço do serviço.');
                return;
            }

            const percentualDesconto = calcularDesconto(qtd);
            const temDesconto = percentualDesconto > 0;

            let totalFormatacao = precoBase * qtd;
            let totalLimpeza = precoLimpeza * qtdLimpeza;
            let totalAntivirus = precoAntivirusAtual * qtdAntivirus;
            let totalOffice = precoOfficeAtual * qtdOffice;
            let totalImpressora = impressoraBrinde ? 0 : precoImpressora * qtdImpressora;
            let totalJogos = precoJogosSelecionado * qtdJogos;

            const totalFormatacaoComDesconto = totalFormatacao * (1 - percentualDesconto);
            const totalLimpezaComDesconto = totalLimpeza * (1 - percentualDesconto);
            const totalAntivirusComDesconto = totalAntivirus;
            const totalOfficeComDesconto = totalOffice;
            const totalImpressoraComDesconto = impressoraBrinde ? 0 : totalImpressora;
            const totalJogosComDesconto = totalJogos;
            const totalComDesconto = totalFormatacaoComDesconto + totalLimpezaComDesconto + totalAntivirusComDesconto + totalOfficeComDesconto + totalImpressoraComDesconto + totalJogosComDesconto;

            const isBitcoin = (metodoPagamento === 'bitcoin');
            const isEthereum = (metodoPagamento === 'ethereum');
            const isInstallment = (metodoPagamento === 'installment');
            let valorFinal = totalComDesconto;
            let detalhePagamento = 'à vista';
            let resultadoParcelamento = null;
            let numParcelas = 1;
            let valorBTC = null;
            let valorETH = null;
            let cotacaoBTCUsada = null;
            let cotacaoETHUsada = null;

            if (isInstallment) {
                numParcelas = numParcelasSelecionadas || 2;
                resultadoParcelamento = calcularParcelamento(totalComDesconto, numParcelas);
                valorFinal = resultadoParcelamento.valorTotalParcelado;
                detalhePagamento = numParcelas + 'x de ' + formatarMoeda(resultadoParcelamento.valorParcela) + ' (juros: ' + formatarMoeda(resultadoParcelamento.jurosTotal) + ')';
            } else if (isBitcoin) {
                try {
                    cotacaoBTC = await obterCotacaoBitcoin();
                    cotacaoBTCUsada = cotacaoBTC;
                    valorBTC = totalComDesconto / cotacaoBTC;
                    detalhePagamento = formatarBitcoin(valorBTC) + ' (cotação: R$ ' + cotacaoBTC.toFixed(2).replace('.', ',') + '/BTC)';
                    valorFinal = totalComDesconto;
                } catch (error) {
                    alert('Erro ao obter cotação do Bitcoin. Tente novamente.');
                    return;
                }
            } else if (isEthereum) {
                try {
                    cotacaoETH = await obterCotacaoEthereum();
                    cotacaoETHUsada = cotacaoETH;
                    valorETH = totalComDesconto / cotacaoETH;
                    detalhePagamento = formatarEthereum(valorETH) + ' (cotação: R$ ' + cotacaoETH.toFixed(2).replace('.', ',') + '/ETH)';
                    valorFinal = totalComDesconto;
                } catch (error) {
                    alert('Erro ao obter cotação do Ethereum. Tente novamente.');
                    return;
                }
            } else {
                valorFinal = totalComDesconto;
                detalhePagamento = 'à vista';
            }

            let brindesGerador = [];

            const brindesDoServico = servicoBase.brindes || brindesPorId[servicoBase.id] || [];
            brindesDoServico.forEach(function(item) {
                if (!item.toLowerCase().includes('pacote de jogos')) {
                    brindesGerador.push(item);
                }
            });

            if (idsComBrindeSuporte.indexOf(servicoBase.id) !== -1 && qtd >= 3) {
                if (!brindesGerador.some(function(b) { return b.includes('suporte remoto'); })) {
                    brindesGerador.push('90 dias de suporte remoto');
                }
                if (!brindesGerador.some(function(b) { return b.includes('instruções'); })) {
                    brindesGerador.push('3 semanas de instruções');
                }
            }

            if (qtdJogos > 0 && jogosIndicador.textContent === 'Sim' && isJogosBrinde) {
                const labelJogo = 'Pacote de Jogos ' + jogosNivel + ' por PC';
                brindesGerador.push(labelJogo);
            }

            brindesGerador = brindesGerador.filter(function(item, index, self) {
                return self.indexOf(item) === index;
            });

            const formatarMoedaFn = function(valor) {
                return 'R$ ' + valor.toFixed(2).replace('.', ',');
            };

            let resultadoHtml = '';

            let detalheValor = '';
            const partes = [];
            partes.push('Formatação: ' + formatarMoedaFn(totalFormatacaoComDesconto));
            if (qtdLimpeza > 0) partes.push('Limpeza: ' + formatarMoedaFn(totalLimpezaComDesconto));
            if (qtdAntivirus > 0) {
                if (precoAntivirusAtual === 0 && (antivirusNome.includes('Brinde') || antivirusNome.includes('Gratuito') || antivirusNome.includes('Free'))) {
                    partes.push('Antivírus: ' + antivirusNome + ' (gratuito)');
                } else {
                    partes.push('Antivírus: ' + formatarMoedaFn(totalAntivirus) + ' (' + antivirusNome + ')');
                }
            }
            if (qtdOffice > 0) {
                if (precoOfficeAtual === 0 && officeNome.includes('Brinde')) {
                    partes.push('Pacote Office: ' + officeNome + ' (gratuito)');
                } else {
                    partes.push('Pacote Office: ' + formatarMoedaFn(totalOffice) + ' (' + officeNome + ')');
                }
            }
            if (qtdImpressora > 0) {
                if (impressoraBrinde) {
                    partes.push('Impressora: Brinde (' + qtdImpressora + ' PCs)');
                } else {
                    partes.push('Impressora: ' + formatarMoedaFn(totalImpressora) + ' (' + qtdImpressora + ' PCs)');
                }
            }
            if (qtdJogos > 0) {
                partes.push('Jogos: ' + jogosNivel + ' (' + qtdJogos + ' PCs)');
            }
            detalheValor = partes.join(' | ');

            if (temDesconto || isInstallment || isBitcoin || isEthereum) {
                resultadoHtml += '<div class="pacote-modal__resultado--com-desconto">';
                let labelTexto = 'Valor ';
                if (isBitcoin) labelTexto += 'em Bitcoin';
                else if (isEthereum) labelTexto += 'em Ethereum';
                else if (isInstallment) labelTexto += 'parcelado';
                else labelTexto += 'com desconto';
                resultadoHtml += '<span class="pacote-modal__resultado-label"><i class="fa-solid fa-tag"></i> ' + labelTexto + '</span>';
                resultadoHtml += '<div>';
                if (temDesconto) {
                    resultadoHtml += '<span class="pacote-modal__resultado-preco--original">' + formatarMoedaFn(totalFormatacao + totalLimpeza + totalAntivirus + totalOffice + totalImpressora + totalJogos) + '</span>';
                }
                if (isBitcoin && valorBTC !== null) {
                    resultadoHtml += '<span class="pacote-modal__resultado-preco" style="font-size: 2.2rem;">' + formatarBitcoin(valorBTC) + '</span>';
                    resultadoHtml += '<div style="font-size: 0.9rem; color: var(--color-text-muted);">' + formatarMoedaFn(totalComDesconto) + ' (cotação: R$ ' + cotacaoBTCUsada.toFixed(2).replace('.', ',') + '/BTC)</div>';
                } else if (isEthereum && valorETH !== null) {
                    resultadoHtml += '<span class="pacote-modal__resultado-preco" style="font-size: 2.2rem;">' + formatarEthereum(valorETH) + '</span>';
                    resultadoHtml += '<div style="font-size: 0.9rem; color: var(--color-text-muted);">' + formatarMoedaFn(totalComDesconto) + ' (cotação: R$ ' + cotacaoETHUsada.toFixed(2).replace('.', ',') + '/ETH)</div>';
                } else {
                    resultadoHtml += '<span class="pacote-modal__resultado-preco">' + formatarMoedaFn(valorFinal) + '</span>';
                }
                resultadoHtml += '</div>';
                if (temDesconto && !isBitcoin && !isEthereum) {
                    resultadoHtml += '<span class="pacote-modal__resultado-economia"><i class="fa-solid fa-circle-arrow-down"></i> Desconto de ' + formatarPorcentagem(percentualDesconto) + ' (formatação e limpeza)</span>';
                }
                if (isInstallment) {
                    resultadoHtml += '<span class="pacote-modal__resultado-economia" style="margin-left: 6px;"><i class="fa-solid fa-credit-card"></i> ' + detalhePagamento + '</span>';
                }
                if (isBitcoin) {
                    resultadoHtml += '<span class="pacote-modal__resultado-economia" style="margin-left: 6px;"><i class="fa-brands fa-bitcoin"></i> ' + detalhePagamento + '</span>';
                }
                if (isEthereum) {
                    resultadoHtml += '<span class="pacote-modal__resultado-economia" style="margin-left: 6px;"><i class="fa-brands fa-ethereum"></i> ' + detalhePagamento + '</span>';
                }
                if (detalheValor) {
                    resultadoHtml += '<div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 6px;">' + detalheValor + '</div>';
                }
                resultadoHtml += '</div>';
            } else {
                resultadoHtml += '<div class="pacote-modal__resultado--sem-desconto">';
                resultadoHtml += '<span class="pacote-modal__resultado-label"><i class="fa-solid fa-box"></i> Valor total</span>';
                resultadoHtml += '<span class="pacote-modal__resultado-preco">' + formatarMoedaFn(valorFinal) + '</span>';
                if (qtd > 1) {
                    resultadoHtml += '<div class="pacote-modal__resultado-detalhe">' + formatarMoedaFn(precoBase) + ' x ' + qtd + ' PCs</div>';
                }
                if (qtdLimpeza > 0) {
                    resultadoHtml += '<div style="font-size: 0.8rem; color: var(--color-text-muted);">+ Limpeza: ' + formatarMoedaFn(totalLimpeza) + ' (' + qtdLimpeza + ' PCs)</div>';
                }
                if (qtdAntivirus > 0) {
                    if (precoAntivirusAtual === 0 && (antivirusNome.includes('Brinde') || antivirusNome.includes('Gratuito') || antivirusNome.includes('Free'))) {
                        resultadoHtml += '<div style="font-size: 0.8rem; color: var(--color-primary-light);">+ Antivírus: ' + antivirusNome + ' (gratuito)</div>';
                    } else {
                        resultadoHtml += '<div style="font-size: 0.8rem; color: var(--color-text-muted);">+ Antivírus: ' + formatarMoedaFn(totalAntivirus) + ' (' + antivirusNome + ')</div>';
                    }
                }
                if (qtdOffice > 0) {
                    if (precoOfficeAtual === 0 && officeNome.includes('Brinde')) {
                        resultadoHtml += '<div style="font-size: 0.8rem; color: var(--color-primary-light);">+ Pacote Office: ' + officeNome + ' (gratuito)</div>';
                    } else {
                        resultadoHtml += '<div style="font-size: 0.8rem; color: var(--color-text-muted);">+ Pacote Office: ' + formatarMoedaFn(totalOffice) + ' (' + officeNome + ')</div>';
                    }
                }
                if (qtdImpressora > 0) {
                    if (impressoraBrinde) {
                        resultadoHtml += '<div style="font-size: 0.8rem; color: var(--color-primary-light);">+ Impressora: Brinde (' + qtdImpressora + ' PCs)</div>';
                    } else {
                        resultadoHtml += '<div style="font-size: 0.8rem; color: var(--color-text-muted);">+ Impressora: ' + formatarMoedaFn(totalImpressora) + ' (' + qtdImpressora + ' PCs)</div>';
                    }
                }
                if (qtdJogos > 0) {
                    resultadoHtml += '<div style="font-size: 0.8rem; color: var(--color-text-muted);">+ Jogos: ' + jogosNivel + ' (' + qtdJogos + ' PCs)</div>';
                }
                resultadoHtml += '</div>';
            }

            if (brindesGerador.length > 0) {
                const itensBrindeGerador = brindesGerador.map(function(item) {
                    let icone = 'fa-gift';
                    if (item.includes('MS Office') || item.includes('Pacote Office')) icone = 'fa-file-word';
                    else if (item.includes('Kaspersky')) icone = 'fa-shield-halved';
                    else if (item.includes('Instalações de Softwares')) icone = 'fa-download';
                    else if (item.includes('suporte')) icone = 'fa-headset';
                    else if (item.includes('instruções')) icone = 'fa-graduation-cap';
                    else if (item.includes('Desconto')) icone = 'fa-percent';
                    else if (item.includes('Atendimento')) icone = 'fa-clock';
                    else if (item.includes('Garantia')) icone = 'fa-shield-check';
                    else if (item.includes('Impressora')) icone = 'fa-print';
                    else if (item.includes('Limpeza')) icone = 'fa-broom';
                    return '<div><i class="fa-solid ' + icone + '" style="color: var(--color-primary-light); width: 22px; display: inline-block;"></i> ' + item + '</div>';
                }).join('');

                resultadoHtml += '<div style="margin-top: 18px; padding: 16px 20px; background: linear-gradient(135deg, rgba(16,185,129,0.10), rgba(16,185,129,0.03)); border-radius: 12px; border: 1px solid rgba(16,185,129,0.20);">';
                resultadoHtml += '<div style="font-weight: 700; color: var(--color-primary-light); font-size: 1rem; margin-bottom: 8px;"><i class="fa-solid fa-gift" style="margin-right: 8px;"></i> Brindes inclusos no pacote</div>';
                resultadoHtml += '<div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem; color: var(--color-text-secondary);">';
                resultadoHtml += itensBrindeGerador;
                resultadoHtml += '</div></div>';
            }

            let mensagem = 'Olá! Gostaria de solicitar um pacote de ' + qtd + ' PCs para Formatação ' +
                nomeTipoExibicao[tipo] + ' (' + (nomeSO[so] || so) + ').';
            if (qtdLimpeza > 0) {
                mensagem += ' Incluindo limpeza em ' + qtdLimpeza + ' PCs.';
            }
            if (qtdAntivirus > 0) {
                mensagem += ' Incluindo antivírus (' + antivirusNome + ') em ' + qtdAntivirus + ' PCs.';
            }
            if (qtdOffice > 0) {
                mensagem += ' Incluindo Pacote Office (' + officeNome + ') em ' + qtdOffice + ' PCs.';
            }
            if (qtdImpressora > 0) {
                mensagem += ' Incluindo instalação de impressora em ' + qtdImpressora + ' PCs' + (impressoraBrinde ? ' (brinde)' : '') + '.';
            }
            if (qtdJogos > 0) {
                mensagem += ' Incluindo pacote de jogos ' + jogosNivel + ' em ' + qtdJogos + ' PCs.';
            }
            if (isBitcoin && valorBTC !== null) {
                mensagem += ' Valor: ' + formatarBitcoin(valorBTC) + ' (' + formatarMoedaFn(valorFinal) + ' na cotação atual).';
            } else if (isEthereum && valorETH !== null) {
                mensagem += ' Valor: ' + formatarEthereum(valorETH) + ' (' + formatarMoedaFn(valorFinal) + ' na cotação atual).';
            } else {
                mensagem += ' Valor: ' + formatarMoedaFn(valorFinal);
            }
            if (temDesconto && !isBitcoin && !isEthereum) {
                mensagem += ' com ' + formatarPorcentagem(percentualDesconto) + ' de desconto (formatação e limpeza)';
            }
            if (isInstallment) {
                mensagem += ' parcelado em ' + numParcelas + 'x (' + detalhePagamento + ')';
            } else if (!isBitcoin && !isEthereum) {
                mensagem += ' à vista';
            }
            if (brindesGerador.length > 0) {
                mensagem += ' (com brindes: ' + brindesGerador.join(' + ') + ')';
            }
            mensagem += '.';
            const whatsappLink = 'https://wa.me/5548996446508?text=' + encodeURIComponent(mensagem);

            resultadoHtml += '<div class="pacote-modal__resultado-whatsapp" style="margin-top: 18px;">';
            resultadoHtml += '<a href="' + whatsappLink + '" target="_blank" class="btn btn--whatsapp" style="width: 100%;">';
            resultadoHtml += '<i class="fa-brands fa-whatsapp"></i> Solicitar orçamento';
            resultadoHtml += '</a>';
            resultadoHtml += '</div>';

            resultadoHtml += '<div style="margin-top: 12px; text-align: center;">';
            resultadoHtml += '<button id="gerarPDFBtn" class="btn btn--pdf" style="width: 100%;">';
            resultadoHtml += '<i class="fa-solid fa-file-pdf"></i> Baixar orçamento em PDF';
            resultadoHtml += '</button>';
            resultadoHtml += '</div>';

            pacoteResultadoModal.innerHTML = resultadoHtml;
            pacoteResultadoModal.style.display = 'block';

            const pdfBtn = document.getElementById('gerarPDFBtn');
            if (pdfBtn) {
                pdfBtn.addEventListener('click', function() {
                    const dadosPDF = {
                        tipo: nomeTipoExibicao[tipo] || tipo,
                        so: nomeSO[so] || so,
                        qtd: qtd,
                        valorUnitario: precoBase,
                        totalOriginal: totalComDesconto,
                        totalFormatacao: totalFormatacaoComDesconto,
                        desconto: temDesconto ? formatarPorcentagem(percentualDesconto) : null,
                        valorFinal: valorFinal,
                        isInstallment: isInstallment,
                        isBitcoin: isBitcoin,
                        isEthereum: isEthereum,
                        numParcelas: isInstallment ? numParcelas : null,
                        valorParcela: isInstallment ? resultadoParcelamento.valorParcela : null,
                        jurosTotal: isInstallment ? resultadoParcelamento.jurosTotal : null,
                        valorBTC: isBitcoin ? valorBTC : null, // agora é número
                        cotacaoBTC: isBitcoin ? cotacaoBTCUsada : null,
                        valorETH: isEthereum ? valorETH : null, // número
                        cotacaoETH: isEthereum ? cotacaoETHUsada : null,
                        brindes: brindesGerador,
                        limpezaQtd: qtdLimpeza,
                        limpezaTotal: totalLimpezaComDesconto,
                        antivirusQtd: qtdAntivirus,
                        antivirusTotal: totalAntivirus,
                        antivirusNome: antivirusNome,
                        officeQtd: qtdOffice,
                        officeTotal: totalOffice,
                        officeNome: officeNome,
                        impressoraQtd: qtdImpressora,
                        impressoraTotal: totalImpressora,
                        impressoraBrinde: impressoraBrinde,
                        jogosQtd: qtdJogos,
                        jogosTotal: totalJogos,
                        jogosNivel: jogosNivel
                    };
                    gerarPDF(dadosPDF);
                });
            }
        });

        console.log('✅ Gerador de pacote configurado com sucesso! (versão 36.55)');
    }

    // ============================================================
    // 18. FORMULÁRIO DE CONTATO COM FORMSPREE (AJAX)
    // ============================================================
    function iniciarContato() {
        const contactForm = document.getElementById('contactForm');
        if (!contactForm) return;

        if (contactForm._listener) return;
        contactForm._listener = true;

        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const form = this;
            const submitBtn = form.querySelector('button[type="submit"]');
            const responseDiv = document.getElementById('formResponse');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Enviando...';
            }

            if (responseDiv) {
                responseDiv.innerHTML = '';
            }

            const formData = new FormData(form);

            fetch(form.action, {
                method: form.method,
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(function(response) {
                if (response.ok) {
                    return response.json();
                } else {
                    return response.json().then(function(data) {
                        throw new Error(data.error || 'Erro ao enviar mensagem.');
                    });
                }
            })
            .then(function(data) {
                if (responseDiv) {
                    responseDiv.innerHTML =
                        '<div class="form-success">' +
                        '<i class="fa-solid fa-circle-check"></i>' +
                        '<h3>Mensagem enviada!</h3>' +
                        '<p>Obrigado! Sua mensagem foi enviada com sucesso. Em breve entraremos em contato.</p>' +
                        '</div>';
                }
                form.reset();
            })
            .catch(function(error) {
                if (responseDiv) {
                    responseDiv.innerHTML =
                        '<div class="form-error" style="color: #f87171; text-align: center; padding: 16px; background: rgba(248, 113, 113, 0.1); border-radius: 8px; border: 1px solid rgba(248, 113, 113, 0.2);">' +
                        '<i class="fa-solid fa-circle-exclamation" style="font-size: 1.5rem; display: block; margin-bottom: 8px;"></i>' +
                        '<strong>Ops!</strong> ' + error.message +
                        '<p style="font-size: 0.9rem; margin-top: 8px; color: var(--color-text-muted);">Tente novamente ou entre em contato diretamente pelo WhatsApp.</p>' +
                        '</div>';
                }
            })
            .finally(function() {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Enviar Mensagem';
                }
            });
        });
    }

    // ============================================================
    // 19. FALLBACK LOGO
    // ============================================================
    const logoImg = document.querySelector('.nav__logo-img');
    if (logoImg) {
        logoImg.addEventListener('error', function() {
            this.style.display = 'none';
            const fallback = this.nextElementSibling;
            if (fallback) fallback.style.display = 'flex';
        });
        if (logoImg.complete && logoImg.naturalWidth === 0) {
            logoImg.style.display = 'none';
            const fallback = logoImg.nextElementSibling;
            if (fallback) fallback.style.display = 'flex';
        }
    }

    // ============================================================
    // 20. INICIALIZAÇÃO
    // ============================================================
    carregarServicos().then(function() {
        configurarFiltros();
        console.log('✅ Inicialização concluída!');
    });

});