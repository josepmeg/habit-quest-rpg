import { WORKOUT_TASKS, DAILY_HABITS } from './database.js';

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
        skill_points: 0, 
        unlocked_skills: ['strike'],
        inventory: [],
        defeat_counts: {},
        custom_workouts: JSON.parse(JSON.stringify(WORKOUT_TASKS)),
        custom_habits: JSON.parse(JSON.stringify(DAILY_HABITS))
    },
    current_boss: { id: 'ifrit', name: "Ifrit", hp: 300, max_hp: 300, elementType: 'Fire', ability: "Burn", image: "assets/sprites/ifrit.png" },
    boss_queue: [],
    //defeated_bosses: [],
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
        if (gameState.history.length > 365) gameState.history.shift();
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
        const loadedState = JSON.parse(savedData);
        // This updates the existing gameState object instead of replacing it
        Object.assign(gameState, loadedState);

        // Backwards compatibility checks
        if (gameState.player && !gameState.player.custom_workouts) {
            gameState.player.custom_workouts = JSON.parse(JSON.stringify(WORKOUT_TASKS));
        }
        if (gameState.player && !gameState.player.custom_habits) {
            gameState.player.custom_habits = JSON.parse(JSON.stringify(DAILY_HABITS));
        }

        if (gameState.player && !gameState.player.defeat_counts) {
            gameState.player.defeat_counts = {};
        }

        if (gameState.player && !gameState.player.unlocked_skills) {
            gameState.player.unlocked_skills = ['strike']; // Give the default starting skill
        }
        if (gameState.player && gameState.player.skill_points === undefined) {
            gameState.player.skill_points = 0; // Initialize skill points
        }
        
    }
    
    const today = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    if (gameState.dailyLog.date !== today) {
        resetDailyTasks();
    }
    
    onLoadComplete();
}

function importData(event, onLoadComplete) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedState = JSON.parse(e.target.result);
            if (importedState.player && importedState.current_boss) {
                // This updates the existing gameState object instead of replacing it
                Object.assign(gameState, importedState);
                saveGameData();
                onLoadComplete(true);
            } else {
                throw new Error("Invalid save file format.");
            }
        } catch (error) {
            onLoadComplete(false, error);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// Export the state and functions that other files will need
export { gameState, loadGameData, saveGameData, importData };
