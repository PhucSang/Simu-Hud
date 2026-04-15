import { extension_settings, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "Simu-Hud"; 
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    isEnabled: true,
};

const HUD_INSTRUCTION = `[HUD INSTRUCTION - ALWAYS FOLLOW]
At the end of EVERY response, you MUST append a JSON block with the current game state. Use this EXACT format:

\`\`\`hud
{"context":{"time":"HH:MM AM/PM","date":"Day, DD/MM/YYYY","location":"Current location","brief":"1-2 sentence summary"},"stats":{"energy":"X/X","nourishment":"X%","hydration":"X%","hygiene":"X%","status":"Physical/mental state"},"inventory":{"money":"Amount Currency","carrying":"Items in pockets","nearbyObjects":"Notable items nearby"},"goals":[{"name":"Goal name","description":"Brief description","deadline":"Time left"}],"assist":{"leads":["Option 1","Option 2","Option 3","Option 4"]}}
\`\`\`

Keep the HUD data consistent with the narrative. Update values based on events in the roleplay.`;

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

function onTestButtonClick() {
    const { chat } = SillyTavern.getContext();
    if (chat && chat.length > 0) {
        const lastMessage = chat[chat.length - 1];
        if (lastMessage && !lastMessage.is_user) {
            parseAndUpdateHud(lastMessage.mes);
        }
    }
}

function onTabClick(event) {
    const tab = $(event.target);
    const tabId = tab.data("tab");
    
    $(".simu-hud-tab").removeClass("active");
    tab.addClass("active");
    
    $(".simu-hud-panel").removeClass("active");
    $(`#panel-${tabId}`).addClass("active");
}

function parseAndUpdateHud(message) {
    const hudMatch = message.match(/```hud\s*([\s\S]*?)\s*```/);
    
    if (hudMatch) {
        try {
            const hudData = JSON.parse(hudMatch[1]);
            updateHudDisplay(hudData);
            return hudData;
        } catch (e) {
            console.error(`[${extensionName}] Failed to parse HUD JSON:`, e);
        }
    }
    return null;
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
            const leadItem = $(`<div class="lead-item">${index + 1}. ${lead}</div>`);
            leadItem.on('click', () => sendLead(lead));
            assistPanel.append(leadItem);
        });
    }
}

function sendLead(leadText) {
    const { send_textarea, send_but } = SillyTavern.getContext();
    
    if (send_textarea && send_but) {
        send_textarea.val(leadText);
        send_but.click();
    }
}

globalThis.simuHudInterceptor = function(chat, contextSize, abort, type) {
    if (!extension_settings[extensionName]?.isEnabled) return;
    if (type === 'quiet' || type === 'impersonate') return;
    
    const hudSystemMessage = {
        is_user: false,
        is_system: true,
        name: 'System',
        mes: HUD_INSTRUCTION,
        send_date: Date.now()
    };
    
    chat.push(hudSystemMessage);
};

function hideHudBlockFromMessage(message) {
    return message.replace(/```hud\s*[\s\S]*?\s*```/g, '').trim();
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
            eventSource.on(event_types.MESSAGE_RECEIVED, (messageId) => {
                if (extension_settings[extensionName].isEnabled) {
                    const { chat } = SillyTavern.getContext();
                    if (chat && chat[messageId] && !chat[messageId].is_user) {
                        parseAndUpdateHud(chat[messageId].mes);
                        chat[messageId].mes = hideHudBlockFromMessage(chat[messageId].mes);
                    }
                }
            });
            
            eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (messageId) => {
                if (extension_settings[extensionName].isEnabled) {
                    const mesBlock = $(`#chat .mes[mesid="${messageId}"]`);
                    if (mesBlock.length) {
                        const mesText = mesBlock.find('.mes_text');
                        if (mesText.length) {
                            const cleaned = hideHudBlockFromMessage(mesText.html());
                            mesText.html(cleaned);
                        }
                    }
                }
            });
            
            eventSource.on(event_types.MESSAGE_EDITED, (messageId) => {
                if (extension_settings[extensionName].isEnabled) {
                    const { chat } = SillyTavern.getContext();
                    if (chat && chat[messageId] && !chat[messageId].is_user) {
                        parseAndUpdateHud(chat[messageId].mes);
                    }
                }
            });
        }
       
        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
