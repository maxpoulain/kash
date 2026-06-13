// Fixed Supabase auth cookie name shared by the browser client, the server
// client, and the middleware.
//
// @supabase/ssr otherwise derives the cookie name from the Supabase URL
// hostname (`sb-${hostname.split(".")[0]}-auth-token`). In the Docker stack the
// browser uses 127.0.0.1 while the server uses host.docker.internal, so they
// would derive different cookie names and the session set by the browser would
// be invisible to the middleware — bouncing the user back to /login. Pinning a
// single name keeps client and server in sync regardless of URL.
export const AUTH_COOKIE_NAME = "sb-kash-auth-token";
