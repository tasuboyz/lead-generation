Proposta di riadattamento per prodotto vendibile

Obiettivo
- Trasformare l'attuale tool in un prodotto vendibile: pacchetto base generico + opzioni a pagamento per personalizzazioni.

Sintesi delle modifiche principali
1) Modularizzazione
- Separare logica (fetch, export, url builder) dalla UI. Creare moduli in `src/`.
- Ridurre `script.js` a orchestratore.

2) Query Builder (sostituisce l'input URL)
- Rimpiazzare l'input libero `#apolloUrl` con un pannello di filtri (titoli, industry, località, dimensione aziendale, keywords, solo con email/linkedin, numero risultati).
- Implementare `src/urlBuilder.js` che costruisce l'URL Apollo in modo robusto usando URLSearchParams.
- Mostrare anteprima URL (opzionale/disattivabile).

3) Backend (nascondere logica sensibile)
- Aggiungere un backend Node/Express con endpoint `/api/search` e `/api/send`.
- Motivazione: nascondere API-key, centralizzare logging, rate-limiting, billing.
- Attenzione legale: verificare ToS di Apollo; preferire integrazione ufficiale o richiesta di consenso.

4) Feature flags e packaging commerciale
- Aggiungere `config.js` con feature flags per abilitarne/disabilitarne l'uso commerciale.
- Pacchetti: Base (on‑prem, esportazione), Pro (backend, presets, integrazioni), Enterprise (CRM/SSO/SLA).

5) UX/Branding
- Branding parametric in `config.js`.
- Onboarding wizard e demo mode per trial.

6) Sicurezza e conformità
- GDPR: checkbox consenso, data retention policy, logging minimo.
- Audit e cifratura lato backend.

MVP (Checklist tecnica minima)
- [ ] Creare `src/urlBuilder.js` con funzioni testate per creare URL Apollo.
- [ ] Sostituire input `#apolloUrl` con Query Builder UI in `index.html` + aggiornare `script.js` per usare `buildApolloUrl()`.
- [ ] Aggiungere endpoint mock `server/index.js` con POST `/api/search` e documentare come sostituirlo con implementation reale.
- [ ] Aggiungere preview URL e validazione client-side.
- [ ] Aggiungere feature flags in `config.js` per abilitare/disabilitare preview e altre funzioni.
- [ ] Documentazione: README con setup, vendita e policy legali.

Sprint raccomandati
- Sprint 1 (1 settimana): refactor JS + Query Builder UI + unit test urlBuilder.
- Sprint 2 (1 settimana): backend mock + integrazione fetch via backend + privacy/consenso.
- Sprint 3 (2-4 settimane): auth, logging, packaging, integrazioni CRM e SSO.

Stime economiche indicative
- Pacchetto base: €500–1.500 (one‑time)
- Pacchetto Pro: €2.500–7.000 + subscription mensile €50–300
- Personalizzazioni: da €1.000 in su (fix o tariffa oraria)

Rischi
- Possibili violazioni ToS di Apollo se si fa scraping; preferire integrazione ufficiale.
- Necessità di policy privacy e clausole contrattuali per uso dati.

Prossimi passi consigliati
1) Implemento subito `src/urlBuilder.js` e sostituisco il campo URL con un pannello base di filtri (bozza UI).
2) Aggiungo mock backend `/api/search` per testare flusso.

Se vuoi procedo subito con (1) o (2).
