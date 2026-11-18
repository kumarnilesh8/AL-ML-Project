'use client';
import { useActionState } from 'react';
import { sendSignInLink, type SignInState } from './actions';

export function SignInForm({ mailbox, next }: { mailbox?: string; next?: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(sendSignInLink, { status: 'idle' });

  if (state.status === 'sent') {
    return (
      <div role="status" className="rounded-lg bg-sunken p-5">
        <p className="font-semibold">Check your email</p>
        <p className="mt-1">
          We sent a sign-in link to <strong>{state.email}</strong>. It works for 15 minutes. Open it on this device and browser.
        </p>
        {mailbox && (
          <p className="mt-3 text-sm text-muted">
            Local testing: emails are caught by the test mailbox at{' '}
            <a className="font-semibold text-court underline" href={mailbox} target="_blank" rel="noreferrer">
              {mailbox}
            </a>
            .
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="email" className="label">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          className="field"
          aria-describedby={state.status === 'error' ? 'email-error' : 'email-hint'}
        />
        {state.status === 'error' ? (
          <p id="email-error" className="error" role="alert">
            {state.message}
          </p>
        ) : (
          <p id="email-hint" className="hint">
            No password needed. New here? The same link creates your account.
          </p>
        )}
      </div>
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? 'Sending…' : 'Email me a sign-in link'}
      </button>
    </form>
  );
}
