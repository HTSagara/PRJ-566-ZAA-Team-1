import { AmplifyClassV6 } from '@aws-amplify/core';
import { GraphQLAuthMode } from '@aws-amplify/core/internals/utils';
import { CustomHeaders } from '@aws-amplify/data-schema/runtime';
/**
 * @private
 *
 * The knobs available for configuring `generateClient` internally.
 */
export type ClientGenerationParams = {
    amplify: AmplifyClassV6;
} & CommonPublicClientOptions;
/**
 * Common options that can be used on public `generateClient()` interfaces.
 */
export interface CommonPublicClientOptions {
    authMode?: GraphQLAuthMode;
    authToken?: string;
    headers?: CustomHeaders;
}
