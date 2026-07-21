# Downer Australia — Driver Self Service Portal

A 3-screen HTML/CSS/JS prototype for drivers to check in, pick their assigned
D365 F&O load, sign an acknowledgement, and print the dispatch docket.

## Screens

1. **Driver Sign In** — driver enters Driver ID / Licence number.
2. **Assigned Loads** — shows loads assigned from D365 F&O; driver selects an
   active load.
3. **Acknowledge & Sign** — displays the load details, driver ticks the
   declaration, signs on-screen, and clicks **Print Dispatch Docket**.

## Files

| File | Purpose |
|------|---------|
| [index.html](index.html) | Markup for all 3 screens + printable docket area |
| [styles.css](styles.css) | Downer-branded styles (screen + print) |
| [script.js](script.js)   | Screen navigation, mock D365 loads, signature pad, print |
| [logo.svg](logo.svg)     | Placeholder logo — **replace with the official Downer logo** |

## Run it

Just open `index.html` in any modern browser (Edge, Chrome, Firefox).
No build step, no dependencies.

## Replacing the logo

Drop the official Downer logo into the folder and either:
- Save it as `logo.svg` (overwriting the placeholder), **or**
- Update the `<img src="logo.svg" ...>` line in `index.html` to point at your file
  (e.g. `logo.png`).

If the image fails to load, the header automatically falls back to a text logo.

## Wiring to D365 F&O

The `MOCK_LOADS` array in [script.js](script.js) simulates the response you'd
get from D365 F&O. Replace `renderLoads()` with a `fetch()` call to your OData /
custom service endpoint, e.g.:

```js
const res = await fetch(`/api/d365/loads?driverId=${state.driverId}`);
const loads = await res.json();
```

Similarly, `doPrint()` can POST the signature (base64 PNG from `sigPad.toDataURL()`)
and acknowledgement back to D365 before opening the print dialog.

## Signature

Uses the HTML5 Canvas + Pointer Events, so it works with mouse, touch,
and stylus input. The signed image is embedded in the docket as a PNG when
printing.

## Print

Uses CSS `@media print` — only the docket section prints, not the app chrome.
