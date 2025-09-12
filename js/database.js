export const SHOP_ITEMS = [
    { id: 'health_potion', cost: 25 },
    { id: 'mana_potion', cost: 15 },
    { id: 'worn-sword', cost: 50 },
    { id: 'leather-vest', cost: 75 },
];

export const ALL_ITEMS = {
    // Consumables
    'health_potion': { name: 'Health Potion', type: 'potion', description: 'Restores 50 HP.', image: 'assets/items/health_potion.png', effect: (gs) => { gs.player.hp = Math.min(gs.player.max_hp, gs.player.hp + 50); }},
    'mana_potion': { name: 'Mana Potion', type: 'potion', description: 'Restores 20 MP.', image: 'assets/items/mana_potion.png', effect: (gs) => { gs.player.mp = Math.min(gs.player.max_mp, gs.player.mp + 20); }},
    
    // Equipment
    'worn-sword': {
        name: 'Worn Sword',
        type: 'weapon',
        bonus: { attack: 1 },
        description: 'A rusty but reliable blade.',
        image: 'assets/items/sword_1.png'
    },
    'leather-vest': {
        name: 'Leather Vest',
        type: 'armor',
        bonus: { max_hp: 10 },
        description: 'Provides basic protection.',
        image: 'assets/items/armor_1.png' 
    }
};

export const WORKOUT_TASKS = [ 
    { id: 'stretch', name: 'Stretch', inputs: [] }, 
    { id: 'seated_leg_curl', name: 'Seated Leg Curl', inputs: ['Weight', 'Reps', 'Rounds'] }, 
    { id: 'leg_press', name: 'Leg Press', inputs: ['Weight', 'Reps', 'Rounds'] }, 
    { id: 'leg_curl_laying', name: 'Leg Curl Laying Down', inputs: ['Weight', 'Reps', 'Rounds'] }, 
    { id: 'inverted_bosu', name: 'Inverted Bosu', inputs: ['Reps', 'Rounds'] }, 
    { id: 'hip_abductor_in', name: 'Hip Abductor In', inputs: ['Weight', 'Reps', 'Rounds'] }, 
    { id: 'hip_abductor_out', name: 'Hip Abductor Out', inputs: ['Weight', 'Reps', 'Rounds'] }, 
    { id: 'glute_drive', name: 'Glute Drive', inputs: ['Weight', 'Reps', 'Rounds'] }, 
    { id: 'abs', name: 'Abs', inputs: ['Reps', 'Rounds'] }, 
    { id: 'push_ups', name: 'Push Ups', inputs: ['Reps', 'Rounds'] }, 
    { id: 'pull_ups', name: 'Pull Ups', inputs: ['Reps', 'Rounds'] }, 
];

export const DAILY_HABITS = [ 
    { id: 'reading', name: 'Reading', exp: 10, mp_regen: 10 }, 
    { id: 'meditation', name: 'Meditation', exp: 5, mp_regen: 5 }, 
    { id: 'clean_house', name: 'Clean/Organize House', exp: 5 }, 
    { id: 'inbox_zero', name: 'Inbox Zero', exp: 5 }, 
    { id: 'healthy_diet', name: 'Healthy Diet', exp: 10, hp_regen: 10 }, 
];

export const SPECIAL_ATTACK = { name: 'Fireball', mp_cost: 20, damage_multiplier: 2.5 };

export const CRITICAL_HIT_MULTIPLIER = 2.0;

export const ITEM_DROP_CHANCE = 5; // Base 5% chance

export const AVAILABLE_BOSS_SPRITES = [
    'ifrit',
    'buggy',
    'orc',
    // 'shiva',
    // 'bahamut',
    // 'titan',
    // Add other boss sprite filenames here
];




















