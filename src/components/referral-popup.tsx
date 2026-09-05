"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faXmark } from "@fortawesome/free-solid-svg-icons";
import { LeadFormModal } from "@/components/lead-form-modal";

/**
 * Small corner nudge for anyone who lands via a tagged referral link (a
 * "Developed by Setups Works" credit on a client site, a directory listing,
 * `?from=`/`?utm_source=`) — shown instead of auto-opening the full quote
 * form, since the full multi-field form crammed into a small dialog just
 * looks cramped rather than "small". The full form only opens once they've
 * actually clicked through, which is also a cleaner signal of real intent.
 */
export function ReferralPopup({
  source,
  services,
}: {
  source: string;
  services: string[];
}) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {visible && !dismissed && !open && (
        <div className="fixed bottom-5 right-5 z-50 w-72 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-xl backdrop-blur-xl animate-in slide-in-from-bottom-4 fade-in">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            <FontAwesomeIcon icon={faXmark} className="size-3.5" />
          </button>
          <p className="pr-4 text-sm font-semibold">Liked what you saw?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            We&apos;d love to build something just as good for you.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Get a quote
            <FontAwesomeIcon icon={faArrowRight} className="size-3" />
          </button>
        </div>
      )}

      <LeadFormModal
        hideTrigger
        open={open}
        onOpenChange={setOpen}
        services={services}
        source={source}
      />
    </>
  );
}
