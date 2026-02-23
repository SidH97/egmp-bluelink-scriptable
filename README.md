# E-GMP Bluelink Scriptable

## What is this?

An alternative Bluelink app to use on Hyundai / Kia E-GMP Electric Cars. Its a [scriptable app](https://scriptable.app/) for IOS that allows you to control your Hyundai / Kia electric car using the Bluelink API. 

## Features

* Auto-Updating Homescreen and Lockscreen Widgets
* Fresh and more responsive app UI
* Single click options for common commands (lock, warm, charge etc) in both app and in IOS Control Center
* Siri voice support "Hey Siri, Warm the car"
* Automations via IOS Shortcuts like walk-away lock
* Unlimited Custom Climate configurations 

## Docs

See [https://bluelink.andyfase.com](https://bluelink.andyfase.com) for all documentation on feature set, installation instructions and usgae of the app.

## In-use

[<img src="./docs/images/widget_charging.png" width="400px"/>](https://bluelink.andyfase.com/images/egmp-scriptable-in-use.mp4)
<center>(click to view video)</center>

## Dev Instructions

### Repo Structure / Codebase

The code is written in typescipt and transpiled to Javascript, which the scriptable app requires. 

`/src` is the main source code of the app  
`/docs` is a Jekyll static CMS, which Gtihub pages supports.  
`/.github/docs.yml` is the GitHub Action pipeline that builds and deploys the Github Pages  
`/exampleData` is a set of exampke API payloads 

### Building the code

```
cd src
npm i
npm run build ./src/index.ts egmp-bluelink
```

The output JavaScript file (`egmp-bluelink.js`) is what you copy into your iCloud `Scriptable` folder on iOS.

### Testing and seeing the app in action

This project is designed to run inside the **Scriptable iOS app**, so most runtime features (widgets, Siri shortcuts, `ListWidget`, `UITable`, `Script`, `Safari`, etc.) only work on iOS.

Typical workflow for testing:

1. Build locally with `npm run build ./src/index.ts egmp-bluelink`.
2. Copy the generated `egmp-bluelink.js` to iCloud Drive → `Scriptable`.
3. Open Scriptable on iPhone/iPad and run `egmp-bluelink`.
4. Test app mode (in-app UI), widget mode (home/lock screen widgets), and Siri/Shortcuts mode.

For code-level checks on desktop, run:

```
npm run lint
```

This validates formatting/types/lint rules but does **not** emulate Scriptable's iOS runtime.

Tip: `exampleData/` includes sample API payloads you can use to reason about response handling while developing.


### Desktop UI test mode (Scriptable mimic)

A lightweight desktop test harness is included for quick iteration on UI states and command/button behavior without needing an iPhone for every change.

Run:

```
npm run ui:test
```

Then open the printed URL (default: `http://localhost:4173`). The harness provides:

- first-run setup form (region/manufacturer/credentials/pin/preferences) with local persistence
- simulated login/logout session flow before app controls are enabled
- scenario switching using payloads from `exampleData/` (default, charging, conditioning, cached)
- Scriptable-like action buttons (`Lock`, `Unlock`, `Start Climate`, `Start/Stop Charge`, etc.)
- a live status summary + event log to validate interaction flows
- iOS/Scriptable-style widget preview cards (home + lockscreen families)

Notes:

- this mode is intended for **developer feedback** and UI behavior checks
- you can open the harness URL in Scriptable `WebView` to use the same test UI from iOS
- real Scriptable APIs/widgets/Siri integrations must still be validated on iOS

Troubleshooting:

- If you run from Git Bash/PowerShell on Windows, avoid passing `~`-prefixed repo paths to tooling. Run `npm run ui:test` from the repository root so the server resolves files from absolute script locations.
