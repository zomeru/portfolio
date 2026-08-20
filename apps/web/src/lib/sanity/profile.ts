import type { Profile, ProfileSocial } from "./types";

export function getProfileSocials(
  profile: Pick<Profile, "email" | "githubUrl" | "linkedinUrl">,
): ProfileSocial[] {
  const socials: ProfileSocial[] = [];

  if (profile.email) socials.push({ name: "Email", href: `mailto:${profile.email}` });
  if (profile.githubUrl) socials.push({ name: "GitHub", href: profile.githubUrl });
  if (profile.linkedinUrl) socials.push({ name: "LinkedIn", href: profile.linkedinUrl });

  return socials;
}
