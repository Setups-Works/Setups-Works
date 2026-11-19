"use client";

import { useRouter } from "next/navigation";
import ProfileCard from "@/components/reactbits/ProfileCard";
import type { Founder } from "@/lib/types";

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80";

export function FounderCard({ founder }: { founder: Founder }) {
  const router = useRouter();
  return (
    <ProfileCard
      className="founder-card mx-auto w-full max-w-[320px]"
      name={founder.name}
      title={founder.role}
      handle={founder.handle || "setupsworks"}
      status={founder.status || "Available"}
      avatarUrl={founder.photo || FALLBACK_AVATAR}
      contactText="Get in touch"
      showUserInfo
      enableTilt
      enableMobileTilt={false}
      behindGlowEnabled
      behindGlowColor="#4D86F7"
      onContactClick={() => router.push("/contact")}
    />
  );
}
