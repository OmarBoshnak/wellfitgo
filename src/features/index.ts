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

// Patient (renamed from clients - doctor-only: patient management)
export * from './patient';

// Doctor (doctor-only: dashboard, appointments)
export * from './doctor';
