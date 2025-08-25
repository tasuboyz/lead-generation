// Global variables
let leadsData = [];
let filteredLeads = [];
let selectedClient = null;
let currentSort = { column: null, direction: null };
let columnFilters = {};
let globalSearchTerm = '';

// DOM elements
const apolloUrlInput = document.getElementById('apolloUrl');
const fetchBtn = document.getElementById('fetchBtn');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const leadsTableBody = document.getElementById('leadsTableBody');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');
const selectAllBtn = document.getElementById('selectAllBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const sendBtn = document.getElementById('sendBtn');
const messageContainer = document.getElementById('messageContainer');
const clientsGrid = document.getElementById('clientsGrid');
const selectedClientInfo = document.getElementById('selectedClientInfo');
const selectedClientName = document.getElementById('selectedClientName');

// New filter elements
const globalSearch = document.getElementById('globalSearch');
const clearSearchBtn = document.getElementById('clearSearch');
const toggleFiltersBtn = document.getElementById('toggleFiltersBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const filterRow = document.getElementById('filterRow');

// New Query Builder elements
const qbTitles = document.getElementById('qbTitles');
const qbIndustry = document.getElementById('qbIndustry');
const qbLocation = document.getElementById('qbLocation');
// employee range checkboxes
const qbEmployeeRanges = document.getElementById('qbEmployeeRanges'); // kept for backward compatibility if present
// We'll also read the checkbox group by class
const qbHasEmail = document.getElementById('qbHasEmail');
const qbHasLinkedIn = document.getElementById('qbHasLinkedIn');
const qbKeywords = document.getElementById('qbKeywords');
const qbCompany = document.getElementById('qbCompany');
const qbMinRevenue = document.getElementById('qbMinRevenue');
const qbMaxRevenue = document.getElementById('qbMaxRevenue');
const qbMarketSegments = document.getElementById('qbMarketSegments');
const previewUrlBtn = document.getElementById('previewUrlBtn');
const qbPreview = document.getElementById('qbPreview');
const qbQKeywords = document.getElementById('qbQKeywords');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeClients();
    addWowEffects();
});

// Event listeners
function initializeEventListeners() {
    fetchBtn.addEventListener('click', handleFetchLeads);
    apolloUrlInput && apolloUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleFetchLeads();
        }
    });

    // Preview URL button
    if (previewUrlBtn) {
        previewUrlBtn.addEventListener('click', function() {
            const filters = readQueryBuilderFilters();
            if (typeof window.buildApolloUrl === 'function') {
                const url = window.buildApolloUrl(filters);
                qbPreview.style.display = 'block';
                qbPreview.textContent = url;
            } else {
                qbPreview.style.display = 'block';
                qbPreview.textContent = 'URL builder non disponibile. Assicurati che src/urlBuilder.js sia caricato.';
                showMessage('URL builder non disponibile', 'error');
            }
        });
    }
    
    selectAllCheckbox.addEventListener('change', handleSelectAll);
    selectAllBtn.addEventListener('click', () => toggleAllCheckboxes(true));
    deselectAllBtn.addEventListener('click', () => toggleAllCheckboxes(false));
    deleteSelectedBtn.addEventListener('click', handleDeleteSelected);
    exportExcelBtn.addEventListener('click', handleExportExcel);
    sendBtn.addEventListener('click', handleSendResults);
    
    // Filter and search event listeners
    globalSearch.addEventListener('input', debounce(handleGlobalSearch, 300));
    clearSearchBtn.addEventListener('click', clearGlobalSearch);
    toggleFiltersBtn.addEventListener('click', toggleFilters);
    clearFiltersBtn.addEventListener('click', clearAllFilters);
}

// Initialize clients from config
function initializeClients() {
    const activeClients = CONFIG.clients.filter(client => client.active);
    
    clientsGrid.innerHTML = '';
    
    activeClients.forEach((client, index) => {
        const clientCard = createClientCard(client, index);
        clientsGrid.appendChild(clientCard);
    });
    
    // Set default client if specified
    if (CONFIG.ui.defaultClient) {
        const defaultClient = activeClients.find(c => c.id === CONFIG.ui.defaultClient);
        if (defaultClient) {
            selectClient(defaultClient);
        }
    }
}

