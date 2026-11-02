(function() {
    const topicsGrid = document.querySelector('[data-lessons-topics]');
    const galleryHeading = document.querySelector('[data-lessons-gallery-heading]');
    const galleryGrid = document.querySelector('[data-lessons-gallery]');
    const errorMessage = document.querySelector('[data-lessons-content-error]');

    function criarIcone(className) {
        const icon = document.createElement('i');
        icon.className = className;
        icon.setAttribute('aria-hidden', 'true');
        return icon;
    }

    function criarEtiqueta(iconClass, text) {
        const tag = document.createElement('span');
        tag.className = 'lessons-tag';
        tag.append(criarIcone(iconClass), document.createTextNode(' ' + text));
        return tag;
    }

    function renderizarIntroducao(introducao) {
        const section = topicsGrid.closest('.lessons-topics');
        section.insertBefore(criarEtiqueta(introducao.icone, introducao.etiqueta), topicsGrid);

        const title = document.createElement('h2');
        title.id = 'topicsTitle';
        title.textContent = introducao.titulo;
        section.insertBefore(title, topicsGrid);

        const description = document.createElement('p');
        description.className = 'lessons-topics__intro';
        description.textContent = introducao.descricao;
        section.insertBefore(description, topicsGrid);

        introducao.cards.forEach(function(card) {
            const article = document.createElement('article');
            article.className = 'lessons-topic';

            const title = document.createElement('h3');
            title.textContent = card.titulo;

            const description = document.createElement('p');
            description.textContent = card.descricao;

            article.append(criarIcone(card.icone), title, description);
            topicsGrid.append(article);
        });
    }

    function renderizarDiaADia(diaADia, whatsapp) {
        galleryHeading.append(
            criarEtiqueta(diaADia.icone, diaADia.etiqueta)
        );

        const title = document.createElement('h2');
        title.id = 'galleryTitle';
        title.textContent = diaADia.titulo;

        const description = document.createElement('p');
        description.textContent = diaADia.descricao;
        galleryHeading.append(title, description);

        diaADia.cards.forEach(function(card) {
            const figure = document.createElement('figure');
            figure.className = 'lessons-gallery__item';

            const image = document.createElement('img');
            image.src = card.imagem;
            image.alt = card.imagem_alt;
            image.loading = 'lazy';

            const caption = document.createElement('figcaption');
            const cardTitle = document.createElement('span');
            cardTitle.textContent = card.titulo;

            const link = document.createElement('a');
            link.href = 'https://wa.me/' + whatsapp.numero + '?text=' +
                encodeURIComponent(card.mensagem_whatsapp);
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'btn btn--whatsapp btn--sm';
            link.append(
                criarIcone('fa-brands fa-whatsapp'),
                document.createTextNode(' ' + whatsapp.texto_botao)
            );

            caption.append(cardTitle, link);
            figure.append(image, caption);
            galleryGrid.append(figure);
        });
    }

    async function carregarConteudo() {
        try {
            const response = await fetch('aulas.json');
            if (!response.ok) {
                throw new Error('Falha ao carregar aulas.json (status ' + response.status + ')');
            }

            const data = await response.json();
            if (!data.introducao || !Array.isArray(data.introducao.cards) ||
                !data.dia_a_dia || !Array.isArray(data.dia_a_dia.cards) ||
                !data.whatsapp || !data.whatsapp.numero) {
                throw new Error('Formato inválido em aulas.json');
            }

            renderizarIntroducao(data.introducao);
            renderizarDiaADia(data.dia_a_dia, data.whatsapp);
        } catch (error) {
            console.error('Não foi possível carregar o conteúdo das aulas particulares:', error);
            errorMessage.hidden = false;
        }
    }

    carregarConteudo();
})();
