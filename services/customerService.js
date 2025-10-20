const { NorthwindDb } = require('../db/db');

class CustomerService {
  constructor(connStr) { this.db = new NorthwindDb(connStr); }

  getCustomerCount() { return this.db.getCustomerCount(); }
  getCustomerNames() { return this.db.getCustomerNames(20); }
  getCustomerLastNames() { return this.db.getCustomerLastNames(20); }
  getOrdersByCustomer(id) { return this.db.getOrdersByCustomer(id); }
  getTopCustomersBySpend() { return this.db.getTopCustomersBySpend(5); }
  getProductsByCategory() { return this.db.getProductsByCategory(); }
  getTenMostExpensiveProducts() { return this.db.getTenMostExpensiveProducts(); }
}

module.exports = { CustomerService };
