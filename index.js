import { extension_settings, getContext } from "../../../extensions.js";
import { eventSource, event_types } from "../../../../script.js";

const extensionName = "Simu-Hud"; 
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// Hàm cập nhật giao diện hiển thị
function updateHudData(parsedData) {
    if (parsedData.time) $("#sh_time").text(parsedData.time);
    if (parsedData.date) $("#sh_date").text(parsedData.date);
    if (parsedData.location) $("#sh_location").text(parsedData.location);
    if (parsedData.brief) $("#sh_brief").text(parsedData.brief);
    
    // Hiệu ứng chớp nhẹ khi cập nhật
    $(".sh-highlight, .sh-brief-box").fadeOut(100).fadeIn(100);
    console.log(`[${extensionName}] Data updated from AI:`, parsedData);
}

// Hệ thống Đọc và Xóa tin nhắn ẩn
function onMessageReceived() {
    // Lấy context chuẩn của SillyTavern để đọc tin nhắn
    const context = getContext();
    const chat = context.chat;
    
    // Lấy tin nhắn cuối cùng
    const lastMessage = chat[chat.length - 1];
    if (!lastMessage || lastMessage.is_user || !lastMessage.mes) return;

    // Tìm khối <simu-hud> chứa code JSON
    const regex = /<simu-hud>([\s\S]*?)<\/simu-hud>/i;
    const match = lastMessage.mes.match(regex);

    if (match) {
        try {
            // 1. Chuyển text thành dữ liệu JSON
            const aiData = JSON.parse(match[1].trim());
            
            // 2. Cập nhật Menu UI
            updateHudData(aiData);

            // 3. XÓA khối <simu-hud> khỏi dữ liệu gốc
            lastMessage.mes = lastMessage.mes.replace(regex, "").trim();

            // 4. Tìm phần tử HTML của tin nhắn đó trên màn hình và ẩn đoạn code đi
            // getContext().chat không tự động update UI, nên ta phải tự xóa nó trên màn hình
            const mesId = chat.length - 1; // ID tạm thời
            const messageDom = $(`.mes_text:last`); 
            if (messageDom.length) {
                messageDom.html(lastMessage.mes.replace(/\n/g, "<br>")); 
            }

            console.log(`[${extensionName}] Đã trích xuất và xóa HUD code thành công.`);
        } catch (error) {
            console.error(`[${extensionName}] ❌ Lỗi khi đọc JSON từ AI:`, error);
        }
    }
}

// Chuyển Tab
function onTabClick(event) {
    $(".simu-hud-tab").removeClass("active");
    $(".simu-hud-tab-content").removeClass("active");
    const clickedTab = $(event.currentTarget);
    clickedTab.addClass("active");
    const targetId = clickedTab.data("tab");
    $(`#tab-${targetId}`).addClass("active");
}

jQuery(async () => {
    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);
       
        $(document).on("click", ".simu-hud-tab", onTabClick);
       
        // Lắng nghe sự kiện ngay sau khi AI trả lời xong
        eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
       
        console.log(`[${extensionName}] ✅ Ready. Đã sửa lỗi import. Lắng nghe tag <simu-hud>...`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});