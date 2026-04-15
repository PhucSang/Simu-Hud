import { extension_settings, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "Simu-Hud"; 
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    isEnabled: true,
};

const hudSchema = {
    name: 'SimuHudState',
    description: 'A schema for simulation HUD state tracking.',
    strict: true,
    value: {
        '$schema': 'http://json-schema.org/draft-04/schema#',
        'type': 'object',
        'properties': {
            'context': {
                'type': 'object',
                'properties': {
                    'time': { 'type': 'string' },
                    'date': { 'type': 'string' },
                    'location': { 'type': 'string' },
                    'brief': { 'type': 'string' }
                },
                'required': ['time', 'date', 'location', 'brief']
            },
            'stats': {
                'type': 'object',
                'properties': {
                    'energy': { 'type': 'string' },
                    'nourishment': { 'type': 'string' },
                    'hydration': { 'type': 'string' },
                    'hygiene': { 'type': 'string' },
                    'status': { 'type': 'string' }
                },
                'required': ['energy', 'nourishment', 'hydration', 'hygiene', 'status']
            },
            'inventory': {
                'type': 'object',
                'properties': {
                    'money': { 'type': 'string' },
                    'carrying': { 'type': 'string' },
                    'nearbyObjects': { 'type': 'string' }
                },
                'required': ['money', 'carrying', 'nearbyObjects']
            },
            'goals': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'name': { 'type': 'string' },
                        'description': { 'type': 'string' },
                        'deadline': { 'type': 'string' }
                    },
                    'required': ['name', 'description', 'deadline']
                }
            },
            'assist': {
                'type': 'object',
                'properties': {
                    'leads': {
                        'type': 'array',
                        'items': { 'type': 'string' }
                    }
                },
                'required': ['leads']
            }
        },
        'required': ['context', 'stats', 'inventory', 'goals', 'assist']
    }
};

const hudPrompt = `Analyze the current roleplay context and generate HUD state data as JSON. Include:
- Context: current time, date, location, brief situation summary
- Stats: energy (current/max), nourishment %, hydration %, hygiene %, physical/mental status
- Inventory: money amount with currency, items being carried, notable nearby objects
- Goals: 1-3 active goals with name, description, and deadline/countdown
- Assist: 4 suggested action/dialogue options for the player`;

async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }
    $("#simu_hud_enabled").prop("checked", extension_settings[extensionName].isEnabled);
}

function onEnabledChange(event) {
    const value = Boolean($(event.target).prop("checked"));
    extension_settings[extensionName].isEnabled = value;
    saveSettingsDebounced();
}

// --- NEW: Hàm xử lý khi bấm nút ---
function onTestButtonClick() {
    generateHudData();
}

function onTabClick(event) {
    const tab = $(event.target);
    const tabId = tab.data("tab");
    
    $(".simu-hud-tab").removeClass("active");
    tab.addClass("active");
    
    $(".simu-hud-panel").removeClass("active");
    $(`#panel-${tabId}`).addClass("active");
}

async function generateHudData() {
    const { generateQuietPrompt } = SillyTavern.getContext();
    
    try {
        const rawResult = await generateQuietPrompt({
            quietPrompt: hudPrompt,
            jsonSchema: hudSchema,
        });
        
        const parsed = JSON.parse(rawResult);
        
        if (parsed && Object.keys(parsed).length > 0) {
            updateHudDisplay(parsed);
            return parsed;
        }
        return null;
    } catch (error) {
        console.error(`[${extensionName}] Lỗi generate HUD:`, error);
        return null;
    }
}

function updateHudDisplay(data) {
    if (data.context) {
        $("#panel-context .stat-value").eq(0).text(data.context.time || "--:-- --");
        $("#panel-context .stat-value").eq(1).text(data.context.date || "--, --/--/----");
        $("#panel-context .stat-value").eq(2).text(data.context.location || "Unknown");
        $("#panel-context .stat-value").eq(3).text(data.context.brief || "No information");
    }
    
    if (data.stats) {
        $("#panel-stats .stat-value").eq(0).text(data.stats.energy || "--/--");
        $("#panel-stats .stat-value").eq(1).text(data.stats.nourishment || "--%");
        $("#panel-stats .stat-value").eq(2).text(data.stats.hydration || "--%");
        $("#panel-stats .stat-value").eq(3).text(data.stats.hygiene || "--%");
        $("#panel-stats .stat-value").eq(4).text(data.stats.status || "Unknown");
    }
    
    if (data.inventory) {
        $("#panel-inventory .stat-value").eq(0).text(data.inventory.money || "0");
        $("#panel-inventory .stat-value").eq(1).text(data.inventory.carrying || "Nothing");
        $("#panel-inventory .stat-value").eq(2).text(data.inventory.nearbyObjects || "None");
    }
    
    if (data.goals && Array.isArray(data.goals)) {
        const goalsPanel = $("#panel-goals");
        goalsPanel.empty();
        data.goals.forEach((goal, index) => {
            goalsPanel.append(`
                <div class="stat-row">
                    <span class="stat-label">Goal ${index + 1}:</span>
                    <span class="stat-value">${goal.description || goal.name} (${goal.deadline || "No deadline"})</span>
                </div>
            `);
        });
        if (data.goals.length === 0) {
            goalsPanel.append(`<div class="stat-row"><span class="stat-value">None</span></div>`);
        }
    }
    
    if (data.assist && data.assist.leads) {
        const assistPanel = $("#panel-assist");
        assistPanel.empty();
        assistPanel.append(`<div class="stat-row"><span class="stat-label">Leads:</span></div>`);
        data.assist.leads.forEach((lead, index) => {
            assistPanel.append(`<div class="lead-item">${index + 1}. ${lead}</div>`);
        });
    }
}

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);
   
    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);
       
        $(document).on("input", "#simu_hud_enabled", onEnabledChange);
        $(document).on("click", "#simu_hud_test_btn", onTestButtonClick);
        $(document).on("click", ".simu-hud-tab", onTabClick);
       
        await loadSettings();
       
        const { eventSource, event_types } = SillyTavern.getContext();
        
        if (eventSource && event_types) {
            eventSource.on(event_types.GENERATION_ENDED, () => {
                if (extension_settings[extensionName].isEnabled) {
                    generateHudData();
                }
            });
        }
       
        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});