import { getContext } from "../../../extensions.js";
import { eventSource, event_types } from "../../../../script.js";

const extensionName = "Simu-Hud"; 
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

function updateUI(d) {
    if (!d) return;
    // Cập nhật text
    if (d.time) $("#sh_time").text(d.time);
    if (d.date) $("#sh_date").text(d.date);
    if (d.location) $("#sh_location").text(d.location);
    if (d.brief) $("#sh_brief").text(d.brief);
    if (d.status) $("#sh_status").text(d.status);
    if (d.money) $("#sh_money").text(d.money);
    if (d.carrying) $("#sh_carrying").text(d.carrying);
    if (d.goals) $("#sh_goals").text(d.goals);
    if (d.leads) $("#sh_leads").text(d.leads);

    // Cập nhật Bars
    if (d.energy && d.energy_max) {
        $("#sh_energy_val").text(`${d.energy}/${d.energy_max}`);
        $("#sh_energy_bar").css("width", `${(d.energy/d.energy_max)*100}%`);
    }
    if (d.nourishment) {
        $("#sh_nourish_val").text(d.nourishment + "%");
        $("#sh_nourish_bar").css("width", d.nourishment + "%");
    }
    if (d.hydration) {
        $("#sh_hydra_val").text(d.hydration + "%");
        $("#sh_hydra_bar").css("width", d.hydration + "%");
    }
    console.log("[Simu-Hud] UI Updated");
}

function handleMessage() {
    const chat = getContext().chat;
    const lastMes = chat[chat.length - 1];
    if (!lastMes || lastMes.is_user) return;

    const regex = /<simu-hud>([\s\S]*?)<\/simu-hud>/i;
    const match = lastMes.mes.match(regex);

    if (match) {
        try {
            const data = JSON.parse(match[1].trim());
            updateUI(data);
            
            // Xóa tag khỏi tin nhắn hiển thị
            lastMes.mes = lastMes.mes.replace(regex, "").trim();
            $(".mes_text:last").html(lastMes.mes.replace(/\n/g, "<br>"));
        } catch (e) { console.error("[Simu-Hud] JSON Parse Error", e); }
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
    eventSource.on(event_types.MESSAGE_RECEIVED, handleMessage);
    console.log("[Simu-Hud] Dashboard Loaded");
});