// Create client card
function createClientCard(client, index) {
    const card = document.createElement('div');
    card.className = 'client-card';
    card.dataset.clientId = client.id;
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
        <div class="client-card-header">
            <div class="client-name">${escapeHtml(client.name)}</div>
            <i class="fas fa-check-circle client-selected-icon"></i>
        </div>
        <div class="client-description">${escapeHtml(client.description)}</div>
    `;
    
    card.addEventListener('click', () => {
        const clientData = CONFIG.clients.find(c => c.id === client.id);
        selectClient(clientData);
    });
    
    // Add entrance animation
    card.classList.add('fade-in-row');
    
    return card;
}

// Select client
function selectClient(client) {
    // Remove previous selection
    document.querySelectorAll('.client-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selection to clicked card
    const selectedCard = document.querySelector(`[data-client-id="${client.id}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // Update global state
    selectedClient = client;
    
    // Update UI
    selectedClientName.textContent = client.name;
    selectedClientInfo.style.display = 'block';
    
    // Visual feedback
    showMessage(`Cliente selezionato: ${client.name}`, 'info');
}

// Add WOW effects
function addWowEffects() {
    // Parallax effect for background
    document.addEventListener('mousemove', function(e) {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        const bg = document.body;
        bg.style.backgroundPosition = `${mouseX * 20}px ${mouseY * 20}px`;
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements that should animate in
    document.querySelectorAll('.input-section, .results-section').forEach(el => {
        observer.observe(el);
    });
}

// Handle fetch leads
async function handleFetchLeads() {
    // Build URL from filters
    const filters = readQueryBuilderFilters();
    const apolloUrl = (typeof window.buildApolloUrl === 'function') ? window.buildApolloUrl(filters) : (apolloUrlInput ? apolloUrlInput.value.trim() : '');

    if (!apolloUrl) {
        showMessage('Configura i filtri per generare l\'URL Apollo', 'error');
        return;
    }

    if (!isValidApolloUrl(apolloUrl)) {
        showMessage(CONFIG.messages.invalidApolloUrl, 'error');
        return;
    }

    // Check if client is selected (if required)
    if (CONFIG.ui.requireClientSelection && !selectedClient) {
        showMessage(CONFIG.messages.noClientSelected, 'error');
        return;
    }

    try {
        setLoadingState(true);
        showMessage('Recupero leads in corso...', 'info');

        const response = await fetch(CONFIG.endpoints.fetchLeads, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
            body: apolloUrl
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => null);
            throw new Error(`HTTP error! status: ${response.status}${errText ? ' - ' + errText : ''}`);
        }

        // Safely handle empty or invalid JSON responses
        const rawText = await response.text();
        
        // If server returned empty body -> show empty results in the UI (not an exception)
        if (!rawText) {
            leadsData = [];
            filteredLeads = [];
            // Ensure table controls are initialized/cleared
            setTimeout(() => {
                initializeTableControls();
                updateFilterOptions();
            }, 50);
            displayResults();
            showMessage('Nessun lead trovato per questi filtri', 'info');
            return;
        }

        let data;
        try {
            data = JSON.parse(rawText);
        } catch (err) {
            // Invalid JSON -> treat as server error
            throw new Error(`Invalid JSON response from server: ${err.message}`);
        }

        // If parsed but not an array or empty array -> show empty results UI
        if (!Array.isArray(data) || data.length === 0) {
            leadsData = [];
            filteredLeads = [];
            setTimeout(() => {
                initializeTableControls();
                updateFilterOptions();
            }, 50);
            displayResults();
            showMessage('Nessun lead trovato per questi filtri', 'info');
            return;
        }

        leadsData = data;
        filteredLeads = [...data];

        // Initialize table controls and filters
        setTimeout(() => {
            initializeTableControls();
            updateFilterOptions();
        }, 100);

        displayResults();
        showMessage(CONFIG.messages.fetchSuccess(data.length), 'success');

        // Smooth scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 300);

    } catch (error) {
        console.error('Error fetching leads:', error);
        showMessage(CONFIG.messages.fetchError(error.message), 'error');
    } finally {
        setLoadingState(false);
    }
}

// Validate Apollo URL
function isValidApolloUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname === 'app.apollo.io' && url.includes('#/people');
    } catch (e) {
        return false;
    }
}

