import { gameState } from './gameState.js';
import { SHOP_ITEMS, ALL_ITEMS, SPECIAL_ATTACK, ALL_BOSSES } from './database.js';

let notificationQueue = [];
let isNotificationVisible = false;

export function applySettings() {
    if (gameState.player.settings && gameState.player.settings.background) {
        const bgNumber = gameState.player.settings.background;
        const imageUrl = `assets/backgrounds/background ${bgNumber}.jpg`;
        document.body.style.backgroundImage = `url('${imageUrl}')`;
    }
}

export function populateTaskLists() {
    const workoutHtml = gameState.player.custom_workouts.map(task => {
        const hasInputs = task.inputs.length > 0;
        // This logic correctly creates a grid with the right number of columns
        let inputsHtml = '';
        if (hasInputs) {
            const inputElements = [];
            task.inputs.forEach(input => {
                const inputLower = input.toLowerCase();
                if (inputLower === 'time') {
                    inputElements.push(`<div class="col-span-1"><input type="number" min="0" placeholder="Hours" data-task-id="${task.id}" data-input-type="time_hours" class="task-input w-full rounded-md p-1 text-sm"></div>`);
                    inputElements.push(`<div class="col-span-1"><input type="number" min="0" max="59" placeholder="Mins" data-task-id="${task.id}" data-input-type="time_minutes" class="task-input w-full rounded-md p-1 text-sm"></div>`);
                } else {
                    const step = (inputLower === 'distance') ? '0.1' : '1';
                    inputElements.push(`<div class="col-span-1"><input type="number" step="${step}" min="0" placeholder="${input}" data-task-id="${task.id}" data-input-type="${inputLower}" class="task-input w-full rounded-md p-1 text-sm"></div>`);
                }
            });
        
            const gridCols = `grid-cols-${inputElements.length}`;
            inputsHtml = `<div class="grid ${gridCols} gap-2 mt-2 pl-8 items-center">
                            ${inputElements.join('')}
                            <div class="col-span-${inputElements.length} text-right text-xs text-gray-400 pr-1" id="pb-${task.id}"></div>
                          </div>`;
        }
        return `<div class="card p-3 rounded-md">
                    <div class="flex justify-between items-center">
                        <label class="flex items-center space-x-3">
                            <input type="checkbox" id="task-${task.id}" data-task-id="${task.id}" class="task-checkbox">
                            <span>${task.name}</span>
                        </label>
                        <button class="delete-task-btn hidden text-red-500 font-bold" data-task-id="${task.id}">X</button>
                    </div>
                    ${inputsHtml}
                </div>`;
    }).join('');
    document.getElementById('workout-content').innerHTML = workoutHtml;
    
    const habitsHtml = gameState.player.custom_habits.map(task => 
        `<label class="card p-3 rounded-md flex justify-between items-center space-x-3 cursor-pointer hover:bg-gray-700">
            <div class="flex items-center space-x-3">
                <input type="checkbox" id="task-${task.id}" data-task-id="${task.id}" class="task-checkbox">
                <span>${task.name}</span>
            </div>
            <button class="delete-task-btn hidden text-red-500 font-bold" data-task-id="${task.id}">X</button>
        </label>`
    ).join('');
    
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
    populateTaskLists();
    
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
    
    [...gameState.player.custom_workouts, ...gameState.player.custom_habits].forEach(task => { 
        const checkbox = document.getElementById(`task-${task.id}`); 
        if (checkbox) checkbox.checked = dailyLog.completed_tasks.includes(task.id); 
    });
    
    gameState.player.custom_workouts.forEach(task => {
        const pb_container = document.getElementById(`pb-${task.id}`);
        if (pb_container && player.personal_bests?.[task.id]) {
            pb_container.textContent = "PB: " + Object.entries(player.personal_bests[task.id])
                .map(([key, value]) => {
                    if (key === 'weight') return `${value} LBS`;
                    if (key === 'distance') return `${value} KM`;
                    if (key === 'time') { // Assumes time is stored in total minutes
                        const hours = Math.floor(value / 60);
                        const minutes = value % 60;
                        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                    }
                    return value; // Default for Reps, Rounds, etc.
                })
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
    renderCollection();
    renderFooter();
}

export function renderBossModals() {
    const queueList = document.getElementById('boss-queue-list');
    if (!queueList) return; // Safety check

    queueList.innerHTML = (!gameState.boss_queue || gameState.boss_queue.length === 0) 
        ? `<li class="text-gray-400">No bosses in the queue.</li>`
        : gameState.boss_queue.map((boss, index) => 
            `<li class="flex justify-between items-center bg-gray-700 p-2 rounded-md"><span>${index + 1}. ${boss.name} (${boss.max_hp} HP)</span></li>`
          ).join('');
}

export function renderQuests() {
    const questCounter = document.getElementById('quest-counter');
    if (questCounter) {
        questCounter.textContent = `(${gameState.quests.length})`;
    }
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
    const completedWorkouts = gameState.player.custom_workouts.filter(t => gameState.dailyLog.completed_tasks.includes(t.id)).length;
    document.getElementById('workout-counter').textContent = `(${completedWorkouts}/${gameState.player.custom_workouts.length})`;
    const completedHabits = gameState.player.custom_habits.filter(t => gameState.dailyLog.completed_tasks.includes(t.id)).length;
    document.getElementById('habits-counter').textContent = `(${completedHabits}/${gameState.player.custom_habits.length})`;
}

export function renderHistory(year, month) {
    const calendarTitle = document.getElementById('calendar-title');
    const calendarGridContainer = document.getElementById('calendar-grid-container');

    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

    const viewDate = new Date(year, month, 1);
    calendarTitle.textContent = `${viewDate.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDay = viewDate.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let calendarHtml = `
        <div class="grid grid-cols-7 gap-2 text-center text-xs font-rpg">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div id="calendar-grid" class="grid grid-cols-7 gap-1 text-center text-sm">
    `;
    for (let i = 0; i < firstDay; i++) { calendarHtml += `<div></div>`; }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayLog = (dateStr === gameState.dailyLog.date) ? gameState.dailyLog : gameState.history.find(h => h.date === dateStr);

        let dayClasses = 'calendar-day w-full aspect-square rounded-md flex items-center justify-center';
        let dataAttribute = '';

        if (dayLog && dayLog.completed_tasks.length > 0) {
            const isWorkoutDone = gameState.player.custom_workouts.some(wt => dayLog.completed_tasks.includes(wt.id));
            const areHabitsDone = gameState.player.custom_habits.some(ht => dayLog.completed_tasks.includes(ht.id));

            if (isWorkoutDone) {
                dayClasses += ' workout-done clickable-day';
            } else if (areHabitsDone) {
                dayClasses += ' habits-done clickable-day'; // Our new class
            }
            dataAttribute = `data-date="${dateStr}"`;
        }

        if (dateStr === todayStr) dayClasses += ' today';
        calendarHtml += `<div class="${dayClasses}" ${dataAttribute}>${day}</div>`;
    }
    calendarHtml += `</div>`;
    calendarGridContainer.innerHTML = calendarHtml;

    const nextMonthBtn = document.getElementById('next-month-btn');
    const isCurrentOrFutureMonth = (year > todayObj.getFullYear()) || (year === todayObj.getFullYear() && month >= todayObj.getMonth());
    nextMonthBtn.disabled = isCurrentOrFutureMonth;
    if (isCurrentOrFutureMonth) {
        nextMonthBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        nextMonthBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
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
    const workoutCompleted = gameState.player.custom_workouts.some(wt => gameState.dailyLog.completed_tasks.includes(wt.id));
    const anyTaskCompleted = gameState.dailyLog.completed_tasks.length > 0;
    const attackBtn = document.getElementById('attack-btn');
    const specialAttackBtn = document.getElementById('special-attack-btn');
    const canLogDay = anyTaskCompleted && !gameState.dailyLog.attack_performed;
    attackBtn.disabled = !canLogDay;
    specialAttackBtn.disabled = !workoutCompleted || !canLogDay || gameState.player.mp < SPECIAL_ATTACK.mp_cost;
    
    let message = "Complete a task to log your day.";
    if (canLogDay) {
        if (workoutCompleted) {
            message = `Ready to Attack! Current Streak: ${gameState.player.training_streak || 0}`;
        } else {
            message = "Log habits to earn rewards.";
        }
    }
    if (gameState.dailyLog.attack_performed) {
        message = "You have already logged your progress today.";
    }
    const attackMessageElement = document.getElementById('attack-message');
    attackMessageElement.textContent = message;
    attackMessageElement.classList.add('attack-message-text');
    const specialAttackMessageElement = document.getElementById('special-attack-message');
    specialAttackMessageElement.textContent = `Cost: ${SPECIAL_ATTACK.mp_cost} MP`;
    specialAttackMessageElement.classList.add('attack-message-text');
}

export function showNotification(message, type = 'success') {
    // Add the new message to the end of the queue
    notificationQueue.push({ message, type });

    // If a notification isn't already on screen, start processing the queue
    if (!isNotificationVisible) {
        processNextNotification();
    }
}

function processNextNotification() {
    // If the queue is empty, we're done
    if (notificationQueue.length === 0) {
        isNotificationVisible = false;
        return;
    }

    // Mark that a notification is now visible
    isNotificationVisible = true;

    // Get the next message from the front of the queue
    const notificationData = notificationQueue.shift();
    const notificationEl = document.getElementById('notification');

    // Set the message and style
    let bgColor = 'bg-green-500';
    if (notificationData.type === 'crit') bgColor = 'bg-yellow-500';
    if (notificationData.type === 'error') bgColor = 'bg-red-500';
    if (notificationData.type === 'item') bgColor = 'bg-purple-500';
    notificationEl.textContent = notificationData.message;
    notificationEl.className = `notification fixed top-5 right-5 text-white p-4 rounded-lg shadow-lg opacity-0 transform translate-y-10 z-50 ${bgColor}`;

    // Make it appear
    notificationEl.classList.remove('opacity-0', 'translate-y-10');

    // Set a timer to hide it
    setTimeout(() => {
        notificationEl.classList.add('opacity-0', 'translate-y-10');

        // Wait for the fade-out animation (500ms) to finish before processing the next item in the queue
        setTimeout(() => {
            processNextNotification();
        }, 500);

    }, 2000); // Display each notification for 2 seconds
}

export function renderShop() {
    document.getElementById('shop-gold-display').textContent = gameState.player.gold;
    const itemsContainer = document.getElementById('shop-items-container');
    itemsContainer.innerHTML = SHOP_ITEMS.map(shopItem => {
        const itemDetails = ALL_ITEMS[shopItem.id];
        // Check for a bonus and create the text for it
        let bonusHtml = '';
        if (itemDetails.bonus) {
            const bonusText = Object.entries(itemDetails.bonus)
                .map(([stat, value]) => `+${value} ${stat.replace('_', ' ').toUpperCase()}`)
                .join(', ');
            bonusHtml = `<p class="text-xs text-green-400 font-bold">${bonusText}</p>`;
        }
        return `
            <div class="card p-3 rounded-md flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <div class="icon-background">
                        <img src="${itemDetails.image}" class="w-6 h-6 pixel-art">
                    </div>
                    <div>
                        <p>${itemDetails.name}</p>
                        ${bonusHtml} <p class="text-sm text-gray-400">${itemDetails.description}</p>
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

export function renderFooter() {
    const footerText = document.getElementById('footer-text');
    const savedData = localStorage.getItem('habitQuestRpgGame');

    if (savedData && footerText) {
        const sizeInBytes = new Blob([savedData]).size;
        const sizeInKB = (sizeInBytes / 1024).toFixed(2);
        footerText.textContent = `Game data is saved locally in your browser. (Size: ${sizeInKB} KB)`;
        footerText.classList.add('attack-message-text'); // Add this line
    }
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
    const completedWorkouts = gameState.player.custom_workouts.filter(task => logData.completed_tasks.includes(task.id));
    const completedHabits = gameState.player.custom_habits.filter(task => logData.completed_tasks.includes(task.id));

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

export function populateBossSpriteDropdown() {
    const bossNameDropdown = document.getElementById('new-boss-name');
    if (!bossNameDropdown) return;
    const optionsHtml = ALL_BOSSES.map(boss =>
        `<option value="${boss.id}">${boss.name}</option>`
    ).join('');
    bossNameDropdown.innerHTML = optionsHtml;
}

export function renderCollection() {
    const grid = document.getElementById('collection-grid');
    if (!grid) return;
    const defeatCounts = gameState.player.defeat_counts || {};

    grid.innerHTML = ALL_BOSSES.map(boss => {
        const count = defeatCounts[boss.id] || 0;
        const isUnlocked = count > 0;

        const spriteHtml = isUnlocked
            ? `<img src="${boss.image}" alt="${boss.name}">`
            : `<img src="${boss.image}" class="sprite-silhouette" alt="Undiscovered Boss">`;

        const nameHtml = isUnlocked
            ? `<p class="font-bold text-sm mt-2">${boss.name} (${count})</p>`
            : `<p class="font-bold text-sm mt-2 text-gray-500">??? (0)</p>`;

        return `<div class="collection-card">${spriteHtml}${nameHtml}</div>`;
    }).join('');
}

export function showDamageSplash(damage, type = 'normal', targetId = 'boss-column', soundId = null) {
    const target = document.getElementById(targetId);
    if (!target) return;

    // --- NEW: Play the sound immediately ---
    if (soundId) {
        playSound(soundId);
    }
    // --- END NEW LOGIC ---

    // Create the number element
    const splash = document.createElement('div');
    splash.textContent = damage;
    splash.classList.add('damage-splash');

    // Add a color class based on the type
    if (type === 'crit') {
        splash.classList.add('damage-crit');
    } else if (type === 'super-effective') {
        splash.classList.add('damage-super-effective');
    } else if (type === 'not-effective') {
        splash.classList.add('damage-not-effective');
    }

    // Add the element to the screen
    target.appendChild(splash);

    // Remove the element after the animation finishes
    setTimeout(() => {
        splash.remove();
    }, 1000);
}

export function triggerScreenShake() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.classList.add('screen-shake');
        setTimeout(() => {
            mainContent.classList.remove('screen-shake');
        }, 400); // Duration must match the CSS animation
    }
}

export function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0; // Rewinds the sound to the start
        sound.play();
    }
}
