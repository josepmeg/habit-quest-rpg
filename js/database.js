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

export const SPECIAL_ATTACK = {
    name: 'Fireball',
    mp_cost: 20,
    damage_multiplier: 2.5,
    elementType: 'Fire' 
};

export const CRITICAL_HIT_MULTIPLIER = 2.0;

export const ITEM_DROP_CHANCE = 5; // Base 5% chance

export const ALL_BOSSES = [
    // --- Tier 1: Early Game ---
    {
        id: 'buggy',
        name: 'Buggy',
        max_hp: 500,
        elementType: 'Physical',
        ability: 'Glitch',
        image: 'assets/sprites/buggy.png'
    },
    {
        id: 'orc',
        name: 'Orc',
        max_hp: 800,
        elementType: 'Physical',
        ability: 'Smash',
        image: 'assets/sprites/orc.png'
    },
    {
        id: 'thornbush',
        name: 'Thornbush',
        max_hp: 1200,
        elementType: 'Grass',
        ability: 'Thorns',
        image: 'assets/sprites/thornbush.png'
    },
    {
        id: 'mimic',
        name: 'Mimic',
        max_hp: 1500,
        elementType: 'Psychic',
        ability: 'Deceive',
        image: 'assets/sprites/mimic.png'
    },

    // --- Tier 2: Mid Game ---
    {
        id: 'salamandra',
        name: 'Salamandra',
        max_hp: 2200,
        elementType: 'Toxic',
        ability: 'Sear',
        image: 'assets/sprites/salamandra.png'
    },
    {
        id: 'golem',
        name: 'Golem',
        max_hp: 2800,
        elementType: 'Rock',
        ability: 'Harden',
        image: 'assets/sprites/golem.png'
    },
    {
        id: 'ifrit',
        name: 'Ifrit',
        max_hp: 3000,
        elementType: 'Fire',
        ability: 'Burn',
        image: 'assets/sprites/ifrit.png'
    },
    {
        id: 'ais',
        name: 'Ais',
        max_hp: 3200,
        elementType: 'Ice',
        ability: 'Icicle Spear',
        image: 'assets/sprites/ais.png'
    },
    {
        id: 'echoer',
        name: 'Echoer',
        max_hp: 3500,
        elementType: 'Psychic',
        ability: 'Sonic Boom',
        image: 'assets/sprites/echoer.png'
    },

    // --- Tier 3: Late Game ---
    {
        id: 'draco',
        name: 'Draco',
        max_hp: 4000,
        elementType: 'Fire',
        ability: 'Fire Breath',
        image: 'assets/sprites/draco.png'
    },
    {
        id: 'drakice',
        name: 'Drakice',
        max_hp: 4200,
        elementType: 'Ice',
        ability: 'Frostbite',
        image: 'assets/sprites/drakice.png'
    },
    {
        id: 'grimjaw',
        name: 'Grimjaw',
        max_hp: 4800,
        elementType: 'Physical',
        ability: 'Vicious Bite',
        image: 'assets/sprites/grimjaw.png'
    },
    {
        id: 'ether',
        name: 'Ether',
        max_hp: 5000,
        elementType: 'Psychic',
        ability: 'Mana Drain',
        image: 'assets/sprites/ether.png'
    },
    {
        id: 'chronospent',
        name: 'Chronospent',
        max_hp: 5500,
        elementType: 'Psychic',
        ability: 'Time Warp',
        image: 'assets/sprites/chronospent.png'
    },

    // --- Tier 4: Legendary & Final Bosses ---
    {
        id: 'katsumoto',
        name: 'Katsumoto',
        max_hp: 6000,
        elementType: 'Physical',
        ability: 'Bushido Blade',
        image: 'assets/sprites/katsumoto.png'
    },
    {
        id: 'blackbeard',
        name: 'Blackbeard',
        max_hp: 6500,
        elementType: 'Physical',
        ability: 'Cannon Barrage',
        image: 'assets/sprites/blackbeard.png'
    },
    {
        id: 'juliana',
        name: 'Juliana',
        max_hp: 7000,
        elementType: 'Physical',
        ability: 'Siren\'s Song',
        image: 'assets/sprites/juliana.png'
    },
    {
        id: 'kairon',
        name: 'Kairon',
        max_hp: 7500,
        elementType: 'Fire',
        ability: 'Chiron\'s Arrow',
        image: 'assets/sprites/kairon.png'
    },
    {
        id: 'ashura',
        name: 'Ashura',
        max_hp: 8000,
        elementType: 'Physical',
        ability: 'Six-Armed Fury',
        image: 'assets/sprites/ashura.png'
    },
    {
        id: 'freedapalos',
        name: 'Freeda Palos',
        max_hp: 4500,
        elementType: 'Physical',
        ability: 'Liberty Chop',
        image: 'assets/sprites/freedapalos.png'
    },
    {
        id: 'seagalf',
        name: 'Seagalf',
        max_hp: 6800,
        elementType: 'Water',
        ability: 'Arcane Cannon',
        image: 'assets/sprites/seagalf.png'
    },
    {
        id: 'leonidas',
        name: 'Leonidas',
        max_hp: 7000,
        elementType: 'Physical',
        ability: 'Spartan Kick',
        image: 'assets/sprites/leonidas.png'
    },

    // --- Special / Joke Bosses ---
    {
        id: 'farty',
        name: 'Farty',
        max_hp: 1800,
        elementType: 'Toxic',
        ability: 'Toxic Cloud',
        image: 'assets/sprites/farty.png'
    },
    {
        id: 'drakachu',
        name: 'Drakachu',
        max_hp: 2500,
        elementType: 'Electric',
        ability: 'Thunder Shock',
        image: 'assets/sprites/drakachu.png'
    },
    {
        id: 'mewthree',
        name: 'Mewthree',
        max_hp: 9999,
        elementType: 'Psychic',
        ability: 'Psybeam',
        image: 'assets/sprites/mewthree.png'
    },
    {
        id: 'cosmikat',
        name: 'Cosmikat',
        max_hp: 5200,
        elementType: 'Psychic',
        ability: 'Laser Eyes',
        image: 'assets/sprites/cosmikat.png'
    },
    {
        id: 'mike',
        name: 'Mike',
        max_hp: 1000,
        elementType: 'Physical',
        ability: 'Microphone Feedback',
        image: 'assets/sprites/mike.png'
    },
];

