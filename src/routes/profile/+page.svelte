<script lang="ts">
	import { PageHeader } from '$lib/components';
	import { preferences, preferenceActions } from '$lib/stores/preferences';
	import { expenses, categories, budgets, expenseActions, categoryActions, budgetActions } from '$lib/stores';
	import { currentUser, isAuthenticated, authActions, authLoading } from '$lib/stores';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { 
		downloadAsJSON, 
		downloadAsCSV, 
		importFromFile,
		getFormattedStorageSize,
		clearStorage
	} from '$lib/utils/storage';
	import { updateDisplayName, deleteUserAccount, deleteAllUserData } from '$lib/firebase/account';
	import type { DateFormat, Theme } from '$lib/types';
	import Modal from '$lib/components/Modal.svelte';
	import Button from '$lib/components/Button.svelte';
	import Toast from '$lib/components/Toast.svelte';

	// Local state bound to preferences
	let currency = $derived($preferences.currency);
	let dateFormat = $derived($preferences.dateFormat);
	let theme = $derived($preferences.theme);
	
	// User account state
	let displayName = $state('');
	let email = $state('');
	let isEditingDisplayName = $state(false);
	let displayNameInput = $state('');
	let savingDisplayName = $state(false);

	// Redirect if not authenticated
	$effect(() => {
		if (!$authLoading && !$isAuthenticated) {
			goto(`${base}/login?returnTo=${base}/profile`);
		}
	});

	// Load user data
	$effect(() => {
		if ($currentUser) {
			displayName = $currentUser.displayName || '';
			email = $currentUser.email || '';
			displayNameInput = displayName;
		}
	});

	const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR'];
	const dateFormats: DateFormat[] = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

	// Stats
	let expenseCount = $derived($expenses.length);
	let categoryCount = $derived($categories.length);
	let budgetCount = $derived($budgets.length);
	let storageSize = $state('0 KB');

	// Update storage size on mount
	$effect(() => {
		storageSize = getFormattedStorageSize();
	});

	// UI state
	let importMessage = $state('');
	let importSuccess = $state(false);
	let showDeleteAccountModal = $state(false);
	let showDeleteDataModal = $state(false);
	let deleting = $state(false);
	let error = $state<string | null>(null);

	function handleCurrencyChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		preferenceActions.setCurrency(target.value);
	}

	function handleDateFormatChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		preferenceActions.setDateFormat(target.value as DateFormat);
	}

	function handleThemeChange(newTheme: Theme) {
		preferenceActions.setTheme(newTheme);
	}

	function startEditingDisplayName() {
		isEditingDisplayName = true;
		displayNameInput = displayName;
	}

	function cancelEditingDisplayName() {
		isEditingDisplayName = false;
		displayNameInput = displayName;
	}

	async function saveDisplayName() {
		if (!displayNameInput.trim()) {
			error = 'Display name cannot be empty';
			return;
		}

		savingDisplayName = true;
		error = null;

		try {
			await updateDisplayName(displayNameInput.trim());
			displayName = displayNameInput.trim();
			isEditingDisplayName = false;
		} catch (err: any) {
			error = err.message || 'Failed to update display name';
		} finally {
			savingDisplayName = false;
		}
	}

	async function handleDeleteAccount() {
		if (!confirm('Are you absolutely sure? This will permanently delete your account and all data. This cannot be undone.')) {
			return;
		}

		deleting = true;
		error = null;

		try {
			await deleteUserAccount();
			// Clear local storage
			clearStorage();
			// Redirect to login
			await authActions.logout();
			goto(`${base}/login?accountDeleted=true`);
		} catch (err: any) {
			error = err.message || 'Failed to delete account. Please try again.';
			deleting = false;
		}
	}

	async function handleDeleteAllData() {
		if (!confirm('Are you sure you want to delete ALL your data? This cannot be undone.')) {
			return;
		}

		if (!confirm('This will permanently delete all expenses, categories, and budgets. Are you absolutely sure?')) {
			return;
		}

		deleting = true;
		error = null;

		try {
			if ($isAuthenticated) {
				// Delete from Firebase
				await deleteAllUserData();
			}
			// Also clear local storage
			clearStorage();
			// Clear stores
			expenseActions.clear();
			// Reset categories to defaults (removes user categories)
			categoryActions.resetToDefaults();
			budgetActions.clear();
			// Reload page
			window.location.reload();
		} catch (err: any) {
			error = err.message || 'Failed to delete data. Please try again.';
			deleting = false;
		}
	}

	function handleExportJSON() {
		const date = new Date().toISOString().split('T')[0];
		downloadAsJSON(`expense-manager-backup-${date}.json`);
	}

	function handleExportCSV() {
		const date = new Date().toISOString().split('T')[0];
		downloadAsCSV(`expenses-${date}.csv`);
	}

	async function handleImport(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (!file) return;
		
		importMessage = 'Importing...';
		importSuccess = false;
		
		const result = await importFromFile(file);
		importMessage = result.message;
		importSuccess = result.success;
		
		if (result.success) {
			// Reload the page to refresh stores
			setTimeout(() => {
				window.location.reload();
			}, 1500);
		}
		
		// Clear the input
		target.value = '';
	}
