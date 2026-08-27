import type { PublicDetailSection } from "@portfolio/api/public-portfolio";

type ContentRun =
  | { items: string[]; style: "bullet" | "number" }
  | { style: "paragraph"; text: string };

function groupContent(section: PublicDetailSection): ContentRun[] {
  const runs: ContentRun[] = [];

  for (const item of section.content) {
    const previous = runs.at(-1);
    if (item.style !== "paragraph" && previous?.style === item.style) {
      previous.items.push(item.text);
    } else if (item.style === "paragraph") {
      runs.push({ style: "paragraph", text: item.text });
    } else {
      runs.push({ items: [item.text], style: item.style });
    }
  }

  return runs;
}

export function DetailSections({ sections }: { sections: PublicDetailSection[] }) {
  if (sections.length === 0) return null;

  return (
    <div className="mt-14 space-y-12">
      {sections.map((section, sectionIndex) => (
        <section key={`${section.title}-${sectionIndex}`}>
          <h2 className="text-lg font-medium tracking-tight">{section.title}</h2>
          <div className="mt-3 max-w-2xl space-y-3 text-sm leading-relaxed text-muted">
            {groupContent(section).map((run, index) => {
              if (run.style === "paragraph") {
                return <p key={`${run.style}-${index}`}>{run.text}</p>;
              }

              const List = run.style === "number" ? "ol" : "ul";
              return (
                <List
                  key={`${run.style}-${index}`}
                  className={
                    run.style === "number"
                      ? "list-decimal space-y-2 ps-5"
                      : "list-disc space-y-2 ps-5"
                  }
                >
                  {run.items.map((item) => (
                    <li key={item} className="ps-1">
                      {item}
                    </li>
                  ))}
                </List>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
