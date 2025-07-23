// Global variables
let leadsData = [];
let filteredLeads = [];
let selectedClient = null;

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
const sendBtn = document.getElementById('sendBtn');
const messageContainer = document.getElementById('messageContainer');
const clientsGrid = document.getElementById('clientsGrid');
const selectedClientInfo = document.getElementById('selectedClientInfo');
const selectedClientName = document.getElementById('selectedClientName');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeClients();
    addWowEffects();
});

// Event listeners
function initializeEventListeners() {
    fetchBtn.addEventListener('click', handleFetchLeads);
    apolloUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleFetchLeads();
        }
    });
    
    selectAllCheckbox.addEventListener('change', handleSelectAll);
    selectAllBtn.addEventListener('click', () => toggleAllCheckboxes(true));
    deselectAllBtn.addEventListener('click', () => toggleAllCheckboxes(false));
    deleteSelectedBtn.addEventListener('click', handleDeleteSelected);
    sendBtn.addEventListener('click', handleSendResults);
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
    const apolloUrl = apolloUrlInput.value.trim();
    
    if (!apolloUrl) {
        showMessage('Inserisci un URL Apollo.io valido', 'error');
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
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apolloUrl)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Nessun lead trovato per questo URL');
        }
        
        leadsData = data;
        filteredLeads = [...data];
        
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

// Display results in table
function displayResults() {
    if (filteredLeads.length === 0) {
        leadsTableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    Nessun lead da visualizzare
                </td>
            </tr>
        `;
        resultsSection.style.display = 'block';
        return;
    }
    
    leadsTableBody.innerHTML = '';
    
    filteredLeads.forEach((lead, index) => {
        const row = createLeadRow(lead, index);
        leadsTableBody.appendChild(row);
    });
    
    resultsSection.style.display = 'block';
    updateSelectAllState();
    
    // Add stagger animation to rows
    const rows = leadsTableBody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        row.style.animationDelay = `${index * 0.05}s`;
        row.classList.add('fade-in-row');
    });
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
