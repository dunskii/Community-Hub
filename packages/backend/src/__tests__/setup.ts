// Backend test setup

// Set test environment variables
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/communityhub_test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing-DO-NOT-USE-IN-PRODUCTION';
process.env.JWT_ACCESS_TOKEN_EXPIRY = '15m';
process.env.JWT_REFRESH_TOKEN_EXPIRY = '7d';
process.env.JWT_REFRESH_TOKEN_EXPIRY_REMEMBER_ME = '30d';
process.env.BCRYPT_COST_FACTOR = '10'; // Lower cost for faster tests
process.env.NODE_ENV = 'development'; // Changed from 'test' to 'development'
process.env.ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-32-characters!';
process.env.MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || 'test-mapbox-token';
process.env.GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || 'test-google-translate-key';
process.env.GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || 'test-google-oauth-client-id';
process.env.GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || 'test-google-oauth-client-secret';
process.env.MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || 'test-mailgun-api-key';
process.env.MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'test.mailgun.org';
process.env.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'test-twilio-account-sid';
process.env.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'test-twilio-auth-token';
process.env.TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+1234567890';
process.env.TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '+1234567890';
process.env.GOOGLE_BUSINESS_API_KEY = process.env.GOOGLE_BUSINESS_API_KEY || 'test-google-business-api-key';
