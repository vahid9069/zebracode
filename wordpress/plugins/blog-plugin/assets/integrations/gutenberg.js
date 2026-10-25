(function (wp) {
    'use strict';
    if (!wp || !wp.plugins || !wp.editPost || !wp.element) return;
    var el = wp.element.createElement;
    var registerPlugin = wp.plugins.registerPlugin;
    var PluginSidebar = wp.editPost.PluginSidebar;
    var config = window.ZebraCodeBlogAIIntegration || {};

    function Sidebar() {
        return el(PluginSidebar, { name: 'zebracode-blog-ai', title: 'ZebraCode AI', icon: 'edit' },
            el('p', null, 'Generate or improve the current content from the ZebraCode AI Studio.'));
    }

    registerPlugin('zebracode-blog-ai', { render: Sidebar });
}(window.wp));
