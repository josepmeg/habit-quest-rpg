// === MODULE IMPORTS ===
import { gameState, loadGameData, saveGameData, importData } from './gameState.js';
import * as db from './database.js';
import * as ui from './ui.js';

// === TOP-LEVEL STATE VARIABLES ===
let calendarView = {
    year: new Date().getFullYear(),
    month: new Date().getMonth()
};

// === GAME INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    loadGameData(() => {
        ui.populateTaskLists();
        setupEventListeners();
        ui.applySettings();
        ui.renderUI();
    });
});

// === GAME LOGIC FUNCTIONS ===
function handleAttack(attackType) {
    if (gameState.dailyLog.attack_performed) {
        ui.showNotification("You have already logged progress today.", "error");
        return;
    }

    // --- Step 1: Grant rewards for ALL completed tasks ---
    let expGained = 0, hpRegen = 0, mpRegen = 0, goldGained = 0;
    gameState.dailyLog.completed_tasks.forEach(taskId => {
        const habit = gameState.player.custom_habits.find(h => h.id === taskId);
        if (habit) {
            expGained += habit.exp || 0;
            hpRegen += habit.hp_regen || 0;
            mpRegen += habit.mp_regen || 0;
            goldGained += 1;
        }
    });

    // --- Step 2: Check if a workout was completed and handle the attack ---
    const workoutCompleted = gameState.player.custom_workouts.some(wt => gameState.dailyLog.completed_tasks.includes(wt.id));

    if (workoutCompleted) {
        // Grant workout-specific rewards
        expGained += 30;
        goldGained += 5;
        gameState.player.training_streak = (gameState.player.training_streak || 0) + 1;

        // Perform attack logic
        let damageMultiplier = 1.0;
        if (attackType === 'special') {
            if (gameState.player.mp >= db.SPECIAL_ATTACK.mp_cost) {
                gameState.player.mp -= db.SPECIAL_ATTACK.mp_cost;
                damageMultiplier = db.SPECIAL_ATTACK.damage_multiplier;
            } else {
                ui.showNotification("Not enough MP!", "error");
                // Important: return here so the day isn't finalized if special attack fails
                return; 
            }
        }
        const totalLuck = (gameState.player.base_luck || 5) + Math.floor((gameState.player.training_streak || 0) / 3);
        const isCritical = Math.random() * 100 < totalLuck;
        if (isCritical) {
            damageMultiplier *= db.CRITICAL_HIT_MULTIPLIER;
            ui.showNotification("CRITICAL HIT!", 'crit');
        }
        const streakBonus = 1 + (0.1 * Math.max(0, gameState.player.training_streak - 1));
        const totalDamage = Math.round(gameState.player.total_attack * streakBonus * damageMultiplier);
        gameState.current_boss.hp = Math.max(0, gameState.current_boss.hp - totalDamage);
        document.getElementById('boss-column').classList.add('character-shake');
        setTimeout(() => document.getElementById('boss-column').classList.remove('character-shake'), 500);

        // Boss retaliation
        if (gameState.current_boss.ability && gameState.current_boss.ability.toLowerCase() === 'burn') {
            gameState.player.hp = Math.max(0, gameState.player.hp - 5);
            document.getElementById('player-column').classList.add('character-shake');
            setTimeout(() => document.getElementById('player-column').classList.remove('character-shake'), 500);
        }
        updatePersonalBests();
    } else {
        // This is what happens on a "rest day" with only habits
        ui.showNotification("Habits logged successfully!", 'success');
    }

    // --- Step 3: Apply all earned rewards and check for level up ---
    gameState.player.hp = Math.min(gameState.player.total_max_hp, gameState.player.hp + hpRegen);
    gameState.player.mp = Math.min(gameState.player.max_mp, gameState.player.mp + mpRegen);
    gameState.player.exp += expGained;
    gameState.player.gold += goldGained;
    if (goldGained > 0) ui.showNotification(`You earned ${goldGained} gold!`, 'success');

    handleLevelUp();

    // --- Step 4: Check for boss defeat (only if a workout was done) ---
    if (workoutCompleted && gameState.current_boss.hp <= 0) {
        ui.showNotification(`Defeated ${gameState.current_boss.name}!`, 'success');
        const defeatedBossData = { name: gameState.current_boss.name, max_hp: gameState.current_boss.max_hp };
        gameState.defeated_bosses.push(defeatedBossData);

        if (gameState.boss_queue && gameState.boss_queue.length > 0) {
            gameState.current_boss = gameState.boss_queue.shift();
        } else {
            gameState.current_boss = { name: "Ifrit (Respawned)", hp: 300, max_hp: 300, ability: "Burn", image: "assets/sprites/ifrit.png" };
        }
    }

    // --- Step 5: Finalize the day ---
    gameState.dailyLog.attack_performed = true;
    saveGameData();
    ui.renderUI();
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
        if (gameState.player.level % 3 === 0) gameState.player.base_luck++;
        gameState.player.hp = gameState.player.max_hp;
        gameState.player.mp = gameState.player.max_mp;
    }
    if (levelUps > 0) {
        ui.showNotification(`Leveled up to ${gameState.player.level}!`);
        ui.recalculatePlayerStats();
    }
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
    ui.updateAttackButtonState();
    saveGameData();
    ui.renderTaskCounters();
}

