const { NorthwindDb, buildConfigFromEnv } = require('../db/db');

class CustomerService {
  constructor() {
    const cfg = buildConfigFromEnv();
    this.db = new NorthwindDb(cfg); // pass connection config into DAL (constructor)
  }

  async getCustomerCount() {
    return this.db.getCustomerCount();
  }

  async getCustomerLastNames() {
    return this.db.getCustomerLastNames();
  }

  async getCustomerNames() {
    return this.db.getCustomerNames();
  }
}

module.exports = { CustomerService };
