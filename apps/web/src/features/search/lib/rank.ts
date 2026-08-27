import type { RankedSearchItem, SearchItem } from "@/features/search/types/search";

const groupPriority = {
  page: 6,
  work: 7,
  project: 7,
  blog: 4,
  profile: 5,
  action: 3,
  assistant: 1,
} as const;

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function distance(left: string, right: string) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const matrix = Array.from({ length: left.length + 1 }, () =>
    Array.from({ length: right.length + 1 }, () => 0),
  );
  for (let leftIndex = 0; leftIndex <= left.length; leftIndex += 1) {
    matrix[leftIndex]![0] = leftIndex;
  }
  for (let rightIndex = 0; rightIndex <= right.length; rightIndex += 1) {
    matrix[0]![rightIndex] = rightIndex;
  }

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution =
        matrix[leftIndex - 1]![rightIndex - 1]! +
        (left.charAt(leftIndex - 1) === right.charAt(rightIndex - 1) ? 0 : 1);
      matrix[leftIndex]![rightIndex] = Math.min(
        matrix[leftIndex]![rightIndex - 1]! + 1,
        matrix[leftIndex - 1]![rightIndex]! + 1,
        substitution,
      );

      if (
        leftIndex > 1 &&
        rightIndex > 1 &&
        left.charAt(leftIndex - 1) === right.charAt(rightIndex - 2) &&
        left.charAt(leftIndex - 2) === right.charAt(rightIndex - 1)
      ) {
        matrix[leftIndex]![rightIndex] = Math.min(
          matrix[leftIndex]![rightIndex]!,
          matrix[leftIndex - 2]![rightIndex - 2]! + 1,
        );
      }
    }
  }
  return matrix[left.length]![right.length]!;
}

function tokenScore(queryToken: string, candidate: string, weight: number) {
  if (!candidate) return 0;
  if (candidate === queryToken) return 240 * weight;
  if (candidate.startsWith(queryToken)) return 150 * weight;
  if (candidate.includes(queryToken)) return 90 * weight;

  const tolerance = queryToken.length >= 8 ? 2 : queryToken.length >= 4 ? 1 : 0;
  if (tolerance && Math.abs(queryToken.length - candidate.length) <= tolerance) {
    const typoDistance = distance(queryToken, candidate);
    if (typoDistance <= tolerance) return (72 - typoDistance * 16) * weight;
  }

  return 0;
}

function itemScore(item: SearchItem, normalizedQuery: string, queryTokens: string[]) {
  const normalizedTitle = normalizeSearchText(item.title);
  const normalizedAliases = item.aliases.map(normalizeSearchText);
  const normalizedKeywords = item.keywords.map(normalizeSearchText);
  const normalizedDescription = normalizeSearchText(item.description ?? "");

  let score = groupPriority[item.group];
  if (normalizedTitle === normalizedQuery) score += 2_000;
  else if (normalizedTitle.startsWith(normalizedQuery)) score += 1_100;
  else if (normalizedTitle.includes(normalizedQuery)) score += 650;

  if (normalizedAliases.includes(normalizedQuery)) score += 1_500;
  else if (normalizedAliases.some((alias) => alias.startsWith(normalizedQuery))) score += 850;

  const fields = [
    ...normalizedTitle.split(" ").map((value) => ({ value, weight: 5 })),
    ...normalizedAliases.flatMap((alias) =>
      alias.split(" ").map((value) => ({ value, weight: 4 })),
    ),
    ...normalizedKeywords.flatMap((keyword) =>
      keyword.split(" ").map((value) => ({ value, weight: 3 })),
    ),
    ...normalizedDescription.split(" ").map((value) => ({ value, weight: 1 })),
  ];

  let matchedTokens = 0;
  for (const queryToken of queryTokens) {
    const best = fields.reduce(
      (current, field) => Math.max(current, tokenScore(queryToken, field.value, field.weight)),
      0,
    );
    if (best > 0) matchedTokens += 1;
    score += best;
  }

  if (matchedTokens === queryTokens.length && queryTokens.length > 1) score += 300;
  if (matchedTokens === 0) return 0;
  if (matchedTokens < Math.ceil(queryTokens.length / 2)) return 0;
  return score;
}

export function rankSearchItems(items: SearchItem[], query: string, limit = 18) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];
  const queryTokens = normalizedQuery.split(" ");

  const groupCounts = new Map<SearchItem["group"], number>();
  return items
    .map((item): RankedSearchItem => ({
      ...item,
      score: itemScore(item, normalizedQuery, queryTokens),
    }))
    .filter((item) => item.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        groupPriority[right.group] - groupPriority[left.group] ||
        left.title.localeCompare(right.title),
    )
    .filter((item) => {
      const count = groupCounts.get(item.group) ?? 0;
      if (count >= 5) return false;
      groupCounts.set(item.group, count + 1);
      return true;
    })
    .slice(0, limit);
}