function handleItemDrop() {
    const totalLuck = (gameState.player.base_luck || 5) + Math.floor((gameState.player.training_streak || 0) / 3);
    if (Math.random() * 100 < (db.ITEM_DROP_CHANCE + totalLuck / 2)) {
        const itemKeys = Object.keys(db.ALL_ITEMS).filter(key => db.ALL_ITEMS[key].type === 'potion');
        if (itemKeys.length > 0) {
            const randomItemKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
            addItemToInventory(randomItemKey);
            ui.showNotification(`You found a ${db.ALL_ITEMS[randomItemKey].name}!`, 'item');
        }
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
        if (db.ALL_ITEMS[item.id].effect) {
            db.ALL_ITEMS[item.id].effect(gameState);
        }
        item.quantity--;
        if (item.quantity <= 0) {
            gameState.player.inventory.splice(itemIndex, 1);
        }
        ui.showNotification(`Used ${db.ALL_ITEMS[item.id].name}.`, 'success');
        saveGameData();
        ui.renderUI();
    }
}

function handleWorkoutInput(inputElement) {
    const taskId = inputElement.dataset.taskId;
    const inputType = inputElement.dataset.inputType;
    const value = inputElement.value;
    if (!gameState.dailyLog.workout_details[taskId]) gameState.dailyLog.workout_details[taskId] = {};
    if (inputType === 'time_hours' || inputType === 'time_minutes') {
        const hoursInput = document.querySelector(`input[data-task-id="${taskId}"][data-input-type="time_hours"]`);
        const minutesInput = document.querySelector(`input[data-task-id="${taskId}"][data-input-type="time_minutes"]`);
    
        const hours = parseInt(hoursInput.value) || 0;
        const minutes = parseInt(minutesInput.value) || 0;
    
        // Save total minutes under the 'time' key to keep PB tracking consistent
        gameState.dailyLog.workout_details[taskId]['time'] = (hours * 60) + minutes;
    } else {
        gameState.dailyLog.workout_details[taskId][inputType] = parseFloat(value) || 0;
    } 
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
        const imageName = name.toLowerCase().replace(/\s+/g, '-') + '.png';
        const imagePath = `assets/sprites/${imageName}`;
        gameState.boss_queue.push({ name, max_hp: hp, hp, ability, image: imagePath });
        e.target.reset();
        saveGameData();
        ui.renderBossModals();
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
        ui.renderQuests();
    }
}

function handleCompleteQuest(index) {
    const quest = gameState.quests[index];
    if (quest) {
        gameState.player.exp += quest.exp;
        gameState.quests.splice(index, 1);
        ui.showNotification(`Quest Complete! +${quest.exp} EXP`, 'success');
        handleLevelUp();
        saveGameData();
        ui.renderUI();
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
            if (currentValue > bestValue) {
                pbs[taskId][inputType] = currentValue;
            }
        }
    }
}

function handleEquipItem(itemId) {
    const item = db.ALL_ITEMS[itemId];
    if (!item || !item.type) return;
    const { player } = gameState;
    const { type } = item;
    const currentItemInSlot = player.equipment[type];
    if (currentItemInSlot === itemId) return;
    if (currentItemInSlot) {
        addItemToInventory(currentItemInSlot);
    }
    const itemIndexInInventory = player.inventory.findIndex(invItem => invItem.id === itemId);
    if (itemIndexInInventory > -1) {
        if (player.inventory[itemIndexInInventory].quantity > 1) {
            player.inventory[itemIndexInInventory].quantity--;
        } else {
            player.inventory.splice(itemIndexInInventory, 1);
        }
    }
    player.equipment[type] = itemId;
    ui.showNotification(`Equipped ${item.name}!`, 'success');
    ui.recalculatePlayerStats();
    saveGameData();
    ui.renderUI();
}

