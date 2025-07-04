# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a single-file REIT Investment Tracker web application. The entire application is contained in `index.html` with no build process, dependencies, or external libraries.

## Architecture

- **Single HTML file**: All HTML, CSS, and JavaScript in `index.html`
- **Zero dependencies**: No npm packages or external libraries
- **No build process**: Open directly in browser
- **Cloud storage**: Optional JSONBin.io integration for data persistence
- **Client-side only**: All processing happens in the browser

## Development Commands

This is a zero-build application:
- **Run**: Open `index.html` in any modern web browser
- **Test**: No automated tests - manual testing only
- **Build**: No build process required
- **Deploy**: Copy `index.html` to any web server

## Key Code Patterns

### State Management
- Single global `investmentData` array holds all records
- Auto-save with 2-second debounce after changes
- LocalStorage for API configuration

### UI Updates
- `renderTable()`: Rebuilds entire investment table
- `calculateTotals()`: Updates running totals column
- `updateSummary()`: Refreshes dashboard metrics
- Direct DOM manipulation (no virtual DOM)

### Event Handling
- Dual `click` and `touchend` events for mobile compatibility
- Event delegation on table for cell editing
- Input blur triggers auto-save

### Data Persistence
- JSONBin.io API for cloud backup (requires API key)
- Manual save/load buttons
- Auto-save after edits (debounced)

## Mobile Considerations

- Responsive breakpoints: 768px and 480px
- Horizontal scroll wrapper for table on mobile
- Touch-friendly 44px minimum targets
- Simplified mobile navigation

## Common Modifications

When adding features:
1. Update the `investmentData` structure carefully - it affects save/load
2. Add new calculations to `calculateTotals()` and `updateSummary()`
3. Maintain mobile responsiveness with media queries
4. Test JSONBin save/load after data structure changes

## JSONBin Integration

The app uses JSONBin.io for cloud storage:
- API key stored in localStorage (not secure for production)
- Bin ID auto-generated on first save
- Rate limits apply to free tier