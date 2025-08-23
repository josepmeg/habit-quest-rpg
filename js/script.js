import { gameState, loadGameData, saveGameData } from './gameState.js';
import { ALL_ITEMS, SHOP_ITEMS, WORKOUT_TASKS, DAILY_HABITS, SPECIAL_ATTACK, CRITICAL_HIT_MULTIPLIER, ALL_TASKS, ITEM_DROP_CHANCE } from './database.js';

const notificationEl = document.getElementById('notification');

document.addEventListener('DOMContentLoaded', () => {
    loadGameData(() => {
        // This code runs after the game state has been loaded
        populateTaskLists();
        setupEventListeners();
        recalculatePlayerStats();
        applySettings();
        renderUI();
    });
});
function exportData() {
    const jsonString = JSON.stringify(gameState);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habitquest-save-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification("Game data exported!", "success");
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) {
        return; // No file selected
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedState = JSON.parse(e.target.result);
            // Basic validation to ensure it's a valid save file
            if (importedState.player && importedState.current_boss) {
                gameState = importedState;
                saveGameData();
                showNotification("Import successful! Reloading...", "success");
                setTimeout(() => location.reload(), 1500);
            } else {
                throw new Error("Invalid save file format.");
            }
        } catch (error) {
            showNotification("Error importing file. Please select a valid save file.", "error");
            console.error("Import failed:", error);
        }
    };
    reader.readAsText(file);
    // Clear the input value to allow importing the same file again
    event.target.value = '';
}

function applySettings() {
    if (gameState.player.settings && gameState.player.settings.background) {
        const bgNumber = gameState.player.settings.background;
        const imageUrl = `assets/backgrounds/background ${bgNumber}.jpg`;
        document.body.style.backgroundImage = `url('${imageUrl}')`;
    }
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
    // Collapsible sections
    const setupCollapsible = (toggleId, contentId, arrowId) => {
        const toggleButton = document.getElementById(toggleId);
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                const content = document.getElementById(contentId);
                content.classList.toggle('open');
                document.getElementById(arrowId).textContent = content.classList.contains('open') ? '▲' : '▼';
            });
        }
    };
    setupCollapsible('workout-toggle', 'workout-content', 'workout-arrow');
    setupCollapsible('habits-toggle', 'daily-habits-content', 'habits-arrow');
    setupCollapsible('quests-toggle', 'quests-content', 'quests-arrow');
    setupCollapsible('attributes-toggle', 'attributes-content', 'attributes-arrow');

    // Attack buttons
    document.getElementById('attack-btn').addEventListener('click', () => handleAttack('normal'));
    document.getElementById('special-attack-btn').addEventListener('click', () => handleAttack('special'));

    // Task and workout inputs
    document.body.addEventListener('change', e => e.target.matches('input[type="checkbox"][data-task-id]') && handleTaskToggle(e.target.dataset.taskId, e.target.checked));
    document.body.addEventListener('input', e => e.target.matches('input[type="number"][data-task-id]') && handleWorkoutInput(e.target));

    // Modal setup
    const setupModal = (btnId, modalId, closeId) => {
        const modal = document.getElementById(modalId);
        const openBtn = document.getElementById(btnId);
        const closeBtn = document.getElementById(closeId);
        if (modal && openBtn && closeBtn) {
            openBtn.addEventListener('click', () => modal.style.display = 'flex');
            closeBtn.addEventListener('click', () => modal.style.display = 'none');
            modal.querySelector('.modal-overlay').addEventListener('click', () => modal.style.display = 'none');
        }
    };
    setupModal('boss-modal-btn', 'boss-modal', 'boss-modal-close');
    setupModal('info-modal-btn', 'info-modal', 'info-modal-close');
    setupModal('player-stats-modal-btn', 'player-stats-modal', 'player-stats-modal-close');
    setupModal('inventory-modal-btn', 'inventory-modal', 'inventory-modal-close');
    setupModal('shop-modal-btn', 'shop-modal', 'shop-modal-close'); // New shop modal

    // Form submissions
    document.getElementById('add-boss-form').addEventListener('submit', handleAddBoss);
    document.getElementById('add-quest-form').addEventListener('submit', handleAddQuest);

    // Dynamic content listeners
    document.getElementById('quest-list').addEventListener('click', e => e.target.matches('.complete-quest-btn') && handleCompleteQuest(parseInt(e.target.dataset.questIndex)));
    document.getElementById('inventory-content').addEventListener('click', e => {
        if (e.target.matches('.use-item-btn')) {
            useItem(e.target.dataset.itemId);
        } else if (e.target.matches('.equip-item-btn')) {
            handleEquipItem(e.target.dataset.itemId);
        }
    });
    const shopContainer = document.getElementById('shop-items-container');
    if (shopContainer) {
        shopContainer.addEventListener('click', e => e.target.matches('.buy-item-btn') && handlePurchase(e.target.dataset.itemId));
    }

    // Editable player name
    document.getElementById('player-name').addEventListener('click', () => {
        const newName = prompt("Enter your character's name:", gameState.player.name);
        if (newName && newName.trim() !== '') {
            gameState.player.name = newName.trim();
            saveGameData();
            renderUI();
            showNotification("Character name updated!", 'success');
        }
    });

    // Reset button
    const resetBtn = document.getElementById('reset-game-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            const isConfirmed = confirm('Are you sure you want to reset all game progress? This cannot be undone.');
            if (isConfirmed) {
                localStorage.removeItem('habitQuestRpgGame');
                location.reload();
            }
        });
    }

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    const importInput = document.getElementById('import-input');
    if (importInput) {
        importInput.addEventListener('change', importData);
    }

    // Background switcher
    const bgSwitcher = document.getElementById('background-switcher');
    if (bgSwitcher) {
        bgSwitcher.addEventListener('click', (e) => {
            if (e.target.matches('button[data-bg]')) {
                const bgNumber = e.target.dataset.bg;
                gameState.player.settings.background = parseInt(bgNumber, 10);
                applySettings();
                saveGameData();
            }
        });
    }

    // Calendar day summary
    const historyContent = document.getElementById('history-content');
    if (historyContent) {
        historyContent.addEventListener('click', (e) => {
            if (e.target.matches('.clickable-day')) {
                showDailySummary(e.target.dataset.date);
            }
        });
    }

    // Summary modal closing
    const summaryModal = document.getElementById('summary-modal');
    if (summaryModal) {
        document.getElementById('summary-modal-close').addEventListener('click', () => summaryModal.style.display = 'none');
        summaryModal.querySelector('.modal-overlay').addEventListener('click', () => summaryModal.style.display = 'none');
    }
}

