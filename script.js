const initialGameState = {
    player: { level: 1, hp: 100, max_hp: 100, mp: 50, max_mp: 50, attack: 5, base_luck: 5, exp: 0, exp_to_next_level: 100, training_streak: 0, personal_bests: {}, inventory: [] },
    current_boss: { name: "Ifrit", hp: 300, max_hp: 300, ability: "Burn" },
    boss_queue: [],
    defeated_bosses: [],
    quests: [],
    history: [],
    dailyLog: { date: new Date().toISOString().split('T')[0], completed_tasks: [], workout_details: {} }
};
let gameState = JSON.parse(JSON.stringify(initialGameState));

const WORKOUT_TASKS = [ { id: 'stretch', name: 'Stretch', inputs: [] }, { id: 'seated_leg_curl', name: 'Seated Leg Curl', inputs: ['Weight', 'Reps', 'Rounds'] }, { id: 'leg_press', name: 'Leg Press', inputs: ['Weight', 'Reps', 'Rounds'] }, { id: 'leg_curl_laying', name: 'Leg Curl Laying Down', inputs: ['Weight', 'Reps', 'Rounds'] }, { id: 'inverted_bosu', name: 'Inverted Bosu', inputs: ['Reps', 'Rounds'] }, { id: 'hip_abductor_in', name: 'Hip Abductor In', inputs: ['Weight', 'Reps', 'Rounds'] }, { id: 'hip_abductor_out', name: 'Hip Abductor Out', inputs: ['Weight', 'Reps', 'Rounds'] }, { id: 'glute_drive', name: 'Glute Drive', inputs: ['Weight', 'Reps', 'Rounds'] }, { id: 'abs', name: 'Abs', inputs: ['Reps', 'Rounds'] }, { id: 'push_ups', name: 'Push Ups', inputs: ['Reps', 'Rounds'] }, { id: 'pull_ups', name: 'Pull Ups', inputs: ['Reps', 'Rounds'] }, ];
const DAILY_HABITS = [ { id: 'reading', name: 'Reading', exp: 10, mp_regen: 10 }, { id: 'meditation', name: 'Meditation', exp: 5, mp_regen: 5 }, { id: 'clean_house', name: 'Clean/Organize House', exp: 5 }, { id: 'inbox_zero', name: 'Inbox Zero', exp: 5 }, { id: 'healthy_diet', name: 'Healthy Diet', exp: 10, hp_regen: 10 }, ];
const SPECIAL_ATTACK = { name: 'Fireball', mp_cost: 20, damage_multiplier: 2.5 };
const CRITICAL_HIT_MULTIPLIER = 2.0;
const ALL_TASKS = [...WORKOUT_TASKS, ...DAILY_HABITS];
const ITEMS = { 'health_potion': { name: 'Health Potion', description: 'Restores 50 HP.', effect: (gs) => { gs.player.hp = Math.min(gs.player.max_hp, gs.player.hp + 50); }}, 'mana_potion': { name: 'Mana Potion', description: 'Restores 20 MP.', effect: (gs) => { gs.player.mp = Math.min(gs.player.max_mp, gs.player.mp + 20); }} };
const ITEM_DROP_CHANCE = 5; // Base 5% chance

const notificationEl = document.getElementById('notification');

document.addEventListener('DOMContentLoaded', () => {
    populateTaskLists();
    setupEventListeners();
    loadGameData();
});

function loadGameData() {
    const savedData = localStorage.getItem('habitQuestRpgGame');
    if (savedData) {
        gameState = JSON.parse(savedData);
        if (!gameState.boss_queue) gameState.boss_queue = [];
        if (!gameState.defeated_bosses) gameState.defeated_bosses = [];
        if (!gameState.quests) gameState.quests = [];
        if (!gameState.history) gameState.history = [];
        if (!gameState.player.base_luck) gameState.player.base_luck = 5;
        if (!gameState.player.inventory) gameState.player.inventory = [];
    } else {
        gameState = JSON.parse(JSON.stringify(initialGameState));
    }
    const today = new Date().toISOString().split('T')[0];
    if (gameState.dailyLog.date !== today) {
        resetDailyTasks();
    } else {
        renderUI();
    }
}

function saveGameData() {
    localStorage.setItem('habitQuestRpgGame', JSON.stringify(gameState));
}

