// Configurazione centralizzata dell'applicazione
const CONFIG = {
    // Endpoints API (calls directly n8n webhooks)
    endpoints: {
        fetchLeads: 'https://edinthor.app.n8n.cloud/webhook/result',
        sendLeads: 'https://edinthor.app.n8n.cloud/webhook/send'
    },

    // Feature flags
    features: {
        companyLookalikes: false,
        aiFilters: false,
        buyingIntent: false,
        emailTracking: false,
        marketSegments: true
    },
    
    // Lista clienti aziendali
    clients: [
        {
            id: 'client1',
            name: 'Queen',
            description: 'Sviluppo software',
            active: true
        },
        {
            id: 'client2',
            name: 'OBLY',
            description: 'Digital Lab & sviluppo software',
            active: true
        },
        {
            id: 'client3',
            name: 'Genhine Way',
            description: 'Blockchain per la tracciabilità e la sostenibilità',
            active: true
        }
        // Aggiungi altri clienti qui quando necessario
    ],
    
    // Impostazioni UI
    ui: {
        defaultClient: null, // null = nessuna selezione di default
        requireClientSelection: true, // true = obbligatoria la selezione del cliente
        enableQueryPreview: true, // true = abilita anteprima query builder
        animations: {
            duration: 300,
            staggerDelay: 50
        }
    },
    
    // Messaggi
    messages: {
        noClientSelected: 'Seleziona un cliente prima di procedere',
        clientRequired: 'La selezione del cliente è obbligatoria',
        fetchSuccess: (count) => `${count} leads recuperati con successo!`,
        sendSuccess: (count, client) => `${count} leads inviati con successo per ${client}!`,
        deleteSuccess: (count) => `${count} lead${count > 1 ? 's' : ''} eliminat${count > 1 ? 'i' : 'o'} con successo`,
        exportSuccess: (count, filename) => `${count} leads esportati in ${filename}`,
        noLeadsToSend: 'Nessun lead da inviare',
        noLeadsToDelete: 'Nessun lead selezionato per l\'eliminazione',
        noLeadsToExport: 'Nessun lead da esportare',
        invalidApolloUrl: 'URL Apollo.io non valido',
        fetchError: (error) => `Errore nel recupero leads: ${error}`,
        sendError: (error) => `Errore nell\'invio: ${error}`,
        exportError: (error) => `Errore nell\'esportazione: ${error}`,
        unexpectedError: 'Si è verificato un errore imprevisto'
    },
    
    // Configurazione Excel export
    excel: {
        filename: 'leads_export',
        sheetName: 'Leads',
        includeTimestamp: true,
        columns: [
            { key: 'first_name', header: 'Nome', width: 15 },
            { key: 'last_name', header: 'Cognome', width: 15 },
            { key: 'organization_name', header: 'Azienda', width: 30 },
            { key: 'email', header: 'Email', width: 25 },
            { key: 'headline', header: 'Ruolo', width: 30 },
            { key: 'organization_website_url', header: 'Sito Web', width: 25 },
            { key: 'organization_phone', header: 'Telefono', width: 15 },
            { key: 'linkedin_url', header: 'LinkedIn Personale', width: 30 },
            { key: 'organization_linkedin_url', header: 'LinkedIn Azienda', width: 30 },
            { key: 'industry', header: 'Settore', width: 20 },
            { key: 'organization_street_address', header: 'Indirizzo', width: 30 },
            { key: 'estimated_num_employees', header: 'Dipendenti', width: 12 },
            { key: 'organization_annual_revenue', header: 'Fatturato', width: 15 },
            { key: 'organization_seo_description', header: 'Descrizione', width: 50 },
            { key: 'keywords', header: 'Keywords', width: 60 }
        ]
    }
};

// Esporta la configurazione per l'uso in altri file (Node)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// Rendi disponibile globalmente per il browser
window.CONFIG = CONFIG;
