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
