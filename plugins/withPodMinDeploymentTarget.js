const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Config plugin: raise every Pod target to the app's minimum iOS version.
 *
 * Several dependencies still declare very old minimums in their podspecs
 * (react-native-permissions 12.4, AsyncStorage 9.0, react-native-svg 12.4).
 * Xcode 26+ refuses to build anything below iOS 15.0:
 *
 *   The iOS Simulator deployment target 'IPHONEOS_DEPLOYMENT_TARGET' is set
 *   to 9.0, but the range of supported deployment target versions is
 *   15.0 to 27.0.x
 *
 * `expo-build-properties`' `ios.deploymentTarget` sets the app target, but
 * CocoaPods generates separate resource-bundle targets (…PrivacyInfo) that
 * inherit the podspec's own floor, so they have to be raised here. The loop
 * covers every target in the Pods project, resource bundles included.
 *
 * Kept in sync with `ios.deploymentTarget` in app.json by MIN_TARGET below.
 */
const MIN_TARGET = '15.1';

const ANCHOR =
  "      :ccache_enabled => podfile_properties['apple.ccacheEnabled'] == 'true',\n    )";

const MARKER = 'pod deployment target floor (injected by withPodMinDeploymentTarget)';

const SNIPPET = [
  '',
  `    # --- ${MARKER} ---`,
  '    installer.pods_project.targets.each do |target|',
  '      target.build_configurations.each do |config|',
  "        current = config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']",
  `        if current.nil? || current.to_f < ${MIN_TARGET}`,
  `          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MIN_TARGET}'`,
  '        end',
  '      end',
  '    end',
  '    # --- end pod deployment target floor ---',
].join('\n');

module.exports = function withPodMinDeploymentTarget(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfile = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');
      if (contents.includes(MARKER)) return config; // already patched
      if (!contents.includes(ANCHOR)) {
        throw new Error(
          'withPodMinDeploymentTarget: post_install anchor not found in Podfile'
        );
      }
      contents = contents.replace(ANCHOR, ANCHOR + '\n' + SNIPPET);
      fs.writeFileSync(podfile, contents);
      return config;
    },
  ]);
};