// Set loading state
function setLoadingState(isLoading) {
    fetchBtn.disabled = isLoading;
    
    if (isLoading) {
        fetchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Caricamento...</span>';
        loadingSection.style.display = 'block';
        resultsSection.style.display = 'none';
    } else {
        fetchBtn.innerHTML = '<i class="fas fa-search"></i><span>Cerca Leads</span>';
        loadingSection.style.display = 'none';
    }
}

// ====== FILTERING AND SORTING FUNCTIONS ======

// Handle global search
function handleGlobalSearch(e) {
    globalSearchTerm = e.target.value.toLowerCase().trim();
    clearSearchBtn.style.display = globalSearchTerm ? 'block' : 'none';
    applyFiltersAndSort();
}

// Clear global search
function clearGlobalSearch() {
    globalSearch.value = '';
    globalSearchTerm = '';
    clearSearchBtn.style.display = 'none';
    applyFiltersAndSort();
}

// Toggle filter row visibility
function toggleFilters() {
    const isVisible = filterRow.style.display !== 'none';
    filterRow.style.display = isVisible ? 'none' : 'table-row';
    
    const btn = toggleFiltersBtn;
    const span = btn.querySelector('span');
    const icon = btn.querySelector('i');
    
    if (isVisible) {
        span.textContent = 'Mostra Filtri';
        icon.className = 'fas fa-sliders-h';
        btn.classList.remove('active');
    } else {
        span.textContent = 'Nascondi Filtri';
        icon.className = 'fas fa-eye-slash';
        btn.classList.add('active');
    }
}

// Clear all filters
function clearAllFilters() {
    // Clear global search
    clearGlobalSearch();
    
    // Clear column filters
    columnFilters = {};
    document.querySelectorAll('.column-filter').forEach(filter => {
        filter.value = '';
        filter.classList.remove('active');
    });
    
    // Clear range filters
    document.querySelectorAll('.range-input').forEach(input => {
        input.value = '';
        input.classList.remove('active');
    });
    
    // Clear sort
    currentSort = { column: null, direction: null };
    document.querySelectorAll('.sortable-header').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });
    
    applyFiltersAndSort();
    showMessage('Tutti i filtri sono stati cancellati', 'info');
}

// Initialize sorting and filtering for table
function initializeTableControls() {
    // Add click event to sortable headers
    document.querySelectorAll('.sortable-header').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.column;
            handleSort(column);
        });
    });
    
    // Add change events to column filters
    document.querySelectorAll('.column-filter').forEach(filter => {
        filter.addEventListener('change', (e) => {
            const column = e.target.dataset.column;
            const value = e.target.value;
            
            if (value === '') {
                delete columnFilters[column];
                e.target.classList.remove('active');
            } else {
                columnFilters[column] = value;
                e.target.classList.add('active');
            }
            
            applyFiltersAndSort();
        });
    });
    
    // Add change events to range filters
    document.querySelectorAll('.range-input').forEach(input => {
        input.addEventListener('input', debounce((e) => {
            const column = e.target.dataset.column;
            const type = e.target.dataset.type; // 'min' or 'max'
            const value = e.target.value;
            
            if (!columnFilters[column]) {
                columnFilters[column] = {};
            }
            
            if (value === '') {
                delete columnFilters[column][type];
                e.target.classList.remove('active');
                
                // If both min and max are empty, remove the column filter entirely
                if (Object.keys(columnFilters[column]).length === 0) {
                    delete columnFilters[column];
                }
            } else {
                columnFilters[column][type] = parseFloat(value);
                e.target.classList.add('active');
            }
            
            applyFiltersAndSort();
        }, 500));
    });
}

