const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Config plugin: keep the portrait lock from becoming a Play install requirement.
 *
 * app.json's `orientation: "portrait"` writes screenOrientation="portrait" on the
 * Android activity. Google Play reads that as an implied
 * <uses-feature android:name="android.hardware.screen.portrait" required="true">,
 * so devices that don't report the feature (Chromebooks, Play Games on PC,
 * Android XR, some tablets) are refused the install, and Play Console blocks the
 * release from review over it.
 *
 * Declaring the feature explicitly with required="false" keeps phones locked to
 * portrait and drops the filter. It is written before <application>, where the
 * manifest schema puts it (xml2js writes children in object key order).
 */
const PORTRAIT_FEATURE = 'android.hardware.screen.portrait';

module.exports = function withPortraitFeatureOptional(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    const features = manifest['uses-feature'] ?? [];
    const existing = features.find((f) => f.$?.['android:name'] === PORTRAIT_FEATURE);
    if (existing) existing.$['android:required'] = 'false';
    else features.push({ $: { 'android:name': PORTRAIT_FEATURE, 'android:required': 'false' } });

    const { application, ...rest } = manifest;
    delete rest['uses-feature'];
    mod.modResults.manifest = { ...rest, 'uses-feature': features, application };

    return mod;
  });
};
