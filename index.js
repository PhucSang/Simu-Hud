import { getContext, extension_settings } from "../../../extensions.js";
// Thêm setExtensionPrompt từ SillyTavern API
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
    
    $("#sh_time").text(data.time || "--:--");
    $("#sh_date").text(data.date || "--");
    $("#sh_location").text(data.location || "Unknown");
    $("#sh_brief").text(data.brief || "Waiting for AI...");
    $("#sh_status").text(data.status || "Healthy");
    $("#sh_money").text(data.money || "0");
    $("#sh_carrying").text(data.carrying || "Nothing");
    $("#sh_nearby").text(data.nearby || "Nothing");
    $("#sh_goals").text(data.goals || "None");
    $("#sh_leads").text(data.leads || "No leads.");

    if (data.energy && data.energy_max) {
        $("#sh_energy_val").text(`${data.energy}/${data.energy_max}`);
        $("#sh_energy_bar").css("width", `${(data.energy/data.energy_max)*100}%`);
    }
    if (data.nourishment !== undefined) {
        $("#sh_nourish_val").text(data.nourishment + "%");
        $("#sh_nourish_bar").css("width", data.nourishment + "%");
    }
    if (data.hydration !== undefined) {
        $("#sh_hydra_val").text(data.hydration + "%");
        $("#sh_hydra_bar").css("width", data.hydration + "%");
    }
    console.log(`[${extensionName}] UI Updated.`);
}

// HÀM TIÊM PROMPT CHUẨN (Được gọi liên tục mỗi khi đổi chat hoặc có tin nhắn mới)
function updateHiddenPrompt() {
    const context = getContext();
    if (!context || !context.chat) return;
    
    // Nếu chat chỉ có 0 hoặc 1 tin nhắn (Mới tạo)
    const isNewChat = context.chat.length <= 1; 
    const data = extension_settings[extensionName].data;

    let injection = `[SYSTEM: SIMULATION ENGINE]\n`;
    if (isNewChat) {
        injection += `NEW SESSION. Based on the scenario and opening message, INITIALIZE all RPG stats logically.\n`;
    } else {
        injection += `CURRENT HUD STATS: Time:${data.time||"N/A"}, Loc:${data.location||"N/A"}, Energy:${data.energy||0}/${data.energy_max||100}, Nourishment:${data.nourishment||0}%, Hydration:${data.hydration||0}%, Status:${data.status||"N/A"}, Money:${data.money||0}, Items:${data.carrying||"None"}.\n`;
    }
    
    // Khuôn dập bắt buộc
    injection += `CRITICAL RULE: At the absolute end of your response, output the new state wrapped EXACTLY in <simu-hud>{...}</simu-hud> tags using valid JSON. Template: {"time":"","date":"","location":"","brief":"","energy":100,"energy_max":100,"nourishment":100,"hydration":100,"hygiene":100,"status":"","money":"","carrying":"","nearby":"","goals":"","leads":""}`;

    // Sử dụng API chính thức của ST để tiêm prompt ẩn
    // setExtensionPrompt(Tên_ID, Nội_dung, Vị_trí(1=In_Chat), Độ_sâu(0=Sát_đáy), Vai_trò(0=System))
    if (typeof setExtensionPrompt === "function") {
        setExtensionPrompt("SimuHud_Injection", injection, 1, 0, 0);
        console.log(`[${extensionName}] 💉 Đã chèn thành công Prompt ẩn bằng API ST.`);
    } else {
        console.error(`[${extensionName}] Lỗi: Hàm setExtensionPrompt không tồn tại!`);
    }
}

// Bắt và xử lý JSON
function handleMessageReceived() {
    const context = getContext();
    const lastMes = context.chat[context.chat.length - 1];
    if (!lastMes || lastMes.is_user) return;

    console.log(`[${extensionName}] Đang quét tin nhắn...`);
    const regex = /<simu-hud>([\s\S]*?)<\/simu-hud>/i;
    const match = lastMes.mes.match(regex);

    if (match) {
        try {
            const parsedData = JSON.parse(match[1].trim());
            console.log(`[${extensionName}] ✅ Tìm thấy JSON hợp lệ!`);
            updateUIAndSave(parsedData);
            
            // Xóa tag khỏi UI
            lastMes.mes = lastMes.mes.replace(regex, "").trim();
            $(".mes_text:last").html(lastMes.mes.replace(/\n/g, "<br>"));
        } catch (e) { 
            console.error(`[${extensionName}] ❌ JSON Parse Error:`, e); 
        }
    } else {
        console.warn(`[${extensionName}] ⚠️ AI bỏ quên thẻ <simu-hud>!`);
    }
    
    // Cập nhật lại Prompt ẩn sau khi đã có dữ liệu mới
    updateHiddenPrompt();
}

// Logic chuyển tab Menu
$(document).on("click", ".sh-tab", function() {
    $(".sh-tab").removeClass("active");
    $(".sh-content").removeClass("active");
    $(this).addClass("active");
    $(`#sh-t-${$(this).data("tab")}`).addClass("active");
});

jQuery(async () => {
    const html = await $.get(`${extensionFolderPath}/example.html`);
    $("#extensions_settings2").append(html);
    
    // Load UI từ bộ nhớ
    updateUIAndSave(extension_settings[extensionName].data);
    
    // Lắng nghe các sự kiện để nhồi prompt liên tục
    eventSource.on(event_types.CHAT_CHANGED, updateHiddenPrompt);
    eventSource.on(event_types.MESSAGE_SENT, updateHiddenPrompt);
    eventSource.on(event_types.MESSAGE_RECEIVED, handleMessageReceived);
    
    // Tiêm lần đầu tiên khi mở app
    updateHiddenPrompt();
    console.log("[Simu-Hud] ✅ Hệ thống chạy API chuẩn đã sẵn sàng.");
});