export const ELEMENTAL_CHART = {
    'Fire':     { weakness: 'Water',    resistance: ['Ice', 'Fire'] },
    'Water':    { weakness: 'Electric', resistance: ['Fire', 'Water'] },
    'Ice':      { weakness: 'Fire',     resistance: ['Water', 'Ice'] },
    'Electric': { weakness: 'Rock',     resistance: ['Water', 'Electric'] },
    'Grass':    { weakness: 'Fire',     resistance: ['Water', 'Grass'] },
    'Rock':     { weakness: ['Water', 'Grass'], resistance: ['Electric', 'Toxic', 'Fire'] },
    'Physical': { weakness: 'Psychic',  resistance: 'Physical' },
    'Psychic':  { weakness: ['Physical', 'Toxic'], resistance: 'Psychic' },
    'Toxic':    { weakness: 'Psychic',  resistance: ['Physical', 'Grass', 'Toxic'] },
};

export const ALL_SKILLS = [
    // --- Column 1: Physical ---
    { id: 'strike', name: 'Strike', elementType: 'physical', column: 1, tier: 1, mp_cost: 0, damage_multiplier: 1.0, level_requirement: 1, icon: 'assets/skills/strike.png', description: 'A basic physical attack.', prerequisite: null },
    { id: 'armor-break', name: 'Armor Break', elementType: 'physical', column: 1, tier: 2, mp_cost: 15, damage_multiplier: 1.5, level_requirement: 5, icon: 'assets/skills/armor-break.png', description: 'A powerful strike that weakens enemy defenses.', prerequisite: 'strike' },
    { id: 'seismic-slash', name: 'Seismic Slash', elementType: 'physical', column: 1, tier: 3, mp_cost: 30, damage_multiplier: 2.8, level_requirement: 12, icon: 'assets/skills/seismic-slash.png', description: 'A devastating blow that shakes the ground.', prerequisite: 'armor-break' },

    // --- Column 2: Fire ---
    { id: 'ember', name: 'Ember', elementType: 'fire', column: 2, tier: 1, mp_cost: 5, damage_multiplier: 1.2, level_requirement: 1, icon: 'assets/skills/ember.png', description: 'A weak but reliable fire spell.', prerequisite: null },
    { id: 'fireball', name: 'Fireball', elementType: 'fire', column: 2, tier: 2, mp_cost: 20, damage_multiplier: 2.5, level_requirement: 4, icon: 'assets/skills/fireball.png', description: 'A classic ball of fire.', prerequisite: 'ember' },
    { id: 'meteor', name: 'Meteor', elementType: 'fire', column: 2, tier: 3, mp_cost: 50, damage_multiplier: 4.0, level_requirement: 15, icon: 'assets/skills/meteor.png', description: 'Summons a meteor from the heavens.', prerequisite: 'fireball' },
    
    // --- Column 3: Water ---
    { id: 'aqua-jet', name: 'Aqua Jet', elementType: 'water', column: 3, tier: 1, mp_cost: 5, damage_multiplier: 1.2, level_requirement: 1, icon: 'assets/skills/aqua-jet.png', description: 'A quick jet of water.', prerequisite: null },
    { id: 'aqua-burst', name: 'Aqua Burst', elementType: 'water', column: 3, tier: 2, mp_cost: 20, damage_multiplier: 2.5, level_requirement: 4, icon: 'assets/skills/aqua-burst.png', description: 'An explosion of pressurized water.', prerequisite: 'aqua-jet' },
    { id: 'tidal-wave', name: 'Tidal Wave', elementType: 'water', column: 3, tier: 3, mp_cost: 50, damage_multiplier: 4.0, level_requirement: 15, icon: 'assets/skills/tidal-wave.png', description: 'Engulfs the enemy in a massive wave.', prerequisite: 'aqua-burst' },

    // --- Column 4: Ice ---
    { id: 'ice-shard', name: 'Ice Shard', elementType: 'ice', column: 4, tier: 1, mp_cost: 5, damage_multiplier: 1.2, level_requirement: 1, icon: 'assets/skills/ice-shard.png', description: 'A sharp shard of ice.', prerequisite: null },
    { id: 'frostbite', name: 'Frostbite', elementType: 'ice', column: 4, tier: 2, mp_cost: 20, damage_multiplier: 2.5, level_requirement: 4, icon: 'assets/skills/frostbite.png', description: 'Freezes the enemy to the core.', prerequisite: 'ice-shard' },
    { id: 'ice-age', name: 'Ice Age', elementType: 'ice', column: 4, tier: 3, mp_cost: 50, damage_multiplier: 4.0, level_requirement: 15, icon: 'assets/skills/ice-age.png', description: 'A catastrophic freezing spell.', prerequisite: 'frostbite' },
    
    // --- Column 5: Electric ---
    { id: 'spark', name: 'Spark', elementType: 'electric', column: 5, tier: 1, mp_cost: 5, damage_multiplier: 1.2, level_requirement: 1, icon: 'assets/skills/spark.png', description: 'A minor electrical discharge.', prerequisite: null },
    { id: 'lightning-bolt', name: 'Lightning Bolt', elementType: 'electric', column: 5, tier: 2, mp_cost: 20, damage_multiplier: 2.5, level_requirement: 4, icon: 'assets/skills/lightning-bolt.png', description: 'A powerful bolt of lightning.', prerequisite: 'spark' },
    { id: 'thunder', name: 'Thunder', elementType: 'electric', column: 5, tier: 3, mp_cost: 50, damage_multiplier: 4.0, level_requirement: 15, icon: 'assets/skills/thunder.png', description: 'A deafening and destructive thunderclap.', prerequisite: 'lightning-bolt' },
    
    // --- Column 6: Rock ---
    { id: 'stone-toss', name: 'Stone Toss', elementType: 'rock', column: 6, tier: 1, mp_cost: 5, damage_multiplier: 1.2, level_requirement: 1, icon: 'assets/skills/stone-toss.png', description: 'Hurls a small rock.', prerequisite: null },
    { id: 'rock-slide', name: 'Rock Slide', elementType: 'rock', column: 6, tier: 2, mp_cost: 20, damage_multiplier: 2.5, level_requirement: 4, icon: 'assets/skills/rock-slide.png', description: 'Causes a cascade of boulders.', prerequisite: 'stone-toss' },
    { id: 'earthquake', name: 'Earthquake', elementType: 'rock', column: 6, tier: 3, mp_cost: 50, damage_multiplier: 4.0, level_requirement: 15, icon: 'assets/skills/earthquake.png', description: 'Shakes the very foundation of the earth.', prerequisite: 'rock-slide' },

    // --- Column 7: Toxic ---
    { id: 'poison-sting', name: 'Poison Sting', elementType: 'toxic', column: 7, tier: 1, mp_cost: 5, damage_multiplier: 1.2, level_requirement: 1, icon: 'assets/skills/poison-sting.png', description: 'A venomous jab.', prerequisite: null },
    { id: 'acid-blast', name: 'Acid Blast', elementType: 'toxic', column: 7, tier: 2, mp_cost: 20, damage_multiplier: 2.5, level_requirement: 4, icon: 'assets/skills/acid-blast.png', description: 'Sprays corrosive acid.', prerequisite: 'acid-blast' },
    { id: 'virus', name: 'Virus', elementType: 'toxic', column: 7, tier: 3, mp_cost: 50, damage_multiplier: 4.0, level_requirement: 15, icon: 'assets/skills/virus.png', description: 'Infects the enemy with a debilitating virus.', prerequisite: 'acid-blast' },

    // --- Column 8: Psychic ---
    { id: 'mind-jab', name: 'Mind Jab', elementType: 'psychic', column: 8, tier: 1, mp_cost: 5, damage_multiplier: 1.2, level_requirement: 1, icon: 'assets/skills/mind-jab.png', description: 'A minor psionic strike.', prerequisite: null },
    { id: 'psy-beam', name: 'Psy Beam', elementType: 'psychic', column: 8, tier: 2, mp_cost: 20, damage_multiplier: 2.5, level_requirement: 4, icon: 'assets/skills/psy-beam.png', description: 'A focused beam of mental energy.', prerequisite: 'mind-jab' },
    { id: 'mind-breaker', name: 'Mind Breaker', elementType: 'psychic', column: 8, tier: 3, mp_cost: 50, damage_multiplier: 4.0, level_requirement: 15, icon: 'assets/skills/mind-breaker.png', description: 'Overwhelms the enemy\'s psyche.', prerequisite: 'psy-beam' },

    // --- Column 9: Grass ---
    { id: 'vine-whip', name: 'Vine Whip', elementType: 'grass', column: 9, tier: 1, mp_cost: 5, damage_multiplier: 1.2, level_requirement: 1, icon: 'assets/skills/vine-whip.png', description: 'Lashes out with a thorny vine.', prerequisite: null },
    { id: 'thorn-ball', name: 'Thorn Ball', elementType: 'grass', column: 9, tier: 2, mp_cost: 20, damage_multiplier: 2.5, level_requirement: 4, icon: 'assets/skills/thorn-ball.png', description: 'A sphere of razor-sharp thorns.', prerequisite: 'vine-whip' },
    { id: 'cutting-leaves', name: 'Cutting Leaves', elementType: 'grass', column: 9, tier: 3, mp_cost: 50, damage_multiplier: 4.0, level_requirement: 15, icon: 'assets/skills/cutting-leaves.png', description: 'A vortex of deadly sharp leaves.', prerequisite: 'thorn-ball' },
];

















