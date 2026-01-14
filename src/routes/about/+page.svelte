<script>
	import { PageHeader, Card } from '$lib/components';
</script>

<svelte:head>
	<title>About | SpendWise</title>
	<meta name="description" content="Learn about SpendWise - your personal expense tracking solution." />
</svelte:head>

<div class="about-page">
	<div class="container mx-auto px-4">
		<PageHeader 
			title="About SpendWise" 
			subtitle="Your personal finance companion"
		/>

		<!-- Hero Section -->
		<section class="hero-section">
			<div class="hero-icon">💰</div>
			<h2 class="hero-title">Take Control of Your Finances</h2>
			<p class="hero-description">
				SpendWise is a free, privacy-focused expense tracking application that helps you 
				understand your spending habits, set budgets, and achieve your financial goals.
			</p>
		</section>

		<!-- Features Grid -->
		<section class="features-section">
			<h3 class="section-title">Features</h3>
			<div class="features-grid">
				<div class="feature-card em-card">
					<span class="feature-icon">📊</span>
					<h4 class="feature-title">Visual Analytics</h4>
					<p class="feature-description">
						Beautiful charts and graphs help you understand where your money goes.
					</p>
				</div>

				<div class="feature-card em-card">
					<span class="feature-icon">🏷️</span>
					<h4 class="feature-title">Custom Categories</h4>
					<p class="feature-description">
						Organize expenses with customizable categories, icons, and colors.
					</p>
				</div>

				<div class="feature-card em-card">
					<span class="feature-icon">💵</span>
					<h4 class="feature-title">Budget Tracking</h4>
					<p class="feature-description">
						Set spending limits and get alerts when you're approaching your budget.
					</p>
				</div>

				<div class="feature-card em-card">
					<span class="feature-icon">📱</span>
					<h4 class="feature-title">Works Everywhere</h4>
					<p class="feature-description">
						Fully responsive design that works on desktop, tablet, and mobile.
					</p>
				</div>

				<div class="feature-card em-card">
					<span class="feature-icon">🔒</span>
					<h4 class="feature-title">Privacy First</h4>
					<p class="feature-description">
						Your data stays private. Share only what you choose to share.
					</p>
				</div>

				<div class="feature-card em-card">
					<span class="feature-icon">👥</span>
					<h4 class="feature-title">Share & Split</h4>
					<p class="feature-description">
						Share expenses with friends and split bills easily.
					</p>
				</div>
			</div>
		</section>

		<!-- Tech Stack -->
		<section class="tech-section em-card">
			<h3 class="section-title">Built With</h3>
			<div class="tech-grid">
				<div class="tech-item">
					<span class="tech-name">SvelteKit</span>
					<span class="tech-desc">Modern web framework</span>
				</div>
				<div class="tech-item">
					<span class="tech-name">Tailwind CSS</span>
					<span class="tech-desc">Utility-first styling</span>
				</div>
				<div class="tech-item">
					<span class="tech-name">Firebase</span>
					<span class="tech-desc">Backend services</span>
				</div>
				<div class="tech-item">
					<span class="tech-name">GitHub Pages</span>
					<span class="tech-desc">Static hosting</span>
				</div>
			</div>
		</section>

		<!-- Open Source -->
		<section class="open-source-section">
			<h3 class="section-title">Open Source</h3>
			<p class="open-source-text">
				SpendWise is open source and free to use. Contributions are welcome!
			</p>
			<a href="https://github.com/expense-manager" target="_blank" class="github-link em-btn em-btn-primary">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
				</svg>
				View on GitHub
			</a>
		</section>
	</div>
</div>

<style>
	.about-page {
		padding-bottom: 3rem;
	}

	.hero-section {
		text-align: center;
		padding: 3rem 0;
		max-width: 600px;
		margin: 0 auto 3rem;
	}

	.hero-icon {
		font-size: 4rem;
		margin-bottom: 1.5rem;
	}

	.hero-title {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 1rem;
		color: var(--em-text-primary);
	}

	.hero-description {
		font-size: 1.125rem;
		color: var(--em-text-secondary);
		line-height: 1.7;
		margin: 0;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 1.5rem;
		color: var(--em-text-primary);
	}

	/* Features */
	.features-section {
		margin-bottom: 3rem;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.feature-card {
		padding: 1.5rem;
		text-align: center;
	}

	.feature-icon {
		font-size: 2.5rem;
		display: block;
		margin-bottom: 1rem;
	}

	.feature-title {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
		color: var(--em-text-primary);
	}

	.feature-description {
		font-size: 0.875rem;
		color: var(--em-text-secondary);
		margin: 0;
		line-height: 1.6;
	}

	/* Tech Stack */
	.tech-section {
		padding: 2rem;
		margin-bottom: 3rem;
	}

	.tech-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1.5rem;
	}

	.tech-item {
		text-align: center;
	}

	.tech-name {
		display: block;
		font-weight: 600;
		color: var(--em-text-primary);
		margin-bottom: 0.25rem;
	}

	.tech-desc {
		font-size: 0.875rem;
		color: var(--em-text-muted);
	}

	/* Open Source */
	.open-source-section {
		text-align: center;
		padding: 2rem;
	}

	.open-source-text {
		color: var(--em-text-secondary);
		margin: 0 0 1.5rem;
	}

	.github-link {
		text-decoration: none;
	}
</style>