// Handle sorting
function handleSort(column) {
    if (currentSort.column === column) {
        // Toggle sort direction
        if (currentSort.direction === 'asc') {
            currentSort.direction = 'desc';
        } else if (currentSort.direction === 'desc') {
            currentSort = { column: null, direction: null };
        } else {
            currentSort.direction = 'asc';
        }
    } else {
        currentSort = { column, direction: 'asc' };
    }
    
    // Update UI
    updateSortUI();
    
    // Apply sorting
    applyFiltersAndSort();
}

// Update sort UI indicators
function updateSortUI() {
    document.querySelectorAll('.sortable-header').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        
        if (header.dataset.column === currentSort.column) {
            if (currentSort.direction === 'asc') {
                header.classList.add('sort-asc');
            } else if (currentSort.direction === 'desc') {
                header.classList.add('sort-desc');
            }
        }
    });
}

// Apply all filters and sorting
function applyFiltersAndSort() {
    if (!leadsData || leadsData.length === 0) return;
    
    // Start with all data
    let result = [...leadsData];
    
    // Apply global search
    if (globalSearchTerm) {
        result = result.filter(lead => {
            const searchableText = [
                lead.first_name,
                lead.last_name,
                lead.organization_name,
                lead.email,
                lead.headline,
                lead.industry,
                lead.organization_website_url
            ].join(' ').toLowerCase();
            
            return searchableText.includes(globalSearchTerm);
        });
    }
    
    // Apply column filters
    Object.keys(columnFilters).forEach(column => {
        const filterValue = columnFilters[column];
        
        if (typeof filterValue === 'string') {
            // Dropdown filter
            result = result.filter(lead => {
                const cellValue = (lead[column] || '').toString().toLowerCase();
                
                // Special cases for LinkedIn filter
                if (column === 'linkedin_url') {
                    if (filterValue === 'has_linkedin') {
                        return lead.linkedin_url && lead.linkedin_url !== 'N/A';
                    } else if (filterValue === 'no_linkedin') {
                        return !lead.linkedin_url || lead.linkedin_url === 'N/A';
                    }
                }
                
                return cellValue.includes(filterValue.toLowerCase());
            });
        } else if (typeof filterValue === 'object') {
            // Range filter
            result = result.filter(lead => {
                const cellValue = parseFloat(lead[column]) || 0;
                const min = filterValue.min;
                const max = filterValue.max;
                
                let passes = true;
                if (min !== undefined && cellValue < min) passes = false;
                if (max !== undefined && cellValue > max) passes = false;
                
                return passes;
            });
        }
    });
    
    // Apply sorting
    if (currentSort.column && currentSort.direction) {
        result.sort((a, b) => {
            const aVal = a[currentSort.column] || '';
            const bVal = b[currentSort.column] || '';
            
            // Check if values are numeric
            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);
            
            let comparison = 0;
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                // Numeric comparison
                comparison = aNum - bNum;
            } else {
                // String comparison
                comparison = aVal.toString().localeCompare(bVal.toString(), 'it', { 
                    numeric: true, 
                    caseFirst: 'lower' 
                });
            }
            
            return currentSort.direction === 'asc' ? comparison : -comparison;
        });
    }
    
    // Update filtered data
    filteredLeads = result;
    
    // Re-render table
    displayResults();
    
    // Update filter options
    updateFilterOptions();
}

