const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Config plugin: fix fmt FMT_STRING consteval build errors.
 *
 * Newer clang (Xcode 16.3+/26) rejects the consteval constructors fmt uses
 * inside FMT_STRING ("call to consteval function ... is not a constant
 * expression"), which breaks React Native's vendored fmt / RCT-Folly / Yoga.
 *
 * fmt/base.h sets FMT_USE_CONSTEVAL via an UNGUARDED #if/#elif chain (no
 * #ifndef), so defining it from the build settings is overwritten by the
 * header. The only reliable fix is to patch the header: force the
 * `#define FMT_USE_CONSTEVAL 1` lines to 0 (=> FMT_CONSTEVAL becomes empty).
 *
 * Done in the Podfile post_install so it survives `prebuild` + `pod install`.
 */
const ANCHOR =
  "      :ccache_enabled => podfile_properties['apple.ccacheEnabled'] == 'true',\n    )";

const MARKER = 'fmt consteval fix (injected by withFmtConstevalFix)';

const SNIPPET = [
  '',
  `    # --- ${MARKER} ---`,
  "    fmt_base = File.join(installer.sandbox.root, 'fmt', 'include', 'fmt', 'base.h')",
  '    if File.exist?(fmt_base)',
  '      original = File.read(fmt_base)',
  "      patched = original.gsub('#  define FMT_USE_CONSTEVAL 1', '#  define FMT_USE_CONSTEVAL 0')",
  '      File.write(fmt_base, patched) if patched != original',
  '    end',
  '    # --- end fmt consteval fix ---',
].join('\n');

module.exports = function withFmtConstevalFix(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfile = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');
      if (contents.includes(MARKER)) return config; // already patched
      if (!contents.includes(ANCHOR)) {
        throw new Error('withFmtConstevalFix: post_install anchor not found in Podfile');
      }
      contents = contents.replace(ANCHOR, ANCHOR + '\n' + SNIPPET);
      fs.writeFileSync(podfile, contents);
      return config;
    },
  ]);
};
