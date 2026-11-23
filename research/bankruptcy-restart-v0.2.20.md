# Bankruptcy restart — v0.2.20

The exhausted-funds warning now offers DEMOLISH CITY & RESTART directly beside
CHANGE BUDGET. Confirmation explains what will be removed and preserved. Cancel
makes no change. Confirm first stores a serialized recovery backup in browser
storage; failure to save the backup aborts demolition. An active region is saved
before replacement and the new city is attached to the same slot.

Restart removes buildings, roads/rails, utilities, pollution, active disasters,
loans and financial deficit. It retains water/forest terrain, edited elevations,
terraforming, map dimensions, city name, difficulty, auto-budget and disaster
preference. The new free city starts January1900 with the original difficulty's
funds ($20000/$10000/$5000). Both120x100 and240x200 are supported. Other region
cities are untouched. INFORMATION exposes RESTORE PRE-RESTART CITY with its own
confirmation; ordinary auto-session saving persists the restarted city.

373 Node tests pass. Added tests cover both sizes and all difficulties, preserved
geography, cleared infrastructure/loans, original-city immutability, backup
restoration and storage-quota failure. Actual Chromium flow verifies desktop and
mobile warning layout, cancel, confirm, terrain and pipe checks, cleared debt,
unchanged neighbouring city save, same region slot, refresh and backup restoration.
No page errors; warning/confirmation/mobile/restarted screenshots inspected.

This is a requested Turbo extension. The full original-game port and the pending
realistic civic, ambulance/health/security/mega-disaster/monorail work remain
active. Those are preserved separately on feature/civic-expansion.