function handlePurchase(itemId) {
    const itemToBuy = db.SHOP_ITEMS.find(item => item.id === itemId);
    if (!itemToBuy) return;
    if (gameState.player.gold >= itemToBuy.cost) {
        gameState.player.gold -= itemToBuy.cost;
        addItemToInventory(itemToBuy.id);
        const itemDetails = db.ALL_ITEMS[itemToBuy.id];
        ui.showNotification(`Purchased ${itemDetails.name}!`, 'success');
        saveGameData();
        ui.renderUI();
    } else {
        ui.showNotification("Not enough gold!", "error");
    }
}

function exportData() {
    const jsonString = JSON.stringify(gameState);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    link.download = `habitquest-save-${todayStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    ui.showNotification("Game data exported!", "success");
}

function setupTaskManagementListeners() {
    const addHabitBtn = document.getElementById('add-habit-btn');

    if (addHabitBtn) {
        addHabitBtn.addEventListener('click', () => {
            // Prevent adding multiple forms if one is already open
            if (document.getElementById('new-task-form')) return;

            // Create the HTML for our new temporary form
            const formHTML = `
                <div id="new-task-form" class="card p-3 rounded-md flex items-center gap-2">
                    <input type="text" id="new-habit-name" placeholder="Enter new habit name" class="task-input flex-grow rounded-md p-2">
                    <button id="save-new-habit" class="btn bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-md">Save</button>
                    <button id="cancel-new-habit" class="btn bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-3 rounded-md">X</button>
                </div>
            `;

            // Add the form to the top of the habits list
            document.getElementById('daily-habits-content').insertAdjacentHTML('afterbegin', formHTML);

            // --- Add Listeners to the new Save and Cancel buttons ---
            document.getElementById('save-new-habit').addEventListener('click', () => {
                const newName = document.getElementById('new-habit-name').value.trim();
                if (newName) {
                    // Create a unique ID for the new habit
                    const newId = 'habit_' + Date.now();
                    
                    // Add the new habit to our gameState
                    gameState.player.custom_habits.push({ id: newId, name: newName, exp: 5 }); // Default 5 EXP

                    saveGameData();
                    ui.renderUI(); // Re-render the entire UI to show the new habit
                }
            });

            document.getElementById('cancel-new-habit').addEventListener('click', () => {
                document.getElementById('new-task-form').remove();
            });
        });
    }

    const addWorkoutBtn = document.getElementById('add-workout-btn');
    if (addWorkoutBtn) {
        addWorkoutBtn.addEventListener('click', () => {
            const modal = document.getElementById('field-chooser-modal');
            modal.style.display = 'flex';
        });
    }

    const cancelFieldChooserBtn = document.getElementById('cancel-field-chooser-btn');
    if (cancelFieldChooserBtn) {
        cancelFieldChooserBtn.addEventListener('click', () => {
            const modal = document.getElementById('field-chooser-modal');
            modal.style.display = 'none';
        });
    }

    const createWorkoutBtn = document.getElementById('create-workout-btn');
    if (createWorkoutBtn) {
        createWorkoutBtn.addEventListener('click', () => {
            // 1. Find all checked boxes and get their values
            const checkedBoxes = document.querySelectorAll('#field-checkboxes input[type="checkbox"]:checked');
            const selectedFields = Array.from(checkedBoxes).map(cb => cb.value);

            // 2. Close the chooser modal
            document.getElementById('field-chooser-modal').style.display = 'none';
            // Optional: Uncheck boxes for next time
            checkedBoxes.forEach(cb => cb.checked = false);

            // 3. Prevent adding a new form if one is already open
            if (document.getElementById('new-task-form')) return;

            // 4. Build the dynamic input fields HTML
            const inputsHTML = selectedFields.map(field => 
                `<input type="number" placeholder="${field}" data-field="${field.toLowerCase()}" class="task-input flex-grow rounded-md p-2 text-sm">`
            ).join('');

            // 5. Build the full form HTML
            const formHTML = `
                <div id="new-task-form" class="card p-3 rounded-md space-y-2">
                    <div class="flex items-center gap-2">
                        <input type="text" id="new-workout-name" placeholder="Enter new workout name" class="task-input flex-grow rounded-md p-2">
                        <button id="save-new-workout" class="btn bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-md">Save</button>
                        <button id="cancel-new-workout" class="btn bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-3 rounded-md">X</button>
                    </div>
                    <div class="flex items-center gap-2 pl-4">
                        ${inputsHTML}
                    </div>
                </div>
            `;

            // 6. Add the form to the top of the workout list
            document.getElementById('workout-content').insertAdjacentHTML('afterbegin', formHTML);

            // 7. Add a listener to the new Cancel button (Save logic will come next)
            document.getElementById('cancel-new-workout').addEventListener('click', () => {
                document.getElementById('new-task-form').remove();
            });

            document.getElementById('save-new-workout').addEventListener('click', () => {
                console.log("Save workout button clicked!");
                const newName = document.getElementById('new-workout-name').value.trim();
                if (!newName) {
                    alert('Please enter a name for the workout.');
                    return;
                }

                // Find all the dynamic input fields and get their 'data-field' attribute
                const fieldInputs = document.querySelectorAll('#new-task-form [data-field]');
                const inputsArray = Array.from(fieldInputs).map(input => {
                    const value = input.getAttribute('data-field');
                    return value.charAt(0).toUpperCase() + value.slice(1); // Capitalize first letter
                });

                // Create the new workout object
                const newWorkout = {
                    id: 'workout_' + Date.now(),
                    name: newName,
                    inputs: inputsArray // e.g., ['Weight', 'Reps']
                };

                // Add to gameState, save, and re-render the UI
                gameState.player.custom_workouts.push(newWorkout);
                saveGameData();
                ui.renderUI();
            });
            
        });
    }

    const editWorkoutBtn = document.getElementById('edit-workout-btn');
    const workoutContent = document.getElementById('workout-content');

    if (editWorkoutBtn) {
        editWorkoutBtn.addEventListener('click', () => {
            workoutContent.classList.toggle('edit-mode');
        });
    }

    if (workoutContent) {
        workoutContent.addEventListener('click', e => {
            if (e.target.matches('.delete-task-btn')) {
                handleDeleteTask(e.target.dataset.taskId, 'workout');
            }
        });
    }

    const editHabitBtn = document.getElementById('edit-habit-btn');
    const habitsContent = document.getElementById('daily-habits-content');

    if (editHabitBtn) {
        editHabitBtn.addEventListener('click', () => {
            habitsContent.classList.toggle('edit-mode');
        });
    }
    
    if (habitsContent) {
        habitsContent.addEventListener('click', e => {
            if (e.target.matches('.delete-task-btn')) {
                handleDeleteTask(e.target.dataset.taskId, 'habit');
            }
        });
    }
    
}

function handleDeleteTask(taskId, taskType) {
    if (confirm('Are you sure you want to delete this task?')) {
        if (taskType === 'workout') {
            gameState.player.custom_workouts = gameState.player.custom_workouts.filter(task => task.id !== taskId);
        } else if (taskType === 'habit') {
            gameState.player.custom_habits = gameState.player.custom_habits.filter(task => task.id !== taskId);
        }
        saveGameData();
        ui.renderUI();
    }
}

// === EVENT LISTENERS ===
function setupEventListeners() {
    // === Collapsible Sections ===
    const setupCollapsible = (toggleId, contentId, arrowId) => {
        const toggleButton = document.getElementById(toggleId);
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                const content = document.getElementById(contentId);
                content.classList.toggle('open');
                const arrow = document.getElementById(arrowId);
                if (arrow) arrow.textContent = content.classList.contains('open') ? '▲' : '▼';
            });
        }
    };
    setupCollapsible('workout-toggle', 'workout-content', 'workout-arrow');
    setupCollapsible('habits-toggle', 'daily-habits-content', 'habits-arrow');
    setupCollapsible('quests-toggle', 'quests-content', 'quests-arrow');
    setupCollapsible('attributes-toggle', 'attributes-content', 'attributes-arrow');
    setupCollapsible('info-core-toggle', 'info-core-content', 'info-core-arrow');
    setupCollapsible('info-combat-toggle', 'info-combat-content', 'info-combat-arrow');
    setupCollapsible('info-progression-toggle', 'info-progression-content', 'info-progression-arrow');
    setupCollapsible('info-equipment-toggle', 'info-equipment-content', 'info-equipment-arrow');

    // === Modal Event Listeners (Explicitly Defined) ===
    const allModals = document.querySelectorAll('.modal');
    allModals.forEach(modal => {
        const modalId = modal.id;
        const openBtn = document.getElementById(`${modalId}-btn`);
        const closeBtn = document.getElementById(`${modalId}-close`);
        const overlay = modal.querySelector('.modal-overlay');

        if (openBtn) {
            openBtn.addEventListener('click', () => {
                // Special logic for calendar modal
                if (modalId === 'player-stats-modal') {
                    calendarView = { year: new Date().getFullYear(), month: new Date().getMonth() };
                    ui.renderHistory(calendarView.year, calendarView.month);
                }
                modal.style.display = 'flex';
            });
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.style.display = 'none');
        }
        if (overlay) {
            overlay.addEventListener('click', () => modal.style.display = 'none');
        }
    });

    // === Calendar Navigation ===
    const prevMonthBtn = document.getElementById('prev-month-btn');
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            calendarView.month--;
            if (calendarView.month < 0) {
                calendarView.month = 11;
                calendarView.year--;
            }
            ui.renderHistory(calendarView.year, calendarView.month);
        });
    }
    const nextMonthBtn = document.getElementById('next-month-btn');
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            calendarView.month++;
            if (calendarView.month > 11) {
                calendarView.month = 0;
                calendarView.year++;
            }
            ui.renderHistory(calendarView.year, calendarView.month);
        });
    }
    
    // === Core Game Actions & The Rest of the Function ... ===
    document.getElementById('attack-btn').addEventListener('click', () => handleAttack('normal'));
    document.getElementById('special-attack-btn').addEventListener('click', () => handleAttack('special'));
    document.body.addEventListener('change', e => e.target.matches('input[type="checkbox"][data-task-id]') && handleTaskToggle(e.target.dataset.taskId, e.target.checked));
    document.body.addEventListener('input', e => e.target.matches('input[type="number"][data-task-id]') && handleWorkoutInput(e.target));
    document.body.addEventListener('submit', e => {
        if (e.target.id === 'add-quest-form') {
            handleAddQuest(e);
        } else if (e.target.id === 'add-boss-form') {
            handleAddBoss(e);
        }
    });
    
    // === Dynamic Content Listeners (Event Delegation) ===
    document.body.addEventListener('click', e => {
        // Listener for completing quests
        if (e.target.matches('.complete-quest-btn')) {
            handleCompleteQuest(parseInt(e.target.dataset.questIndex));
        }
    
        // Listener for using or equipping inventory items
        if (e.target.matches('.use-item-btn')) {
            useItem(e.target.dataset.itemId);
        } else if (e.target.matches('.equip-item-btn')) {
            handleEquipItem(e.target.dataset.itemId);
        }
    
        // Listener for buying shop items
        if (e.target.matches('.buy-item-btn')) {
            handlePurchase(e.target.dataset.itemId);
        }
    });
    
    // === Player & Data Management ===
    document.getElementById('player-name').addEventListener('click', () => {
        const newName = prompt("Enter your character's name:", gameState.player.name);
        if (newName && newName.trim() !== '') {
            gameState.player.name = newName.trim();
            saveGameData();
            ui.renderUI();
            ui.showNotification("Character name updated!", 'success');
        }
    });
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) { exportBtn.addEventListener('click', exportData); }
    const importInput = document.getElementById('import-input');
    if (importInput) {
        importInput.addEventListener('change', (event) => {
            importData(event, (success, error) => {
                if (success) {
                    ui.showNotification("Import successful! Reloading...", "success");
                    setTimeout(() => location.reload(), 1500);
                } else {
                    ui.showNotification("Error importing file. Please select a valid save file.", "error");
                    console.error("Import failed:", error);
                }
            });
        });
    }
    const resetBtn = document.getElementById('reset-game-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all game progress? This cannot be undone.')) {
                localStorage.removeItem('habitQuestRpgGame');
                location.reload();
            }
        });
    }

    // === Visuals & Misc ===
    const bgSwitcher = document.getElementById('background-switcher');
    if (bgSwitcher) {
        bgSwitcher.addEventListener('click', (e) => {
            if (e.target.matches('button[data-bg]')) {
                gameState.player.settings.background = parseInt(e.target.dataset.bg, 10);
                ui.applySettings();
                saveGameData();
            }
        });
    }
    const historyContent = document.getElementById('history-content');
    if (historyContent) {
        historyContent.addEventListener('click', (e) => {
            if (e.target.matches('.clickable-day')) {
                ui.showDailySummary(e.target.dataset.date);
            }
        });
    }

    setupTaskManagementListeners();
    
}
