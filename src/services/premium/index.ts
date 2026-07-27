/**
 * Achievement & Badge Services
 *
 * v1 has no paid tier, so there is no subscription or payment service here.
 * Feature gating is kept as a pass-through for a future paid tier.
 */

export { achievementService, type Achievement, type UserAchievement, type AchievementProgress } from './AchievementService';
export { badgeService } from './BadgeService';
export { featureGatingService, UpgradePrompt, PremiumFeature } from '../core/FeatureGatingService';
