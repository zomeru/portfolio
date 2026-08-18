import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

import { SocialLinks } from "@/components/portfolio/social-links";
import { TechStack } from "@/components/portfolio/tech-stack";
import { profile } from "@/data/profile";

const AVATAR_SIZE = 96;

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="grid gap-10 py-10 md:grid-cols-2 md:gap-16 sm:py-12">
        <div className="flex flex-col items-start gap-5">
          <div className="group relative size-24 overflow-hidden rounded-full border border-border">
            <Image
              src="/assets/zomer_sketch.png"
              alt={`Portrait of ${profile.name}`}
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              priority
              className="block size-full object-cover transition-opacity duration-300 group-hover:opacity-0 motion-reduce:transition-none"
            />
            <Image
              src="/assets/zomer.jpg"
              alt=""
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              className="absolute inset-0 block size-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
            />
          </div>
          <div>
            <p className="text-2xl font-medium tracking-tight">{profile.name}</p>
            <p className="mt-0.5 text-base text-muted">{profile.role}</p>
          </div>
          <a
            href={profile.resumeUrl}
            className="inline-flex items-center gap-1 text-base font-medium underline-offset-4 transition-colors duration-200 hover:text-muted motion-reduce:transition-none"
          >
            Resume <ArrowUpRight size={16} />
          </a>
          <SocialLinks className="flex items-center" />
        </div>
        <div>
          <TechStack />
        </div>
      </div>
    </header>
  );
}
