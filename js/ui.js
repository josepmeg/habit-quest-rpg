import { gameState } from './gameState.js';
import { WORKOUT_TASKS, DAILY_HABITS, SHOP_ITEMS, ALL_ITEMS, SPECIAL_ATTACK } from './database.js';

export function applySettings() {
    if (gameState.player.settings && gameState.player.settings.background) {
        const bgNumber = gameState.player.settings.background;
        const imageUrl = `assets/backgrounds/background ${bgNumber}.jpg`;
        document.body.style.backgroundImage = `url('${imageUrl}')`;
    }
}

export function populateTaskLists() {
    const workoutHtml = WORKOUT_TASKS.map(task => {
        const hasInputs = task.inputs.length > 0;
        const inputsHtml = task.inputs.map(input => `<input type="number" placeholder="${input.charAt(0).toUpperCase() + input.slice(1)}" data-task-id="${task.id}" data-input-type="${input.toLowerCase()}" class="task-input w-full rounded-md p-1 text-sm mt-1">`).join('');
        return `<div class="card p-3 rounded-md"><label class="flex items-center space-x-3"><input type="checkbox" id="task-${task.id}" data-task-id="${task.id}" class="task-checkbox"><span>${task.name}</span></label>${hasInputs ? `<div class="mt-2 pl-8">${inputsHtml}<div class="text-right text-xs text-gray-400 pr-1 mt-1" id="pb-${task.id}"></div></div>` : ''}</div>`;
    }).join('');
    document.getElementById('workout-content').innerHTML = workoutHtml;
    
    const habitsHtml = DAILY_HABITS.map(task => `<label class="card p-3 rounded-md flex items-center space-x-3 cursor-pointer hover:bg-gray-700"><input type="checkbox" id="task-${task.id}" data-task-id="${task.id}" class="task-checkbox"><span>${task.name}</span></label>`).join('');
    document.getElementById('daily-habits-content').innerHTML = habitsHtml;
    
    document.getElementById('quests-content').innerHTML = `
        <div id="quest-list" class="space-y-2"></div>
        <form id="add-quest-form" class="flex items-center gap-2 mt-4">
            <input id="new-quest-desc" type="text" placeholder="New Quest Description" class="task-input flex-grow rounded-md p-2" required>
            <input id="new-quest-exp" type="number" placeholder="EXP" class="task-input w-24 rounded-md p-2" required>
            <button type="submit" class="btn bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md">Add</button>
        </form>
    `;
}

export function recalculatePlayerStats() {
    const { player } = gameState;
    
    let totalAttack = player.attack;
    let totalMaxHp = player.max_hp;

    for (const slot in player.equipment) {
        const itemId = player.equipment[slot];
        if (itemId) {
            const item = ALL_ITEMS[itemId];
            if (item && item.bonus) {
                if (item.bonus.attack) totalAttack += item.bonus.attack;
                if (item.bonus.max_hp) totalMaxHp += item.bonus.max_hp;
            }
        }
    }

    player.total_attack = totalAttack;
    player.total_max_hp = totalMaxHp;

    player.hp = Math.min(player.hp, player.total_max_hp);
}

