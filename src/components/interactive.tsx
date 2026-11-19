"use client";

import Link from "next/link";
import { Button, type buttonVariants } from "@/components/ui/button";
import Magnet from "@/components/reactbits/Magnet";
import CountUp from "@/components/reactbits/CountUp";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

type BtnVariants = VariantProps<typeof buttonVariants>;

/** A magnetic button that gently follows the cursor. Renders a link or button. */
export function MagneticButton({
  children,
  href,
  variant = "default",
  size = "lg",
  className,
  strength = 3,
  icon,
  ...rest
}: {
  children: ReactNode;
  href?: string;
  className?: string;
  strength?: number;
  icon?: IconDefinition;
} & BtnVariants &
  React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const inner = (
    <Button
      variant={variant}
      size={size}
      className={cn("group relative", className)}
      asChild={!!href}
      {...(!href ? rest : {})}
    >
      {href ? (
        <Link href={href}>
          {children}
          {icon && (
            <FontAwesomeIcon
              icon={icon}
              className="ml-1 size-3.5 transition-transform group-hover:translate-x-0.5"
            />
          )}
        </Link>
      ) : (
        <>
          {children}
          {icon && (
            <FontAwesomeIcon
              icon={icon}
              className="ml-1 size-3.5 transition-transform group-hover:translate-x-0.5"
            />
          )}
        </>
      )}
    </Button>
  );

  return (
    <Magnet padding={80} magnetStrength={strength} wrapperClassName="inline-block">
      {inner}
    </Magnet>
  );
}

/** Animated number that counts up when scrolled into view. */
export function AnimatedStat({
  value,
  prefix,
  suffix,
  decimals,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const isFloat = !Number.isInteger(value);
  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      <CountUp
        to={value}
        duration={2}
        separator={isFloat ? "" : ","}
        className="inline"
      />
      {suffix}
    </span>
  );
}
