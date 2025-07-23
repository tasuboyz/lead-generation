// Configurazione centralizzata dell'applicazione
const CONFIG = {
    // Endpoints API
    endpoints: {
        fetchLeads: 'https://edinthor.app.n8n.cloud/webhook-test/result',
        sendLeads: 'https://edinthor.app.n8n.cloud/webhook-test/send'
    },
    
    // Lista clienti aziendali
    clients: [
        {
            id: 'client1',
            name: 'Azienda Alpha S.r.l.',
            description: 'Settore tecnologico e consulenza IT',
            active: true
        },
        {
            id: 'client2',
            name: 'Beta Corporation',
            description: 'Servizi digitali e marketing',
            active: true
        },
        {
            id: 'client3',
            name: 'Gamma Industries',
            description: 'Produzione e distribuzione',
            active: true
        }
        // Aggiungi altri clienti qui quando necessario
        // {
        //     id: 'client4',
        //     name: 'Delta Solutions',
        //     description: 'Servizi finanziari',
        //     active: false
        // }
    ],
    
    // Impostazioni UI
    ui: {
        defaultClient: null, // null = nessuna selezione di default
        requireClientSelection: true, // true = obbligatoria la selezione del cliente
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
        noLeadsToSend: 'Nessun lead da inviare',
        noLeadsToDelete: 'Nessun lead selezionato per l\'eliminazione',
        invalidApolloUrl: 'URL Apollo.io non valido',
        fetchError: (error) => `Errore nel recupero leads: ${error}`,
        sendError: (error) => `Errore nell'invio: ${error}`,
        unexpectedError: 'Si è verificato un errore imprevisto'
    }
};

// Esporta la configurazione per l'uso in altri file
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// Rendi disponibile globalmente per il browser
window.CONFIG = CONFIG;