export function renderEquippedItems() {
    const { player } = gameState;
    document.getElementById('inventory-player-name').textContent = player.name;

    for (const slot in player.equipment) {
        const slotElement = document.getElementById(`equipped-${slot}-slot`);
        const itemId = player.equipment[slot];
        
        if (itemId) {
            const item = ALL_ITEMS[itemId];
            const bonusText = Object.entries(item.bonus).map(([stat, value]) => `+${value} ${stat.replace('_', ' ')}`).join(', ');
            slotElement.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="icon-background flex-shrink-0">
                        <img src="${item.image}" class="w-6 h-6 pixel-art">
                    </div>
                    <div>
                        <p class="font-bold text-white">${item.name}</p>
                        <p class="text-sm text-green-400">${bonusText.toUpperCase()}</p>
                    </div>
                </div>
            `;
        } else {
            slotElement.innerHTML = `<p class="text-gray-500 p-4 text-center">-${slot.charAt(0).toUpperCase() + slot.slice(1)} Slot Empty-</p>`;
        }
    }
}

export function renderUI() {
    if (!gameState || !gameState.player) return;
    const { player, current_boss, dailyLog } = gameState;
    
    recalculatePlayerStats(); // Ensure stats are up-to-date before rendering

    document.getElementById('player-level').textContent = player.level;
    document.getElementById('player-name').textContent = player.name;
    document.getElementById('player-hp-bar').style.width = `${(player.hp / player.total_max_hp) * 100}%`;
    document.getElementById('player-hp-text').textContent = `${player.hp} / ${player.total_max_hp}`;
    document.getElementById('player-mp-bar').style.width = `${(player.mp / player.max_mp) * 100}%`;
    document.getElementById('player-mp-text').textContent = `${player.mp} / ${player.max_mp}`;
    document.getElementById('player-exp-bar').style.width = `${(player.exp / player.exp_to_next_level) * 100}%`;
    document.getElementById('player-exp-text').textContent = `${player.exp} / ${player.exp_to_next_level}`;
    
    document.getElementById('boss-name').textContent = current_boss.name;
    document.getElementById('boss-image').src = current_boss.image;
    document.getElementById('boss-hp-bar').style.width = `${(current_boss.hp / current_boss.max_hp) * 100}%`;
    document.getElementById('boss-hp-text').textContent = `${current_boss.hp} / ${current_boss.max_hp}`;
    
    [...WORKOUT_TASKS, ...DAILY_HABITS].forEach(task => { 
        const checkbox = document.getElementById(`task-${task.id}`); 
        if (checkbox) checkbox.checked = dailyLog.completed_tasks.includes(task.id); 
    });
    
    WORKOUT_TASKS.forEach(task => {
        const pb_container = document.getElementById(`pb-${task.id}`);
        if (pb_container && player.personal_bests?.[task.id]) {
            pb_container.textContent = "PB: " + Object.entries(player.personal_bests[task.id])
                .map(([key, value]) => `${value}${key === 'weight' ? 'LBS' : ''}`)
                .join(' / ');
        } else if (pb_container) {
            pb_container.textContent = "PB: None";
        }
        
        if (dailyLog.workout_details && dailyLog.workout_details[task.id]) {
            for (const inputType in dailyLog.workout_details[task.id]) {
                const inputEl = document.querySelector(`input[data-task-id="${task.id}"][data-input-type="${inputType}"]`);
                if (inputEl) inputEl.value = dailyLog.workout_details[task.id][inputType];
            }
        }
    });

    updateAttackButtonState();
    renderBossModals();
    renderQuests();
    renderTaskCounters();
    renderHistory();
    renderInventory();
    renderShop();
    renderEquippedItems();
    renderAttributes();
}

export function renderBossModals() {
    const queueList = document.getElementById('boss-queue-list');
    queueList.innerHTML = (!gameState.boss_queue || gameState.boss_queue.length === 0) 
        ? `<li class="text-gray-400">No bosses in the queue.</li>`
        : gameState.boss_queue.map((boss, index) => `<li class="flex justify-between items-center bg-gray-700 p-2 rounded-md"><span>${index + 1}. ${boss.name} (${boss.hp} HP)</span></li>`).join('');

    const defeatedList = document.getElementById('defeated-boss-list');
    defeatedList.innerHTML = (!gameState.defeated_bosses || gameState.defeated_bosses.length === 0)
        ? `<li class="text-gray-400">No bosses defeated yet.</li>`
        : gameState.defeated_bosses.map(name => `<li class="text-gray-400 p-2">✔️ ${name}</li>`).join('');
}

export function renderQuests() {
    const questList = document.getElementById('quest-list');
    if (!gameState.quests || gameState.quests.length === 0) {
        questList.innerHTML = `<p class="text-gray-400">No active quests. Add one below!</p>`;
    } else {
        questList.innerHTML = gameState.quests.map((quest, index) => `
            <div class="card p-3 rounded-md flex justify-between items-center">
                <div>
                    <p>${quest.description}</p>
                    <p class="text-sm text-purple-400">+${quest.exp} EXP</p>
                </div>
                <button class="complete-quest-btn btn bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md" data-quest-index="${index}">Complete</button>
            </div>
        `).join('');
    }
}

export function renderTaskCounters() {
    const completedWorkouts = WORKOUT_TASKS.filter(t => gameState.dailyLog.completed_tasks.includes(t.id)).length;
    document.getElementById('workout-counter').textContent = `(${completedWorkouts}/${WORKOUT_TASKS.length})`;
    const completedHabits = DAILY_HABITS.filter(t => gameState.dailyLog.completed_tasks.includes(t.id)).length;
    document.getElementById('habits-counter').textContent = `(${completedHabits}/${DAILY_HABITS.length})`;
}

export function renderHistory() {
    const historyContent = document.getElementById('history-content');
    const todayObj = new Date();
    const year = todayObj.getFullYear();
    const month = todayObj.getMonth();
    const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
    const monthName = todayObj.toLocaleString('default', { month: 'long' });
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let calendarHtml = `
        <div class="text-center font-bold text-lg mb-4">${monthName} ${year}</div>
        <div class="grid grid-cols-7 gap-2 text-center text-xs font-rpg">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div id="calendar-grid" class="grid grid-cols-7 gap-1 text-center text-sm">
    `;
    for (let i = 0; i < firstDay; i++) { calendarHtml += `<div></div>`; }
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const historyEntry = gameState.history.find(h => h.date === dateStr);
        let isWorkoutDone = historyEntry ? WORKOUT_TASKS.some(wt => historyEntry.completed_tasks.includes(wt.id)) : false;
        if (dateStr === gameState.dailyLog.date && WORKOUT_TASKS.some(wt => gameState.dailyLog.completed_tasks.includes(wt.id))) { isWorkoutDone = true; }
        let dayClasses = 'calendar-day w-full aspect-square rounded-md flex items-center justify-center';
        let dataAttribute = '';
        if (isWorkoutDone) {
            dayClasses += ' workout-done clickable-day';
            dataAttribute = `data-date="${dateStr}"`;
        }
        if (dateStr === todayStr) dayClasses += ' today';
        calendarHtml += `<div class="${dayClasses}" ${dataAttribute}>${day}</div>`;
    }
    calendarHtml += `</div>`;
    historyContent.innerHTML = calendarHtml;
}

export function renderInventory() {
    const inventoryContent = document.getElementById('inventory-content');
    if (!gameState.player.inventory || gameState.player.inventory.length === 0) {
        inventoryContent.innerHTML = `<p class="text-gray-400">Your bag is empty.</p>`;
    } else {
        inventoryContent.innerHTML = gameState.player.inventory.map(item => {
            const itemDetails = ALL_ITEMS[item.id];
            let buttonHtml = '';
            if (itemDetails.type === 'potion') {
                buttonHtml = `<button class="use-item-btn btn bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md" data-item-id="${item.id}">Use</button>`;
            } else if (['weapon', 'armor'].includes(itemDetails.type)) {
                buttonHtml = `<button class="equip-item-btn btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-md" data-item-id="${item.id}">Equip</button>`;
            }
            return `
                <div class="card p-3 rounded-md flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <div class="icon-background">
                            <img src="${itemDetails.image}" class="w-6 h-6 pixel-art">
                        </div>
                        <div>
                            <p>${itemDetails.name} (x${item.quantity || 1})</p>
                            <p class="text-sm text-gray-400">${itemDetails.description}</p>
                        </div>
                    </div>
                    ${buttonHtml}
                </div>
            `;
        }).join('');
    }
}

export function updateAttackButtonState() {
    const workoutCompleted = WORKOUT_TASKS.some(wt => gameState.dailyLog.completed_tasks.includes(wt.id));
    const attackBtn = document.getElementById('attack-btn');
    const specialAttackBtn = document.getElementById('special-attack-btn');
    const canAttack = workoutCompleted && !gameState.dailyLog.attack_performed;
    attackBtn.disabled = !canAttack;
    specialAttackBtn.disabled = !canAttack || gameState.player.mp < SPECIAL_ATTACK.mp_cost;
    let message = "Complete a workout to attack.";
    if (workoutCompleted && !gameState.dailyLog.attack_performed) {
        message = `Ready! Current Streak: ${gameState.player.training_streak || 0}`;
    } else if (gameState.dailyLog.attack_performed) {
        message = "You have already attacked today.";
    }
    document.getElementById('attack-message').textContent = message;
    document.getElementById('special-attack-message').textContent = `Cost: ${SPECIAL_ATTACK.mp_cost} MP`;
}

export function showNotification(message, type = 'success') {
    const notificationEl = document.getElementById('notification');
    let bgColor = 'bg-green-500';
    if (type === 'crit') bgColor = 'bg-yellow-500';
    if (type === 'error') bgColor = 'bg-red-500';
    if (type === 'item') bgColor = 'bg-purple-500';
    notificationEl.textContent = message;
    notificationEl.className = `notification fixed top-5 right-5 text-white p-4 rounded-lg shadow-lg opacity-0 transform translate-y-10 z-50 ${bgColor}`;
    notificationEl.classList.remove('opacity-0', 'translate-y-10');
    setTimeout(() => {
        notificationEl.classList.add('opacity-0', 'translate-y-10');
    }, 2000);
}

export function renderShop() {
    document.getElementById('shop-gold-display').textContent = gameState.player.gold;
    const itemsContainer = document.getElementById('shop-items-container');
    itemsContainer.innerHTML = SHOP_ITEMS.map(shopItem => {
        const itemDetails = ALL_ITEMS[shopItem.id];
        return `
            <div class="card p-3 rounded-md flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <div class="icon-background">
                        <img src="${itemDetails.image}" class="w-6 h-6 pixel-art">
                    </div>
                    <div>
                        <p>${itemDetails.name}</p>
                        <p class="text-sm text-gray-400">${itemDetails.description}</p>
                    </div>
                </div>
                <button class="buy-item-btn btn bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-md flex items-center gap-1" data-item-id="${shopItem.id}">
                    <span>${shopItem.cost}</span>
                    <img src="assets/icons/gold.png" class="w-4 h-4">
                </button>
            </div>
        `;
    }).join('');
}

export function renderAttributes() {
    const { player } = gameState;
    const attributesContent = document.getElementById('attributes-content');
    const totalLuck = (player.base_luck || 5) + Math.floor((player.training_streak || 0) / 3);
    const attributesHtml = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div class="card p-2 rounded-md">
                <span class="text-2xl">⚔️</span>
                <p class="text-xs text-gray-400">Attack</p>
                <p class="font-bold text-white">${player.total_attack}</p>
            </div>
            <div class="card p-2 rounded-md">
                <span class="text-2xl">❤️</span>
                <p class="text-xs text-gray-400">Max HP</p>
                <p class="font-bold text-white">${player.total_max_hp}</p>
            </div>
            <div class="card p-2 rounded-md">
                <span class="text-2xl">🔷</span>
                <p class="text-xs text-gray-400">Max MP</p>
                <p class="font-bold text-white">${player.max_mp}</p>
            </div>
            <div class="card p-2 rounded-md">
                <span class="text-2xl">🍀</span>
                <p class="text-xs text-gray-400">Luck</p>
                <p class="font-bold text-white">${totalLuck}</p>
            </div>
        </div>
        <div class="card p-2 rounded-md mt-4 text-center">
            <span class="text-2xl">💰</span>
            <p class="text-xs text-gray-400">Gold</p>
            <p class="font-bold text-white">${player.gold}</p>
        </div>
    `;
    attributesContent.innerHTML = attributesHtml;
}

export function showDailySummary(dateStr) {
    let logData = null;
    if (dateStr === gameState.dailyLog.date) {
        logData = gameState.dailyLog;
    } else {
        logData = gameState.history.find(h => h.date === dateStr);
    }

    if (!logData) return;

    const modal = document.getElementById('summary-modal');
    const titleEl = document.getElementById('summary-modal-title');
    const contentEl = document.getElementById('summary-modal-content');

    const date = new Date(dateStr + 'T00:00:00');
    titleEl.textContent = `Summary for ${date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

    let contentHtml = '';
    
    // VVV These two lines are now fixed (db. prefix removed) VVV
    const completedWorkouts = WORKOUT_TASKS.filter(task => logData.completed_tasks.includes(task.id));
    const completedHabits = DAILY_HABITS.filter(task => logData.completed_tasks.includes(task.id));

    if (completedWorkouts.length > 0) {
        contentHtml += '<h4 class="font-rpg text-yellow-400 text-sm">Workout Details</h4><ul class="list-disc list-inside text-gray-400 space-y-1">';
        completedWorkouts.forEach(task => {
            let details = '';
            if (logData.workout_details && logData.workout_details[task.id]) {
                details = Object.entries(logData.workout_details[task.id])
                    .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
                    .join(', ');
            }
            contentHtml += `<li>${task.name}${details ? ` <span class="text-xs">(${details})</span>` : ''}</li>`;
        });
        contentHtml += '</ul>';
    }

    if (completedHabits.length > 0) {
        contentHtml += '<h4 class="font-rpg text-green-400 text-sm mt-4">Habits Completed</h4><ul class="list-disc list-inside text-gray-400 space-y-1">';
        completedHabits.forEach(task => {
            contentHtml += `<li>${task.name}</li>`;
        });
        contentHtml += '</ul>';
    }
    
    contentEl.innerHTML = contentHtml || '<p class="text-gray-500">No details were logged for this day.</p>';
    modal.style.display = 'flex';
}
