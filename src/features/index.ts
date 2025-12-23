// Features - domain-driven modules
// Export all features from here for convenient imports

// Auth
export * from './auth';

// Messaging (shared between client and doctor)
export * from './messaging';

// Meals (meal plans management)
export * from './meals';

// Tracking (client-only: weight, water)
export * from './tracking';

// Clients (doctor-only: client management)
export * from './clients';
