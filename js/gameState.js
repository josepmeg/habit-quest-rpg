import { WORKOUT_TASKS } from './database.js';

const initialGameState = {
    player: {
        name: 'Player',
        settings: { background: 1 },
        gold: 0,
        equipment: { weapon: null, armor: null },
        level: 1,
        hp: 100,
        max_hp: 100,
        mp: 50,
        max_mp: 50,
        attack: 5,
        base_luck: 5,
        exp: 0,
        exp_to_next_level: 100,
        training_streak: 0,
        personal_bests: {},
        inventory: []
    },
    current_boss: { name: "Ifrit", hp: 300, max_hp: 300, ability: "Burn", image: "assets/sprites/ifrit.png" },
    boss_queue: [],
    defeated_bosses: [],
    quests: [],
    history: [],
    dailyLog: { 
        date: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0], 
        completed_tasks: [], 
        workout_details: {}, 
        attack_performed: false 
    }
};

let gameState = JSON.parse(JSON.stringify(initialGameState));

function saveGameData() {
    localStorage.setItem('habitQuestRpgGame', JSON.stringify(gameState));
}

function resetDailyTasks() {
    if (gameState.dailyLog.completed_tasks.length > 0) {
        gameState.history.push(JSON.parse(JSON.stringify(gameState.dailyLog)));
        if (gameState.history.length > 30) gameState.history.shift();
    }
    const today = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const yesterdayWorkoutCompleted = WORKOUT_TASKS.some(wt => gameState.dailyLog.completed_tasks.includes(wt.id));
    if (!yesterdayWorkoutCompleted) gameState.player.training_streak = 0;
    
    gameState.dailyLog = { date: today, completed_tasks: [], workout_details: {}, attack_performed: false };
    saveGameData();
}

function loadGameData(onLoadComplete) {
    const savedData = localStorage.getItem('habitQuestRpgGame');
    if (savedData) {
        gameState = JSON.parse(savedData);

        // Backwards compatibility checks
        if (gameState.player && !gameState.player.equipment) gameState.player.equipment = { weapon: null, armor: null };
        if (gameState.player && typeof gameState.player.gold === 'undefined') gameState.player.gold = 0;
        if (gameState.player && !gameState.player.settings) gameState.player.settings = { background: 1 };
        if (gameState.current_boss && gameState.current_boss.image === 'assets/ifrit.png') gameState.current_boss.image = 'assets/sprites/ifrit.png';
        if (gameState.current_boss && !gameState.current_boss.image) gameState.current_boss.image = 'assets/sprites/ifrit.png';

    } else {
        gameState = JSON.parse(JSON.stringify(initialGameState));
    }
    
    const today = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    if (gameState.dailyLog.date !== today) {
        resetDailyTasks();
    }
    
    // Call the provided function once loading is complete
    onLoadComplete();
}

// Export the state and functions that other files will need
export { gameState, loadGameData, saveGameData };
