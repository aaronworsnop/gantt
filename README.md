# Gantt Chart
## A clean, native Gantt chart for personal planning
`TypeScript` `React` `Tauri` `Rust` `SQLite` `UI/UX`

A super clean and minimal Gantt chart I built for myself (because all the other ones are kinda ugly, slow and full of bloat). 

- Self-ordering entries
  - Create entries with custom colours
  - Drag to move and resize periods
  - Click an entry's name to edit it in place
- Jump-to-today button
  - Smoothly animates the horizontal scroll position back to today.
- Smooth motion throughout
  - Period resize/move
  - Row re-sorts
  - Colour-picker
  - Scroll 
- Local storage
  - All data lives in a single SQLite file
  - No servers or accounts

*To run this app...*
- Clone this repository
- In your terminal use `npm install`
- Then `npm run tauri dev`

*The first launch compiles the Rust backend, which takes a few minutes. Launches after that are basically instant.*
