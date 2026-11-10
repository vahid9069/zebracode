/**
 * Safe, robust REST API client for Omni AI Suite.
 * Handles:
 * 1. Pretty permalinks (/wp-json/omni-ai/v1/...)
 * 2. Plain permalinks (?rest_route=/omni-ai/v1/...&...)
 * 3. Automatic fallback from pretty to plain permalinks if web server returns 404
 * 4. Automatic nonce and same-origin credentials
 */

export function buildApiUrl(endpoint, params = {}, forcePlain = false) {
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const data = window.omniAiData || {};
  const baseRestUrl = data.restUrl || '/wp-json/omni-ai/v1/';
  const siteUrl = data.siteUrl || (window.location.origin + '/');

  // Determine full route path (default namespace: /omni-ai/v1/)
  const routePath = cleanEndpoint.startsWith('wp/') 
    ? `/${cleanEndpoint}`
    : `/omni-ai/v1/${cleanEndpoint}`;

  // If forcePlain OR if baseRestUrl already uses ?rest_route=
  if (forcePlain || baseRestUrl.includes('?')) {
    let baseUrl = siteUrl;
    if (baseRestUrl.includes('?')) {
      baseUrl = baseRestUrl.split('?')[0];
    }
    const search = new URLSearchParams();
    search.set('rest_route', routePath);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        search.set(k, v);
      }
    }
    const glue = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${glue}${search.toString()}`;
  }

  // Pretty permalinks mode
  let basePretty = baseRestUrl;
  if (cleanEndpoint.startsWith('wp/')) {
    basePretty = basePretty.replace('omni-ai/v1/', '');
  }
  if (!basePretty.endsWith('/')) {
    basePretty += '/';
  }

  let finalUrl;
  try {
    const fullPath = basePretty.startsWith('http')
      ? new URL(cleanEndpoint, basePretty).toString()
      : new URL(basePretty + cleanEndpoint, window.location.origin).toString();
    finalUrl = new URL(fullPath);
  } catch (e) {
    finalUrl = new URL(`/wp-json${routePath}`, window.location.origin);
  }

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      finalUrl.searchParams.set(k, v);
    }
  }

  return finalUrl.toString();
}

/**
 * Universal safe API fetcher:
 * - Automatically attaches nonce & same-origin credentials
 * - Auto-retries via plain permalinks (?rest_route=) if pretty permalinks return 404
 */
export async function apiFetch(endpoint, options = {}, params = {}) {
  const nonce = window.omniAiData?.nonce || '';
  const headers = {
    'X-WP-Nonce': nonce,
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  // Auto-set Content-Type: application/json for JSON POST/PUT payloads
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const primaryUrl = buildApiUrl(endpoint, params, false);

  let res;
  try {
    res = await fetch(primaryUrl, {
      credentials: 'same-origin',
      ...options,
      headers,
    });
  } catch (netErr) {
    // If network or CORS fail on pretty URL, attempt fallback via plain query parameter
    try {
      const fallbackUrl = buildApiUrl(endpoint, params, true);
      return await fetch(fallbackUrl, {
        credentials: 'same-origin',
        ...options,
        headers,
      });
    } catch (_) {
      throw netErr;
    }
  }

  // If pretty permalinks fail with 404 (e.g. web server mod_rewrite / Nginx try_files missing or broken)
  if (res.status === 404 && !primaryUrl.includes('rest_route=')) {
    try {
      const fallbackUrl = buildApiUrl(endpoint, params, true);
      const fallbackRes = await fetch(fallbackUrl, {
        credentials: 'same-origin',
        ...options,
        headers,
      });
      if (fallbackRes.ok || fallbackRes.status !== 404) {
        return fallbackRes;
      }
    } catch (_) {
      // Fallback network error; return original response
    }
  }

  return res;
}
