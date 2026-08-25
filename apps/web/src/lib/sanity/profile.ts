import type { PublicProfile } from "@portfolio/api/public-portfolio";

export type ProfileSocial = {
  href: string;
  name: "Email" | "GitHub" | "LinkedIn";
};

export function getProfileSocials(
  profile: Pick<PublicProfile, "email" | "links">,
): ProfileSocial[] {
  const socials: ProfileSocial[] = [];

  socials.push({ name: "Email", href: profile.links.email });
  socials.push({ name: "GitHub", href: profile.links.github });
  socials.push({ name: "LinkedIn", href: profile.links.linkedin });

  return socials;
}
