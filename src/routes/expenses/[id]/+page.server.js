// Disable prerendering for dynamic expense detail page
export const prerender = false;

// Disable SSR for this route to avoid __data.json fetch issues on static sites
// This makes the page fully client-side, which works better on GitHub Pages
export const ssr = false;

// Server-side load function - won't run on static sites with ssr = false
// Return empty object to avoid any data fetching attempts
export async function load() {
	// Return empty - all data is loaded client-side from stores
	return {};
}
