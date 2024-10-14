import { CommonPublicClientOptions, V6Client } from '@aws-amplify/api-graphql';
/**
 * Generates an API client that can work with models or raw GraphQL
 *
 * @returns {@link V6Client}
 * @throws {@link Error} - Throws error when client cannot be generated due to configuration issues.
 */
export declare function generateClient<T extends Record<any, any> = never>(options?: CommonPublicClientOptions): V6Client<T>;
