/* 
   ROLAND'S STEAKHOUSE - DESIGN SYSTEM JS
   Centralized Logic for Premium Modals and Console Branding
*/

(function() {
    // 1. Stylized Console Greeting
    const consoleStyle = 'background: #1b5e20; color: white; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; font-weight: bold; padding: 8px 16px; border-radius: 8px; border: 2px solid #10b981;';
    const subStyle = 'color: #1b5e20; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; font-weight: bold;';
    
    console.log('%c🏛️ ROLAND\'S STEAKHOUSE SYSTEMS ', consoleStyle);
    window.escapeHtml = function (str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    // 2. Super Modal System
    window.superModal = function ({ 
        title = 'Notice', 
        message = '', 
        type = 'alert', 
        confirmText = 'Confirm', 
        cancelText = 'Cancel',
        showInput = false,
        placeholder = '',
        inputType = 'text'
    }) {
        return new Promise((resolve) => {
            // Ensure root exists
            let root = document.getElementById('super-modal-root');
            if (!root) {
                root = document.createElement('div');
                root.id = 'super-modal-root';
                document.body.appendChild(root);
            }

            const html = `
                <div class="super-modal-overlay">
                    <div class="super-modal-box">
                        <div class="super-modal-header">
                            <h3>${title}</h3>
                        </div>
                        <div class="super-modal-body">
                            <p>${message}</p>
                            ${showInput ? `<div style="margin-top:15px;"><input type="${inputType}" id="ds-modal-input" class="super-modal-input" placeholder="${placeholder}" autocomplete="off"></div>` : ''}
                        </div>
                        <div class="super-modal-footer">
                            ${(type === 'confirm' || showInput) ? `<button class="super-modal-btn cancel" id="ds-modal-cancel">${cancelText}</button>` : ''}
                            <button class="super-modal-btn confirm" id="ds-modal-confirm">${confirmText}</button>
                        </div>
                    </div>
                </div>
            `;
            root.innerHTML = html;

            const confirmBtn = document.getElementById('ds-modal-confirm');
            const cancelBtn = document.getElementById('ds-modal-cancel');
            const inputEl = document.getElementById('ds-modal-input');

            if (inputEl) {
                inputEl.focus();
                inputEl.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') confirmBtn.click();
                });
            }

            // Handle Clicks
            confirmBtn.onclick = () => {
                const val = inputEl ? inputEl.value : true;
                root.innerHTML = '';
                resolve(val);
            };
            
            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    root.innerHTML = '';
                    resolve(showInput ? null : false);
                };
            }
        });
    };

    // 3. Fallback for alert/confirm (Optional: could override native if desired)
    // window.alert = (msg) => window.superModal({ message: msg });
    
    // 4. Premium Toast Notification System
    window.showToast = function (message = '', type = 'info', duration = 3500) {
        let container = document.getElementById('ds-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ds-toast-container';
            container.style.cssText = 'position:fixed; top:24px; right:24px; z-index:999999; display:flex; flex-direction:column; gap:10px; pointer-events:none; font-family:"Inter",-apple-system,sans-serif;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        const icons = { 
            success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#86efac" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`, 
            error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`, 
            warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fde047" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`, 
            info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>` 
        };
        const bgColors = {
            success: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
            error: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
            warning: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
            info: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)'
        };

        toast.style.cssText = `
            background: ${bgColors[type] || bgColors.info};
            color: #ffffff;
            padding: 12px 20px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 10px 25px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            gap: 10px;
            pointer-events: auto;
            transform: translateX(120%);
            opacity: 0;
            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            max-width: 380px;
            border: 1px solid rgba(255,255,255,0.15);
        `;

        toast.innerHTML = `<span style="display:flex; align-items:center;">${icons[type] || icons.info}</span><span>${message}</span>`;
        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 350);
        }, duration);
    };

    // 5. Centralized Philippine Holiday & Blocked Dates Subsystem
    const DEFAULT_PH_HOLIDAYS = [
        { id: 'PH-01-01', monthDay: '01-01', name: "New Year's Day", isBlocked: true, type: 'annual', category: 'Regular Holiday' },
        { id: 'PH-02-25', monthDay: '02-25', name: "EDSA People Power Anniversary", isBlocked: true, type: 'annual', category: 'Special Non-Working' },
        { id: 'PH-04-09', monthDay: '04-09', name: "Araw ng Kagitingan (Day of Valor)", isBlocked: true, type: 'annual', category: 'Regular Holiday' },
        { id: 'PH-05-01', monthDay: '05-01', name: "Labor Day", isBlocked: true, type: 'annual', category: 'Regular Holiday' },
        { id: 'PH-06-12', monthDay: '06-12', name: "Independence Day", isBlocked: true, type: 'annual', category: 'Regular Holiday' },
        { id: 'PH-08-21', monthDay: '08-21', name: "Ninoy Aquino Day", isBlocked: true, type: 'annual', category: 'Special Non-Working' },
        { id: 'PH-08-31', monthDay: '08-31', name: "National Heroes Day", isBlocked: true, type: 'annual', category: 'Regular Holiday' },
        { id: 'PH-11-01', monthDay: '11-01', name: "All Saints' Day (Undas)", isBlocked: true, type: 'annual', category: 'Special Non-Working' },
        { id: 'PH-11-02', monthDay: '11-02', name: "All Souls' Day", isBlocked: true, type: 'annual', category: 'Special Non-Working' },
        { id: 'PH-11-30', monthDay: '11-30', name: "Bonifacio Day", isBlocked: true, type: 'annual', category: 'Regular Holiday' },
        { id: 'PH-12-08', monthDay: '12-08', name: "Feast of the Immaculate Conception", isBlocked: true, type: 'annual', category: 'Special Non-Working' },
        { id: 'PH-12-24', monthDay: '12-24', name: "Christmas Eve", isBlocked: true, type: 'annual', category: 'Special Non-Working' },
        { id: 'PH-12-25', monthDay: '12-25', name: "Christmas Day", isBlocked: true, type: 'annual', category: 'Regular Holiday' },
        { id: 'PH-12-30', monthDay: '12-30', name: "Rizal Day", isBlocked: true, type: 'annual', category: 'Regular Holiday' },
        { id: 'PH-12-31', monthDay: '12-31', name: "New Year's Eve", isBlocked: true, type: 'annual', category: 'Special Non-Working' }
    ];

    window.getHolidayList = function () {
        try {
            const stored = localStorage.getItem('ph_holiday_config');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Error loading holiday config:', e);
        }
        localStorage.setItem('ph_holiday_config', JSON.stringify(DEFAULT_PH_HOLIDAYS));
        return DEFAULT_PH_HOLIDAYS;
    };

    window.saveHolidayConfig = function (list) {
        try {
            localStorage.setItem('ph_holiday_config', JSON.stringify(list));
            window.dispatchEvent(new CustomEvent('holidayConfigUpdated', { detail: list }));
            if (typeof BroadcastChannel !== 'undefined') {
                try {
                    new BroadcastChannel('inventory_sync_channel').postMessage({ action: 'holidayConfigUpdated', payload: list });
                } catch (e) {}
            }
        } catch (e) {
            console.error('Error saving holiday config:', e);
        }
    };

    window.toggleHolidayStatus = function (id) {
        const list = window.getHolidayList();
        const item = list.find(h => h.id === id || h.monthDay === id || h.date === id);
        if (item) {
            item.isBlocked = !item.isBlocked;
            window.saveHolidayConfig(list);
            return item;
        }
        return null;
    };

    window.addCustomHoliday = function (dateStr, reasonStr) {
        if (!dateStr) return null;
        const list = window.getHolidayList();
        const existing = list.find(h => h.date === dateStr || h.monthDay === dateStr);
        if (existing) {
            existing.name = reasonStr || existing.name;
            existing.isBlocked = true;
            window.saveHolidayConfig(list);
            return existing;
        }
        const newItem = {
            id: 'CUSTOM-' + Date.now(),
            date: dateStr,
            name: reasonStr || 'Custom Blocked Date / Private Event',
            isBlocked: true,
            type: 'custom',
            category: 'Special Closure'
        };
        list.push(newItem);
        window.saveHolidayConfig(list);
        return newItem;
    };

    window.removeCustomHoliday = function (id) {
        let list = window.getHolidayList();
        const idx = list.findIndex(h => h.id === id || h.date === id);
        if (idx !== -1) {
            const item = list[idx];
            if (item.type === 'annual') {
                item.isBlocked = true;
            } else {
                list.splice(idx, 1);
            }
            window.saveHolidayConfig(list);
            return true;
        }
        return false;
    };

    window.autoPopulatePHHolidays = function () {
        const currentList = window.getHolidayList();
        const customItems = currentList.filter(h => h.type === 'custom');
        // Merge default annual holidays with preserved custom closures
        const merged = [...DEFAULT_PH_HOLIDAYS, ...customItems];
        window.saveHolidayConfig(merged);
        return merged;
    };

    window.checkHolidayOrBlockedDate = function (dateStr) {
        if (!dateStr) return { isBlocked: false };
        const list = window.getHolidayList();

        // 1. Direct date match (e.g. YYYY-MM-DD for custom date or specific date override)
        const customMatch = list.find(h => h.date === dateStr);
        if (customMatch) {
            if (customMatch.isBlocked) {
                return { isBlocked: true, name: customMatch.name || 'Restaurant Closed / Blocked Date', item: customMatch };
            } else {
                return { isBlocked: false, name: customMatch.name, isOpenOverride: true, item: customMatch };
            }
        }

        // 2. Annual Philippines Fixed Holidays (MM-DD)
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const monthDay = `${parts[1]}-${parts[2]}`;
            const annualMatch = list.find(h => h.monthDay === monthDay);
            if (annualMatch) {
                if (annualMatch.isBlocked) {
                    return { isBlocked: true, name: annualMatch.name || 'Philippine National Holiday', item: annualMatch };
                } else {
                    return { isBlocked: false, name: annualMatch.name, isOpenOverride: true, item: annualMatch };
                }
            }
        }

        return { isBlocked: false };
    };

    console.log('%c» SuperModal, Toast & Philippine Holiday Management: Active', 'color: #10b981; font-weight: bold; font-size: 10px;');
})();


