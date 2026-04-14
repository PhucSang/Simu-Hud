import { extension_settings, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "Simu-Hud"; // Đã sửa đúng chữ hoa chữ thường
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    isEnabled: true,
};

async function loadSettings() {
    // Kiểm tra nếu settings của extension chưa tồn tại thì khởi tạo bằng default
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    // Cập nhật trạng thái checkbox trên UI dựa vào settings đã lưu
    $("#simu_hud_enabled").prop("checked", extension_settings[extensionName].isEnabled);
    
    console.log(`[${extensionName}] Settings loaded:`, extension_settings[extensionName]);
}

function onEnabledChange(event) {
    const value = Boolean($(event.target).prop("checked"));
    extension_settings[extensionName].isEnabled = value;
    saveSettingsDebounced();
    console.log(`[${extensionName}] isEnabled changed to:`, value);
}

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);
   
    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);
       
        // Bind sự kiện khi click checkbox
        $(document).on("input", "#simu_hud_enabled", onEnabledChange);
       
        // Load settings khi khởi động
        await loadSettings();
       
        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});