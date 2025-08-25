Albero del progetto proposto

root (lead-generation)
├─ index.html                       # UI principale
├─ styles.css                       # Stili globali
├─ script.js                        # Orchestratore UI (da refactor)
├─ config.js                        # Configurazioni e feature flags
├─ PROPOSTA_CHECKLIST.md            # Proposta e checklist (questo file)
├─ PROJECT_TREE.md                  # Mappa del progetto (questo file)
├─ src/                             # Nuovi moduli (da creare)
│  ├─ urlBuilder.js                 # Costruisce URL Apollo da filtri
│  ├─ apiClient.js                  # Chiamate al backend (/api/search, /api/send)
│  ├─ tableRenderer.js              # Funzioni per render tabella e righe
│  └─ exporter.js                   # Funzioni per esportazione Excel
├─ server/                          # Backend (opzionale per Pro/SaaS)
│  ├─ index.js                      # Server Express minimo (mock)
│  ├─ routes/                       # Route handlers
│  └─ Dockerfile                    # Docker per deploy
├─ tests/                           # Unit e E2E tests
│  ├─ urlBuilder.test.js
│  └─ api.test.js
├─ README.md                        # Documentazione per vendita e setup
└─ dist/                            # Build output / bundling

Note
- `script.js` verrà ridotto a orchestratore che usa i moduli in `src/`.
- `server/` è opzionale per pacchetto base, ma necessario per Pro/SaaS.
- `README.md` conterrà istruzioni di vendita, setup onboarding e policy legali.
