#!/bin/bash
# Builds the Google Play listing images from the app's own assets.
#
#   store-assets/google-play/build-assets.sh
#
# icon-512.png         512x512 32-bit PNG (Play "App icon")
# feature-graphic.jpg  1024x500 JPEG, no alpha (Play "Feature graphic")
# phone-0N-*.png       1320x2640 phone screenshots
#
# The screenshots are the App Store simulator captures with the iOS status bar
# and home indicator cropped off. That also brings them to exactly 2:1, the
# tallest ratio Play accepts. Replace them with captures from an Android phone
# when one is to hand.
set -euo pipefail
cd "$(dirname "$0")"

CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
CAPTURES=../../scripts/store-screenshots/captures/phone

render() { # html out width height [extra chrome flags]
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --allow-file-access-from-files --window-size="$3,$4" "${@:5}" \
    --screenshot="$PWD/$2" "file://$PWD/$1" >/dev/null 2>&1
}

render icon.html icon-512.png 512 512 --default-background-color=00000000
render feature-graphic.html feature-graphic.png 1024 500
sips -s format jpeg -s formatOptions 92 feature-graphic.png --out feature-graphic.jpg >/dev/null
rm feature-graphic.png

i=1
for shot in today templates focus calendar insights awards; do
  sips --cropToHeightWidth 2640 1320 --cropOffset 170 0 "$CAPTURES/$shot.png" \
    --out "phone-0$i-$shot.png" >/dev/null
  i=$((i + 1))
done

sips -g pixelWidth -g pixelHeight -g hasAlpha icon-512.png feature-graphic.jpg phone-01-today.png
