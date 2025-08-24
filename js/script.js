// === MODULE IMPORTS ===
import { gameState, loadGameData, saveGameData } from './gameState.js';
import * as db from './database.js';
import * as ui from './ui.js';

// === GAME INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    loadGameData(() => {
        // This code runs only after the game state has been loaded
        ui.populateTaskLists();
        setupEventListeners();
        ui.applySettings();
        ui.renderUI();
    });
});

// === GAME LOGIC FUNCTIONS ===
function handleAttack(attackType) {
    if (gameState.dailyLog.attack_performed) {
        ui.showNotification("You have already attacked today.", "error");
        return;
    }

    let expGained = 0, hpRegen = 0, mpRegen = 0, goldGained = 0;
    const workoutCompleted = db.WORKOUT_TASKS.some(wt => gameState.dailyLog.completed_tasks.includes(wt.id));
    if (workoutCompleted) {
        expGained += 30;
        goldGained += 5;
        gameState.player.training_streak = (gameState.player.training_streak || 0) + 1;
    }
    gameState.dailyLog.completed_tasks.forEach(taskId => {
        const habit = db.DAILY_HABITS.find(h => h.id === taskId);
        if (habit) {
            expGained += habit.exp || 0;
            hpRegen += habit.hp_regen || 0;
            mpRegen += habit.mp_regen || 0;
            goldGained += 1;
        }
    });
    gameState.player.hp = Math.min(gameState.player.total_max_hp, gameState.player.hp + hpRegen);
    gameState.player.mp = Math.min(gameState.player.max_mp, gameState.player.mp + mpRegen);
    gameState.player.exp += expGained;
    gameState.player.gold += goldGained;
    
    let damageMultiplier = 1.0;
    if (attackType === 'special') {
        if (gameState.player.mp >= db.SPECIAL_ATTACK.mp_cost) {
            gameState.player.mp -= db.SPECIAL_ATTACK.mp_cost;
            damageMultiplier = db.SPECIAL_ATTACK.damage_multiplier;
        } else {
            ui.showNotification("Not enough MP!", "error");
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

    if (gameState.current_boss.ability && gameState.current_boss.ability.toLowerCase() === 'burn') {
        gameState.player.hp = Math.max(0, gameState.player.hp - 5);
        document.getElementById('player-column').classList.add('character-shake');
        setTimeout(() => document.getElementById('player-column').classList.remove('character-shake'), 500);
    }
    updatePersonalBests();
    handleLevelUp();
    if (gameState.current_boss.hp <= 0) {
        ui.showNotification(`Defeated ${gameState.current_boss.name}!`, 'success');
        if (goldGained > 0) ui.showNotification(`You earned ${goldGained} gold!`, 'success');
        gameState.defeated_bosses.push(gameState.current_boss.name);
        if (gameState.boss_queue && gameState.boss_queue.length > 0) {
            gameState.current_boss = gameState.boss_queue.shift();
        } else {
            gameState.current_boss = { name: "Ifrit (Respawned)", hp: 300, max_hp: 300, ability: "Burn", image: "assets/sprites/ifrit.png" };
        }
    } else {
        if (goldGained > 0) ui.showNotification(`You earned ${goldGained} gold!`, 'success');
    }
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
        const randomItemKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
        addItemToInventory(randomItemKey);
        ui.showNotification(`You found a ${db.ALL_ITEMS[randomItemKey].name}!`, 'item');
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
        player.inventory.splice(itemIndexInInventory, 1);
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
    // This now uses the timezone-corrected date for the filename
    const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    link.download = `habitquest-save-${todayStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    ui.showNotification("Game data exported!", "success");
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedState = JSON.parse(e.target.result);
            if (importedState.player && importedState.current_boss) {
                gameState = importedState;
                saveGameData();
                ui.showNotification("Import successful! Reloading...", "success");
                setTimeout(() => location.reload(), 1500);
            } else {
                throw new Error("Invalid save file format.");
            }
        } catch (error) {
            ui.showNotification("Error importing file. Please select a valid save file.", "error");
            console.error("Import failed:", error);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// === EVENT LISTENERS ===

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
    setupModal('shop-modal-btn', 'shop-modal', 'shop-modal-close');

    // Form submissions
    document.getElementById('add-boss-form').addEventListener('submit', handleAddBoss);
    document.getElementById('add-quest-form').addEventListener('submit', handleAddQuest);
    
    // Dynamic content listeners
    document.getElementById('quest-list').addEventListener('click', e => e.target.matches('.complete-quest-btn') && handleCompleteQuest(parseInt(e.target.dataset.questIndex)));
    
    document.getElementById('inventory-content').addEventListener('click', e => {
        if (e.target.matches('.use-item-btn')) useItem(e.target.dataset.itemId);
        else if (e.target.matches('.equip-item-btn')) handleEquipItem(e.target.dataset.itemId);
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
            ui.renderUI();
            ui.showNotification("Character name updated!", 'success');
        }
    });

    // Reset button
    const resetBtn = document.getElementById('reset-game-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all game progress? This cannot be undone.')) {
                localStorage.removeItem('habitQuestRpgGame');
                location.reload();
            }
        });
    }

    // Background switcher
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
    
    // Data Management Buttons
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    const importInput = document.getElementById('import-input');
    if (importInput) {
        importInput.addEventListener('change', importData);
    }

    // Calendar day summary
    const historyContent = document.getElementById('history-content');
    if (historyContent) {
        historyContent.addEventListener('click', (e) => {
            if (e.target.matches('.clickable-day')) {
                ui.showDailySummary(e.target.dataset.date);
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

    const summaryModal = document.getElementById('summary-modal');
    if (summaryModal) {
        document.getElementById('summary-modal-close').addEventListener('click', () => summaryModal.style.display = 'none');
        summaryModal.querySelector('.modal-overlay').addEventListener('click', () => summaryModal.style.display = 'none');
    }

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }

    const importInput = document.getElementById('import-input');
    if (importInput) {
        importInput.addEventListener('change', importData);
    }
    
}
