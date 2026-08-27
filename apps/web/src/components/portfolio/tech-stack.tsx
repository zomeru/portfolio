import type { PublicTechStackGroup } from "@portfolio/api/public-portfolio";
import { getTranslations } from "next-intl/server";

const categoryKeys = {
  Frontend: "frontend",
  Backend: "backend",
  Data: "data",
  "Infrastructure / Tools": "infrastructure",
} as const;

export async function TechStack({ groups }: { groups: readonly PublicTechStackGroup[] }) {
  const t = await getTranslations("Common.techGroups");

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
      {groups.map((category) => (
        <div key={category.name}>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {categoryKeys[category.name as keyof typeof categoryKeys]
              ? t(categoryKeys[category.name as keyof typeof categoryKeys])
              : category.name}
          </dt>
          <dd className="mt-1.5">
            <ul className="space-y-0.5">
              {category.items.map((item) => (
                <li key={item} className="text-[13px] text-muted">
                  {item}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      ))}
    </dl>
  );
}
