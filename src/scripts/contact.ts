/*
 * Contact form: progressive enhancement.
 * Without this script the browser posts the form to Basin. With it, the script validates the
 * fields, posts JSON to the form `action`, and shows the result in the status region.
 */

type Field = HTMLInputElement | HTMLTextAreaElement;
type StatusState = 'idle' | 'pending' | 'success' | 'error';

const MESSAGES = {
  pending: 'Sending…',
  success: 'Your message has been sent. Thank you for contacting me!',
  error: 'Something went wrong. Please try again, or contact me on LinkedIn.',
} as const;

const HONEYPOT_NAME = '_gotcha';

function errorElement(field: Field): HTMLElement | null {
  return document.getElementById(`${field.id}-error`);
}

/** Returns the error text for a field, or an empty string if the field is valid. */
function validate(field: Field): string {
  const label = field.dataset.label ?? 'a value';
  const validity = field.validity;

  // Whitespace only is empty. Any Unicode text is valid for the name.
  if (validity.valueMissing || field.value.trim() === '') return `Enter ${label}.`;
  // `type="email"` accepts "a@b". Also require a dot in the domain part.
  if (validity.typeMismatch || (field.type === 'email' && !/@[^@\s]+\.[^@\s.]+$/.test(field.value.trim()))) {
    return 'Enter a valid email address, with an @ sign and a domain.';
  }
  if (validity.tooLong) return `Use ${field.maxLength} characters or fewer.`;
  if (!validity.valid) return field.validationMessage || `Enter ${label}.`;
  return '';
}

function showError(field: Field, message: string): void {
  const error = errorElement(field);
  if (message) {
    field.setAttribute('aria-invalid', 'true');
  } else {
    field.removeAttribute('aria-invalid');
  }
  if (error) {
    error.textContent = message;
    error.hidden = message === '';
  }
}

function initContactForm(form: HTMLFormElement): void {
  const submit = form.querySelector<HTMLButtonElement>('[data-contact-submit]');
  const status = form.querySelector<HTMLElement>('[data-contact-status]');
  const statusText = status?.querySelector<HTMLElement>('[data-status-text]') ?? null;
  const fields = ['name', 'email', 'message']
    .map((name) => form.elements.namedItem(name))
    .filter(
      (el): el is Field => el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement,
    );

  if (!submit || !status || !statusText || fields.length !== 3) return; // Keep the native submit.

  let sending = false;

  const setStatus = (state: StatusState): void => {
    status.dataset.state = state;
    statusText.textContent = state === 'idle' ? '' : MESSAGES[state];
    status.querySelectorAll<HTMLElement>('[data-status-icon]').forEach((icon) => {
      icon.hidden = icon.dataset.statusIcon !== state;
    });
  };

  form.noValidate = true;

  // After an error is shown, check the field again while the user types.
  fields.forEach((field) => {
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') showError(field, validate(field));
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;

    let firstInvalid: Field | null = null;
    fields.forEach((field) => {
      const message = validate(field);
      showError(field, message);
      if (message && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      setStatus('idle');
      (firstInvalid as Field).focus();
      return;
    }

    const payload: Record<string, string> = {};
    fields.forEach((field) => {
      payload[field.name] = field.value.trim();
    });

    // People cannot see the honeypot. If it has a value, send the value: Basin marks the
    // submission as spam, and a message from a person whose browser autofilled it is not lost.
    const honeypot = form.elements.namedItem(HONEYPOT_NAME);
    if (honeypot instanceof HTMLInputElement && honeypot.value !== '') {
      payload[HONEYPOT_NAME] = honeypot.value;
    }

    sending = true;
    submit.disabled = true;
    setStatus('pending');

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Request failed');

      form.reset();
      fields.forEach((field) => showError(field, ''));
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      sending = false;
      submit.disabled = false;
      // The disabled button lost focus. Give it back, so keyboard users keep their place.
      if (document.activeElement === document.body) submit.focus();
    }
  });
}

document.querySelectorAll<HTMLFormElement>('form[data-contact-form]').forEach(initContactForm);
