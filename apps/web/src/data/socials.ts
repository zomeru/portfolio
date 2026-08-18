export type Social = {
  name: "Email" | "GitHub" | "LinkedIn";
  href: string;
};

export const socials: readonly Social[] = [
  { name: "Email", href: "mailto:zomergregorio@gmail.com" },
  { name: "GitHub", href: "https://github.com/zomeru" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/zomergregorio" },
];
