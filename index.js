import { getContext, extension_settings } from "../../../extensions.js";
import { eventSource, event_types } from "../../../../script.js";

const extensionName = "Simu-Hud"; 
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// Khởi tạo dữ liệu nếu chưa có
if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = { data: {} };
}

function updateUIAndSave(d) {
    if (!d) return;
    // Gộp dữ liệu mới vào bộ nhớ
    extension_settings[extensionName].data = { ...extension_settings[extensionName].data, ...d };
    const data = extension_settings[extensionName].data;
    
    // Cập nhật giao diện
    $("#sh_time").text(data.time || "--:--");
    $("#sh_date").text(data.date || "--");
    $("#sh_location").text(data.location || "Unknown");
    $("#sh_brief").text(data.brief || "Waiting for AI...");
    $("#sh_status").text(data.status || "Healthy");
    $("#sh_money").text(data.money || "0");
    $("#sh_carrying").text(data.carrying || "Nothing");
    $("#sh_goals").text(data.goals || "None");
    $("#sh_leads").text(data.leads || "No leads.");

    if (data.energy) {
        $("#sh_energy_val").text(`${data.energy}/${data.energy_max || 100}`);
        $("#sh_energy_bar").css("width", `${(data.energy / (data.energy_max || 100)) * 100}%`);
    }
    if (data.nourishment) {
        $("#sh_nourish_val").text(data.nourishment + "%");
        $("#sh_nourish_bar").css("width", data.nourishment + "%");
    }
    if (data.hydration) {
        $("#sh_hydra_val").text(data.hydration + "%");
        $("#sh_hydra_bar").css("width", data.hydration + "%");
    }
    console.log(`[${extensionName}] UI Updated.`);
}

// HÀM QUAN TRỌNG: ÉP AI PHẢI ĐIỀN DATA
eventSource.on("extension_prompt_roles", (prompt) => {
    const context = getContext();
    const isNewChat = context.chat.length <= 1; 
    const data = extension_settings[extensionName].data;

    console.log(`[${extensionName}] 💉 ĐANG TIÊM PROMPT NGẦM...`);

    let injection = `### [SYSTEM: SIMULATION ENGINE ACTIVE] ###\n`;
    if (isNewChat) {
        injection += `NEW SESSION DETECTED. Automatically INITIALIZE all RPG stats (Time, Location, Energy, Inventory, etc.) based on the lore.\n`;
    } else {
        injection += `CURRENT STATS: Time:${data.time}, Loc:${data.location}, Energy:${data.energy}%, Money:${data.money}.\n`;
    }
    
    injection += `At the end of your response, you MUST output the updated state inside <simu-hud>{ JSON }</simu-hud> tags. Use this exact JSON structure: {"time":"","date":"","location":"","brief":"","energy":100,"energy_max":100,"nourishment":100,"hydration":100,"status":"","money":"","carrying":"","nearby":"","goals":"","leads":""}\n`;

    // Đẩy thông tin này vào danh sách prompt gửi đi cho AI
    prompt.push({
        role: "system",
        content: injection
    });
});

// Bắt tin nhắn trả về
function handleMessage() {
    const context = getContext();
    const lastMes = context.chat[context.chat.length - 1];
    if (!lastMes || lastMes.is_user) return;

    console.log(`[${extensionName}] Đang quét tin nhắn tìm thẻ <simu-hud>...`);
    const regex = /<simu-hud>([\s\S]*?)<\/simu-hud>/i;
    const match = lastMes.mes.match(regex);

    if (match) {
        try {
            const parsedData = JSON.parse(match[1].trim());
            console.log(`[${extensionName}] ✅ Đã thấy JSON! Cập nhật Menu ngay.`);
            updateUIAndSave(parsedData);
            
            // Xóa tag khỏi khung chat để user không thấy
            lastMes.mes = lastMes.mes.replace(regex, "").trim();
            $(".mes_text:last").html(lastMes.mes.replace(/\n/g, "<br>"));
        } catch (e) { 
            console.error(`[${extensionName}] ❌ Lỗi đọc JSON. AI viết sai định dạng rôi!`, e); 
        }
    } else {
        console.warn(`[${extensionName}] ⚠️ Không tìm thấy thẻ <simu-hud> trong câu trả lời của AI.`);
    }
}

// Logic chuyển tab
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
    eventSource.on(event_types.MESSAGE_RECEIVED, handleMessage);
    console.log("[Simu-Hud] Ready and Listening.");
});