// Small API client to centralize network requests for lead-generation app
// Exposes window.apiClient with methods: fetchLeads(apolloUrl) and sendLeads(payload)
(function() {
    async function handleNonOk(response) {
        const text = await response.text().catch(() => null);
        throw new Error(`HTTP error! status: ${response.status}${text ? ' - ' + text : ''}`);
    }

    async function fetchLeads(apolloUrl) {
        if (!apolloUrl) throw new Error('Apollo URL mancante');

        const response = await fetch(CONFIG.endpoints.fetchLeads, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain; charset=utf-8'
            },
            body: apolloUrl
        });

        if (!response.ok) {
            await handleNonOk(response);
        }

        const raw = await response.text().catch(() => null);

        // empty body -> no results
        if (!raw) return [];

        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                // If API returns an object with a property (e.g. { results: [...] }) try to extract
                if (parsed && Array.isArray(parsed.results)) return parsed.results;
                throw new Error('Risposta non è un array');
            }
            return parsed;
        } catch (err) {
            throw new Error(`Invalid JSON response from server: ${err.message}`);
        }
    }

    async function sendLeads(payload) {
        const response = await fetch(CONFIG.endpoints.sendLeads, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            await handleNonOk(response);
        }

        return await response.text().catch(() => '');
    }

    window.apiClient = {
        fetchLeads,
        sendLeads
    };
})();
