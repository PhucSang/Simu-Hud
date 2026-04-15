import { getContext, extension_settings } from "../../../extensions.js";
import { eventSource, event_types } from "../../../../script.js";

const extensionName = "Simu-Hud"; 
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// Khởi tạo dữ liệu trống
if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = { data: {} };
}

function updateUIAndSave(d) {
    if (!d) return;
    extension_settings[extensionName].data = Object.assign(extension_settings[extensionName].data, d);
    const data = extension_settings[extensionName].data;
    
    if (data.time) $("#sh_time").text(data.time);
    if (data.date) $("#sh_date").text(data.date);
    if (data.location) $("#sh_location").text(data.location);
    if (data.brief) $("#sh_brief").text(data.brief);
    if (data.status) $("#sh_status").text(data.status);
    if (data.money) $("#sh_money").text(data.money);
    if (data.carrying) $("#sh_carrying").text(data.carrying);
    if (data.nearby) $("#sh_nearby").text(data.nearby);
    if (data.goals) $("#sh_goals").text(data.goals);
    if (data.leads) $("#sh_leads").text(data.leads);

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
    if (data.hygiene !== undefined) {
        // Nếu có hygiene thì thêm vào (tùy HTML của bạn)
    }
}

// EXTENSION TỰ ĐỘNG TIÊM PROMPT (Thay thế hoàn toàn Preset của bạn)
eventSource.on("extension_prompt_roles", (prompt) => {
    const context = getContext();
    const isNewChat = context.chat.length <= 1; 
    const data = extension_settings[extensionName].data;
    
    // Khung JSON mẫu bắt buộc AI phải tuân theo
    const jsonTemplate = `
<simu-hud>
{
  "time": "...", "date": "...", "location": "...", "brief": "...",
  "energy": 100, "energy_max": 100, "nourishment": 100, "hydration": 100, "hygiene": 100,
  "status": "...", "money": "...", "carrying": "...", "nearby": "...",
  "goals": "...", "leads": "..."
}
</simu-hud>`;

    let injectionContent = `[SYSTEM: BACKGROUND SIMULATION MANAGER]\nYou are managing an RPG simulation in the background. Keep your narrative response immersive. `;

    if (isNewChat) {
        // LƯỢT ĐẦU TIÊN: Yêu cầu AI tự động Generate dữ liệu khởi tạo
        injectionContent += `For this new session or opening input, automatically INITIALIZE the simulation. Establish starting Date, Time, and exact Location based on lore. Set Energy to a logical number (Max 100). Set Nourishment, Hydration, Hygiene percentages logically. Assign Status, Money, Carrying, Nearby Objects, and Goals.\n`;
    } else {
        // TỪ LƯỢT THỨ 2: Gửi dữ liệu hiện tại để AI tính toán tiếp
        injectionContent += `Current state:\n`;
        injectionContent += `- Context: Time: ${data.time || "N/A"}, Date: ${data.date || "N/A"}, Location: ${data.location || "N/A"}\n`;
        injectionContent += `- Stats: Energy: ${data.energy || 0}/${data.energy_max || 100}, Nourishment: ${data.nourishment || 0}%, Hydration: ${data.hydration || 0}%\n`;
        injectionContent += `- Inventory: Money: ${data.money || "0"}, Carrying: ${data.carrying || "Nothing"}, Nearby: ${data.nearby || "Nothing"}\n`;
        injectionContent += `- Goals: ${data.goals || "None"}\n`;
        injectionContent += `Update these dynamically based on the latest narrative action.\n`;
    }

    // Luật dập khuôn (Ép AI xuất JSON ẩn vào cuối)
    injectionContent += `CRITICAL RULE: At the ABSOLUTE END of EVERY response, output the new state as a strict JSON block wrapped in <simu-hud> tags exactly like this template. Do NOT write any Markdown HUDs or stat blocks in the narrative text:\n${jsonTemplate}`;

    prompt.push({
        role: "system",
        content: injectionContent
    });
});

// Bắt và xử lý JSON ẩn
function handleMessage() {
    const context = getContext();
    const lastMes = context.chat[context.chat.length - 1];
    if (!lastMes || lastMes.is_user) return;

    const regex = /<simu-hud>([\s\S]*?)<\/simu-hud>/i;
    const match = lastMes.mes.match(regex);

    if (match) {
        try {
            const parsedData = JSON.parse(match[1].trim());
            updateUIAndSave(parsedData);
            
            // Xóa sạch dấu vết
            lastMes.mes = lastMes.mes.replace(regex, "").trim();
            $(".mes_text:last").html(lastMes.mes.replace(/\n/g, "<br>"));
        } catch (e) { console.error("[Simu-Hud] JSON Error", e); }
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
    
    // Load dữ liệu cũ lên UI
    updateUIAndSave(extension_settings[extensionName].data);
    
    eventSource.on(event_types.MESSAGE_RECEIVED, handleMessage);
    console.log("[Simu-Hud] Ready - Extension handles all prompt logic.");
});