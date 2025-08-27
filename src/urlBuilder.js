// Simple Apollo URL builder exposed on window.buildApolloUrl(filters)
// filters: {
//   titles: array of strings,
//   industry: string,
//   location: string,
//   company: string,
//   marketSegments: array of strings,
//   minEmployees, maxEmployees,
//   minRevenue, maxRevenue,
//   hasEmail, hasLinkedIn, keywords, qKeywords, page, sortByField, sortAscending, results
// }
(function() {
    function appendArrayParam(params, key, arr) {
        if (!arr || !Array.isArray(arr)) return;
        arr.forEach(v => {
            const val = String(v).trim();
            if (val) params.append(key, val);
        });
    }

    window.buildApolloUrl = function(filters = {}) {
        const base = 'https://app.apollo.io/#/people';
        const params = new URLSearchParams();

        // Titles -> personTitles[]
        if (filters.titles) {
            const titlesArray = Array.isArray(filters.titles) ? filters.titles : String(filters.titles).split(',');
            appendArrayParam(params, 'personTitles[]', titlesArray.map(t => t.trim()).filter(Boolean));
        }

        // Industry -> personIndustries[]
        if (filters.industry) {
            appendArrayParam(params, 'personIndustries[]', [filters.industry]);
        }

        // Market segments -> also map to personIndustries[] as fallback
        if (filters.marketSegments && filters.marketSegments.length) {
            appendArrayParam(params, 'personIndustries[]', filters.marketSegments);
        }

        // Location -> personLocations[]
        if (filters.location) {
            appendArrayParam(params, 'personLocations[]', [filters.location]);
        }

        // Email / LinkedIn preference
        if (filters.hasEmail === true) params.set('hasEmail', 'true');
        if (filters.hasEmail === false) params.set('hasEmail', 'false');
        if (filters.hasLinkedIn === true) params.set('hasLinkedIn', 'true');
        if (filters.hasLinkedIn === false) params.set('hasLinkedIn', 'false');

        // Employees range -> organizationNumEmployeesRanges[]=min,max
        const minE = (filters.minEmployees !== undefined && filters.minEmployees !== '') ? String(filters.minEmployees) : null;
        const maxE = (filters.maxEmployees !== undefined && filters.maxEmployees !== '') ? String(filters.maxEmployees) : null;
        if (minE && maxE) {
            params.append('organizationNumEmployeesRanges[]', `${minE},${maxE}`);
        }

        // Support multiple employee ranges passed as filters.employeeRanges = [{min, max}, ...]
        if (filters.employeeRanges && Array.isArray(filters.employeeRanges)) {
            filters.employeeRanges.forEach(range => {
                const rMin = range && range.min ? String(range.min) : null;
                const rMax = range && range.max ? String(range.max) : null;
                if (rMin && rMax) {
                    params.append('organizationNumEmployeesRanges[]', `${rMin},${rMax}`);
                }
            });
        }

        // Page and sorting defaults
        const page = (filters.page !== undefined && filters.page !== null) ? String(filters.page) : '1';
        params.set('page', page);

        const sortBy = (filters.sortByField !== undefined && filters.sortByField !== null) ? String(filters.sortByField) : '[none]';
        params.set('sortByField', sortBy);

        const sortAsc = (filters.sortAscending === true) ? 'true' : 'false';
        params.set('sortAscending', sortAsc);

        // qKeywords takes precedence (explicit advanced search); fall back to keywords or company
        if (filters.qKeywords) {
            params.set('qKeywords', String(filters.qKeywords));
        } else if (filters.keywords) {
            params.set('qKeywords', String(filters.keywords));
        } else if (filters.company) {
            // If user provided company name and no qKeywords/keywords, use it as qKeywords
            params.set('qKeywords', String(filters.company));
        }

        // q_organization_keyword_tags[]: combine keywords and industry as an array of tags
        // Split keywords by comma and append each as a separate array entry (snake_case key required)
        const orgTagParts = [];
        if (filters.keywords) {
            const raw = String(filters.keywords);
            raw.split(',').map(s => s.trim()).filter(Boolean).forEach(k => orgTagParts.push(k));
        }
        if (filters.industry) {
            const i = String(filters.industry).trim();
            if (i) orgTagParts.push(i);
        }
        if (orgTagParts.length > 0) {
            orgTagParts.forEach(tag => {
                params.append('q_organization_keyword_tags[]', tag);
            });
        }

        // Keep legacy/company specific params if needed
        if (filters.company && !params.has('qKeywords')) {
            params.set('organizationName', String(filters.company));
        }

        // Revenue (kept as optional additional params)
        if (filters.minRevenue) params.set('organizationAnnualRevenueMin', String(filters.minRevenue));
        if (filters.maxRevenue) params.set('organizationAnnualRevenueMax', String(filters.maxRevenue));

        // Results per page / pageSize (optional)
        if (filters.results) params.set('pageSize', String(filters.results));

        const query = params.toString();
        return query ? `${base}?${query}` : base;
    };
})();
