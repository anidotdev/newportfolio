# Contact setup

The contact form sends through [Resend](https://resend.com) only when all three
server-only variables are set. Missing variables return `not_configured`, and the
form offers a prefilled `mailto:` link instead of silently failing.

```dotenv
RESEND_API_KEY=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=
```

1. Create a Resend API key and verify the sending domain.
2. Set `CONTACT_FROM_EMAIL` to a verified sender, for example
   `Portfolio <hello@your-domain.com>`.
3. Set `CONTACT_TO_EMAIL` to the inbox that should receive messages.
4. Add the variables in `.env.local` or Vercel, then restart or redeploy.
5. Send a test message. The visitor's address becomes `reply_to`.

The route validates and caps input, strips newlines from headers, limits messages to five per IP per hour, and never logs message contents.
