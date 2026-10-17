document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.getElementById('navLinks');
    const toggleButton = document.getElementById('mobileToggle');

    if (!navLinks || !toggleButton) return;

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
});
