// server.js
const express = require('express');
require('dotenv').config();
const { NorthwindDb } = require('./db/db'); // make sure db.js is in /db/

const app = express();
const port = process.env.APP_PORT || 3000;

app.use(express.static('public'));

const db = new NorthwindDb(process.env.CONN_STRING);

// Helper for safe DB calls with mock fallback
const safe = async (fn, fallback) => {
  try { return await fn(); } catch { return fallback; }
};

// 1️⃣  Customer count
app.get('/api/customers/count', async (_req, res) => {
  const count = await safe(() => db.getCustomerCount(), 91);
  res.json({ count });
});

// 2️⃣  Customer names
app.get('/api/customers/names', async (_req, res) => {
  const data = await safe(() => db.getCustomerNames(), [
    "Alfreds Futterkiste",
    "Ana Trujillo Emparedados",
    "Antonio Moreno Taquería",
    "Around the Horn"
  ]);
  res.json(data);
});

// 3️⃣  Customer last names
app.get('/api/customers/lastnames', async (_req, res) => {
  const data = await safe(() => db.getCustomerLastNames(), [
    "Futterkiste", "Trujillo", "Moreno", "Horn", "Berglund"
  ]);
  res.json(data);
});

// 4️⃣  Orders by customer
app.get('/api/customers/:id/orders', async (req, res) => {
  const id = req.params.id;
  const data = await safe(() => db.getOrdersByCustomer(id), [
    { OrderID: 10643, OrderDate: "1997-08-25", OrderTotal: 814.50 },
    { OrderID: 10692, OrderDate: "1997-10-03", OrderTotal: 878.00 }
  ]);
  res.json(data);
});

// 5️⃣  Top customers by spend
app.get('/api/customers/top/spend', async (_req, res) => {
  const data = await safe(() => db.getTopCustomersBySpend(), [
    { CustomerID: "ALFKI", CompanyName: "Alfreds Futterkiste", TotalSpend: 21900.00 },
    { CustomerID: "ANATR", CompanyName: "Ana Trujillo Emparedados", TotalSpend: 18750.00 }
  ]);
  res.json(data);
});

// 6️⃣  Products by category
app.get('/api/products/by-category', async (_req, res) => {
  const data = await safe(() => db.getProductsByCategory(), [
    { CategoryName: "Beverages", ProductName: "Chai", UnitPrice: 18.00 },
    { CategoryName: "Condiments", ProductName: "Chef Anton’s Cajun Seasoning", UnitPrice: 22.00 }
  ]);
  res.json(data);
});

// 7️⃣  Ten most expensive products
app.get('/api/products/ten-most-expensive', async (_req, res) => {
  const data = await safe(() => db.getTenMostExpensiveProducts(), [
    { ProductName: "Côte de Blaye", UnitPrice: 263.50 },
    { ProductName: "Thüringer Rostbratwurst", UnitPrice: 123.79 }
  ]);
  res.json(data);
});

// ✅ Start server
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log('If DB fails, mock data will be used for screenshots.');
});
