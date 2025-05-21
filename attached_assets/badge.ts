export async function awardBadge(userId, badgeId) {
  const badge = await badgeDao.getBadgeById(badgeId);
  if (!badge) {
    console.warn(`Badge '${badgeId}' not found. Skipping award.`);
    return null;
  }
  return badgeDao.assignBadge(userId, badgeId);
}