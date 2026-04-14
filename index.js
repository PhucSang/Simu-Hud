import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

// ⚠️ QUAN TRỌNG: Tên này phải trùng khớp 100% với tên folder bạn đặt trong third-party
const extensionName = "simu-hud"; 
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

jQuery(async () => {
    // Nếu dòng này hiện ra trong Console thì code đã chạy
    console.log(`[${extensionName}] Loading starting...`);
   
    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        
        // Thử append vào cả 2 nơi để chắc chắn nó xuất hiện ở đâu đó
        $("#extensions_settings").append(settingsHtml); // Cột trái
        
        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load HTML. Check if folder name is exactly '${extensionName}'`, error);
    }
});