import { Amplify, Auth } from "aws-amplify";
import { CognitoUser } from "amazon-cognito-identity-js";
import { createContext } from "react";

export interface User {
  username: string;
  idToken: string | undefined;
  accessToken: string | undefined;
  authorizationHeaders: (type?: string) => {
    "Content-Type": string; // type
    Authorization: string;
  };
}

// Configure our Auth object to use our Cognito User Pool
Amplify.configure({
  Auth: {
    // Amazon Region. We can hard-code this (we always use the us-east-1 region)
    region: "us-east-1",

    // Amazon Cognito User Pool ID
    // userPoolId: "us-east-1_7rLTf9xC8",
    userPoolId: process.env.EXPO_PUBLIC_AWS_COGNITO_POOL_ID,

    // Amazon Cognito App Client ID (26-char alphanumeric string)
    // userPoolWebClientId: "5nlgr8qrqjocvvg9o2sfrqnr5r",
    userPoolWebClientId: process.env.EXPO_PUBLIC_AWS_COGNITO_CLIENT_ID,

    // Hosted UI configuration
    oauth: {
      // Amazon Hosted UI Domain
      domain: process.env.EXPO_PUBLIC_AWS_COGNITO_HOSTED_UI_DOMAIN,

      // These scopes must match what you set in the User Pool for this App Client
      // The default based on what we did above is: email, phone, openid. To see
      // your app's OpenID Connect scopes, go to Amazon Cognito in the AWS Console
      // then: Amazon Cognito > User Pools > {your user pool} > App client > {your client}
      // and look in the "Hosted UI" section under "OpenID Connect Scopes".
      scope: ["email", "phone", "openid", "profile"],

      // NOTE: these must match what you have specified in the Hosted UI
      // app settings for Callback and Redirect URls (e.g., no trailing slash).
      redirectSignIn: process.env.EXPO_PUBLIC_OAUTH_SIGN_IN_REDIRECT_URL,

      redirectSignOut: process.env.EXPO_PUBLIC_OAUTH_SIGN_OUT_REDIRECT_URL,
      // We're using the Acess Code Grant flow (i.e., `code`)
      responseType: "code",
    },
  },
});

/**
 * Get the authenticated user
 * @returns Promise<User>
 */
async function getUser(): Promise<User | null> {
  try {
    // Get the user's info, see:
    // https://docs.amplify.aws/lib/auth/advanced/q/platform/js/#identity-pool-federation
    const currentAuthUser: CognitoUser = await Auth.currentAuthenticatedUser();

    // Get the user's username
    const username = currentAuthUser.getUsername();

    // If that didn't throw, we have a user object, and the user is authenticated
    console.log("The user is authenticated", username);

    // Get the user's Identity Token, which we'll use later with our
    // microservice. See discuttion of various tokens:
    // https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html
    const idToken = currentAuthUser
      .getSignInUserSession()
      ?.getIdToken()
      .getJwtToken();
    const accessToken = currentAuthUser
      .getSignInUserSession()
      ?.getAccessToken()
      .getJwtToken();

    // Return a simplified "user" object
    return {
      username,
      idToken,
      accessToken,
      // Include a simple method to generate headers with our Authorization info
      authorizationHeaders: (type = "application/json") => {
        const headers = {
          "Content-Type": type,
          Authorization: `Bearer ${accessToken}`,
        };
        return headers;
      },
    };
  } catch (err) {
    console.log(err);
    // Unable to get user, return `null` instead
    return null;
  }
}

const AuthContext = createContext<User | null>(null);

export { Auth, getUser, AuthContext };
