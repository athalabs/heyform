# OAuth2 Authentication Setup

This document describes how to configure OAuth2 authentication for HeyForm.

## Overview

OAuth2 authentication has been implemented as an optional authentication method. When enabled, OAuth2 becomes the **exclusive** authentication method - all other authentication methods (email/password, Google, and Apple social login) are automatically disabled.

## Features

- **Generic OAuth2 Provider Support**: Works with any OAuth2-compliant provider
- **Flexible Configuration**: Customizable field mappings for user information
- **Exclusive Mode**: When enabled, only OAuth2 authentication is available
- **Auto-provisioning**: New users are automatically created on first login
- **Session Management**: Uses existing HeyForm session management

## Environment Variables

Add these variables to your `.env` file or environment configuration:

### Required Variables

```bash
# Enable OAuth2 authentication (disables all other auth methods)
OAUTH2_ENABLED=true

# OAuth2 provider credentials
OAUTH2_CLIENT_ID=your_client_id
OAUTH2_CLIENT_SECRET=your_client_secret

# OAuth2 provider endpoints
OAUTH2_AUTHORIZATION_URL=https://provider.com/oauth/authorize
OAUTH2_TOKEN_URL=https://provider.com/oauth/token
OAUTH2_USERINFO_URL=https://provider.com/oauth/userinfo
```

### Optional Variables

```bash
# OAuth2 scope (default: "openid profile email")
OAUTH2_SCOPE="openid profile email"

# Callback URL (default: APP_HOMEPAGE_URL/auth/oauth2/callback)
OAUTH2_CALLBACK_URL=https://your-domain.com/auth/oauth2/callback

# User field mappings (customize based on your provider's response)
OAUTH2_USER_ID_FIELD=sub          # Default: 'sub'
OAUTH2_USER_EMAIL_FIELD=email     # Default: 'email'
OAUTH2_USER_NAME_FIELD=name       # Default: 'name'
OAUTH2_USER_AVATAR_FIELD=picture  # Default: 'picture'
```

## Configuration Examples

### Example 1: Keycloak

```bash
OAUTH2_ENABLED=true
OAUTH2_CLIENT_ID=heyform
OAUTH2_CLIENT_SECRET=your_secret_here
OAUTH2_AUTHORIZATION_URL=https://keycloak.example.com/realms/master/protocol/openid-connect/auth
OAUTH2_TOKEN_URL=https://keycloak.example.com/realms/master/protocol/openid-connect/token
OAUTH2_USERINFO_URL=https://keycloak.example.com/realms/master/protocol/openid-connect/userinfo
OAUTH2_SCOPE="openid profile email"
```

### Example 2: Okta

```bash
OAUTH2_ENABLED=true
OAUTH2_CLIENT_ID=your_okta_client_id
OAUTH2_CLIENT_SECRET=your_okta_client_secret
OAUTH2_AUTHORIZATION_URL=https://your-domain.okta.com/oauth2/default/v1/authorize
OAUTH2_TOKEN_URL=https://your-domain.okta.com/oauth2/default/v1/token
OAUTH2_USERINFO_URL=https://your-domain.okta.com/oauth2/default/v1/userinfo
OAUTH2_SCOPE="openid profile email"
```

### Example 3: Auth0

```bash
OAUTH2_ENABLED=true
OAUTH2_CLIENT_ID=your_auth0_client_id
OAUTH2_CLIENT_SECRET=your_auth0_client_secret
OAUTH2_AUTHORIZATION_URL=https://your-tenant.auth0.com/authorize
OAUTH2_TOKEN_URL=https://your-tenant.auth0.com/oauth/token
OAUTH2_USERINFO_URL=https://your-tenant.auth0.com/userinfo
OAUTH2_SCOPE="openid profile email"
```

### Example 4: Azure AD (Microsoft Entra ID)

```bash
OAUTH2_ENABLED=true
OAUTH2_CLIENT_ID=your_azure_client_id
OAUTH2_CLIENT_SECRET=your_azure_client_secret
OAUTH2_AUTHORIZATION_URL=https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize
OAUTH2_TOKEN_URL=https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
OAUTH2_USERINFO_URL=https://graph.microsoft.com/oidc/userinfo
OAUTH2_SCOPE="openid profile email"
```

## Registering Your Application

When registering HeyForm with your OAuth2 provider, you'll need to configure:

1. **Redirect URI / Callback URL**: `https://your-domain.com/auth/oauth2/callback`
2. **Scopes**: At minimum, request `openid`, `profile`, and `email`
3. **Client Type**: Confidential client (server-side application)

## User Field Mapping

Different OAuth2 providers return user information in different formats. Use the field mapping variables to match your provider's response:

If your provider returns user data like:
```json
{
  "id": "12345",
  "email_address": "user@example.com",
  "full_name": "John Doe",
  "profile_picture": "https://example.com/photo.jpg"
}
```

