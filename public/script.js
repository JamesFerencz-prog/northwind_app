const $ = (id) => document.getElementById(id);
const show = (html) => { $("result").innerHTML = html; };
const table = (headers, rows) =>
  `<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead>
     <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

async function getJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    show(`<p class="error">Error: ${err.message}. Is the API running?</p>`);
    throw err;
  }
}

// 1
$("btnCount").onclick = async () => {
  const { count } = await getJSON("/api/customers/count");
  show(`<h3>Total Customers</h3><p><b>${count}</b></p>`);
};

// 2
$("btnNames").onclick = async () => {
  const data = await getJSON("/api/customers/names");
  show(`<h3>Customer Names</h3>${table(["Name"], data.map(n => [n]))}`);
};

// 3
$("btnLastNames").onclick = async () => {
  const data = await getJSON("/api/customers/lastnames");
  show(`<h3>Customer Last Names</h3>${table(["Last Name"], data.map(n => [n]))}`);
};

// 4
$("btnOrders").onclick = async () => {
  const id = prompt("Enter CustomerID (e.g., ALFKI)");
  if (!id) return;
  const data = await getJSON(`/api/customers/${encodeURIComponent(id)}/orders`);
  show(`<h3>Orders for ${id}</h3>${table(["OrderID","OrderDate","OrderTotal"], data.map(r => [r.OrderID, r.OrderDate, r.OrderTotal]))}`);
};

// 5
$("btnTopSpend").onclick = async () => {
  const data = await getJSON("/api/customers/top/spend");
  show(`<h3>Top 5 Customers by Spend</h3>${table(["CustomerID","CompanyName","TotalSpend"], data.map(r => [r.CustomerID, r.CompanyName, r.TotalSpend]))}`);
};

// 6
$("btnByCat").onclick = async () => {
  const data = await getJSON("/api/products/by-category");
  show(`<h3>Products by Category</h3>${table(["Category","Product","UnitPrice"], data.map(r => [r.CategoryName, r.ProductName, r.UnitPrice]))}`);
};

// 7
$("btnExpensive").onclick = async () => {
  const data = await getJSON("/api/products/ten-most-expensive");
  // handle both stored-proc and fallback shapes
  const rows = data.map(r => [r.ProductName ?? r.TenMostExpensiveProducts, r.UnitPrice]);
  show(`<h3>Ten Most Expensive Products</h3>${table(["Product","UnitPrice"], rows)}`);
};
