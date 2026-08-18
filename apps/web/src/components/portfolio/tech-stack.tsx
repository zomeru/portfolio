import { techStack } from "@/data/tech-stack";

export function TechStack() {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
      {techStack.map((category) => (
        <div key={category.label}>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {category.label}
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
