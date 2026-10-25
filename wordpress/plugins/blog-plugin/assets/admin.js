(function () {
    'use strict';

    var provider = document.querySelector('select[name="zebracode_blog_ai_settings[provider]"]');
    var endpoint = document.querySelector('input[name="zebracode_blog_ai_settings[endpoint]"]');
    var model = document.querySelector('select[data-model-field]');
    var imageModel = document.querySelector('input[data-image-model-field]');

    if (!provider || !endpoint || !model) return;

    var values = {
        gemini: {
            endpoint: 'https://generativelanguage.googleapis.com/v1beta',
            model: 'gemini-flash-latest',
            imageModel: 'gemini-3.1-flash-image'
        },
        'openai-compatible': {
            endpoint: 'https://api.openai.com/v1',
            model: 'gpt-4o-mini',
            imageModel: 'gpt-image-1'
        }
    };

    provider.addEventListener('change', function () {
        var next = values[provider.value];
        if (!next) return;

        var knownEndpoints = Object.keys(values).map(function (key) { return values[key].endpoint; });
        var knownModels = Object.keys(values).map(function (key) { return values[key].model; });

        if (!endpoint.value || knownEndpoints.indexOf(endpoint.value) !== -1) endpoint.value = next.endpoint;
        if (!model.value || knownModels.indexOf(model.value) !== -1) setModelValue(next.model);
        if (imageModel && (!imageModel.value || Object.keys(values).some(function (key) { return values[key].imageModel === imageModel.value; }))) imageModel.value = next.imageModel;

        endpoint.placeholder = next.endpoint;
        model.placeholder = next.model;
        if (imageModel) imageModel.placeholder = next.imageModel;
    });

    var picker = document.querySelector('[data-load-models]');
    var modelStatus = document.querySelector('[data-model-status]');
    var config = window.ZebraCodeBlogAI || {};

    if (!picker || !modelStatus || !config.ajaxUrl || !config.modelsNonce) return;

    function setModelValue(value) {
        var exists = Array.prototype.some.call(model.options, function (option) { return option.value === value; });
        if (!exists) model.add(new Option(value, value));
        model.value = value;
    }

    picker.addEventListener('click', function () {
        picker.disabled = true;
        modelStatus.textContent = 'Loading models…';

        var body = new URLSearchParams();
        body.set('action', 'zebracode_blog_ai_list_models');
        body.set('nonce', config.modelsNonce);
        body.set('provider', provider.value);
        body.set('endpoint', endpoint.value);

        fetch(config.ajaxUrl, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body: body.toString()
        }).then(function (response) {
            return response.json();
        }).then(function (payload) {
            if (!payload.success) throw new Error(payload.data && payload.data.message ? payload.data.message : 'Could not load models.');

            var models = payload.data && Array.isArray(payload.data.models) ? payload.data.models : [];
            if (!models.length) {
                modelStatus.textContent = 'The provider returned no models that can be used for generation.';
                return;
            }

            var previousModel = model.value;
            model.innerHTML = '';
            models.forEach(function (item) {
                var option = new Option(item.label || item.name || item.id, item.id);
                if (item.id === previousModel) option.selected = true;
                model.add(option);
            });
            modelStatus.textContent = models.length + ' model(s) loaded. Choose one or keep the current model.';
        }).catch(function (error) {
            modelStatus.textContent = error.message;
        }).finally(function () {
            picker.disabled = false;
        });
    });

    var connectionForm = document.querySelector('[data-test-connection-form]');
    var connectionButton = document.querySelector('[data-test-connection]');
    var connectionStatus = document.querySelector('[data-connection-status]');

    if (connectionForm && connectionButton && connectionStatus && config.testNonce) {
        connectionForm.addEventListener('submit', function (event) {
            event.preventDefault();
            connectionButton.disabled = true;
            connectionStatus.textContent = 'Testing the current endpoint, model, and key…';

            var body = new URLSearchParams();
            body.set('action', 'zebracode_blog_ai_test_connection');
            body.set('nonce', config.testNonce);
            body.set('provider', provider.value);
            body.set('endpoint', endpoint.value);
            body.set('model', model.value);

            fetch(config.ajaxUrl, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                body: body.toString()
            }).then(function (response) {
                return response.json();
            }).then(function (payload) {
                var message = payload.data && payload.data.message ? payload.data.message : 'Connection test failed.';
                connectionStatus.textContent = message;
                connectionStatus.className = payload.success ? 'mt-3 text-xs leading-5 text-emerald-700' : 'mt-3 text-xs leading-5 text-red-700';
            }).catch(function (error) {
                connectionStatus.textContent = error.message || 'Connection test failed.';
                connectionStatus.className = 'mt-3 text-xs leading-5 text-red-700';
            }).finally(function () {
                connectionButton.disabled = false;
            });
        });
    }

}());
