'use client';
import { useActionState } from 'react';

export type ActionState = { error?: string; ok?: string };
type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/** A small form that runs a server action and shows its result next to the button. */
export function ActionForm({
  action,
  children,
  hidden = {},
  confirm,
  className = '',
}: {
  action: Action;
  children: React.ReactNode;
  hidden?: Record<string, string>;
  confirm?: string;
  className?: string;
}) {
  const [state, run, pending] = useActionState<ActionState, FormData>(action, {});
  return (
    <form
      action={run}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {state.error && <p className="error w-full" role="alert">{state.error}</p>}
      {state.ok && <p className="mt-1 w-full text-sm font-semibold text-court" role="status">{state.ok}</p>}
    </form>
  );
}
