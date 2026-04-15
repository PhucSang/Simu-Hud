import { getContext, extension_settings } from "../../../extensions.js";
import { eventSource, event_types } from "../../../../script.js";

const extensionName = "Simu-Hud"; 
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// Schema ép AI phải trả về đúng định dạng
const sh_schema = {
    name: 'SimuHudState',
    strict: true,
    value: {
        'type': 'object',
        'properties': {
            'time': { 'type': 'string' },
            'date': { 'type': 'string' },
            'location': { 'type': 'string' },
            'brief': { 'type': 'string' },
            'energy': { 'type': 'number' },
            'energy_max': { 'type': 'number' },
            'nourishment': { 'type': 'number' },
            'hydration': { 'type': 'number' },
            'status': { 'type': 'string' },
            'money': { 'type': 'string' },
            'carrying': { 'type': 'string' },
            'nearby': { 'type': 'string' },
            'goals': { 'type': 'string' },
            'leads': { 'type': 'string' }
        },
        'required': ['time', 'date', 'location', 'brief', 'energy', 'energy_max', 'nourishment', 'hydration', 'status', 'money', 'carrying', 'nearby', 'goals', 'leads']
    }
};

if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = { data: {} };
}

function updateUI(d) {
    if (!d) return;
    extension_settings[extensionName].data = { ...extension_settings[extensionName].data, ...d };
    const data = extension_settings[extensionName].data;
    
    $("#sh_time").text(data.time || "--:--");
    $("#sh_date").text(data.date || "--");
    $("#sh_location").text(data.location || "Unknown");
    $("#sh_brief").text(data.brief || "...");
    $("#sh_status").text(data.status || "Normal");
    $("#sh_money").text(data.money || "0");
    $("#sh_carrying").text(data.carrying || "None");
    $("#sh_nearby").text(data.nearby || "None");
    $("#sh_goals").text(data.goals || "None");
    $("#sh_leads").text(data.leads || "None.");

    if (data.energy !== undefined) {
        const p = (data.energy / (data.energy_max || 100)) * 100;
        $("#sh_energy_val").text(`${data.energy}/${data.energy_max || 100}`);
        $("#sh_energy_bar").css("width", `${p}%`);
    }
    if (data.nourishment !== undefined) {
        $("#sh_nourish_val").text(data.nourishment + "%");
        $("#sh_nourish_bar").css("width", data.nourishment + "%");
    }
    if (data.hydration !== undefined) {
        $("#sh_hydra_val").text(data.hydration + "%");
        $("#sh_hydra_bar").css("width", data.hydration + "%");
    }
}

async function runQuietSync() {
    console.log(`[${extensionName}] 🤫 Quiet Syncing...`);
    const context = getContext();
    const data = extension_settings[extensionName].data;

    const instruction = `Update the RPG simulation state based on the last message. Current Context: Time ${data.time}, Location ${data.location}. Output ONLY the new state in JSON.`;

    try {
        const result = await context.generateQuietPrompt(instruction, false, false, sh_schema);
        if (result) {
            console.log(`[${extensionName}] ✅ Sync Complete:`, result);
            updateUI(result);
        }
    } catch (e) {
        console.error(`[${extensionName}] ❌ Quiet Sync Failed:`, e);
    }
}

eventSource.on(event_types.MESSAGE_RECEIVED, async () => {
    await runQuietSync();
});

$(document).on("click", ".sh-tab", function() {
    $(".sh-tab").removeClass("active");
    $(".sh-content").removeClass("active");
    $(this).addClass("active");
    $(`#sh-t-${$(this).data("tab")}`).addClass("active");
});

jQuery(async () => {
    const html = await $.get(`${extensionFolderPath}/example.html`);
    $("#extensions_settings2").append(html);
    updateUI(extension_settings[extensionName].data);
    console.log("[Simu-Hud] Dashboard Loaded in Quiet Mode.");
});