(function() {
    "use strict";

    function initSimuHud() {
        // Tạo Bong bóng
        const bubble = document.createElement('div');
        bubble.id = 'simu-hud-bubble';
        bubble.innerHTML = '📊';
        document.body.appendChild(bubble);

        // Tạo Menu
        const menu = document.createElement('div');
        menu.id = 'simu-hud-menu';
        menu.innerHTML = `
            <div style="font-weight:bold; margin-bottom:10px; text-align:center;">SIMU-HUD</div>
            <div class="stat-row">
                <label>HP: <span id="hp-val">100</span>/100</label>
                <div class="stat-bar"><div id="hp-fill" class="stat-fill" style="width:100%; background:red;"></div></div>
            </div>
            <div class="stat-row">
                <label>MP: <span id="mp-val">50</span>/50</label>
                <div class="stat-bar"><div id="mp-fill" class="stat-fill" style="width:100%; background:blue;"></div></div>
            </div>
            <div class="stat-row">
                <label>STAMINA: <span id="st-val">80</span>/100</label>
                <div class="stat-bar"><div id="st-fill" class="stat-fill" style="width:80%; background:green;"></div></div>
            </div>
        `;
        document.body.appendChild(menu);

        // Sự kiện click để ẩn/hiện menu
        bubble.addEventListener('click', () => {
            const isVisible = menu.style.display === 'block';
            menu.style.display = isVisible ? 'none' : 'block';
        });
    }

    // Chờ SillyTavern sẵn sàng
    $(document).ready(function() {
        initSimuHud();
    });
})();