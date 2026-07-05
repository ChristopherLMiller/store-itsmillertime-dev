import { loadEnv, defineConfig } from '@medusajs/framework/utils';
import {
  resolveEnvironmentApiKey,
  resolveStripeWebhookSecret,
} from './src/utils/ecommerce-environment';

loadEnv(process.env.NODE_ENV || 'development', process.cwd());

/**
 * File storage: default to the local provider, but switch to S3-compatible
 * storage (e.g. Cloudflare R2) when R2_* env vars are present. This keeps local
 * dev working with zero config while letting production serve product images
 * from R2 so they render on the storefront.
 */
const useR2 = Boolean(process.env.R2_BUCKET && process.env.R2_ENDPOINT);

const modules: Record<string, unknown>[] = [
  { resolve: './src/modules/print-catalog' },
  { resolve: './src/modules/prodigi' },
  { resolve: './src/modules/digital-delivery' },
  {
    resolve: '@medusajs/medusa/fulfillment',
    options: {
      providers: [
        // Keep the default manual provider alongside Prodigi.
        {
          resolve: '@medusajs/medusa/fulfillment-manual',
          id: 'manual',
        },
        {
          resolve: './src/modules/prodigi-fulfillment',
          id: 'prodigi',
        },
      ],
    },
  },
  {
    resolve: '@medusajs/medusa/notification',
    options: {
      providers: [
        {
          resolve: './src/modules/resend',
          id: 'resend',
          options: {
            channels: ['email'],
            api_key: process.env.RESEND_API_KEY,
            from: process.env.RESEND_FROM_EMAIL,
          },
        },
      ],
    },
  },
  {
    resolve: '@medusajs/medusa/payment',
    options: {
      providers: [
        {
          resolve: '@medusajs/medusa/payment-stripe',
          id: 'stripe',
          options: {
            apiKey: resolveEnvironmentApiKey('STRIPE'),
            webhookSecret: resolveStripeWebhookSecret(),
            // Auto-capture so digital fulfillment and Prodigi submit work without
            // a manual capture step in admin.
            capture: true,
          },
        },
      ],
    },
  },
];

if (useR2) {
  modules.push({
    resolve: '@medusajs/medusa/file',
    options: {
      providers: [
        {
          resolve: '@medusajs/medusa/file-s3',
          id: 's3',
          options: {
            // Public base URL for files, e.g. https://pub-xxxx.r2.dev or a
            // custom domain mapped to the bucket.
            file_url: process.env.R2_FILE_URL,
            endpoint: process.env.R2_ENDPOINT,
            bucket: process.env.R2_BUCKET,
            region: process.env.R2_REGION || 'auto',
            access_key_id: process.env.R2_ACCESS_KEY_ID,
            secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
            prefix: process.env.R2_PREFIX || '',
            // R2 requires explicit access-key auth (no IAM roles).
            authentication_method: 'access-key',
            additional_client_config: {
              forcePathStyle: true,
            },
          },
        },
      ],
    },
  });
}

module.exports = defineConfig({
  admin: {
    // Default is 1MB in the admin UI; R2 has no practical limit on our side.
    maxUploadFileSize: Infinity,
    storefrontUrl: process.env.STOREFRONT_URL || 'http://localhost:8000',
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  modules,
});
