import { extension_settings } from "../../../extensions.js";

const extensionName = "Simu-Hud"; 
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// --- NEW: Logic chuyển Tab ---
function onTabClick(event) {
    // Tắt tất cả tab và nội dung đang sáng
    $(".simu-hud-tab").removeClass("active");
    $(".simu-hud-tab-content").removeClass("active");

    // Bật tab vừa click
    const clickedTab = $(event.currentTarget);
    clickedTab.addClass("active");

    // Bật nội dung tương ứng với tab đó
    const targetId = clickedTab.data("tab");
    $(`#tab-${targetId}`).addClass("active");
}

jQuery(async () => {
    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);
       
        // Bind sự kiện click cho các tab
        $(document).on("click", ".simu-hud-tab", onTabClick);
       
        console.log(`[${extensionName}] ✅ Tabs loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});