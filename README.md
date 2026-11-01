# CSFloat Butane Buddy Preview

A Chrome Manifest V3 extension that replaces Butane Buddy listing thumbnails with each item's actual CSFloat inspect screenshot, including its colour and liquid level.

## Install

1. Extract the ZIP to a folder you intend to keep.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** in the top right.
4. Click **Load unpacked** and choose the `csfloat-butane-buddy` folder containing `manifest.json`.
5. Refresh your CSFloat tab, then search for Butane Buddy.
6. Click the extension in Chrome's Extensions menu (pin it for convenience). Use **Inspect images** to turn replacements on or off. Switching off restores thumbnails in open tabs without reloading.

## How it works

- Observes CSFloat's existing `/api/v1/listings` fetch/XHR responses, including subsequent pages and changed filters. Makes no additional listing requests.
- Reads `item.cs2_screenshot_id` for charms with `keychain_index: 81` and builds `https://csfloat.pics/m/<screenshot-id>/playside.png?v=3`.
- Matches cards by inspect link or listing link, falling back to the visible charm template. Never pairs images by result order or the shared Steam icon.
- Handles dynamically inserted/reused cards. Only touches standalone Butane Buddy card images.
- Missing or failed screenshots retain the original thumbnail. Toggle off and on to retry failed images.
- Uses the real screenshot; it does not recolour the generic icon or estimate fill from a formula. Screenshot composition/background comes from CSFloat.

## Permissions and privacy

Only requests `storage`, to remember the toggle. Content scripts run exclusively on `https://csfloat.com/*`. No API keys, analytics, uploads, third-party libraries, or purchase/trade actions. Only the relevant public listing IDs, pattern numbers, screenshot IDs and inspect links are passed from the page observer to the thumbnail script; seller and account data are not retained. Inspect image requests go to `csfloat.pics`.

## Troubleshooting

- Refresh CSFloat after first installation or after reloading the extension in Developer mode: its observer must be present when listing responses arrive.
- No replacement means there is no usable screenshot yet, the screenshot failed to load, or CSFloat changed its card markup/API. There is no screenshot-generation request or guessed substitute.
- The extension supports the `item-card` / `app-item-image-actions img.item-img` markup inspected on November 1, 2026. Future website changes may require an update.
- If screenshots are blocked by the website or another extension, the original thumbnail remains.

## Validation

The provided listing-response sample and a DOM fixture based on the live site's card structure are used for local checks of response capture, matching, toggle restoration, pagination, missing/failed images, and card reuse. The extension has not been installed into your Chrome profile automatically.
