"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import TextPressure from "@/components/reactbits/TextPressure";

export function FooterWordmark() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const color = resolvedTheme === "light" ? "#0a0b0f" : "#f2f5fb";

  return (
    <div className="relative mx-auto h-28 w-full max-w-6xl select-none sm:h-40 lg:h-52">
      {mounted && (
        <TextPressure
          text="SETUPS WORKS"
          flex
          width
          weight
          italic={false}
          textColor={color}
          minFontSize={36}
          className="font-display"
        />
      )}
    </div>
  );
}
