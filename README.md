# Simu-Hud Extension for SillyTavern

A simulation HUD extension that displays player stats, inventory, goals, and suggested actions.

## Installation

1. Copy the `Simu-Hud` folder to `SillyTavern/public/scripts/extensions/third-party/`
2. Restart SillyTavern
3. Enable the extension in **User Settings > Extensions**

## Setup

### Step 1: Add System Prompt

Copy the contents of `system-prompt.md` into your **Author's Note** or **Character's First Message** in SillyTavern.

This tells the LLM:
- How to calculate stats (Energy, Nourishment, Hydration, Hygiene)
- How time advances
- How to format the HUD JSON
- The name "Simu-Hud" so the LLM recognizes it

### Step 2: Customize Rules

Edit the system prompt to match your game:
- Change stat calculation rules
- Add custom status effects
- Modify time progression
- Set starting values

## Features

### Tab 1: Context & Environment
- Current time and date
- Location
- Brief situation summary

### Tab 2: Basic Stats & Condition
- Energy (current/max)
- Nourishment %
- Hydration %
- Hygiene %
- Status effects

### Tab 3: Inventory & Surroundings
- Money
- Carried items
- Nearby objects

### Tab 4: Active Goals
- 1-3 goals with deadlines

### Tab 5: System Assist (Leads)
- 4 clickable action suggestions
- Click to auto-send as player response

## How It Works

1. LLM generates response with HUD JSON at the end
2. Extension parses JSON and updates menu
3. JSON block is hidden from display
4. Menu shows current game state

## Customization

### Change Energy Max Value

In `system-prompt.md`, change:
```
- Energy: Current/Max (e.g., 85/100)
```
to:
```
- Energy: Current/Max (e.g., 85/200)
```

### Add Custom Stats

1. Edit `index.js` - add to `hudSchema` and `updateHudDisplay()`
2. Edit `example.html` - add HTML elements
3. Edit `system-prompt.md` - add calculation rules

### Modify Time Progression

In `system-prompt.md`, adjust:
```
- Each message = +5-15 minutes
- Combat/action = +1-5 minutes
- Sleeping = +6-8 hours
```

## Tips

- Start a new chat after adding the system prompt
- The LLM needs context to understand "Simu-Hud"
- Reference "Simu-Hud" in your messages to remind LLM
- Check console (F12) if leads don't work

## Troubleshooting

**HUD not updating?**
- Check if extension is enabled
- Verify system prompt is added
- Check console for JSON parse errors

**Leads not clickable?**
- Reload the page
- Check browser console for errors

**Stats not changing?**
- LLM needs clear actions to update stats
- Remind LLM about time passing
- Reference the system prompt rules
