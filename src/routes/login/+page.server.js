// Enable prerendering for login page
// The page is static HTML; client-side auth logic runs after hydration
export const prerender = true;

// Server-side load function for login page
export async function load() {
	return {};
}
