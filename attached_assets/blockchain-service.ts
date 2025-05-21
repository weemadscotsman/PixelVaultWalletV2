import * as minerDao from './minerDao';

export async function getMiningRewards(address) {
  const rewards = await minerDao.fetchRewardsByAddress(address);
  return { address, rewards };
}