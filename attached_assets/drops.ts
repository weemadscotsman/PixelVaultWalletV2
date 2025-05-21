import * as badgeService from './badge';

export async function claimDrop(userId, badgeId) {
  const badge = await badgeService.getBadgeById(badgeId);
  if (!badge) {
    console.warn("Drop failed: badge not found");
    return null;
  }
  return badgeService.awardBadge(userId, badgeId);
}