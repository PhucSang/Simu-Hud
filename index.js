import { getContext, extension_settings } from "../../../extensions.js";
import { eventSource, event_types, setExtensionPrompt } from "../../../../script.js";

const extensionName = "Simu-Hud"; 
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = { data: {} };
}

function updateUIAndSave(d) {
    if (!d) return;
    extension_settings[extensionName].data = { ...extension_settings[extensionName].data, ...d };
    const data = extension_settings[extensionName].data;
    
    // Cập nhật DOM (giữ nguyên logic cũ)
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

    if (data.energy) {
        $("#sh_energy_val").text(`${data.energy}/${data.energy_max || 100}`);
        $("#sh_energy_bar").css("width", `${(data.energy/(data.energy_max || 100))*100}%`);
    }
    if (data.nourishment) {
        $("#sh_nourish_val").text(data.nourishment + "%");
        $("#sh_nourish_bar").css("width", data.nourishment + "%");
    }
    if (data.hydration) {
        $("#sh_hydra_val").text(data.hydration + "%");
        $("#sh_hydra_bar").css("width", data.hydration + "%");
    }
}

// HÀM TIÊM PROMPT - Cải tiến theo tài liệu ST
function updateHiddenPrompt() {
    const context = getContext();
    if (!context || !context.chat) return;
    
    const isNewChat = context.chat.length <= 1; 
    const data = extension_settings[extensionName].data;

    // Sử dụng định dạng rành mạch hơn cho AI
    let injection = `\n\n[SIMULATION DATA BOX]\n`;
    if (isNewChat) {
        injection += `ACTION: Initialize all RPG stats for a new session.\n`;
    } else {
        injection += `LAST KNOWN STATS: Time:${data.time}, Location:${data.location}, Energy:${data.energy}%, Items:${data.carrying}.\n`;
    }
    
    injection += `INSTRUCTION: You MUST update these stats based on the narrative. 
At the END of your response, attach the data using this EXACT format:
<simu-hud>
{"time":"...","date":"...","location":"...","brief":"...","energy":100,"energy_max":100,"nourishment":100,"hydration":100,"hygiene":100,"status":"...","money":"...","carrying":"...","nearby":"...","goals":"...","leads":"..."}
</simu-hud>`;

    // Tiêm vào vị trí Depth 0 (sát nút tin nhắn cuối) để AI không thể quên
    setExtensionPrompt("SimuHud_Injection", injection, 1, 0, 0);
}

// Xử lý tin nhắn - Thêm delay nhỏ để đảm bảo UI đã load
async function handleMessageReceived() {
    // Đợi 100ms để SillyTavern render xong tin nhắn ra màn hình
    await new Promise(r => setTimeout(r, 100));

    const context = getContext();
    const lastMes = context.chat[context.chat.length - 1];
    if (!lastMes || lastMes.is_user) return;

    const regex = /<simu-hud>([\s\S]*?)<\/simu-hud>/i;
    const match = lastMes.mes.match(regex);

    if (match) {
        try {
            const parsedData = JSON.parse(match[1].trim());
            console.log(`[${extensionName}] 🎯 Bắt được dữ liệu!`);
            updateUIAndSave(parsedData);
            
            // Xóa tag khỏi UI bằng cách cập nhật lại message
            lastMes.mes = lastMes.mes.replace(regex, "").trim();
            
            // Ép SillyTavern vẽ lại tin nhắn vừa được làm sạch
            const messageDom = $(`.mes:last .mes_text`);
            if (messageDom.length) {
                // Sử dụng render chuẩn của ST nếu có thể, hoặc đơn giản là text
                messageDom.text(lastMes.mes); 
            }
        } catch (e) { 
            console.error(`[${extensionName}] JSON Error:`, e); 
        }
    } else {
        console.warn(`[${extensionName}] AI không xuất thẻ <simu-hud>. Hãy kiểm tra lại Prompt trong menu (A).`);
    }
    updateHiddenPrompt();
}

// Chuyển tab
$(document).on("click", ".sh-tab", function() {
    $(".sh-tab").removeClass("active");
    $(".sh-content").removeClass("active");
    $(this).addClass("active");
    $(`#sh-t-${$(this).data("tab")}`).addClass("active");
});

jQuery(async () => {
    const html = await $.get(`${extensionFolderPath}/example.html`);
    $("#extensions_settings2").append(html);
    updateUIAndSave(extension_settings[extensionName].data);
    
    eventSource.on(event_types.CHAT_CHANGED, updateHiddenPrompt);
    eventSource.on(event_types.MESSAGE_SENT, updateHiddenPrompt);
    eventSource.on(event_types.MESSAGE_RECEIVED, handleMessageReceived);
    
    updateHiddenPrompt();
    console.log("[Simu-Hud] Dashboard v2.1 Active");
});