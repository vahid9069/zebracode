(function () {
    'use strict';
    var button = document.querySelector('[data-zebracode-ai-product]');
    if (!button) return;
    button.addEventListener('click', function () {
        button.disabled = true;
        button.textContent = 'Open ZebraCode AI Studio';
        var url = (window.ZebraCodeBlogAIIntegration || {}).studioUrl;
        if (url) window.open(url, '_blank');
        button.disabled = false;
    });
}());
