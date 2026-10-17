const TAXAS_JUROS_MENSAIS = Object.freeze({
    2: 0.02,
    3: 0.021,
    4: 0.022,
    5: 0.023,
    6: 0.024,
    7: 0.025,
    8: 0.026,
    9: 0.027,
    10: 0.028,
    11: 0.029,
    12: 0.03
});

function obterTaxaJurosMensal(numParcelas) {
    const taxa = TAXAS_JUROS_MENSAIS[numParcelas];
    if (taxa === undefined) {
        throw new RangeError('Número de parcelas sem taxa de juros configurada.');
    }
    return taxa;
}

function formatarTaxaJurosMensal(taxa) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(taxa);
}

function atualizarOpcoesParcelamento(raiz) {
    raiz.querySelectorAll('.installment-select').forEach(function(select) {
        Array.from(select.options).forEach(function(option) {
            const numParcelas = Number(option.value);
            if (numParcelas in TAXAS_JUROS_MENSAIS) {
                option.textContent = numParcelas + 'x — ' +
                    formatarTaxaJurosMensal(obterTaxaJurosMensal(numParcelas)) + ' ao mês';
            }
        });
    });
}

function calcularParcelamento(valorTotal, numParcelas) {
    if (numParcelas === 1) {
        return {
            valorParcela: valorTotal,
            valorTotalParcelado: valorTotal,
            jurosTotal: 0,
            taxaJurosMensal: 0
        };
    }

    const taxaJurosMensal = obterTaxaJurosMensal(numParcelas);
    const fator = Math.pow(1 + taxaJurosMensal, numParcelas);
    const valorParcela = valorTotal * (taxaJurosMensal * fator) / (fator - 1);
    const valorParcelaArredondado = Math.round(valorParcela * 100) / 100;
    const valorTotalParcelado = Math.round(valorParcelaArredondado * numParcelas * 100) / 100;

    return {
        valorParcela: valorParcelaArredondado,
        valorTotalParcelado: valorTotalParcelado,
        jurosTotal: Math.round((valorTotalParcelado - valorTotal) * 100) / 100,
        taxaJurosMensal: taxaJurosMensal
    };
}