function populateTaskLists() {
    const workoutHtml = WORKOUT_TASKS.map(task => {
        const hasInputs = task.inputs.length > 0;
        const gridCols = hasInputs ? `grid-cols-${task.inputs.length}` : '';
        return `<div class="card p-3 rounded-md"><label class="flex items-center space-x-3"><input type="checkbox" id="task-${task.id}" data-task-id="${task.id}" class="task-checkbox"><span>${task.name}</span></label>${hasInputs ? `<div class="grid ${gridCols} gap-2 mt-2 pl-8 items-center">${task.inputs.map(input => `<div class="col-span-1"><input type="number" placeholder="${input}" data-task-id="${task.id}" data-input-type="${input.toLowerCase()}" class="task-input w-full rounded-md p-1 text-sm"></div>`).join('')}<div class="col-span-${task.inputs.length} text-right text-xs text-gray-400 pr-1" id="pb-${task.id}"></div></div>` : ''}</div>`;
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

function setupEventListeners() {
    const setupCollapsible = (toggleId, contentId, arrowId) => {
        document.getElementById(toggleId).addEventListener('click', () => {
            const content = document.getElementById(contentId);
            content.classList.toggle('open');
            document.getElementById(arrowId).textContent = content.classList.contains('open') ? '▲' : '▼';
        });
    };
    setupCollapsible('workout-toggle', 'workout-content', 'workout-arrow');
    setupCollapsible('habits-toggle', 'daily-habits-content', 'habits-arrow');
    setupCollapsible('quests-toggle', 'quests-content', 'quests-arrow');
    document.getElementById('attack-btn').addEventListener('click', () => handleAttack('normal'));
    document.getElementById('special-attack-btn').addEventListener('click', () => handleAttack('special'));
    document.body.addEventListener('change', e => e.target.matches('input[type="checkbox"][data-task-id]') && handleTaskToggle(e.target.dataset.taskId, e.target.checked));
    document.body.addEventListener('input', e => e.target.matches('input[type="number"][data-task-id]') && handleWorkoutInput(e.target));
    
    const setupModal = (btnId, modalId, closeId) => {
        const modal = document.getElementById(modalId);
        document.getElementById(btnId).addEventListener('click', () => modal.style.display = 'flex');
        document.getElementById(closeId).addEventListener('click', () => modal.style.display = 'none');
        modal.querySelector('.modal-overlay').addEventListener('click', () => modal.style.display = 'none');
    };
    setupModal('boss-modal-btn', 'boss-modal', 'boss-modal-close');
    setupModal('info-modal-btn', 'info-modal', 'info-modal-close');
    setupModal('player-stats-modal-btn', 'player-stats-modal', 'player-stats-modal-close');
    setupModal('inventory-modal-btn', 'inventory-modal', 'inventory-modal-close');

    document.getElementById('add-boss-form').addEventListener('submit', handleAddBoss);
    document.getElementById('add-quest-form').addEventListener('submit', handleAddQuest);
    document.getElementById('quest-list').addEventListener('click', e => e.target.matches('.complete-quest-btn') && handleCompleteQuest(parseInt(e.target.dataset.questIndex)));
    document.getElementById('inventory-content').addEventListener('click', e => e.target.matches('.use-item-btn') && useItem(e.target.dataset.itemId));
}

function handleAttack(attackType) {
    let expGained = 0, hpRegen = 0, mpRegen = 0;
    const workoutCompleted = WORKOUT_TASKS.some(wt => gameState.dailyLog.completed_tasks.includes(wt.id));
    if (workoutCompleted) { expGained += 30; gameState.player.training_streak = (gameState.player.training_streak || 0) + 1; }
    gameState.dailyLog.completed_tasks.forEach(taskId => {
        const habit = DAILY_HABITS.find(h => h.id === taskId);
        if (habit) { expGained += habit.exp || 0; hpRegen += habit.hp_regen || 0; mpRegen += habit.mp_regen || 0; }
    });
    gameState.player.hp = Math.min(gameState.player.max_hp, gameState.player.hp + hpRegen);
    gameState.player.mp = Math.min(gameState.player.max_mp, gameState.player.mp + mpRegen);
    gameState.player.exp += expGained;
    
    let damageMultiplier = 1.0;
    if (attackType === 'special') {
        if (gameState.player.mp >= SPECIAL_ATTACK.mp_cost) {
            gameState.player.mp -= SPECIAL_ATTACK.mp_cost;
            damageMultiplier = SPECIAL_ATTACK.damage_multiplier;
        } else {
            showNotification("Not enough MP!", 'error'); return;
        }
    }
    
    const totalLuck = (gameState.player.base_luck || 5) + Math.floor((gameState.player.training_streak || 0) / 3);
    const isCritical = Math.random() * 100 < totalLuck;
    if (isCritical) {
        damageMultiplier *= CRITICAL_HIT_MULTIPLIER;
        showNotification("CRITICAL HIT!", 'crit');
    }

    const streakBonus = 1 + (0.1 * Math.max(0, gameState.player.training_streak - 1));
    const totalDamage = Math.round(gameState.player.attack * streakBonus * damageMultiplier);
    gameState.current_boss.hp = Math.max(0, gameState.current_boss.hp - totalDamage);
    document.getElementById('boss-card').classList.add('character-shake');
    setTimeout(() => document.getElementById('boss-card').classList.remove('character-shake'), 500);

    if (gameState.current_boss.ability && gameState.current_boss.ability.toLowerCase() === 'burn') {
        gameState.player.hp = Math.max(0, gameState.player.hp - 5);
        document.getElementById('player-card').classList.add('character-shake');
        setTimeout(() => document.getElementById('player-card').classList.remove('character-shake'), 500);
    }

    updatePersonalBests();
    handleLevelUp();
    if (gameState.current_boss.hp <= 0) {
        showNotification(`Defeated ${gameState.current_boss.name}!`, 'success');
        gameState.defeated_bosses.push(gameState.current_boss.name);
        if (gameState.boss_queue && gameState.boss_queue.length > 0) {
            gameState.current_boss = gameState.boss_queue.shift();
        } else {
            gameState.current_boss = { name: "Ifrit (Respawned)", hp: 300, max_hp: 300, ability: "Burn" };
        }
    }
    saveGameData();
    renderUI();
}

function handleLevelUp() {
    let levelUps = 0;
    while (gameState.player.exp >= gameState.player.exp_to_next_level) {
        levelUps++;
        gameState.player.level++;
        gameState.player.exp -= gameState.player.exp_to_next_level;
        gameState.player.exp_to_next_level = Math.round(gameState.player.exp_to_next_level * 1.5);
        gameState.player.max_hp += 10;
        gameState.player.max_mp += 5;
        gameState.player.attack += 2;
        if(gameState.player.level % 3 === 0) gameState.player.base_luck++;
        gameState.player.hp = gameState.player.max_hp;
        gameState.player.mp = gameState.player.max_mp;
    }
    if (levelUps > 0) showNotification(`Leveled up to ${gameState.player.level}!`);
}

function handleTaskToggle(taskId, isChecked) {
    const completed = gameState.dailyLog.completed_tasks;
    if (isChecked) {
        if (!completed.includes(taskId)) {
            completed.push(taskId);
            handleItemDrop();
        }
    } else { 
        const index = completed.indexOf(taskId); 
        if (index > -1) completed.splice(index, 1); 
    }
    updateAttackButtonState();
    saveGameData();
    renderTaskCounters();
}

function handleItemDrop() {
    const totalLuck = (gameState.player.base_luck || 5) + Math.floor((gameState.player.training_streak || 0) / 3);
    if (Math.random() * 100 < (ITEM_DROP_CHANCE + totalLuck / 2)) {
        const itemKeys = Object.keys(ITEMS);
        const randomItemKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
        addItemToInventory(randomItemKey);
        showNotification(`You found a ${ITEMS[randomItemKey].name}!`, 'item');
    }
}

function addItemToInventory(itemId) {
    const existingItem = gameState.player.inventory.find(item => item.id === itemId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        gameState.player.inventory.push({ id: itemId, quantity: 1 });
    }
}

function useItem(itemId) {
    const itemIndex = gameState.player.inventory.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
        const item = gameState.player.inventory[itemIndex];
        ITEMS[item.id].effect(gameState);
        item.quantity--;
        if (item.quantity <= 0) {
            gameState.player.inventory.splice(itemIndex, 1);
        }
        showNotification(`Used ${ITEMS[item.id].name}.`, 'success');
        saveGameData();
        renderUI();
    }
}

function handleWorkoutInput(inputElement) {
    const taskId = inputElement.dataset.taskId;
    const inputType = inputElement.dataset.inputType;
    const value = inputElement.value;
    if (!gameState.dailyLog.workout_details[taskId]) gameState.dailyLog.workout_details[taskId] = {};
    gameState.dailyLog.workout_details[taskId][inputType] = parseFloat(value) || 0;
    const checkbox = document.getElementById(`task-${taskId}`);
    if (value && !checkbox.checked) {
        checkbox.checked = true;
        handleTaskToggle(taskId, true);
    }
}

function handleAddBoss(e) {
    e.preventDefault();
    const name = e.target.elements['new-boss-name'].value.trim();
    const hp = parseInt(e.target.elements['new-boss-hp'].value);
    const ability = e.target.elements['new-boss-ability'].value.trim();
    if (name && hp > 0) {
        gameState.boss_queue.push({ name, max_hp: hp, hp, ability });
        e.target.reset();
        saveGameData();
        renderBossModals();
    }
}

function handleAddQuest(e) {
    e.preventDefault();
    const description = e.target.elements['new-quest-desc'].value.trim();
    const exp = parseInt(e.target.elements['new-quest-exp'].value);
    if (description && exp > 0) {
        gameState.quests.push({ description, exp });
        e.target.reset();
        saveGameData();
        renderQuests();
    }
}

function handleCompleteQuest(index) {
    const quest = gameState.quests[index];
    if (quest) {
        gameState.player.exp += quest.exp;
        gameState.quests.splice(index, 1);
        showNotification(`Quest Complete! +${quest.exp} EXP`, 'success');
        handleLevelUp();
        saveGameData();
        renderUI();
    }
}

function updatePersonalBests() {
    if (!gameState.player.personal_bests) gameState.player.personal_bests = {};
    const pbs = gameState.player.personal_bests;
    const details = gameState.dailyLog.workout_details;
    for (const taskId in details) {
        if (!pbs[taskId]) pbs[taskId] = {};
        for (const inputType in details[taskId]) {
            const currentValue = details[taskId][inputType];
            const bestValue = pbs[taskId][inputType] || 0;
            if (currentValue > bestValue) { pbs[taskId][inputType] = currentValue; }
        }
    }
}

function resetDailyTasks() {
    if (gameState.dailyLog.completed_tasks.length > 0) {
        gameState.history.push(JSON.parse(JSON.stringify(gameState.dailyLog)));
        if (gameState.history.length > 30) gameState.history.shift();
    }
    const today = new Date().toISOString().split('T')[0];
    const yesterdayWorkoutCompleted = WORKOUT_TASKS.some(wt => gameState.dailyLog.completed_tasks.includes(wt.id));
    if (!yesterdayWorkoutCompleted) gameState.player.training_streak = 0;
    gameState.dailyLog = { date: today, completed_tasks: [], workout_details: {} };
    saveGameData();
    renderUI();
}

function renderUI() {
    if (!gameState || !gameState.player) return;
    const { player, current_boss, dailyLog } = gameState;
    document.getElementById('player-level').textContent = player.level;
    document.getElementById('player-hp-bar').style.width = `${(player.hp / player.max_hp) * 100}%`;
    document.getElementById('player-hp-text').textContent = `${player.hp} / ${player.max_hp}`;
    document.getElementById('player-mp-bar').style.width = `${(player.mp / player.max_mp) * 100}%`;
    document.getElementById('player-mp-text').textContent = `${player.mp} / ${player.max_mp}`;
    document.getElementById('player-exp-bar').style.width = `${(player.exp / player.exp_to_next_level) * 100}%`;
    document.getElementById('player-exp-text').textContent = `${player.exp} / ${player.exp_to_next_level}`;
    const totalLuck = (player.base_luck || 5) + Math.floor((player.training_streak || 0) / 3);
    document.getElementById('player-luck-text').textContent = `LUCK: ${totalLuck}`;
    document.getElementById('boss-name').textContent = current_boss.name;
    document.getElementById('boss-hp-bar').style.width = `${(current_boss.hp / current_boss.max_hp) * 100}%`;
    document.getElementById('boss-hp-text').textContent = `${current_boss.hp} / ${current_boss.max_hp}`;
    [...WORKOUT_TASKS, ...DAILY_HABITS].forEach(task => { const checkbox = document.getElementById(`task-${task.id}`); if (checkbox) checkbox.checked = dailyLog.completed_tasks.includes(task.id); });
    WORKOUT_TASKS.forEach(task => {
        const pb_container = document.getElementById(`pb-${task.id}`);
        if (pb_container) {
            const pbs = player.personal_bests?.[task.id];
            let pb_string = "PB: ";
            if (pbs) { pb_string += task.inputs.map(input => `${pbs[input.toLowerCase()] || 0}${input === 'Weight' ? 'kg' : ''}`).join(' / '); } 
            else { pb_string += "None"; }
            pb_container.textContent = pb_string;
        }
        task.inputs.forEach(input => { const inputEl = document.querySelector(`input[data-task-id="${task.id}"][data-input-type="${input.toLowerCase()}"]`); if (inputEl) inputEl.value = dailyLog.workout_details?.[task.id]?.[input.toLowerCase()] || ''; });
    });
    updateAttackButtonState();
    renderBossModals();
    renderQuests();
    renderTaskCounters();
    renderHistory();
    renderInventory();
}

function renderBossModals() {
    const queueList = document.getElementById('boss-queue-list');
    if (!gameState.boss_queue || gameState.boss_queue.length === 0) { 
        queueList.innerHTML = `<li class="text-gray-400">No bosses in the queue.</li>`; 
    } else { 
        queueList.innerHTML = gameState.boss_queue.map((boss, index) => `<li class="flex justify-between items-center bg-gray-700 p-2 rounded-md"><span>${index + 1}. ${boss.name} (${boss.hp} HP)</span></li>`).join(''); 
    }

    const defeatedList = document.getElementById('defeated-boss-list');
    // The typo was in the next line: "defeated_besses" is now correctly "defeated_bosses"
    if (!gameState.defeated_bosses || gameState.defeated_bosses.length === 0) { 
        defeatedList.innerHTML = `<li class="text-gray-400">No bosses defeated yet.</li>`; 
    } else { 
        defeatedList.innerHTML = gameState.defeated_bosses.map(name => `<li class="text-gray-400 p-2">✔️ ${name}</li>`).join(''); 
    }
}

function renderQuests() {
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

function renderTaskCounters() {
    const completedWorkouts = WORKOUT_TASKS.filter(t => gameState.dailyLog.completed_tasks.includes(t.id)).length;
    document.getElementById('workout-counter').textContent = `(${completedWorkouts}/${WORKOUT_TASKS.length})`;
    const completedHabits = DAILY_HABITS.filter(t => gameState.dailyLog.completed_tasks.includes(t.id)).length;
    document.getElementById('habits-counter').textContent = `(${completedHabits}/${DAILY_HABITS.length})`;
}

function renderHistory() {
    const historyContent = document.getElementById('history-content');
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const monthName = today.toLocaleString('default', { month: 'long' });
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let calendarHtml = `
        <div class="text-center font-bold text-lg mb-4">${monthName} ${year}</div>
        <div class="grid grid-cols-7 gap-2 text-center text-xs font-rpg">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center text-sm">
    `;

    for (let i = 0; i < firstDay; i++) {
        calendarHtml += `<div></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const historyEntry = gameState.history.find(h => h.date === dateStr);
        const isWorkoutDone = historyEntry ? WORKOUT_TASKS.some(wt => historyEntry.completed_tasks.includes(wt.id)) : false;
        
        let dayClasses = 'calendar-day w-full aspect-square rounded-md flex items-center justify-center';
        if (isWorkoutDone) dayClasses += ' workout-done';
        if (day === today.getDate() && dateStr === today.toISOString().split('T')[0]) dayClasses += ' today';

        calendarHtml += `<div class="${dayClasses}">${day}</div>`;
    }

    calendarHtml += `</div>`;
    historyContent.innerHTML = calendarHtml;
}

function renderInventory() {
    const inventoryContent = document.getElementById('inventory-content');
    if (!gameState.player.inventory || gameState.player.inventory.length === 0) {
        inventoryContent.innerHTML = `<p class="text-gray-400">Your bag is empty.</p>`;
    } else {
        inventoryContent.innerHTML = gameState.player.inventory.map(item => {
            const itemDetails = ITEMS[item.id];
            return `
                <div class="card p-3 rounded-md flex justify-between items-center">
                    <div>
                        <p>${itemDetails.name} (x${item.quantity})</p>
                        <p class="text-sm text-gray-400">${itemDetails.description}</p>
                    </div>
                    <button class="use-item-btn btn bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md" data-item-id="${item.id}">Use</button>
                </div>
            `;
        }).join('');
    }
}

function updateAttackButtonState() {
    const workoutCompleted = WORKOUT_TASKS.some(wt => gameState.dailyLog.completed_tasks.includes(wt.id));
    const attackBtn = document.getElementById('attack-btn');
    const specialAttackBtn = document.getElementById('special-attack-btn');
    
    attackBtn.disabled = !workoutCompleted;
    document.getElementById('attack-message').textContent = workoutCompleted ? `Ready! Current Streak: ${gameState.player.training_streak || 0}` : "Complete a workout to attack.";

    specialAttackBtn.disabled = !workoutCompleted || gameState.player.mp < SPECIAL_ATTACK.mp_cost;
    document.getElementById('special-attack-message').textContent = `Cost: ${SPECIAL_ATTACK.mp_cost} MP`;
}

function showNotification(message, type = 'success') {
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