// Update filter dropdown options based on current data
function updateFilterOptions() {
    const columns = ['first_name', 'last_name', 'organization_name', 'email', 'headline', 'industry'];
    
    columns.forEach(column => {
        const filter = document.querySelector(`.column-filter[data-column="${column}"]`);
        if (!filter) return;
        
        // Get unique values for this column
        const uniqueValues = [...new Set(
            leadsData
                .map(lead => lead[column])
                .filter(value => value && value !== 'N/A')
                .map(value => value.toString().trim())
        )].sort();
        
        // Save current value
        const currentValue = filter.value;
        
        // Clear options except "Tutti"
        filter.innerHTML = '<option value="">Tutti</option>';
        
        // Add unique values as options
        uniqueValues.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            filter.appendChild(option);
        });
        
        // Restore current value if it still exists
        if (currentValue && uniqueValues.includes(currentValue)) {
            filter.value = currentValue;
        }
    });
}

// Display results in table
function displayResults() {
    const tableContainer = document.querySelector('.table-container');
    
    if (filteredLeads.length === 0) {
        const isFiltered = globalSearchTerm || Object.keys(columnFilters).length > 0;
        const emptyMessage = isFiltered ? 
            'Nessun lead corrisponde ai filtri applicati' : 
            'Nessun lead da visualizzare';
        
        leadsTableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-${isFiltered ? 'filter' : 'inbox'}" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    ${emptyMessage}
                    ${isFiltered ? '<div style="margin-top: 10px;"><button class="filter-btn" onclick="clearAllFilters()">Cancella Filtri</button></div>' : ''}
                </td>
            </tr>
        `;
        resultsSection.style.display = 'block';
        updateResultsHeader();
        return;
    }
    
    leadsTableBody.innerHTML = '';
    
    filteredLeads.forEach((lead, index) => {
        const row = createLeadRow(lead, index);
        leadsTableBody.appendChild(row);
    });
    
    resultsSection.style.display = 'block';
    updateSelectAllState();
    updateResultsHeader();
    
    // Add table update animation
    tableContainer.classList.add('table-updated');
    setTimeout(() => {
        tableContainer.classList.remove('table-updated');
    }, 300);
    
    // Add stagger animation to rows
    const rows = leadsTableBody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        row.style.animationDelay = `${index * 0.02}s`;
        row.classList.add('fade-in-row');
    });
}

// Update results header with count information
function updateResultsHeader() {
    const header = document.querySelector('.results-header h2');
    if (!header) return;
    
    const totalCount = leadsData.length;
    const filteredCount = filteredLeads.length;
    const isFiltered = totalCount !== filteredCount;
    
    const countText = isFiltered ? 
        `Risultati Lead Generation (${filteredCount} di ${totalCount})` :
        `Risultati Lead Generation (${totalCount})`;
    
    header.innerHTML = `
        <i class="fas fa-table"></i>
        ${countText}
    `;
    
    // Add filter indicator
    if (isFiltered) {
        header.style.color = 'var(--accent-primary)';
    } else {
        header.style.color = 'var(--text-primary)';
    }
}

// Create lead row
function createLeadRow(lead, index) {
    const row = document.createElement('tr');
    row.dataset.leadIndex = index;
    
    const formatCurrency = (value) => {
        if (!value) return 'N/A';
        const num = parseInt(value);
        if (isNaN(num)) return 'N/A';
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    };
    
    const formatEmployees = (value) => {
        if (!value) return 'N/A';
        const num = parseInt(value);
        if (isNaN(num)) return 'N/A';
        return new Intl.NumberFormat('it-IT').format(num);
    };
    
    const createLink = (url, text, icon = 'external-link-alt') => {
        if (!url || url === 'N/A') return text || 'N/A';
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">
            <i class="fas fa-${icon}"></i> ${text || url}
        </a>`;
    };
    
    row.innerHTML = `
        <td class="select-column">
            <input type="checkbox" class="lead-checkbox" data-index="${index}">
        </td>
        <td><strong>${escapeHtml(lead.first_name || 'N/A')}</strong></td>
        <td><strong>${escapeHtml(lead.last_name || 'N/A')}</strong></td>
        <td>
            <div style="font-weight: 600;">${escapeHtml(lead.organization_name || 'N/A')}</div>
            ${lead.organization_website_url ? `<div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">${createLink(lead.organization_website_url, 'Sito Web', 'globe')}</div>` : ''}
        </td>
        <td>
            ${lead.email ? createLink(`mailto:${lead.email}`, lead.email, 'envelope') : 'N/A'}
        </td>
        <td>
            <div style="font-weight: 500;">${escapeHtml(lead.headline || 'N/A')}</div>
            ${lead.industry ? `<div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">${escapeHtml(lead.industry)}</div>` : ''}
        </td>
        <td>
            ${lead.linkedin_url ? createLink(lead.linkedin_url, 'Profilo', 'linkedin') : 'N/A'}
            ${lead.organization_linkedin_url ? `<div style="margin-top: 4px;">${createLink(lead.organization_linkedin_url, 'Azienda', 'linkedin')}</div>` : ''}
        </td>
        <td>${escapeHtml(lead.industry || 'N/A')}</td>
        <td>${formatEmployees(lead.estimated_num_employees)}</td>
        <td>${formatCurrency(lead.organization_annual_revenue)}</td>
    `;
    
    // Add event listeners
    const checkbox = row.querySelector('.lead-checkbox');
    checkbox.addEventListener('change', function() {
        row.classList.toggle('selected', this.checked);
        updateSelectAllState();
        updateDeleteButtonState();
    });
    
    return row;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Handle select all
function handleSelectAll() {
    const isChecked = selectAllCheckbox.checked;
    toggleAllCheckboxes(isChecked);
}

// Toggle all checkboxes
function toggleAllCheckboxes(checked) {
    const checkboxes = document.querySelectorAll('.lead-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = checked;
        const row = checkbox.closest('tr');
        row.classList.toggle('selected', checked);
    });
    
    selectAllCheckbox.checked = checked;
    updateDeleteButtonState();
    
    // Visual feedback
    if (checked) {
        showMessage('Tutti i leads selezionati', 'info');
    } else {
        showMessage('Selezione rimossa', 'info');
    }
}

// Update select all state
function updateSelectAllState() {
    const checkboxes = document.querySelectorAll('.lead-checkbox');
    const checkedCheckboxes = document.querySelectorAll('.lead-checkbox:checked');
    
    if (checkboxes.length === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
    } else if (checkedCheckboxes.length === checkboxes.length) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
    } else if (checkedCheckboxes.length > 0) {
        selectAllCheckbox.indeterminate = true;
        selectAllCheckbox.checked = false;
    } else {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
    }
}

// Update delete button state
function updateDeleteButtonState() {
    const checkedCheckboxes = document.querySelectorAll('.lead-checkbox:checked');
    deleteSelectedBtn.disabled = checkedCheckboxes.length === 0;
}

// Handle delete selected
function handleDeleteSelected() {
    const checkedCheckboxes = document.querySelectorAll('.lead-checkbox:checked');
    
    if (checkedCheckboxes.length === 0) {
        showMessage(CONFIG.messages.noLeadsToDelete, 'error');
        return;
    }
    
    // Confirm deletion
    const count = checkedCheckboxes.length;
    if (!confirm(`Sei sicuro di voler eliminare ${count} lead${count > 1 ? 's' : ''}?`)) {
        return;
    }
    
    // Get indices to delete (in reverse order to maintain correct indices)
    const indicesToDelete = Array.from(checkedCheckboxes)
        .map(cb => parseInt(cb.dataset.index))
        .sort((a, b) => b - a);
    
    // Remove from filteredLeads array
    indicesToDelete.forEach(index => {
        filteredLeads.splice(index, 1);
    });
    
    // Re-render table
    displayResults();
    
    showMessage(CONFIG.messages.deleteSuccess(count), 'success');
    
    // Add deletion animation
    const rows = leadsTableBody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        row.style.animationDelay = `${index * 0.02}s`;
        row.classList.add('slide-in-left');
    });
}

// Handle send results
async function handleSendResults() {
    if (filteredLeads.length === 0) {
        showMessage(CONFIG.messages.noLeadsToSend, 'error');
        return;
    }
    
    // Check if client is selected (if required)
    if (CONFIG.ui.requireClientSelection && !selectedClient) {
        showMessage(CONFIG.messages.clientRequired, 'error');
        return;
    }
    
    try {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Invio in corso...</span>';
        
        showMessage('Invio dei leads filtrati in corso...', 'info');
        
        // Prepare data to send including client info
        const dataToSend = {
            leads: filteredLeads,
            client: selectedClient,
            timestamp: new Date().toISOString(),
            totalCount: filteredLeads.length
        };
        
        const response = await fetch(CONFIG.endpoints.sendLeads, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.text();
        
        showMessage(CONFIG.messages.sendSuccess(filteredLeads.length, selectedClient.name), 'success');
        
        // Add success animation
        sendBtn.classList.add('success-pulse');
        setTimeout(() => {
            sendBtn.classList.remove('success-pulse');
        }, 1000);
        
    } catch (error) {
        console.error('Error sending leads:', error);
        showMessage(CONFIG.messages.sendError(error.message), 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i><span>Invia Risultati Filtrati</span>';
    }
}

// Handle Excel export
function handleExportExcel() {
    if (filteredLeads.length === 0) {
        showMessage(CONFIG.messages.noLeadsToExport, 'error');
        return;
    }
    
    try {
        exportExcelBtn.disabled = true;
        exportExcelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Esportazione...</span>';
        
        showMessage('Preparazione file Excel in corso...', 'info');
        
        // Prepare data for Excel export
        const excelData = prepareExcelData();
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData, {
            header: CONFIG.excel.columns.map(col => col.header)
        });
        
        // Set column widths
        const colWidths = CONFIG.excel.columns.map(col => ({ wch: col.width }));
        ws['!cols'] = colWidths;
        
        // Style header row
        const headerRange = XLSX.utils.decode_range(ws['!ref']);
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (ws[cellAddress]) {
                ws[cellAddress].s = {
                    font: { bold: true, color: { rgb: "FFFFFF" } },
                    fill: { fgColor: { rgb: "4F46E5" } },
                    alignment: { horizontal: "center" }
                };
            }
        }
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, CONFIG.excel.sheetName);
        
        // Generate filename
        const timestamp = CONFIG.excel.includeTimestamp ? 
            `_${new Date().toLocaleDateString('it-IT').replace(/\//g, '-')}_${new Date().toLocaleTimeString('it-IT', { hour12: false }).replace(/:/g, '-')}` : 
            '';
        const clientSuffix = selectedClient ? `_${selectedClient.name.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
        const filename = `${CONFIG.excel.filename}${clientSuffix}${timestamp}.xlsx`;
        
        // Save file
        XLSX.writeFile(wb, filename);
        
        showMessage(CONFIG.messages.exportSuccess(filteredLeads.length, filename), 'success');
        
        // Add success animation
        exportExcelBtn.classList.add('success-pulse');
        setTimeout(() => {
            exportExcelBtn.classList.remove('success-pulse');
        }, 1000);
        
    } catch (error) {
        console.error('Error exporting Excel:', error);
        showMessage(CONFIG.messages.exportError(error.message), 'error');
    } finally {
        exportExcelBtn.disabled = false;
        exportExcelBtn.innerHTML = '<i class="fas fa-file-excel"></i><span>Esporta Excel</span>';
    }
}

// Prepare data for Excel export
function prepareExcelData() {
    return filteredLeads.map(lead => {
        const rowData = {};
        
        CONFIG.excel.columns.forEach(col => {
            let value = lead[col.key] || '';
            
            // Format specific fields
            switch (col.key) {
                case 'estimated_num_employees':
                    value = value ? parseInt(value).toLocaleString('it-IT') : '';
                    break;
                case 'organization_annual_revenue':
                    if (value) {
                        const num = parseInt(value);
                        value = !isNaN(num) ? num.toLocaleString('it-IT', {
                            style: 'currency',
                            currency: 'EUR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }) : '';
                    }
                    break;
                case 'keywords':
                    // Limit keywords length for better readability
                    if (value && value.length > 200) {
                        value = value.substring(0, 200) + '...';
                    }
                    break;
                case 'organization_seo_description':
                    // Limit description length
                    if (value && value.length > 300) {
                        value = value.substring(0, 300) + '...';
                    }
                    break;
                default:
                    // Clean HTML and normalize text
                    value = value.toString().replace(/<[^>]*>/g, '').trim();
            }
            
            rowData[col.header] = value;
        });
        
        return rowData;
    });
}

// Show message
function showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 
                 'info-circle';
    
    message.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${text}</span>
    `;
    
    messageContainer.appendChild(message);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        message.style.animation = 'slideOutRight 0.5s ease-out forwards';
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 500);
    }, 5000);
}

