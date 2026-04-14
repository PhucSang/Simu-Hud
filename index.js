// Import từ SillyTavern core
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "character-stats-manager"; 
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// Khởi tạo Extension
jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);
   
    try {
        // Tải file HTML
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
       
        // Thêm vào cột bên phải của bảng Extensions
        $("#extensions_settings2").append(settingsHtml);
       
        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});