const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Simple CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

// Health
app.get('/health', (req, res) => res.send({ status: 'ok' }));

// Mock search endpoint: expects { url, filters }
app.post('/api/search', async (req, res) => {
  const { url, filters } = req.body;

  // Basic validation
  if (!url) {
    return res.status(400).send({ error: 'Missing url' });
  }

  // NOTE: This mock does NOT scrape Apollo.io. It returns fake leads for testing.
  // In production replace this with integration to official API or an authorized scraping service.

  const fakeLeads = [];
  for (let i = 1; i <= 10; i++) {
    fakeLeads.push({
      first_name: `Nome${i}`,
      last_name: `Cognome${i}`,
      organization_name: `Azienda ${i}`,
      email: `nome${i}@azienda${i}.com`,
      headline: filters && filters.titles && filters.titles[0] ? filters.titles[0] : 'Manager',
      linkedin_url: `https://linkedin.com/in/nome${i}`,
      industry: filters && filters.industry ? filters.industry : 'IT',
      organization_website_url: `https://azienda${i}.com`,
      organization_linkedin_url: `https://linkedin.com/company/azienda${i}`,
      estimated_num_employees: (filters && filters.minEmployees) ? filters.minEmployees : 50,
      organization_annual_revenue: 1000000
    });
  }

  // Simulate latency
  setTimeout(() => {
    res.send(fakeLeads);
  }, 800);
});

// Mock send endpoint: expects { leads, client }
app.post('/api/send', (req, res) => {
  const { leads, client } = req.body;
  if (!leads || !Array.isArray(leads)) {
    return res.status(400).send({ error: 'Missing leads' });
  }

  // In production this would enqueue the send, call CRM, etc.
  console.log(`Received ${leads.length} leads to send for client:`, client && client.name);

  res.send({ status: 'queued', count: leads.length });
});

app.listen(PORT, () => {
  console.log(`Mock server listening on port ${PORT}`);
});
