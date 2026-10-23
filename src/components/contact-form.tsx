"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  LoaderCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type Field = "name" | "email" | "message";
type FieldErrors = Partial<Record<Field, string>>;
type FormState = "idle" | "sending" | "success" | "error" | "not-configured";

const FIELD_CLASS =
  "mt-1.5 block w-full min-w-0 rounded-[10px] border border-input bg-background px-3 text-[15px] leading-5 text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15";

function fillTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template,
  );
}

function validateField(field: Field, values: Record<Field, string>) {
  const errors = siteConfig.contact.form.errors;
  const value = values[field].trim();

  if (field === "name") {
    if (!value) return errors.name;
    return value.length > 100 ? errors.nameLong : undefined;
  }
  if (field === "email") {
    if (!value) return errors.email;
    if (value.length > 200) return errors.emailLong;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? undefined
      : errors.emailFormat;
  }

  if (!value) return errors.message;
  if (value.length < 10) return errors.messageShort;
  return value.length > 2000 ? errors.messageLong : undefined;
}

function validate(values: Record<Field, string>): FieldErrors {
  const errors: FieldErrors = {};

  for (const field of ["name", "email", "message"] as const) {
    const message = validateField(field, values);
    if (message) errors[field] = message;
  }

  return errors;
}

export function ContactForm() {
  const { contact } = siteConfig;
  const formCopy = contact.form;
  const emailChannel = contact.channels.find((channel) => channel.id === "email");
  const [values, setValues] = useState({
    name: "",
    email: "",
    message: "",
    website: "",
  });
  const [topic, setTopic] = useState(formCopy.topics[0]?.value ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formState, setFormState] = useState<FormState>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState({ name: "", email: "" });
  const startedAt = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const topicRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const fieldRefs = {
    name: nameRef,
    email: emailRef,
    message: messageRef,
  };

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const topicLabel =
    formCopy.topics.find((option) => option.value === topic)?.label ?? "";

  function updateValue(field: Field | "website", value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function focusFirstError(nextErrors: FieldErrors) {
    const first = (["name", "email", "message"] as const).find(
      (field) => nextErrors[field],
    );
    if (first) {
      requestAnimationFrame(() => fieldRefs[first].current?.focus());
    }
  }

  function handleBlur(field: Field) {
    const message = validateField(field, values);
    setErrors((current) => ({ ...current, [field]: message }));
  }

  function selectTopic(index: number) {
    const next = formCopy.topics[index];
    if (!next) return;
    setTopic(next.value);
    topicRefs.current[index]?.focus();
  }

  function handleTopicKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const direction =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;

    if (!direction) return;
    event.preventDefault();
    const nextIndex =
      (index + direction + formCopy.topics.length) % formCopy.topics.length;
    selectTopic(nextIndex);
  }

  function emailAppHref() {
    const subject = fillTemplate(formCopy.emailSubject, {
      name: values.name.trim(),
    });
    const body = fillTemplate(formCopy.emailBody, {
      name: values.name.trim(),
      email: values.email.trim(),
      topic: topicLabel,
      message: values.message.trim(),
    });

    return `mailto:${siteConfig.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (formState === "sending") return;

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setFormState("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          topic,
          message: values.message.trim(),
          website: values.website,
          startedAt: startedAt.current,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fields?: Record<string, string>;
      };

      if (response.ok && result.ok) {
        setSentTo({
          name: values.name.trim(),
          email: values.email.trim(),
        });
        setFormState("success");
        return;
      }

      if (response.status === 400 && result.fields) {
        const next: FieldErrors = {};
        for (const field of ["name", "email", "message"] as const) {
          if (result.fields[field]) next[field] = result.fields[field];
        }

        if (Object.keys(next).length > 0) {
          setErrors(next);
          setFormState("idle");
          focusFirstError(next);
          return;
        }
      }

      if (response.status === 503 && result.error === "not_configured") {
        setFormState("not-configured");
        return;
      }

      setFormError(
        response.status === 429 ? formCopy.rateLimited : formCopy.error,
      );
      setFormState("error");
    } catch {
      setFormError(formCopy.error);
      setFormState("error");
    }
  }

  function sendAnother() {
    setValues({ name: "", email: "", message: "", website: "" });
    setErrors({});
    setFormError(null);
    setFormState("idle");
    setSentTo({ name: "", email: "" });
    startedAt.current = Date.now();
    requestAnimationFrame(() => nameRef.current?.focus());
  }

  if (formState === "success") {
    const firstName = sentTo.name.split(/\s+/)[0] || sentTo.name;

    return (
      <div
        role="status"
        data-testid="contact-success"
        className="mt-3.5 flex min-h-[432px] flex-col items-start justify-center rounded-xl border border-hairline bg-background/40 p-5"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-status-available/10 text-status-available">
          <Check aria-hidden="true" className="size-5" />
        </span>
        <h4 className="mt-4 text-lg font-semibold">{formCopy.successTitle}</h4>
        <p className="mt-2 max-w-[42ch] text-sm leading-6 text-muted-foreground">
          {fillTemplate(formCopy.successBody, {
            name: firstName,
            email: sentTo.email,
          })}
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={sendAnother}
          className="mt-5 h-9 px-3"
        >
          {formCopy.sendAnother}
        </Button>
      </div>
    );
  }

  if (formState === "not-configured") {
    return (
      <div
        role="alert"
        data-testid="contact-not-configured"
        className="mt-3.5 flex min-h-[432px] flex-col items-start justify-center rounded-xl border border-hairline bg-background/40 p-5"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-surface-hover text-muted-foreground">
          <AlertCircle aria-hidden="true" className="size-5" />
        </span>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {formCopy.notConfigured}
        </p>
        <Button asChild variant="secondary" className="mt-5 h-10 px-4">
          <a href={emailAppHref()}>{formCopy.openEmailApp}</a>
        </Button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      noValidate
      data-testid="contact-form"
      onSubmit={handleSubmit}
      aria-busy={formState === "sending"}
      className="relative mt-3.5 flex min-h-[432px] min-w-0 flex-col"
    >
      <div>
        <p
          id="contact-topic-label"
          className="text-[13px] font-medium leading-5 text-foreground"
        >
          {formCopy.topicLabel}
        </p>
        <div
          role="radiogroup"
          aria-labelledby="contact-topic-label"
          className="mt-2 flex flex-wrap gap-2 min-[360px]:flex-nowrap"
        >
          {formCopy.topics.map((option, index) => (
            <button
              key={option.value}
              ref={(element) => {
                topicRefs.current[index] = element;
              }}
              type="button"
              role="radio"
              aria-checked={topic === option.value}
              tabIndex={topic === option.value ? 0 : -1}
              onClick={() => setTopic(option.value)}
              onKeyDown={(event) => handleTopicKeyDown(event, index)}
              className={cn(
                "relative inline-flex h-8 items-center whitespace-nowrap rounded-full border px-3 text-[13px] font-medium transition-colors duration-150 before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                topic === option.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-hairline text-muted-foreground hover:bg-surface-hover hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <div>
          <label
            htmlFor="contact-name"
            className="block text-[13px] font-medium leading-5 text-foreground"
          >
            {formCopy.labels.name}
          </label>
          <input
            ref={nameRef}
            id="contact-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            maxLength={100}
            value={values.name}
            placeholder={formCopy.placeholders.name}
            onChange={(event) => updateValue("name", event.target.value)}
            onBlur={() => handleBlur("name")}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            className={cn(FIELD_CLASS, "h-11")}
          />
          {errors.name ? (
            <p
              id="contact-name-error"
              className="mt-1.5 text-xs text-destructive"
            >
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="block text-[13px] font-medium leading-5 text-foreground"
          >
            {formCopy.labels.email}
          </label>
          <input
            ref={emailRef}
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={200}
            value={values.email}
            placeholder={formCopy.placeholders.email}
            onChange={(event) => updateValue("email", event.target.value)}
            onBlur={() => handleBlur("email")}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            className={cn(FIELD_CLASS, "h-11")}
          />
          {errors.email ? (
            <p
              id="contact-email-error"
              className="mt-1.5 text-xs text-destructive"
            >
              {errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label
              htmlFor="contact-message"
              className="block text-[13px] font-medium leading-5 text-foreground"
            >
              {formCopy.labels.message}
            </label>
            {values.message.length >= 1600 ? (
              <span className="whitespace-nowrap font-mono text-[11px] tabular-nums text-muted-foreground">
                {values.message.length}/2000 {formCopy.counterLabel}
              </span>
            ) : null}
          </div>
          <textarea
            ref={messageRef}
            id="contact-message"
            name="message"
            rows={4}
            maxLength={2000}
            required
            value={values.message}
            placeholder={formCopy.placeholders.message}
            onChange={(event) => updateValue("message", event.target.value)}
            onBlur={() => handleBlur("message")}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={
              errors.message ? "contact-message-error" : undefined
            }
            className={cn(
              FIELD_CLASS,
              "h-auto max-h-[200px] min-h-[104px] resize-y py-2.5",
            )}
          />
          {errors.message ? (
            <p
              id="contact-message-error"
              className="mt-1.5 text-xs text-destructive"
            >
              {errors.message}
            </p>
          ) : null}
        </div>
      </div>

      <div
        aria-hidden="true"
        inert
        className="pointer-events-none absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => updateValue("website", event.target.value)}
        />
      </div>

      <div className="mt-3.5">
        {formState === "error" && formError ? (
          <div
            role="alert"
            className="mb-3 flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs leading-5 text-destructive"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0"
            />
            <p>
              {formError}{" "}
              <a
                href={`mailto:${siteConfig.email}`}
                className="font-medium underline underline-offset-4"
              >
                {emailChannel?.hint ?? siteConfig.email}
              </a>
            </p>
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={formState === "sending"}
          aria-busy={formState === "sending"}
          className="h-11 w-full gap-2"
        >
          {formState === "sending" ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          ) : null}
          <span>{formState === "sending" ? formCopy.sending : formCopy.submit}</span>
          {formState === "sending" ? null : (
            <ArrowRight aria-hidden="true" className="size-4" />
          )}
        </Button>
      </div>
    </form>
  );
}
