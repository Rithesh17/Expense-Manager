<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { authActions, isAuthenticated } from '$lib/stores';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Toast from '$lib/components/Toast.svelte';

	let email = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	// Redirect if already logged in
	$effect(() => {
		if ($isAuthenticated) {
			goto(`${base}/`);
		}
	});

	async function handleResetPassword(event: SubmitEvent) {
		event.preventDefault();
		loading = true;
		error = null;
		success = false;

		try {
			await authActions.resetPassword(email);
			success = true;
		} catch (err: any) {
			error = err.message || 'Failed to send reset email. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Reset Password - SpendWise</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-container">
		<Card>
			<div class="auth-header">
				<h1>💰 SpendWise</h1>
				<p class="auth-subtitle">Reset your password</p>
			</div>

			{#if error}
				<Toast type="error" message={error} onclose={() => (error = null)} />
			{/if}

			{#if success}
				<Toast
					type="success"
					message="Password reset email sent! Check your inbox for instructions."
					onclose={() => (success = false)}
				/>
				<div class="success-message">
					<p>We've sent a password reset link to <strong>{email}</strong></p>
					<p class="help-text">Please check your email and follow the instructions to reset your password.</p>
					<div class="form-actions">
						<Button variant="primary" onclick={() => goto(`${base}/login`)} fullWidth>
							Back to Sign In
						</Button>
					</div>
				</div>
			{:else}
				<form onsubmit={handleResetPassword} class="auth-form">
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
						<p class="help-text">Enter your email address and we'll send you a link to reset your password.</p>
					</div>

					<div class="form-actions">
						<Button type="submit" variant="primary" disabled={loading} fullWidth>
							{loading ? 'Sending...' : 'Send Reset Link'}
						</Button>
					</div>

					<div class="auth-links">
						<a href={`${base}/login`} class="link">Back to Sign In</a>
					</div>
				</form>
			{/if}
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

	.help-text {
		font-size: 0.875rem;
		color: var(--em-text-secondary);
		margin-top: 0.25rem;
	}

	.form-actions {
		margin-top: 0.5rem;
	}

	.success-message {
		text-align: center;
		color: var(--em-text-primary);
	}

	.success-message p {
		margin-bottom: 1rem;
	}

	.success-message .help-text {
		font-size: 0.875rem;
		color: var(--em-text-secondary);
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
</style>
