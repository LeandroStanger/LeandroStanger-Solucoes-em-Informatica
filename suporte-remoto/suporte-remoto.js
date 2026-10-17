document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.getElementById('navLinks');
    const toggleButton = document.getElementById('mobileToggle');

    if (navLinks && toggleButton) {
        function closeMenu() {
            navLinks.classList.remove('nav--open');
            toggleButton.setAttribute('aria-expanded', 'false');
            toggleButton.setAttribute('aria-label', 'Abrir menu');
            document.body.style.overflow = '';
        }

        toggleButton.addEventListener('click', function() {
            const isOpen = navLinks.classList.toggle('nav--open');
            toggleButton.setAttribute('aria-expanded', String(isOpen));
            toggleButton.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        navLinks.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('click', function(event) {
            if (!navLinks.contains(event.target) && !toggleButton.contains(event.target)) {
                closeMenu();
            }
        });

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') closeMenu();
        });
    }

    const payment = document.getElementById('remotePayment');
    if (!payment) return;

    atualizarOpcoesParcelamento(payment);

    const price = Number(payment.dataset.price);
    const methodButtons = payment.querySelectorAll('.remote-payment__method');
    const installmentOptions = payment.querySelector('.remote-payment__installments');
    const installmentSelect = payment.querySelector('#remoteInstallmentCount');
    const totalDisplay = payment.querySelector('.remote-payment__total');
    const detailDisplay = payment.querySelector('.remote-payment__detail');
    let activeMethod = 'cash';
    let cryptoRates = null;
    let cryptoRatesFetchedAt = 0;

    const formatCurrency = function(amount) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(amount);
    };

    function setPaymentDisplay(total, detail, isError) {
        totalDisplay.textContent = total;
        detailDisplay.textContent = detail;
        detailDisplay.classList.toggle('is-error', isError);
    }

    function updateInstallmentDisplay() {
        const numberOfInstallments = Number(installmentSelect.value);
        const result = calcularParcelamento(price, numberOfInstallments);

        setPaymentDisplay(
            'Total parcelado: ' + formatCurrency(result.valorTotalParcelado),
            numberOfInstallments + 'x de ' + formatCurrency(result.valorParcela) +
                ' (juros: ' + formatCurrency(result.jurosTotal) + ' | taxa estimada: ' +
                formatarTaxaJurosMensal(result.taxaJurosMensal) + ' ao mês) por hora',
            false
        );
    }

    async function getCryptoRates() {
        const cacheDuration = 5 * 60 * 1000;
        if (cryptoRates && Date.now() - cryptoRatesFetchedAt < cacheDuration) {
            return cryptoRates;
        }

        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=brl'
        );
        if (!response.ok) {
            throw new Error('A cotação das criptomoedas não está disponível no momento.');
        }

        const data = await response.json();
        const bitcoin = Number(data?.bitcoin?.brl);
        const ethereum = Number(data?.ethereum?.brl);
        if (!Number.isFinite(bitcoin) || bitcoin <= 0 || !Number.isFinite(ethereum) || ethereum <= 0) {
            throw new Error('A cotação recebida é inválida. Tente novamente mais tarde.');
        }

        cryptoRates = { bitcoin: bitcoin, ethereum: ethereum };
        cryptoRatesFetchedAt = Date.now();
        return cryptoRates;
    }

    async function updateCryptoDisplay(method) {
        setPaymentDisplay('Consultando cotação…', 'Aguarde um instante.', false);
        try {
            const rates = await getCryptoRates();
            if (activeMethod !== method) return;

            const isBitcoin = method === 'bitcoin';
            const amount = price / rates[method];
            const formattedAmount = new Intl.NumberFormat('pt-BR', {
                minimumFractionDigits: isBitcoin ? 8 : 6,
                maximumFractionDigits: isBitcoin ? 8 : 6
            }).format(amount);
            const currencyLabel = isBitcoin ? 'BTC' : 'ETH';

            setPaymentDisplay(
                formattedAmount + ' ' + currencyLabel,
                'Valor do serviço: ≈ ' + formatCurrency(price) + ' por hora, pela cotação atual',
                false
            );
        } catch (error) {
            if (activeMethod !== method) return;
            console.error('Erro ao consultar cotação para pagamento remoto:', error);
            setPaymentDisplay('Cotação indisponível', error.message, true);
        }
    }

    function selectMethod(method) {
        activeMethod = method;
        methodButtons.forEach(function(button) {
            const isActive = button.dataset.payment === method;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        installmentOptions.hidden = method !== 'installment';
        if (method === 'installment') {
            updateInstallmentDisplay();
        } else if (method === 'bitcoin' || method === 'ethereum') {
            updateCryptoDisplay(method);
        } else {
            setPaymentDisplay('Valor do serviço: ' + formatCurrency(price), 'À vista por hora', false);
        }
    }

    methodButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            selectMethod(button.dataset.payment);
        });
    });

    installmentSelect.addEventListener('change', function() {
        if (activeMethod === 'installment') updateInstallmentDisplay();
    });
});
