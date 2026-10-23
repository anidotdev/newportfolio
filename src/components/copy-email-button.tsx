"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const labels = siteConfig.contact.copyEmail;

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    setFailed(false);

    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
      setFailed(true);
    }
  }

  return (
    <div className="relative flex shrink-0 items-center">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={copy}
        className="h-8 gap-1.5 rounded-md px-2 text-xs text-muted-foreground"
      >
        {copied ? (
          <Check aria-hidden="true" className="size-3.5" />
        ) : (
          <Copy aria-hidden="true" className="size-3.5" />
        )}
        <span>{copied ? labels.copied : labels.button}</span>
      </Button>
      <span className="sr-only" aria-live="polite">
        {failed ? labels.failed : copied ? labels.announcement : ""}
      </span>
    </div>
  );
}
