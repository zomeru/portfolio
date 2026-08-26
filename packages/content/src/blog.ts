export const BLOG_CONTENT_LIMITS = {
  body: {
    minimumCharacters: 3_000,
    maximumCharacters: 20_000,
  },
  excerpt: {
    minimumCharacters: 80,
    maximumCharacters: 300,
  },
  readTime: {
    minimumMinutes: 1,
    maximumMinutes: 60,
    wordsPerMinute: 200,
  },
  slug: {
    minimumCharacters: 8,
    maximumCharacters: 80,
  },
  tags: {
    minimumItems: 3,
    maximumItems: 5,
    minimumCharacters: 2,
    maximumCharacters: 30,
  },
  title: {
    minimumCharacters: 12,
    maximumCharacters: 100,
  },
} as const;