</script>

<svelte:head>
	<title>Profile | SpendWise</title>
	<meta name="description" content="Manage your account and preferences." />
</svelte:head>

<div class="profile-page">
	{#if $authLoading}
		<div class="container mx-auto px-4">
			<PageHeader title="Profile" subtitle="Loading..." />
		</div>
	{:else if !$isAuthenticated}
		<div class="container mx-auto px-4">
			<PageHeader title="Profile" subtitle="Please sign in to view your profile" />
		</div>
	{:else}
		<div class="container mx-auto px-4">
			<PageHeader 
				title="Profile" 
				subtitle="Manage your account and preferences"
			/>

			{#if error}
				<Toast type="error" message={error} onclose={() => (error = null)} />
			{/if}

			<div class="profile-grid">
			<!-- Row 1: Account and Preferences -->
			<div class="profile-row">
				<!-- Account Section -->
				<section class="profile-section em-card">
					<h2 class="section-title">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
							<circle cx="12" cy="7" r="4"></circle>
						</svg>
						Account
					</h2>

					<div class="settings-form">
						<div class="form-group">
							<label class="em-label" for="displayName">Display Name</label>
							{#if isEditingDisplayName}
								<div class="edit-group">
									<input 
										type="text" 
										id="displayName"
										class="em-input"
										bind:value={displayNameInput}
										disabled={savingDisplayName}
										placeholder="Enter display name"
									/>
									<div class="edit-actions">
										<Button 
											variant="primary" 
											size="small"
											onclick={saveDisplayName}
											disabled={savingDisplayName}
										>
											{savingDisplayName ? 'Saving...' : 'Save'}
										</Button>
										<Button 
											variant="ghost" 
											size="small"
											onclick={cancelEditingDisplayName}
											disabled={savingDisplayName}
										>
											Cancel
										</Button>
									</div>
								</div>
							{:else}
								<div class="display-group">
									<span class="display-value">{displayName || 'Not set'}</span>
									<Button 
										variant="ghost" 
										size="small"
										onclick={startEditingDisplayName}
									>
										Edit
									</Button>
								</div>
							{/if}
						</div>

						<div class="form-group">
							<label class="em-label" for="email">Email</label>
							<input 
								type="email" 
								id="email"
								class="em-input"
								value={email}
								disabled
							/>
							<p class="input-hint">Email cannot be changed</p>
						</div>

						<div class="account-actions">
							<button 
								class="em-btn em-btn-ghost" 
								onclick={async () => {
									await authActions.logout();
									goto(`${base}/login`);
								}}
							>
								Logout
							</button>
							<button 
								class="em-btn em-btn-danger" 
								onclick={() => (showDeleteAccountModal = true)}
								disabled={deleting}
							>
								Delete Account
							</button>
						</div>
					</div>
				</section>

				<!-- Preferences Section -->
				<section class="profile-section em-card">
					<h2 class="section-title">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="3"></circle>
							<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
						</svg>
						Preferences
					</h2>

					<div class="settings-form">
						<div class="form-group">
							<label class="em-label" for="currency">Currency</label>
							<select id="currency" class="em-input" value={currency} onchange={handleCurrencyChange}>
								{#each currencies as curr}
									<option value={curr}>{curr}</option>
								{/each}
							</select>
						</div>

						<div class="form-group">
							<label class="em-label" for="dateFormat">Date Format</label>
							<select id="dateFormat" class="em-input" value={dateFormat} onchange={handleDateFormatChange}>
								{#each dateFormats as format}
									<option value={format}>{format}</option>
								{/each}
							</select>
						</div>

						<div class="form-group">
							<label class="em-label" id="theme-label">Theme</label>
							<div class="theme-options" role="radiogroup" aria-labelledby="theme-label">
								<button 
									type="button"
									class="theme-btn" 
									class:active={theme === 'dark'}
									onclick={() => handleThemeChange('dark')}
									role="radio"
									aria-checked={theme === 'dark'}
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
									</svg>
									Dark
								</button>
								<button 
									type="button"
									class="theme-btn" 
									class:active={theme === 'light'}
									onclick={() => handleThemeChange('light')}
									role="radio"
									aria-checked={theme === 'light'}
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<circle cx="12" cy="12" r="5"></circle>
										<line x1="12" y1="1" x2="12" y2="3"></line>
										<line x1="12" y1="21" x2="12" y2="23"></line>
										<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
										<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
										<line x1="1" y1="12" x2="3" y2="12"></line>
										<line x1="21" y1="12" x2="23" y2="12"></line>
										<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
										<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
									</svg>
									Light
								</button>
							</div>
						</div>
					</div>
				</section>
			</div>

			<!-- Row 2: Data and About -->
			<div class="profile-row">
				<!-- Data Management Section -->
				<section class="profile-section em-card">
					<h2 class="section-title">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
							<polyline points="7 10 12 15 17 10"></polyline>
							<line x1="12" y1="15" x2="12" y2="3"></line>
						</svg>
						Data
					</h2>

					<!-- Data Stats -->
					<div class="data-stats">
						<div class="stat-item">
							<span class="stat-value">{expenseCount}</span>
							<span class="stat-label">Expenses</span>
						</div>
						<div class="stat-item">
							<span class="stat-value">{categoryCount}</span>
							<span class="stat-label">Categories</span>
						</div>
						<div class="stat-item">
							<span class="stat-value">{budgetCount}</span>
							<span class="stat-label">Budgets</span>
						</div>
						<div class="stat-item">
							<span class="stat-value">{storageSize}</span>
							<span class="stat-label">Storage</span>
						</div>
					</div>

					<div class="data-actions">
						<div class="data-action">
							<div class="action-info">
								<h3 class="action-title">Export Data (JSON)</h3>
								<p class="action-description">Download all your data as a backup file</p>
							</div>
							<button class="em-btn em-btn-ghost" onclick={handleExportJSON}>
								Export JSON
							</button>
						</div>

						<div class="data-action">
							<div class="action-info">
								<h3 class="action-title">Export Expenses (CSV)</h3>
								<p class="action-description">Download expenses in spreadsheet format</p>
							</div>
							<button class="em-btn em-btn-ghost" onclick={handleExportCSV}>
								Export CSV
							</button>
						</div>

						<div class="data-action">
							<div class="action-info">
								<h3 class="action-title">Import Data</h3>
								<p class="action-description">Restore from a JSON backup file</p>
								{#if importMessage}
									<p class="import-message" class:success={importSuccess} class:error={!importSuccess}>
										{importMessage}
									</p>
								{/if}
							</div>
							<label class="em-btn em-btn-ghost import-btn">
								Import
								<input 
									type="file" 
									accept=".json"
									onchange={handleImport}
									hidden
								/>
							</label>
						</div>

						<div class="data-action danger">
							<div class="action-info">
								<h3 class="action-title">Delete All Data</h3>
								<p class="action-description">Permanently delete all expenses and settings</p>
							</div>
							<button 
								class="em-btn em-btn-danger" 
								onclick={() => (showDeleteDataModal = true)}
								disabled={deleting}
							>
								Delete All
							</button>
						</div>
					</div>
				</section>

				<!-- About Section -->
				<section class="profile-section em-card">
					<h2 class="section-title">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="12" y1="16" x2="12" y2="12"></line>
							<line x1="12" y1="8" x2="12.01" y2="8"></line>
						</svg>
						About
					</h2>

					<div class="about-info">
						<div class="about-row">
							<span class="about-label">Version</span>
							<span class="about-value">1.0.0</span>
						</div>
						<div class="about-row">
							<span class="about-label">Build</span>
							<span class="about-value">Phase 9 - Firebase</span>
						</div>
						<div class="about-row">
							<span class="about-label">Storage</span>
							<span class="about-value">Firebase + LocalStorage</span>
						</div>
					</div>

					<div class="about-links">
						<a href="https://github.com/expense-manager" class="about-link" target="_blank">
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
							</svg>
							GitHub
						</a>
						<a href={`${base}/about`} class="about-link">About</a>
					</div>
				</section>
			</div>
		</div>
		</div>
	{/if}
</div>

<!-- Delete Account Modal -->
{#if $isAuthenticated}
	<Modal
		open={showDeleteAccountModal}
		title="Delete Account"
		onclose={() => (showDeleteAccountModal = false)}
	>
		{#snippet children()}
			<p>Are you absolutely sure you want to delete your account?</p>
			<p class="warning-text">This will permanently delete:</p>
			<ul class="warning-list">
				<li>Your Firebase account</li>
				<li>All your expenses</li>
				<li>All your categories</li>
				<li>All your budgets</li>
				<li>All your preferences</li>
			</ul>
			<p class="warning-text"><strong>This action cannot be undone.</strong></p>
		{/snippet}
		{#snippet footer()}
			<Button variant="ghost" onclick={() => (showDeleteAccountModal = false)} disabled={deleting}>
				Cancel
			</Button>
			<Button variant="danger" onclick={handleDeleteAccount} disabled={deleting}>
				{deleting ? 'Deleting...' : 'Delete Account'}
			</Button>
		{/snippet}
	</Modal>

	<!-- Delete All Data Modal -->
	<Modal
		open={showDeleteDataModal}
		title="Delete All Data"
		onclose={() => (showDeleteDataModal = false)}
	>
		{#snippet children()}
			<p>Are you sure you want to delete all your data?</p>
			<p class="warning-text">This will permanently delete:</p>
			<ul class="warning-list">
				<li>All your expenses</li>
				<li>All your categories</li>
				<li>All your budgets</li>
			</ul>
			<p class="warning-text"><strong>This action cannot be undone.</strong></p>
			<p class="info-text">Your account will remain active.</p>
		{/snippet}
		{#snippet footer()}
			<Button variant="ghost" onclick={() => (showDeleteDataModal = false)} disabled={deleting}>
				Cancel
			</Button>
			<Button variant="danger" onclick={handleDeleteAllData} disabled={deleting}>
				{deleting ? 'Deleting...' : 'Delete All Data'}
			</Button>
		{/snippet}
	</Modal>
{/if}

<style>
	.profile-page {
		padding-bottom: 2rem;
	}

	.profile-grid {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 1200px;
	}

	.profile-row {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.profile-section {
		padding: 1.5rem;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0 0 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--em-border);
	}

	.section-title svg {
		color: var(--em-primary);
	}

	.settings-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.input-hint {
		font-size: 0.75rem;
		color: var(--em-text-muted);
		margin: 0;
	}

	.em-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.display-group {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-md);
	}

	.display-value {
		font-weight: 500;
		color: var(--em-text-primary);
	}

	.edit-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.edit-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.account-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--em-border);
	}

	/* Theme Options */
	.theme-options {
		display: flex;
		gap: 0.75rem;
	}

	.theme-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background-color: var(--em-bg-tertiary);
		border: 2px solid transparent;
		border-radius: var(--em-radius-md);
		color: var(--em-text-secondary);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--em-transition-fast);
	}

	.theme-btn:hover {
		background-color: var(--em-bg-hover);
	}

	.theme-btn.active {
		border-color: var(--em-primary);
		background-color: var(--em-primary-bg);
		color: var(--em-text-primary);
	}

	/* Data Stats */
	.data-stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		padding: 1rem;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-md);
		margin-bottom: 1.5rem;
	}

	.stat-item {
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--em-text-primary);
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--em-text-muted);
	}

	/* Data Actions */
	.data-actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.data-action {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-md);
		gap: 1rem;
	}

	.data-action.danger {
		background-color: var(--em-expense-bg);
	}

	.action-title {
		font-size: 0.875rem;
		font-weight: 600;
		margin: 0 0 0.25rem;
	}

	.action-description {
		font-size: 0.75rem;
		color: var(--em-text-muted);
		margin: 0;
	}

	.import-message {
		font-size: 0.75rem;
		margin: 0.5rem 0 0;
		font-weight: 500;
	}

	.import-message.success {
		color: var(--em-income);
	}

	.import-message.error {
		color: var(--em-expense);
	}

	.import-btn {
		cursor: pointer;
	}

	/* About Section */
	.about-info {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.about-row {
		display: flex;
		justify-content: space-between;
	}

	.about-label {
		color: var(--em-text-muted);
	}

	.about-value {
		font-weight: 500;
	}

	.about-links {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--em-border);
	}

	.about-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--em-primary);
		text-decoration: none;
		font-size: 0.875rem;
	}

	.about-link:hover {
		text-decoration: underline;
	}

	.warning-text {
		margin: 0.5rem 0;
		color: var(--em-text-secondary);
	}

	.warning-list {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
		color: var(--em-text-secondary);
	}

	.info-text {
		margin-top: 1rem;
		font-size: 0.875rem;
		color: var(--em-text-muted);
		font-style: italic;
	}

	@media (max-width: 1024px) {
		.profile-row {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 600px) {
		.data-stats {
			grid-template-columns: repeat(2, 1fr);
		}

		.data-action {
			flex-direction: column;
			align-items: stretch;
			text-align: center;
		}
	}
</style>
