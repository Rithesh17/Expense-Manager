// Enable prerendering - page will show demo preview when not authenticated
export const prerender = true;

// Server-side load function for profile page
export async function load() {
	// Profile page loads user data client-side after hydration
	// Pre-rendering creates the static HTML shell
	return {};
}