// Add CSS animations
const additionalStyles = `
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
    
    @keyframes fadeInRow {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideInLeft {
        from {
            opacity: 0;
            transform: translateX(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .fade-in-row {
        animation: fadeInRow 0.5s ease-out forwards;
    }
    
    .slide-in-left {
        animation: slideInLeft 0.3s ease-out forwards;
    }
    
    .success-pulse {
        animation: successPulse 1s ease-out;
    }
    
    @keyframes successPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); background: var(--gradient-success); }
        100% { transform: scale(1); }
    }
    
    .animate-in {
        animation: slideInUp 0.8s ease-out;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Add error handling for fetch requests
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showMessage(CONFIG.messages.unexpectedError, 'error');
});

// Show filter statistics
function showFilterStats() {
    const totalFilters = Object.keys(columnFilters).length + (globalSearchTerm ? 1 : 0);
    if (totalFilters === 0) return;
    
    let message = `Filtri applicati: ${totalFilters}`;
    
    if (globalSearchTerm) {
        message += ` | Ricerca: "${globalSearchTerm}"`;
    }
    
    if (Object.keys(columnFilters).length > 0) {
        message += ` | Colonne filtrate: ${Object.keys(columnFilters).length}`;
    }
    
    showMessage(message, 'info');
}

// Performance optimization: debounce search if we add real-time filtering later
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Read filters from Query Builder UI
function readQueryBuilderFilters() {
    const titlesRaw = qbTitles ? qbTitles.value : '';
    const titles = titlesRaw ? titlesRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    const marketRaw = qbMarketSegments ? qbMarketSegments.value : '';
    const marketSegments = marketRaw ? marketRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    // Read selected employee range checkboxes (class .qbEmployeeRange)
    let employeeRanges = [];
    document.querySelectorAll('.qbEmployeeRange:checked').forEach(cb => {
        const parts = String(cb.value).split(',').map(p => p.trim());
        if (parts.length === 2 && parts[0] && parts[1]) {
            employeeRanges.push({ min: parseInt(parts[0], 10), max: parseInt(parts[1], 10) });
        }
    });

    return {
        titles,
        industry: qbIndustry ? qbIndustry.value.trim() : '',
        location: qbLocation ? qbLocation.value.trim() : '',
        company: qbCompany ? qbCompany.value.trim() : '',
        marketSegments,
        minRevenue: qbMinRevenue && qbMinRevenue.value ? parseInt(qbMinRevenue.value) : undefined,
        maxRevenue: qbMaxRevenue && qbMaxRevenue.value ? parseInt(qbMaxRevenue.value) : undefined,
        hasEmail: qbHasEmail ? qbHasEmail.checked : undefined,
        hasLinkedIn: qbHasLinkedIn ? qbHasLinkedIn.checked : undefined,
        keywords: qbKeywords ? qbKeywords.value.trim() : '',
        qKeywords: qbQKeywords ? qbQKeywords.value.trim() : '',
        results: undefined,
        employeeRanges,
    };
}
