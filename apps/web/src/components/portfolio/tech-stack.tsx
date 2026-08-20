import type { TechStackGroup } from "@/lib/sanity/types";

export function TechStack({ groups }: { groups: readonly TechStackGroup[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
      {groups.map((category) => (
        <div key={category._id}>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {category.name}
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
