require('dotenv').config();
const express = require('express');
const path = require('path');
const { CustomerService } = require('./services/customerService');

const app = express();
const svc = new CustomerService();
const PORT = Number(process.env.APP_PORT || 3000);

// Static GUI
app.use(express.static(path.join(__dirname, 'public')));

// API routes (GUI calls these)
app.get('/api/customers/count', async (req, res) => {
  try {
    const count = await svc.getCustomerCount();
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load customer count.' });
  }
});

app.get('/api/customers/names', async (req, res) => {
  try {
    const names = await svc.getCustomerNames();
    res.json(names);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load customer names.' });
  }
});

app.get('/api/customers/lastnames', async (req, res) => {
  try {
    const names = await svc.getCustomerLastNames();
    res.json(names);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load customer last names.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ App listening on http://localhost:${PORT}`);
});
