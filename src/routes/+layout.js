// Enable SSR so pages can be prerendered with demo content
// During build, pages will render the demo preview (since user is not authenticated)
// After hydration, if user is signed in, pages will show user data
export const ssr = true;
export const trailingSlash = 'always'; // Always use trailing slashes for consistency 