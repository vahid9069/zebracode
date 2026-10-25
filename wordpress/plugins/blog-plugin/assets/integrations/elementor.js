(function () {
    'use strict';
    var addButton = function () {
        if (document.querySelector('[data-zebracode-ai-elementor]')) return;
        var button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'ZebraCode AI';
        button.setAttribute('data-zebracode-ai-elementor', '1');
        button.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:99999;padding:8px 12px;border:0;border-radius:6px;background:#111827;color:#fff;cursor:pointer;';
        button.addEventListener('click', function () {
            window.open((window.ZebraCodeBlogAIIntegration || {}).studioUrl || '#', '_blank');
        });
        document.body.appendChild(button);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton); else addButton();
}());
