// Server-side layout - handles auth state and route protection

export async function load({ url }) {
	return {
		navbarConfig: {
			siteTitle: 'SpendWise',
			logo: null
		}
	};
}
