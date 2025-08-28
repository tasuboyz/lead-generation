// Simple Apollo URL builder exposed on window.buildApolloUrl(filters)
// Improved and hardened version
(function() {
    function normalizeToArray(input) {
        // Accepts array or comma-separated string or single value. Returns array of trimmed non-empty strings.
        if (input === undefined || input === null) return [];
        if (Array.isArray(input)) {
            return input.map(String).map(s => s.trim()).filter(Boolean);
        }
        // single value (number/string)
        return String(input).split(',').map(s => s.trim()).filter(Boolean);
    }

    function appendArrayParam(params, key, arr) {
        if (!arr || !Array.isArray(arr)) return;
        arr.forEach(v => {
            const val = String(v).trim();
            if (val) params.append(key, val);
        });
    }

    function isDefined(v) {
        return v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '');
    }

    window.buildApolloUrl = function(filters = {}) {
        const base = 'https://app.apollo.io/#/people';
        const params = new URLSearchParams();

        // personTitles[] (accept array or comma-separated string)
        const titles = normalizeToArray(filters.titles);
        appendArrayParam(params, 'personTitles[]', titles);

    // Industry and marketSegments are not mapped to personIndustries[] (deprecated)
    // They are instead used for organization keyword tags and other organization-level filters.

        // Locations
        const locations = normalizeToArray(filters.location);
        appendArrayParam(params, 'personLocations[]', locations);

        // Booleans: set only if explicitly provided
        if (filters.hasEmail !== undefined) params.set('hasEmail', String(Boolean(filters.hasEmail)));
        if (filters.hasLinkedIn !== undefined) params.set('hasLinkedIn', String(Boolean(filters.hasLinkedIn)));

        // Employees range -> organizationNumEmployeesRanges[]=min,max
        // Accept single min or max as well as ranges array
        const minE = (isDefined(filters.minEmployees)) ? String(filters.minEmployees).trim() : null;
        const maxE = (isDefined(filters.maxEmployees)) ? String(filters.maxEmployees).trim() : null;
        if (minE !== null || maxE !== null) {
            // allow partial ranges like "10," or ",50"
            params.append('organizationNumEmployeesRanges[]', `${minE !== null ? minE : ''},${maxE !== null ? maxE : ''}`);
        }

        // Additional employeeRanges array [{min, max}, ...]
        if (Array.isArray(filters.employeeRanges)) {
            filters.employeeRanges.forEach(range => {
                const rMin = (isDefined(range && range.min)) ? String(range.min).trim() : '';
                const rMax = (isDefined(range && range.max)) ? String(range.max).trim() : '';
                if (rMin !== '' || rMax !== '') {
                    params.append('organizationNumEmployeesRanges[]', `${rMin},${rMax}`);
                }
            });
        }

        // Page and sorting (only set when provided)
        if (isDefined(filters.page)) {
            const page = String(filters.page).trim();
            if (page) params.set('page', page);
        }

        if (isDefined(filters.sortByField)) {
            params.set('sortByField', String(filters.sortByField));
        }

        if (filters.sortAscending !== undefined) {
            // expects boolean-ish
            params.set('sortAscending', String(Boolean(filters.sortAscending)));
        }

        // qKeywords precedence: qKeywords > keywords > (company if useCompanyAsKeywords true)
        if (isDefined(filters.qKeywords)) {
            params.set('qKeywords', String(filters.qKeywords).trim());
        } else if (isDefined(filters.keywords)) {
            params.set('qKeywords', String(filters.keywords).trim());
        } else if (isDefined(filters.company) && filters.useCompanyAsKeywords !== false) {
            // By default we allow company to be used as keywords unless explicitly disabled
            params.set('qKeywords', String(filters.company).trim());
        }

        // q_organization_keyword_tags[]: combine keywords and industry as tags (split keywords by comma)
        const orgTagParts = [];
        if (isDefined(filters.keywords)) {
            normalizeToArray(filters.keywords).forEach(k => orgTagParts.push(k));
        }
        if (isDefined(filters.industry)) {
            normalizeToArray(filters.industry).forEach(i => orgTagParts.push(i));
        }
        if (orgTagParts.length > 0) {
            appendArrayParam(params, 'q_organization_keyword_tags[]', orgTagParts);
        }

        // marketSegments -> marketSegments[] (each segment as separate param)
        const marketSegments = normalizeToArray(filters.marketSegments);
        if (marketSegments.length > 0) {
            appendArrayParam(params, 'marketSegments[]', marketSegments);
        }

        // Keep legacy/company specific param: always set organizationName if provided
        // (user can disable with skipOrganizationName = true)
        if (isDefined(filters.company) && filters.skipOrganizationName !== true) {
            params.set('organizationName', String(filters.company).trim());
        }

        // Revenue
        if (isDefined(filters.minRevenue)) params.set('organizationAnnualRevenueMin', String(filters.minRevenue).trim());
        if (isDefined(filters.maxRevenue)) params.set('organizationAnnualRevenueMax', String(filters.maxRevenue).trim());

        // Results per page (pageSize)
        if (isDefined(filters.results)) params.set('pageSize', String(filters.results).trim());

        // Any other custom raw params forwarded (optional)
        // if filters.extraParams is an object we append its keys
        if (filters.extraParams && typeof filters.extraParams === 'object') {
            Object.keys(filters.extraParams).forEach(k => {
                const v = filters.extraParams[k];
                if (Array.isArray(v)) {
                    appendArrayParam(params, k, v);
                } else if (isDefined(v)) {
                    params.set(k, String(v).trim());
                }
            });
        }

        const query = params.toString();
        // Build final: note that for hash-based SPA we want the query inside the fragment (#/people?...)
        return query ? `${base}?${query}` : base;
    };
})();
