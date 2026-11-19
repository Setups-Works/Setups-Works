"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PortfolioCard } from "@/components/cards";
import type { Portfolio } from "@/lib/types";

export function PortfolioGrid({
  projects,
  categories,
}: {
  projects: Portfolio[];
  categories: string[];
}) {
  const [active, setActive] = useState("All");
  const filtered =
    active === "All" ? projects : projects.filter((p) => p.category === active);

  return (
    <div>
      <div className="mb-10 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActive(cat)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-all",
              active === cat
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-border/60 bg-surface-2/60 text-muted-foreground hover:text-foreground hover:border-brand-500/40",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <motion.div layout className="grid gap-5 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((p, i) => (
            <motion.div
              key={p.slug}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, delay: (i % 2) * 0.05 }}
            >
              <PortfolioCard project={p} priority={i < 2} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">
          No projects in this category yet.
        </p>
      )}
    </div>
  );
}
