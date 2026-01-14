<script lang="ts">
	import { goto, beforeNavigate } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import { authActions, isAuthenticated } from '$lib/stores';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Toast from '$lib/components/Toast.svelte';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let displayName = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let isGoogleSignInInProgress = $state(false);

	// Redirect if already logged in
	$effect(() => {
		if ($isAuthenticated) {
			goto(`${base}/`);
		}
	});

	// Reset loading state if user navigates away during sign-in
	onMount(() => {
		const handleVisibilityChange = () => {
			if (document.hidden && loading) {
				// User switched tabs or minimized window during sign-in
				loading = false;
				isGoogleSignInInProgress = false;
			}
		};

		const handleBeforeUnload = () => {
			if (loading) {
				// User is navigating away - reset state
				loading = false;
				isGoogleSignInInProgress = false;
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	});

	// Reset loading state when component is destroyed (user navigated away)
	onDestroy(() => {
		if (loading) {
			loading = false;
			isGoogleSignInInProgress = false;
		}
	});

	// Reset loading state if user navigates away via SvelteKit navigation
	beforeNavigate(({ cancel }) => {
		if (loading && !$isAuthenticated) {
			// User is navigating away during sign-in, reset state
			loading = false;
			isGoogleSignInInProgress = false;
		}
	});

	async function handleRegister(event: SubmitEvent) {
		event.preventDefault();
		loading = true;
		error = null;

		// Validation
		if (password.length < 6) {
			error = 'Password must be at least 6 characters long.';
			loading = false;
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match.';
			loading = false;
			return;
		}

		try {
			await authActions.register(email, password, displayName || undefined);
			// Redirect to home after successful registration
			goto(`${base}/`);
		} catch (err: any) {
			error = err.message || 'Failed to create account. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function handleGoogleSignUp() {
		loading = true;
		isGoogleSignInInProgress = true;
		error = null;

		try {
			await authActions.loginWithGoogle();
			// Redirect to home after successful registration
			goto(`${base}/`);
		} catch (err: any) {
			// Check if user closed the popup
			if (err.code === 'auth/popup-closed-by-user') {
				error = 'Sign-up cancelled. Please try again.';
			} else {
				error = err.message || 'Failed to sign up with Google. Please try again.';
			}
		} finally {
			loading = false;
			isGoogleSignInInProgress = false;
		}
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	function toggleConfirmPasswordVisibility() {
		showConfirmPassword = !showConfirmPassword;
	}
</script>

<svelte:head>
	<title>Create Account - SpendWise</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-container">
		<Card>
			<div class="auth-header">
				<h1>💰 SpendWise</h1>
				<p class="auth-subtitle">Create your account</p>
			</div>

			{#if error}
				<Toast type="error" message={error} onclose={() => (error = null)} />
			{/if}

			<div class="auth-form">
				<!-- Google Sign Up Button -->
				<button
					type="button"
					class="google-signin-button"
					onclick={handleGoogleSignUp}
					disabled={loading}
				>
					<svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
						<path
							fill="#4285F4"
							d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						/>
						<path
							fill="#34A853"
							d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						/>
						<path
							fill="#FBBC05"
							d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						/>
						<path
							fill="#EA4335"
							d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						/>
					</svg>
					<span>{isGoogleSignInInProgress ? 'Signing up...' : 'Continue with Google'}</span>
				</button>

				<div class="divider">
					<span>or</span>
				</div>

				<!-- Email/Password Form -->
				<form onsubmit={handleRegister}>
				<div class="form-group">
					<label for="displayName">Display Name (Optional)</label>
					<input
						id="displayName"
						type="text"
						bind:value={displayName}
						placeholder="John Doe"
						autocomplete="name"
						disabled={loading}
					/>
				</div>

				<div class="form-group">
					<label for="email">Email</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder="you@example.com"
						required
						autocomplete="email"
						disabled={loading}
					/>
				</div>

				<div class="form-group">
					<label for="password">Password</label>
					<div class="password-input-wrapper">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder="At least 6 characters"
							required
							autocomplete="new-password"
							disabled={loading}
							minlength="6"
						/>
						<button
							type="button"
							class="password-toggle"
							onclick={togglePasswordVisibility}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{#if showPassword}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
									<line x1="1" y1="1" x2="23" y2="23"></line>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
									<circle cx="12" cy="12" r="3"></circle>
								</svg>
							{/if}
						</button>
					</div>
				</div>

				<div class="form-group">
					<label for="confirmPassword">Confirm Password</label>
					<div class="password-input-wrapper">
						<input
							id="confirmPassword"
							type={showConfirmPassword ? 'text' : 'password'}
							bind:value={confirmPassword}
							placeholder="Re-enter your password"
							required
							autocomplete="new-password"
							disabled={loading}
							minlength="6"
						/>
						<button
							type="button"
							class="password-toggle"
							onclick={toggleConfirmPasswordVisibility}
							aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
						>
							{#if showConfirmPassword}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
									<line x1="1" y1="1" x2="23" y2="23"></line>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
									<circle cx="12" cy="12" r="3"></circle>
								</svg>
							{/if}
						</button>
					</div>
				</div>

					<div class="form-actions">
						<Button type="submit" variant="primary" disabled={loading} fullWidth>
							{loading ? 'Creating account...' : 'Create Account'}
						</Button>
					</div>
				</form>

				<div class="auth-links">
					<a href={`${base}/login`} class="link">Already have an account? Sign in</a>
				</div>
			</div>
		</Card>
	</div>
</div>

<style>
	.auth-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: var(--em-bg);
	}

	.auth-container {
		width: 100%;
		max-width: 420px;
	}

	.auth-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.auth-header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--em-text-primary);
		margin-bottom: 0.5rem;
	}

	.auth-subtitle {
		color: var(--em-text-secondary);
		font-size: 0.9375rem;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 500;
		color: var(--em-text-primary);
		font-size: 0.9375rem;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid var(--em-border);
		border-radius: var(--em-radius-md);
		background: var(--em-surface);
		color: var(--em-text-primary);
		font-size: 1rem;
		transition: all var(--em-transition-fast);
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--em-primary);
		box-shadow: 0 0 0 3px var(--em-primary-bg);
	}

	.form-group input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.password-input-wrapper {
		position: relative;
	}

	.password-toggle {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: var(--em-text-secondary);
		cursor: pointer;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color var(--em-transition-fast);
	}

	.password-toggle:hover {
		color: var(--em-text-primary);
	}

	.form-actions {
		margin-top: 0.5rem;
	}

	.auth-links {
		text-align: center;
		font-size: 0.875rem;
		color: var(--em-text-secondary);
	}

	.auth-links .link {
		color: var(--em-primary);
		text-decoration: none;
		font-weight: 500;
		transition: color var(--em-transition-fast);
	}

	.auth-links .link:hover {
		color: var(--em-primary-dark);
		text-decoration: underline;
	}

	.google-signin-button {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: var(--em-surface);
		border: 1px solid var(--em-border);
		border-radius: var(--em-radius-md);
		color: var(--em-text-primary);
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--em-transition-fast);
		margin-bottom: 1.5rem;
	}

	.google-signin-button:hover:not(:disabled) {
		background: var(--em-bg-hover);
		border-color: var(--em-primary);
	}

	.google-signin-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.google-icon {
		flex-shrink: 0;
	}

	.divider {
		display: flex;
		align-items: center;
		text-align: center;
		margin: 1.5rem 0;
		color: var(--em-text-secondary);
		font-size: 0.875rem;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		border-bottom: 1px solid var(--em-border);
	}

	.divider span {
		padding: 0 1rem;
	}
</style>
