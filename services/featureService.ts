import { FeatureManifest, Blueprint } from '../types/factory';
import { featureManifestRepository } from './repositories/featureManifest.repository';

export class FeatureService {
  static getAllFeatures(): FeatureManifest[] {
    return featureManifestRepository.getFeatureManifests();
  }

  static getFeatureById(id: string): FeatureManifest | undefined {
    return this.getAllFeatures().find((f) => f.id === id);
  }

  static saveFeature(feature: FeatureManifest): void {
    const features = this.getAllFeatures();
    const index = features.findIndex((f) => f.id === feature.id);
    if (index >= 0) {
      features[index] = feature;
    } else {
      features.push(feature);
    }
    featureManifestRepository.saveFeatureManifests(features);
  }

  /**
   * SMART DEPENDENCIES RESOLUTION
   * Resolves required and recommended dependencies.
   * Auto-activates recommended features unless user explicitly disabled them.
   */
  static resolveBlueprintFeatures(blueprint: Blueprint): {
    activeFeatureIds: string[];
    autoActivatedFeatures: Array<{ id: string; reason: string }>;
    disabledRecommendedFeatures: Array<{ id: string; reason: string }>;
  } {
    const allFeatures = this.getAllFeatures();
    const activeSet = new Set<string>(blueprint.featureIds || []);
    const disabledSet = new Set<string>(blueprint.disabledAutoFeatures || []);

    const autoActivatedFeatures: Array<{ id: string; reason: string }> = [];
    const disabledRecommendedFeatures: Array<{ id: string; reason: string }> = [];
    // Tracks recIds already recorded. Keyed by recId alone (not by which active feature
    // recommended it) because every consumer of disabledRecommendedFeatures treats `id` as
    // unique — FeatureManifestsView keys a list on `d.id` and ValidationService derives a
    // message id from it — so two different reasons for disabling the same feature would
    // still collide downstream even if this only deduped per (featId, recId) pair. Keeping
    // the first reason encountered is enough; the point is flagging *that* it's disabled.
    const seenDisabledIds = new Set<string>();

    let changed = true;
    let passes = 0;

    while (changed && passes < 10) {
      changed = false;
      passes++;

      const currentActiveIds = Array.from(activeSet);
      for (const featId of currentActiveIds) {
        const feat = allFeatures.find((f) => f.id === featId);
        if (!feat) continue;

        // 1. Mandatory Dependencies
        for (const depId of feat.dependencies || []) {
          if (!activeSet.has(depId)) {
            activeSet.add(depId);
            autoActivatedFeatures.push({
              id: depId,
              reason: `Mandatory dependency of '${feat.name}'`,
            });
            changed = true;
          }
        }

        // 2. Recommended Dependencies
        for (const recId of feat.recommendedDependencies || []) {
          if (disabledSet.has(recId)) {
            // User explicitly disabled this recommended feature!
            if (!seenDisabledIds.has(recId)) {
              seenDisabledIds.add(recId);
              disabledRecommendedFeatures.push({
                id: recId,
                reason: `Recommended by '${feat.name}' but explicitly disabled by architect`,
              });
            }
          } else if (!activeSet.has(recId)) {
            // Auto-activate recommended feature
            activeSet.add(recId);
            autoActivatedFeatures.push({
              id: recId,
              reason: `Automatically recommended by '${feat.name}' (Smart Dependency)`,
            });
            changed = true;
          }
        }
      }
    }

    return {
      activeFeatureIds: Array.from(activeSet),
      autoActivatedFeatures,
      disabledRecommendedFeatures,
    };
  }

  /**
   * Toggles a feature in a blueprint.
   * If turning OFF a feature that was recommended by another active feature, adds it to disabledAutoFeatures.
   */
  static toggleFeatureInBlueprint(blueprint: Blueprint, featureId: string, enable: boolean): Blueprint {
    const activeSet = new Set<string>(blueprint.featureIds || []);
    const disabledSet = new Set<string>(blueprint.disabledAutoFeatures || []);

    if (enable) {
      activeSet.add(featureId);
      disabledSet.delete(featureId);
    } else {
      activeSet.delete(featureId);
      // Mark as explicitly disabled
      disabledSet.add(featureId);
    }

    return {
      ...blueprint,
      featureIds: Array.from(activeSet),
      disabledAutoFeatures: Array.from(disabledSet),
    };
  }
}
