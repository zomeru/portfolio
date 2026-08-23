import type {
  GithubContributionCalendar as ContributionCalendarData,
  GithubContributionDay,
  GithubContributionLevel,
} from "@portfolio/api/types";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});
const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});
const DAY_LABELS = [
  { label: "Mon", row: 3 },
  { label: "Wed", row: 5 },
  { label: "Fri", row: 7 },
] as const;
const LEVEL_CLASSES: Record<GithubContributionLevel, string> = {
  NONE: "bg-border/60",
  FIRST_QUARTILE: "bg-foreground/20",
  SECOND_QUARTILE: "bg-foreground/40",
  THIRD_QUARTILE: "bg-foreground/65",
  FOURTH_QUARTILE: "bg-foreground/90",
};

function dayLabel(day: GithubContributionDay) {
  const date = DATE_FORMATTER.format(new Date(`${day.date}T00:00:00Z`));
  const contribution = day.contributionCount === 1 ? "contribution" : "contributions";
  return `${day.contributionCount} ${contribution} on ${date}`;
}

type MonthLabel = {
  column: number;
  columnEnd?: number;
  key: string;
  label: string;
};

function buildMonthLabels(weeks: ContributionCalendarData["weeks"]): MonthLabel[] {
  const candidates: MonthLabel[] = [];
  const firstDay = weeks[0]?.contributionDays[0];
  let previousMonthKey = firstDay?.date.slice(0, 7) ?? null;

  if (firstDay && previousMonthKey) {
    candidates.push({
      column: 2,
      key: previousMonthKey,
      label: MONTH_FORMATTER.format(new Date(`${firstDay.date}T00:00:00Z`)),
    });
  }

  for (const [weekIndex, week] of weeks.entries()) {
    const monthStart = week.contributionDays.find(
      (day) => Number.parseInt(day.date.slice(8, 10), 10) <= 7,
    );
    if (!monthStart) continue;

    const monthKey = monthStart.date.slice(0, 7);
    if (monthKey === previousMonthKey) continue;

    candidates.push({
      column: weekIndex + 2,
      key: monthKey,
      label: MONTH_FORMATTER.format(new Date(`${monthStart.date}T00:00:00Z`)),
    });
    previousMonthKey = monthKey;
  }

  const [firstMonth, secondMonth] = candidates;
  if (firstMonth && secondMonth && secondMonth.column - firstMonth.column === 1) {
    candidates[0] = { ...firstMonth, column: 1, columnEnd: secondMonth.column };
  }
  return candidates;
}

type ContributionCalendarProps = {
  calendar: ContributionCalendarData;
};

export function ContributionCalendar({ calendar }: ContributionCalendarProps) {
  const rangeLabel = calendar.year ? String(calendar.year) : "the last 12 months";
  const monthLabels = buildMonthLabels(calendar.weeks);
  const total = calendar.totalContributions.toLocaleString("en-US");

  return (
    <div>
      <p className="text-sm text-muted">
        {total} contributions in {rangeLabel}
      </p>
      {calendar.totalContributions === 0 && (
        <p className="mt-3 text-sm text-muted">No contributions were recorded for this period.</p>
      )}
      <div className="-mx-1 mt-5 overflow-x-auto px-1 pb-2">
        <div
          role="img"
          aria-label={`${total} GitHub contributions by day in ${rangeLabel}`}
          className="grid w-max gap-[3px]"
          style={{
            gridTemplateColumns: `2rem repeat(${calendar.weeks.length}, 0.75rem)`,
            gridTemplateRows: "1rem repeat(7, 0.75rem)",
          }}
        >
          {monthLabels.map((month) => (
            <span
              key={month.key}
              aria-hidden="true"
              className={`whitespace-nowrap font-mono text-[0.625rem] text-muted ${month.columnEnd ? "pe-1 text-end" : ""}`}
              style={{
                gridColumn: month.columnEnd ? `${month.column} / ${month.columnEnd}` : month.column,
                gridRow: 1,
              }}
            >
              {month.label}
            </span>
          ))}
          {DAY_LABELS.map((day) => (
            <span
              key={day.label}
              aria-hidden="true"
              className="font-mono text-[0.625rem] text-muted"
              style={{ gridColumn: 1, gridRow: day.row }}
            >
              {day.label}
            </span>
          ))}
          {calendar.weeks.flatMap((week, weekIndex) =>
            week.contributionDays.map((day) => (
              <span
                key={day.date}
                aria-hidden="true"
                title={dayLabel(day)}
                className={`size-3 rounded-[2px] ${LEVEL_CLASSES[day.contributionLevel]}`}
                style={{ gridColumn: weekIndex + 2, gridRow: day.weekday + 2 }}
              />
            )),
          )}
        </div>
      </div>
      <div
        aria-hidden="true"
        className="mt-2 flex items-center justify-end gap-1.5 text-xs text-muted"
      >
        <span>Less</span>
        {Object.values(LEVEL_CLASSES).map((className) => (
          <span key={className} className={`size-3 rounded-[2px] ${className}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
