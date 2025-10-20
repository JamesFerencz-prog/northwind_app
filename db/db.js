const sql = require('mssql');

class NorthwindDb {
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.poolPromise = null;
  }

  async #pool() {
    if (!this.poolPromise) {
      this.poolPromise = new sql.ConnectionPool(this.connectionString).connect();
    }
    return this.poolPromise;
  }

  async getCustomerCount() {
    const r = await (await this.#pool()).request()
      .query('SELECT COUNT(*) AS cnt FROM dbo.Customers;');
    return r.recordset[0].cnt;
  }

  async getCustomerNames(limit = 20) {
    const r = await (await this.#pool()).request()
      .input('n', sql.Int, limit)
      .query(`
        SELECT TOP (@n) LTRIM(RTRIM(ContactName)) AS FullName
        FROM dbo.Customers
        WHERE ContactName IS NOT NULL AND LTRIM(RTRIM(ContactName)) <> ''
        ORDER BY ContactName;
      `);
    return r.recordset.map(x => x.FullName);
  }

  async getCustomerLastNames(limit = 20) {
    const r = await (await this.#pool()).request()
      .input('n', sql.Int, limit)
      .query(`
        SELECT TOP (@n)
          CASE WHEN CHARINDEX(' ', LTRIM(RTRIM(ContactName))) > 0
               THEN RIGHT(LTRIM(RTRIM(ContactName)),
                          LEN(LTRIM(RTRIM(ContactName))) - CHARINDEX(' ', LTRIM(RTRIM(ContactName))))
               ELSE LTRIM(RTRIM(ContactName)) END AS LastName
        FROM dbo.Customers
        WHERE ContactName IS NOT NULL AND LTRIM(RTRIM(ContactName)) <> ''
        ORDER BY LastName;
      `);
    return r.recordset.map(x => x.LastName);
  }

  async getOrdersByCustomer(customerId) {
    const q = `
      SELECT o.OrderID, CONVERT(date, o.OrderDate) AS OrderDate,
             ROUND(SUM(od.UnitPrice*od.Quantity*(1.0-od.Discount)),2) AS OrderTotal
      FROM dbo.Orders o
      JOIN dbo.[Order Details] od ON od.OrderID = o.OrderID
      WHERE o.CustomerID = @cid
      GROUP BY o.OrderID, o.OrderDate
      ORDER BY o.OrderDate;
    `;
    const r = await (await this.#pool()).request()
      .input('cid', sql.NVarChar(5), customerId)
      .query(q);
    return r.recordset;
  }

  async getTopCustomersBySpend(limit = 5) {
    const q = `
      SELECT TOP (@n) c.CustomerID, c.CompanyName,
             ROUND(SUM(od.UnitPrice*od.Quantity*(1.0-od.Discount)),2) AS TotalSpend
      FROM dbo.Customers c
      JOIN dbo.Orders o ON o.CustomerID = c.CustomerID
      JOIN dbo.[Order Details] od ON od.OrderID = o.OrderID
      GROUP BY c.CustomerID, c.CompanyName
      ORDER BY TotalSpend DESC;
    `;
    const r = await (await this.#pool()).request()
      .input('n', sql.Int, limit)
      .query(q);
    return r.recordset;
  }

  async getProductsByCategory() {
    const q = `
      SELECT cat.CategoryName, p.ProductName, CAST(p.UnitPrice AS DECIMAL(10,2)) AS UnitPrice
      FROM dbo.Categories cat
      JOIN dbo.Products p ON p.CategoryID = cat.CategoryID
      ORDER BY cat.CategoryName, p.ProductName;
    `;
    const r = await (await this.#pool()).request().query(q);
    return r.recordset;
  }

  async getTenMostExpensiveProducts() {
    try {
      const r = await (await this.#pool()).request().execute('dbo.[Ten Most Expensive Products]');
      return r.recordset;
    } catch {
      const r = await (await this.#pool()).request().query(`
        SELECT TOP 10 ProductName, UnitPrice
        FROM dbo.Products
        ORDER BY UnitPrice DESC;
      `);
      return r.recordset;
    }
  }
}

module.exports = { NorthwindDb };
