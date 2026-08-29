export function calculateLearningProgress(
  items: Array<{ recallStreak: number }>,
) {
  const learned = items.filter(({ recallStreak }) => recallStreak === 3).length;
  return {
    learned,
    total: items.length,
    percentage:
      items.length === 0 ? 0 : Math.round((learned / items.length) * 100),
  };
}
