import { extension_settings, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "Simu-Hud"; 
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    isEnabled: true,
};

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
    const isEnabled = extension_settings[extensionName].isEnabled;
    // Hiển thị thông báo trong SillyTavern
    toastr.info(
        `Simu-Hud đang ở trạng thái: ${isEnabled ? "BẬT" : "TẮT"}`,
        "Kiểm tra Simu-Hud"
    );
    console.log(`[${extensionName}] Nút Test đã được bấm!`);
}

function onTabClick(event) {
    const tab = $(event.target);
    const tabId = tab.data("tab");
    
    $(".simu-hud-tab").removeClass("active");
    tab.addClass("active");
    
    $(".simu-hud-panel").removeClass("active");
    $(`#panel-${tabId}`).addClass("active");
}

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);
   
    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);
       
        // Bind sự kiện
        $(document).on("input", "#simu_hud_enabled", onEnabledChange);
        $(document).on("click", "#simu_hud_test_btn", onTestButtonClick);
        $(document).on("click", ".simu-hud-tab", onTabClick);
       
        await loadSettings();
       
        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});