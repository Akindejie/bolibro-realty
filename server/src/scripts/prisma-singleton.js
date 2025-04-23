/**
 * Singleton implementation of PrismaClient for use in scripts
 * This ensures only one connection is made across script executions
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Singleton pattern for PrismaClient to prevent multiple instances
const prisma = (() => {
  let instance = null;

  function getInstance() {
    if (!instance) {
      console.log('Initializing new Prisma client for scripts');
      instance = new PrismaClient({
        log: ['error', 'warn'],
      });
    }
    return instance;
  }

  return {
    getInstance,
    disconnect: async () => {
      if (instance) {
        await instance.$disconnect();
        console.log('Prisma client disconnected');
        instance = null;
      }
    },
  };
})();

module.exports = prisma;