Configure the mappings:
```bash
OAUTH2_USER_ID_FIELD=id
OAUTH2_USER_EMAIL_FIELD=email_address
OAUTH2_USER_NAME_FIELD=full_name
OAUTH2_USER_AVATAR_FIELD=profile_picture
```

## Architecture

### Backend Components

1. **OAuth2 Service** (`packages/server/src/service/oauth2.service.ts`)
   - Handles OAuth2 authorization flow
   - Exchanges authorization code for access token
   - Fetches user information from provider
   - Auto-provisions users

2. **OAuth2 Controller** (`packages/server/src/controller/oauth2.controller.ts`)
   - Route: `GET /auth/oauth2` - Initiates OAuth2 flow
   - Route: `GET /auth/oauth2/callback` - Handles provider callback

3. **Environment Configuration** (`packages/server/src/environments/index.ts`)
   - Loads and validates OAuth2 environment variables

4. **Authentication Guards**
   - Login/SignUp resolvers check `OAUTH2_ENABLED` flag
   - Social login controller blocks requests when OAuth2 is enabled

### Frontend Components

1. **OAuth2Login Component** (`packages/webapp/src/pages/auth/views/OAuth2Login.tsx`)
   - Displays OAuth2 sign-in button
   - Redirects to OAuth2 authorization endpoint

2. **Login/SignUp Pages**
   - Conditionally render OAuth2 login when enabled
   - Hide email/password and social login forms

3. **Environment Configuration** (`packages/webapp/src/consts/environments.ts`)
   - Reads `OAUTH2_ENABLED` flag from server

## Authentication Flow

1. User clicks "Sign in with OAuth2" button
2. Frontend redirects to `/auth/oauth2?state={browserId}`
3. Backend redirects to OAuth2 provider's authorization URL
4. User authenticates with OAuth2 provider
5. Provider redirects to `/auth/oauth2/callback?code={code}&state={state}`
6. Backend exchanges code for access token
7. Backend fetches user info using access token
8. Backend creates/updates user record
9. Backend establishes session
10. User is redirected to dashboard

## Security Considerations

1. **Exclusive Mode**: When OAuth2 is enabled, email/password authentication is completely disabled for security
2. **HTTPS Required**: OAuth2 should only be used over HTTPS in production
3. **State Parameter**: Used to prevent CSRF attacks (mapped to browser ID)
4. **Token Exchange**: Authorization code is exchanged server-side (never exposed to client)
5. **Email Verification**: Users authenticated via OAuth2 are automatically marked as email-verified

## Troubleshooting

### "OAuth2 token exchange failed"
- Verify `OAUTH2_CLIENT_ID` and `OAUTH2_CLIENT_SECRET` are correct
- Ensure `OAUTH2_TOKEN_URL` is accessible from your server
- Check that the redirect URI is correctly registered with your provider

### "Invalid user information received"
- Verify `OAUTH2_USERINFO_URL` is correct
- Check field mappings match your provider's response format
- Ensure the scope includes necessary permissions (profile, email)

### "Email is required from OAuth2 provider"
- Ensure your OAuth2 provider is configured to return email addresses
- Add `email` to the `OAUTH2_SCOPE` variable
- Check if your provider requires explicit consent for email access

## Testing

To test OAuth2 authentication:

1. Set up a test OAuth2 provider (e.g., local Keycloak instance)
2. Configure environment variables
3. Start HeyForm server
4. Navigate to `/login`
5. Click "Sign in with OAuth2"
6. Complete authentication with your provider
7. Verify you're logged into HeyForm

## Disabling OAuth2

To disable OAuth2 and restore standard authentication methods:

```bash
OAUTH2_ENABLED=false
```

Or remove/comment out the `OAUTH2_ENABLED` variable entirely.

## Implementation Files

### Backend
- `packages/server/src/environments/index.ts` - Environment configuration
- `packages/server/src/service/oauth2.service.ts` - OAuth2 service logic
- `packages/server/src/controller/oauth2.controller.ts` - OAuth2 routes
- `packages/server/src/resolver/auth/login.resolver.ts` - Login guard
- `packages/server/src/resolver/auth/sign-up.resolver.ts` - SignUp guard
- `packages/server/src/controller/social-login.controller.ts` - Social login guard
- `packages/server/src/controller/dashboard.controller.ts` - Frontend config

### Frontend
- `packages/webapp/src/consts/environments.ts` - Environment constants
- `packages/webapp/src/pages/auth/views/OAuth2Login.tsx` - OAuth2 login UI
- `packages/webapp/src/pages/auth/Login.tsx` - Login page with OAuth2 support
- `packages/webapp/src/pages/auth/SignUp.tsx` - SignUp page with OAuth2 support

## Support

For issues or questions about OAuth2 authentication:
- Check HeyForm documentation
- Review provider-specific OAuth2 documentation
- Verify environment variable configuration
- Check server logs for detailed error messages