function handleAttack(attackType) {
    if (gameState.dailyLog.attack_performed) {
        showNotification("You have already attacked today.", "error");
        return;
    }

    let expGained = 0, hpRegen = 0, mpRegen = 0, goldGained = 0; // Added goldGained

    const workoutCompleted = WORKOUT_TASKS.some(wt => gameState.dailyLog.completed_tasks.includes(wt.id));
    if (workoutCompleted) {
        expGained += 30;
        goldGained += 5; // Award 5 gold for the workout
        gameState.player.training_streak = (gameState.player.training_streak || 0) + 1;
    }

    gameState.dailyLog.completed_tasks.forEach(taskId => {
        const habit = DAILY_HABITS.find(h => h.id === taskId);
        if (habit) {
            expGained += habit.exp || 0;
            hpRegen += habit.hp_regen || 0;
            mpRegen += habit.mp_regen || 0;
            goldGained += 1; // Award 1 gold for each habit
        }
    });

    gameState.player.hp = Math.min(gameState.player.max_hp, gameState.player.hp + hpRegen);
    gameState.player.mp = Math.min(gameState.player.max_mp, gameState.player.mp + mpRegen);
    gameState.player.exp += expGained;
    gameState.player.gold += goldGained; // Add the total gold to the player

    let damageMultiplier = 1.0;
    if (attackType === 'special') {
        if (gameState.player.mp >= SPECIAL_ATTACK.mp_cost) {
            gameState.player.mp -= SPECIAL_ATTACK.mp_cost;
            damageMultiplier = SPECIAL_ATTACK.damage_multiplier;
        } else {
            showNotification("Not enough MP!", 'error');
            return;
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
    
    document.getElementById('boss-column').classList.add('character-shake');
    setTimeout(() => document.getElementById('boss-column').classList.remove('character-shake'), 500);

    if (gameState.current_boss.ability && gameState.current_boss.ability.toLowerCase() === 'burn') {
        gameState.player.hp = Math.max(0, gameState.player.hp - 5);
        document.getElementById('player-column').classList.add('character-shake');
        setTimeout(() => document.getElementById('player-column').classList.remove('character-shake'), 500);
    }

    updatePersonalBests();
    handleLevelUp();
    if (gameState.current_boss.hp <= 0) {
        showNotification(`Defeated ${gameState.current_boss.name}!`, 'success');
        gameState.defeated_bosses.push(gameState.current_boss.name);
        if (gameState.boss_queue && gameState.boss_queue.length > 0) {
            gameState.current_boss = gameState.boss_queue.shift();
        } else {
            gameState.current_boss = { name: "Ifrit (Respawned)", hp: 300, max_hp: 300, ability: "Burn", image: "assets/sprites/ifrit.png" };
        }
    }

    if (goldGained > 0) {
        showNotification(`You earned ${goldGained} gold!`, 'success');
    }
    
    gameState.dailyLog.attack_performed = true;
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

function recalculatePlayerStats() {
    const { player } = gameState;
    
    // Start with base stats
    let totalAttack = player.attack;
    let totalMaxHp = player.max_hp;

    // Add bonuses from equipped items
    for (const slot in player.equipment) {
        const itemId = player.equipment[slot];
        if (itemId) {
            const item = ALL_ITEMS[itemId];
            if (item.bonus) {
                if (item.bonus.attack) totalAttack += item.bonus.attack;
                if (item.bonus.max_hp) totalMaxHp += item.bonus.max_hp;
                // We can add more bonus types here in the future (luck, max_mp, etc.)
            }
        }
    }

    // Store the calculated totals for use elsewhere
    player.total_attack = totalAttack;
    player.total_max_hp = totalMaxHp;

    // Ensure current HP isn't higher than the new max HP
    player.hp = Math.min(player.hp, player.total_max_hp);
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

function handleEquipItem(itemId) {
    const item = ALL_ITEMS[itemId];
    if (!item || !item.type) return;

    const { player } = gameState;
    const currentItemInSlot = player.equipment[item.type];

    // If the same item is already equipped, do nothing
    if (currentItemInSlot === itemId) return;

    // Move the currently equipped item (if any) back to inventory
    if (currentItemInSlot) {
        addItemToInventory(currentItemInSlot);
    }
    
    // Remove the new item from inventory
    const itemIndexInInventory = player.inventory.findIndex(invItem => invItem.id === itemId);
    if (itemIndexInInventory > -1) {
        player.inventory.splice(itemIndexInInventory, 1);
    }
    
    // Equip the new item
    player.equipment[item.type] = itemId;

    showNotification(`Equipped ${item.name}!`, 'success');
    recalculatePlayerStats();
    saveGameData();
    renderUI();
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
        // Auto-generate image path from name (e.g., "Ice Queen" -> "ice-queen.png")
        const imageName = name.toLowerCase().replace(/\s+/g, '-') + '.png';
        const imagePath = `assets/sprites/${imageName}`;

        gameState.boss_queue.push({ name, max_hp: hp, hp, ability, image: imagePath });
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

function renderUI() {
    if (!gameState || !gameState.player) return;
    const { player, current_boss, dailyLog } = gameState;
    document.getElementById('player-level').textContent = player.level;
    document.getElementById('player-name').textContent = player.name;
    document.getElementById('player-hp-bar').style.width = `${(player.hp / player.max_hp) * 100}%`;
    document.getElementById('player-hp-text').textContent = `${player.hp} / ${player.max_hp}`;
    document.getElementById('player-mp-bar').style.width = `${(player.mp / player.max_mp) * 100}%`;
    document.getElementById('player-mp-text').textContent = `${player.mp} / ${player.max_mp}`;
    document.getElementById('player-exp-bar').style.width = `${(player.exp / player.exp_to_next_level) * 100}%`;
    document.getElementById('player-exp-text').textContent = `${player.exp} / ${player.exp_to_next_level}`;
    document.getElementById('boss-name').textContent = current_boss.name;
    document.getElementById('boss-image').src = current_boss.image; 
    document.getElementById('boss-hp-bar').style.width = `${(current_boss.hp / current_boss.max_hp) * 100}%`;
    document.getElementById('boss-hp-text').textContent = `${current_boss.hp} / ${current_boss.max_hp}`;
    [...WORKOUT_TASKS, ...DAILY_HABITS].forEach(task => { const checkbox = document.getElementById(`task-${task.id}`); if (checkbox) checkbox.checked = dailyLog.completed_tasks.includes(task.id); });
    WORKOUT_TASKS.forEach(task => {
        const pb_container = document.getElementById(`pb-${task.id}`);
        if (pb_container) {
            const pbs = player.personal_bests?.[task.id];
            let pb_string = "PB: ";
            if (pbs) { pb_string += task.inputs.map(input => `${pbs[input.toLowerCase()] || 0}${input === 'Weight' ? 'lbs' : ''}`).join(' / '); }
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
    renderAttributes();
    renderShop();
    renderEquippedItems();
}

// Add this new function to script.js

function renderAttributes() {
    const { player } = gameState;
    const attributesContent = document.getElementById('attributes-content');
    const totalLuck = (player.base_luck || 5) + Math.floor((player.training_streak || 0) / 3);

    const attributesHtml = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div class="card p-2 rounded-md">
                <span class="text-2xl">⚔️</span>
                <p class="text-xs text-gray-400">Attack</p>
                <p class="font-bold text-white">${player.attack}</p>
            </div>
            <div class="card p-2 rounded-md">
                <span class="text-2xl">❤️</span>
                <p class="text-xs text-gray-400">Max HP</p>
                <p class="font-bold text-white">${player.max_hp}</p>
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
    `; // Added id="calendar-grid"

    for (let i = 0; i < firstDay; i++) {
        calendarHtml += `<div></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const historyEntry = gameState.history.find(h => h.date === dateStr);
        let isWorkoutDone = historyEntry ? WORKOUT_TASKS.some(wt => historyEntry.completed_tasks.includes(wt.id)) : false;
        
        if (dateStr === gameState.dailyLog.date && WORKOUT_TASKS.some(wt => gameState.dailyLog.completed_tasks.includes(wt.id))) {
            isWorkoutDone = true;
        }
        
        let dayClasses = 'calendar-day w-full aspect-square rounded-md flex items-center justify-center';
        let dataAttribute = '';
        if (isWorkoutDone) {
            dayClasses += ' workout-done clickable-day';
            dataAttribute = `data-date="${dateStr}"`; // Add data-date attribute
        }
        if (dateStr === todayStr) dayClasses += ' today';

        calendarHtml += `<div class="${dayClasses}" ${dataAttribute}>${day}</div>`;
    }

    calendarHtml += `</div>`;
    historyContent.innerHTML = calendarHtml;
}

function showDailySummary(dateStr) {
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
    
    contentEl.innerHTML = contentHtml;
    modal.style.display = 'flex';
}

function renderInventory() {
    const inventoryContent = document.getElementById('inventory-content');
    if (!gameState.player.inventory || gameState.player.inventory.length === 0) {
        inventoryContent.innerHTML = `<p class="text-gray-400">Your bag is empty.</p>`;
    } else {
        inventoryContent.innerHTML = gameState.player.inventory.map(item => {
            const itemDetails = ALL_ITEMS[item.id];
            let buttonHtml = '';

            if (itemDetails.type === 'potion') {
                buttonHtml = `<button class="use-item-btn btn bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md" data-item-id="${item.id}">Use</button>`;
            } else if (itemDetails.type === 'weapon' || itemDetails.type === 'armor') {
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

function renderShop() {
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

function renderEquippedItems() {
    const { player } = gameState;
    document.getElementById('inventory-player-name').textContent = player.name;

    for (const slot in player.equipment) { // Loops through 'weapon', 'armor', etc.
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
                        <p class="text-sm text-green-400">${bonusText}</p>
                    </div>
                </div>
            `;
        } else {
            slotElement.innerHTML = `<p class="text-gray-500 p-4 text-center">-${slot.charAt(0).toUpperCase() + slot.slice(1)} Slot Empty-</p>`;
        }
    }
}

function handlePurchase(itemId) {
    const itemToBuy = SHOP_ITEMS.find(item => item.id === itemId);
    if (!itemToBuy) return;

    if (gameState.player.gold >= itemToBuy.cost) {
        gameState.player.gold -= itemToBuy.cost;
        addItemToInventory(itemToBuy.id);
        const itemDetails = ALL_ITEMS[itemToBuy.id];
        showNotification(`Purchased ${itemDetails.name}!`, 'success');
        saveGameData();
        renderUI();
    } else {
        showNotification("Not enough gold!", "error");
    }
}

function updateAttackButtonState() {
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
