'use strict';

Object.defineProperty(exports, "__esModule", { value: true });
exports.getInternals = exports.__headers = exports.__authToken = exports.__authMode = exports.__amplify = exports.GraphQLAuthError = exports.ConnectionState = exports.CONTROL_MSG = void 0;
var PubSub_1 = require("./PubSub");
Object.defineProperty(exports, "CONTROL_MSG", { enumerable: true, get: function () { return PubSub_1.CONTROL_MSG; } });
Object.defineProperty(exports, "ConnectionState", { enumerable: true, get: function () { return PubSub_1.ConnectionState; } });
(function (GraphQLAuthError) {
    GraphQLAuthError["NO_API_KEY"] = "No api-key configured";
    GraphQLAuthError["NO_CURRENT_USER"] = "No current user";
    GraphQLAuthError["NO_CREDENTIALS"] = "No credentials";
    GraphQLAuthError["NO_FEDERATED_JWT"] = "No federated jwt";
    GraphQLAuthError["NO_AUTH_TOKEN"] = "No auth token specified";
})(exports.GraphQLAuthError || (exports.GraphQLAuthError = {}));
exports.__amplify = Symbol('amplify');
exports.__authMode = Symbol('authMode');
exports.__authToken = Symbol('authToken');
exports.__headers = Symbol('headers');
function getInternals(client) {
    const c = client;
    return {
        amplify: c[exports.__amplify],
        authMode: c[exports.__authMode],
        authToken: c[exports.__authToken],
        headers: c[exports.__headers],
    };
}
exports.getInternals = getInternals;
//# sourceMappingURL=index.js.map
