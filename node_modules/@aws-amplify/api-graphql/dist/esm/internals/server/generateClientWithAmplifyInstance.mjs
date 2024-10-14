import { addSchemaToClientWithInstance } from '@aws-amplify/data-schema/runtime';
import { __amplify, __authMode, __authToken, __headers, getInternals } from '../../types/index.mjs';
import { isApiGraphQLConfig } from '../utils/runtimeTypeGuards/isApiGraphQLProviderConfig.mjs';
import '../InternalGraphQLAPI.mjs';
import { graphql, cancel, isCancelError } from '../v6.mjs';
import '../generateClient.mjs';

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
/**
 * @private
 *
 * Used internally by `adapter-nextjs` package.
 *
 * Creates a client that can be used to make GraphQL requests, using a provided `AmplifyClassV6`
 * compatible context object for config and auth fetching.
 *
 * @param params
 * @returns
 */
function generateClientWithAmplifyInstance(params) {
    const client = {
        [__amplify]: params.amplify,
        [__authMode]: params.authMode,
        [__authToken]: params.authToken,
        [__headers]: params.headers,
        graphql,
        cancel,
        isCancelError,
    };
    const apiGraphqlConfig = params.config?.API?.GraphQL;
    if (isApiGraphQLConfig(apiGraphqlConfig)) {
        addSchemaToClientWithInstance(client, params, getInternals);
    }
    return client;
}

export { generateClientWithAmplifyInstance };
//# sourceMappingURL=generateClientWithAmplifyInstance.mjs.map
