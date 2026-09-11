/**
 * Roland's Steakhouse - Enterprise Ingredient & Recipe Inventory System
 * Handles Raw Ingredients, Financial COGS, Recipe Mappings (BOM), Spoilage/Wastage Tracking,
 * Audit Logs, Dynamic Food Availability, and Automated Order Deductions/Refunds.
 */

(function (window) {
    'use strict';

    // ── DEFAULT RAW INGREDIENTS CATALOG WITH FINANCIAL UNIT COSTS & SUPPLIERS ──
    const DEFAULT_RAW_INGREDIENTS = [
        // Meat Cuts
        { id: 'ING-BEEF-TENDERLOIN', name: 'Tenderloin Beef Cut', category: 'Meat', stock: 15000, unit: 'g', minThreshold: 2500, unitCost: 1.40, supplier: 'Manila Prime Meats', lastRestocked: new Date().toISOString() },
        { id: 'ING-BEEF-RIBEYE', name: 'Ribeye Beef Cut', category: 'Meat', stock: 18000, unit: 'g', minThreshold: 3000, unitCost: 1.25, supplier: 'Manila Prime Meats', lastRestocked: new Date().toISOString() },
        { id: 'ING-BEEF-TBONE', name: 'T-Bone Steak Cut', category: 'Meat', stock: 20000, unit: 'g', minThreshold: 3000, unitCost: 0.95, supplier: 'Batangas Meat Corp', lastRestocked: new Date().toISOString() },
        { id: 'ING-BEEF-SIRLOIN', name: 'Sirloin Beef Cut', category: 'Meat', stock: 16000, unit: 'g', minThreshold: 2500, unitCost: 0.85, supplier: 'Batangas Meat Corp', lastRestocked: new Date().toISOString() },
        { id: 'ING-BEEF-PATTY', name: 'Ground Beef Patty', category: 'Meat', stock: 120, unit: 'pcs', minThreshold: 20, unitCost: 45.00, supplier: 'Roland Kitchen Prep', lastRestocked: new Date().toISOString() },
        
        // Poultry & Seafood
        { id: 'ING-CHICKEN-WHOLE', name: 'Whole Fresh Chicken', category: 'Poultry', stock: 45, unit: 'pcs', minThreshold: 10, unitCost: 220.00, supplier: 'Magnolia Poultry', lastRestocked: new Date().toISOString() },
        { id: 'ING-FISH-TANIGUE', name: 'Tanigue Fish Fillet', category: 'Seafood', stock: 12000, unit: 'g', minThreshold: 2000, unitCost: 0.75, supplier: 'Navotas Fresh Seafood', lastRestocked: new Date().toISOString() },
        { id: 'ING-FISH-BANGUS', name: 'Bangus (Milkfish)', category: 'Seafood', stock: 50, unit: 'pcs', minThreshold: 10, unitCost: 120.00, supplier: 'Dagupan Fishery', lastRestocked: new Date().toISOString() },
        
        // Seasonings, Sauces, Dairy & Bakery
        { id: 'ING-SALT-PEPPER', name: 'Salt & Pepper Seasoning', category: 'Produce', stock: 5000, unit: 'g', minThreshold: 500, unitCost: 0.05, supplier: 'Local Spices Co', lastRestocked: new Date().toISOString() },
        { id: 'ING-MARGARINE', name: 'Margarine', category: 'Dairy', stock: 8000, unit: 'g', minThreshold: 1000, unitCost: 0.18, supplier: 'Magnolia Dairy', lastRestocked: new Date().toISOString() },
        { id: 'ING-OYSTER-SAUCE', name: 'Oyster Sauce', category: 'Sauces & Liquids', stock: 10000, unit: 'ml', minThreshold: 1500, unitCost: 0.25, supplier: 'Mama Sita Sauces', lastRestocked: new Date().toISOString() },
        { id: 'ING-KETCHUP', name: 'Ketchup', category: 'Sauces & Liquids', stock: 8000, unit: 'g', minThreshold: 1000, unitCost: 0.12, supplier: 'Del Monte / UFC', lastRestocked: new Date().toISOString() },
        { id: 'ING-BUTTER', name: 'Cooking Butter', category: 'Dairy', stock: 5000, unit: 'g', minThreshold: 800, unitCost: 0.50, supplier: 'Anchor Dairy', lastRestocked: new Date().toISOString() },
        { id: 'ING-TOYO', name: 'Toyo (Soy Sauce)', category: 'Sauces & Liquids', stock: 10000, unit: 'ml', minThreshold: 1500, unitCost: 0.08, supplier: 'Silver Swan', lastRestocked: new Date().toISOString() },
        { id: 'ING-KALAMANSI', name: 'Kalamansi', category: 'Produce', stock: 5000, unit: 'ml', minThreshold: 800, unitCost: 0.10, supplier: 'Local Citrus Farms', lastRestocked: new Date().toISOString() },
        
        { id: 'ING-BURGER-BUN', name: 'Sesame Burger Buns', category: 'Bakery', stock: 150, unit: 'pcs', minThreshold: 25, unitCost: 12.00, supplier: 'Goldilocks Bakery', lastRestocked: new Date().toISOString() },
        { id: 'ING-BREAD-GARLIC', name: 'Garlic Bread Loaf Slices', category: 'Bakery', stock: 120, unit: 'pcs', minThreshold: 20, unitCost: 8.00, supplier: 'In-House Bakery', lastRestocked: new Date().toISOString() },
        { id: 'ING-POTATO', name: 'Fresh Potatoes', category: 'Produce', stock: 35000, unit: 'g', minThreshold: 5000, unitCost: 0.14, supplier: 'Benguet Produce', lastRestocked: new Date().toISOString() },
        { id: 'ING-RICE', name: 'Premium Rice Grains', category: 'Grains', stock: 50000, unit: 'g', minThreshold: 8000, unitCost: 0.07, supplier: 'Central Luzon Grains', lastRestocked: new Date().toISOString() },
        { id: 'ING-MUSHROOM-SAUCE', name: 'Signature Mushroom Sauce', category: 'Sauces & Liquids', stock: 8000, unit: 'ml', minThreshold: 1500, unitCost: 0.35, supplier: 'Roland Secret Prep', lastRestocked: new Date().toISOString() },
        { id: 'ING-CHICKEN-SOUP-BASE', name: 'Chicken Soup Broth Base', category: 'Sauces & Liquids', stock: 6000, unit: 'ml', minThreshold: 1000, unitCost: 0.18, supplier: 'Roland Secret Prep', lastRestocked: new Date().toISOString() },
        { id: 'ING-GARLIC', name: 'Minced Garlic', category: 'Produce', stock: 3000, unit: 'g', minThreshold: 500, unitCost: 0.22, supplier: 'Benguet Produce', lastRestocked: new Date().toISOString() },
        
        // Beverages & Wines
        { id: 'ING-WINE-CARLO-RED', name: 'Carlo Rossi Red Wine Bottle', category: 'Beverages', stock: 36, unit: 'pcs', minThreshold: 6, unitCost: 450.00, supplier: 'Premier Wines Ph', lastRestocked: new Date().toISOString() },
        { id: 'ING-WINE-CARLO-WHITE', name: 'Carlo Rossi White Wine Bottle', category: 'Beverages', stock: 36, unit: 'pcs', minThreshold: 6, unitCost: 450.00, supplier: 'Premier Wines Ph', lastRestocked: new Date().toISOString() },
        { id: 'ING-WINE-PEGOES', name: 'Adega De Pegões Wine Bottle', category: 'Beverages', stock: 3, unit: 'pcs', minThreshold: 5, unitCost: 680.00, supplier: 'Premier Wines Ph', lastRestocked: new Date().toISOString() },
        { id: 'ING-MANGO-JUICE', name: 'Mango Juice Concentrate', category: 'Beverages', stock: 15000, unit: 'ml', minThreshold: 2000, unitCost: 0.18, supplier: 'Zest-O Corp', lastRestocked: new Date().toISOString() },
        { id: 'ING-PINEAPPLE-JUICE', name: 'Pineapple Juice Concentrate', category: 'Beverages', stock: 15000, unit: 'ml', minThreshold: 2000, unitCost: 0.18, supplier: 'Dole Ph', lastRestocked: new Date().toISOString() },
        { id: 'ING-ICED-TEA', name: 'Iced Tea Syrup Base', category: 'Beverages', stock: 20000, unit: 'ml', minThreshold: 3000, unitCost: 0.12, supplier: 'Nestea Foodservice', lastRestocked: new Date().toISOString() },
        { id: 'ING-JUICE-FOUR-SEASONS', name: 'Four Seasons Juice Base', category: 'Beverages', stock: 15000, unit: 'ml', minThreshold: 2000, unitCost: 0.18, supplier: 'Zest-O Corp', lastRestocked: new Date().toISOString() },
        { id: 'ING-JUICE-PINEORANGE', name: 'Pine-Orange Juice Base', category: 'Beverages', stock: 15000, unit: 'ml', minThreshold: 2000, unitCost: 0.18, supplier: 'Dole Ph', lastRestocked: new Date().toISOString() },
        { id: 'ING-JUICE-CUCUMBER', name: 'Cucumber Juice Base', category: 'Beverages', stock: 12000, unit: 'ml', minThreshold: 1500, unitCost: 0.15, supplier: 'Benguet Produce', lastRestocked: new Date().toISOString() },
        { id: 'ING-JUICE-BLUE-LEMONADE', name: 'Blue Lemonade Syrup Base', category: 'Beverages', stock: 0, unit: 'ml', minThreshold: 1500, unitCost: 0.15, supplier: 'Roland Secret Prep', lastRestocked: new Date().toISOString() },
        { id: 'ING-JUICE-CALAMANSI', name: 'Calamansi Extract Base', category: 'Beverages', stock: 8000, unit: 'ml', minThreshold: 1200, unitCost: 0.12, supplier: 'Local Farmers', lastRestocked: new Date().toISOString() },
        { id: 'ING-COKE-CAN', name: 'Coke 330ml Can', category: 'Beverages', stock: 120, unit: 'pcs', minThreshold: 20, unitCost: 32.00, supplier: 'Coca-Cola Ph', lastRestocked: new Date().toISOString() },
        { id: 'ING-SPRITE-CAN', name: 'Sprite / Royal 330ml Can', category: 'Beverages', stock: 120, unit: 'pcs', minThreshold: 20, unitCost: 32.00, supplier: 'Coca-Cola Ph', lastRestocked: new Date().toISOString() },
        { id: 'ING-BEER-PILSEN', name: 'San Miguel Pale Pilsen Bottle', category: 'Beverages', stock: 144, unit: 'pcs', minThreshold: 24, unitCost: 55.00, supplier: 'San Miguel Brewery', lastRestocked: new Date().toISOString() },
        { id: 'ING-BEER-LIGHT', name: 'San Mig Light Bottle', category: 'Beverages', stock: 144, unit: 'pcs', minThreshold: 24, unitCost: 58.00, supplier: 'San Miguel Brewery', lastRestocked: new Date().toISOString() },
        { id: 'ING-WATER-BOTTLE', name: 'Purified Water 500ml', category: 'Beverages', stock: 200, unit: 'pcs', minThreshold: 30, unitCost: 12.00, supplier: 'Nature Spring', lastRestocked: new Date().toISOString() },
        { id: 'ING-TEA-BAGS', name: 'Black Tea Bags', category: 'Beverages', stock: 150, unit: 'pcs', minThreshold: 20, unitCost: 6.00, supplier: 'Lipton Ph', lastRestocked: new Date().toISOString() },
        { id: 'ING-COFFEE-BEANS', name: 'Arabica Coffee Beans', category: 'Beverages', stock: 8000, unit: 'g', minThreshold: 1000, unitCost: 0.90, supplier: 'Batangas Coffee Co.', lastRestocked: new Date().toISOString() },
        { id: 'ING-MILK-CREAM', name: 'Dairy Creamer', category: 'Dairy', stock: 6000, unit: 'ml', minThreshold: 1000, unitCost: 0.09, supplier: 'Nestle Ph', lastRestocked: new Date().toISOString() }
    ];

    // ── DEFAULT RECIPE MAP PER MENU FOOD ITEM (by Menu ID) ──
    const DEFAULT_FOOD_RECIPES = {
        // STEAKS (Different Meat Cuts + Salt & Pepper + Margarine + Oyster Sauce)
        'INV-B1': [
            { ingredientId: 'ING-BEEF-TENDERLOIN', qty: 250, unit: 'g' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 5, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 20, unit: 'g' },
            { ingredientId: 'ING-OYSTER-SAUCE', qty: 30, unit: 'ml' }
        ],
        'INV-B2': [
            { ingredientId: 'ING-BEEF-TENDERLOIN', qty: 200, unit: 'g' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 5, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 20, unit: 'g' },
            { ingredientId: 'ING-OYSTER-SAUCE', qty: 30, unit: 'ml' }
        ],
        'INV-B3': [
            { ingredientId: 'ING-BEEF-TENDERLOIN', qty: 200, unit: 'g' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 5, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 20, unit: 'g' },
            { ingredientId: 'ING-OYSTER-SAUCE', qty: 30, unit: 'ml' }
        ],
        'INV-B4': [
            { ingredientId: 'ING-BEEF-RIBEYE', qty: 300, unit: 'g' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 5, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 20, unit: 'g' },
            { ingredientId: 'ING-OYSTER-SAUCE', qty: 30, unit: 'ml' }
        ],
        'INV-B5': [
            { ingredientId: 'ING-BEEF-PATTY', qty: 2, unit: 'pcs' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 5, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 20, unit: 'g' },
            { ingredientId: 'ING-OYSTER-SAUCE', qty: 30, unit: 'ml' }
        ],
        'INV-T1': [
            { ingredientId: 'ING-BEEF-TBONE', qty: 350, unit: 'g' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 5, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 20, unit: 'g' },
            { ingredientId: 'ING-OYSTER-SAUCE', qty: 30, unit: 'ml' }
        ],
        'INV-T2': [
            { ingredientId: 'ING-BEEF-TBONE', qty: 450, unit: 'g' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 5, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 20, unit: 'g' },
            { ingredientId: 'ING-OYSTER-SAUCE', qty: 30, unit: 'ml' }
        ],
        'INV-T3': [
            { ingredientId: 'ING-BEEF-TBONE', qty: 520, unit: 'g' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 5, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 20, unit: 'g' },
            { ingredientId: 'ING-OYSTER-SAUCE', qty: 30, unit: 'ml' }
        ],
        'INV-T4': [
            { ingredientId: 'ING-BEEF-TBONE', qty: 580, unit: 'g' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 5, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 20, unit: 'g' },
            { ingredientId: 'ING-OYSTER-SAUCE', qty: 30, unit: 'ml' }
        ],
        'INV-T5': [
            { ingredientId: 'ING-BEEF-TBONE', qty: 600, unit: 'g' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 5, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 20, unit: 'g' },
            { ingredientId: 'ING-OYSTER-SAUCE', qty: 30, unit: 'ml' }
        ],
        'INV-S1': [
            { ingredientId: 'ING-BEEF-SIRLOIN', qty: 280, unit: 'g' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 5, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 20, unit: 'g' },
            { ingredientId: 'ING-OYSTER-SAUCE', qty: 30, unit: 'ml' }
        ],
        'INV-S2': [
            { ingredientId: 'ING-BEEF-SIRLOIN', qty: 320, unit: 'g' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 5, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 20, unit: 'g' },
            { ingredientId: 'ING-OYSTER-SAUCE', qty: 30, unit: 'ml' }
        ],
        'INV-S3': [
            { ingredientId: 'ING-BEEF-SIRLOIN', qty: 400, unit: 'g' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 5, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 20, unit: 'g' },
            { ingredientId: 'ING-OYSTER-SAUCE', qty: 30, unit: 'ml' }
        ],
        'INV-S4': [
            { ingredientId: 'ING-BEEF-SIRLOIN', qty: 450, unit: 'g' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 5, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 20, unit: 'g' },
            { ingredientId: 'ING-OYSTER-SAUCE', qty: 30, unit: 'ml' }
        ],

        // CHICKEN (Chicken Meat + Ketchup + Butter)
        'INV-CF1': [
            { ingredientId: 'ING-CHICKEN-WHOLE', qty: 1, unit: 'pcs' },
            { ingredientId: 'ING-KETCHUP', qty: 50, unit: 'g' },
            { ingredientId: 'ING-BUTTER', qty: 20, unit: 'g' }
        ],
        'INV-CF2': [
            { ingredientId: 'ING-CHICKEN-WHOLE', qty: 0.5, unit: 'pcs' },
            { ingredientId: 'ING-KETCHUP', qty: 30, unit: 'g' },
            { ingredientId: 'ING-BUTTER', qty: 15, unit: 'g' }
        ],

        // FISH (Fish Cut + Toyo + Kalamansi)
        'INV-CF3': [
            { ingredientId: 'ING-FISH-TANIGUE', qty: 250, unit: 'g' },
            { ingredientId: 'ING-TOYO', qty: 30, unit: 'ml' },
            { ingredientId: 'ING-KALAMANSI', qty: 20, unit: 'ml' }
        ],
        'INV-CF4': [
            { ingredientId: 'ING-FISH-BANGUS', qty: 1, unit: 'pcs' },
            { ingredientId: 'ING-TOYO', qty: 30, unit: 'ml' },
            { ingredientId: 'ING-KALAMANSI', qty: 20, unit: 'ml' }
        ],

        // SANDWICHES
        'INV-SW1': [
            { ingredientId: 'ING-BURGER-BUN', qty: 1, unit: 'pcs' },
            { ingredientId: 'ING-BEEF-PATTY', qty: 2, unit: 'pcs' },
            { ingredientId: 'ING-POTATO', qty: 150, unit: 'g' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 2, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 10, unit: 'g' }
        ],
        'INV-SW2': [
            { ingredientId: 'ING-BURGER-BUN', qty: 1, unit: 'pcs' },
            { ingredientId: 'ING-BEEF-SIRLOIN', qty: 150, unit: 'g' },
            { ingredientId: 'ING-POTATO', qty: 150, unit: 'g' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 2, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 10, unit: 'g' }
        ],
        'INV-SW3': [
            { ingredientId: 'ING-BURGER-BUN', qty: 1, unit: 'pcs' },
            { ingredientId: 'ING-BEEF-SIRLOIN', qty: 120, unit: 'g' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 2, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 10, unit: 'g' }
        ],
        'INV-SW4': [
            { ingredientId: 'ING-BURGER-BUN', qty: 1, unit: 'pcs' },
            { ingredientId: 'ING-BEEF-PATTY', qty: 1, unit: 'pcs' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 2, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 10, unit: 'g' }
        ],
        'INV-SW5': [
            { ingredientId: 'ING-BURGER-BUN', qty: 1, unit: 'pcs' },
            { ingredientId: 'ING-BEEF-PATTY', qty: 1, unit: 'pcs' },
            { ingredientId: 'ING-SALT-PEPPER', qty: 2, unit: 'g' },
            { ingredientId: 'ING-MARGARINE', qty: 10, unit: 'g' }
        ],

        // SIDE ORDERS
        'INV-SO1': [{ ingredientId: 'ING-MUSHROOM-SAUCE', qty: 200, unit: 'ml' }],
        'INV-SO2': [{ ingredientId: 'ING-CHICKEN-SOUP-BASE', qty: 200, unit: 'ml' }],
        'INV-SO3': [{ ingredientId: 'ING-POTATO', qty: 200, unit: 'g' }, { ingredientId: 'ING-BUTTER', qty: 15, unit: 'g' }],
        'INV-SO4': [{ ingredientId: 'ING-POTATO', qty: 200, unit: 'g' }],
        'INV-SO5': [{ ingredientId: 'ING-POTATO', qty: 200, unit: 'g' }],
        'INV-SO6': [{ ingredientId: 'ING-BREAD-GARLIC', qty: 2, unit: 'pcs' }, { ingredientId: 'ING-BUTTER', qty: 15, unit: 'g' }],
        'INV-SO7': [{ ingredientId: 'ING-RICE', qty: 150, unit: 'g' }, { ingredientId: 'ING-GARLIC', qty: 15, unit: 'g' }],
        'INV-SO8': [{ ingredientId: 'ING-RICE', qty: 150, unit: 'g' }],

        // DRINKS & WINES
        'INV-D1': [{ ingredientId: 'ING-MANGO-JUICE', qty: 250, unit: 'ml' }],
        'INV-D2': [{ ingredientId: 'ING-JUICE-FOUR-SEASONS', qty: 250, unit: 'ml' }],
        'INV-D3': [{ ingredientId: 'ING-PINEAPPLE-JUICE', qty: 250, unit: 'ml' }],
        'INV-D4': [{ ingredientId: 'ING-JUICE-PINEORANGE', qty: 250, unit: 'ml' }],
        'INV-D5': [{ ingredientId: 'ING-ICED-TEA', qty: 250, unit: 'ml' }],
        'INV-D6': [{ ingredientId: 'ING-JUICE-CUCUMBER', qty: 250, unit: 'ml' }],
        'INV-D7': [{ ingredientId: 'ING-JUICE-BLUE-LEMONADE', qty: 250, unit: 'ml' }],
        'INV-D8': [{ ingredientId: 'ING-JUICE-CALAMANSI', qty: 250, unit: 'ml' }],
        'INV-D9': [{ ingredientId: 'ING-COKE-CAN', qty: 1, unit: 'pcs' }],
        'INV-D10': [{ ingredientId: 'ING-SPRITE-CAN', qty: 1, unit: 'pcs' }],
        'INV-D11': [{ ingredientId: 'ING-BEER-PILSEN', qty: 1, unit: 'pcs' }],
        'INV-D12': [{ ingredientId: 'ING-BEER-LIGHT', qty: 1, unit: 'pcs' }],
        'INV-D13': [{ ingredientId: 'ING-TEA-BAGS', qty: 1, unit: 'pcs' }],
        'INV-D14': [{ ingredientId: 'ING-COFFEE-BEANS', qty: 15, unit: 'g' }],
        'INV-D15': [{ ingredientId: 'ING-COFFEE-BEANS', qty: 15, unit: 'g' }, { ingredientId: 'ING-MILK-CREAM', qty: 30, unit: 'ml' }],
        'INV-D16': [{ ingredientId: 'ING-WATER-BOTTLE', qty: 1, unit: 'pcs' }],
        'INV-W1': [{ ingredientId: 'ING-WINE-CARLO-RED', qty: 1, unit: 'pcs' }],
        'INV-W2': [{ ingredientId: 'ING-WINE-CARLO-WHITE', qty: 1, unit: 'pcs' }],
        'INV-W3': [{ ingredientId: 'ING-WINE-PEGOES', qty: 1, unit: 'pcs' }]
    };

    // ── BROADCAST CHANNEL FOR REAL-TIME ADMIN & SUPER ADMIN SYNC ──
    let invBroadcastChannel = null;
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            invBroadcastChannel = new BroadcastChannel('inventory_sync_channel');
        }
    } catch (e) {
        console.warn('BroadcastChannel not supported:', e);
    }

    function broadcastSync(action, payload) {
        if (invBroadcastChannel) {
            try {
                invBroadcastChannel.postMessage({ action: action, payload: payload, timestamp: Date.now() });
            } catch (e) {}
        }
    }

    // ── MEMOIZED STATE CACHE LAYER ──
    let _cachedRawIngredients = null;

    function invalidateInventoryCache() {
        _cachedRawIngredients = null;
    }

    window.addEventListener('storage', function (e) {
        if (e.key === 'rawIngredients' || e.key === 'inventoryItems' || e.key === 'inventory_audit_logs') {
            invalidateInventoryCache();
        }
    });

    // ── STORE STATUS (OPEN / CLOSED) MANAGEMENT ──
    function getStoreStatus() {
        try {
            return localStorage.getItem('store_status') || 'open';
        } catch (e) {
            return 'open';
        }
    }

    function setStoreStatus(status) {
        const cleanStatus = status === 'closed' ? 'closed' : 'open';
        try {
            localStorage.setItem('store_status', cleanStatus);
            window.dispatchEvent(new CustomEvent('storeStatusUpdated', { detail: cleanStatus }));
            broadcastSync('storeStatusUpdated', cleanStatus);
        } catch (e) {
            console.error('Error saving store status:', e);
        }
        return cleanStatus;
    }

    function toggleStoreStatus() {
        const current = getStoreStatus();
        const next = current === 'open' ? 'closed' : 'open';
        return setStoreStatus(next);
    }

    // ── AUDIT LOG SUBSYSTEM ──
    function getAuditLogs() {
        try {
            const logs = localStorage.getItem('inventory_audit_logs');
            return logs ? JSON.parse(logs) : [];
        } catch (e) {
            return [];
        }
    }

    function logStockMovement(entry) {
        try {
            const logs = getAuditLogs();
            const newEntry = {
                id: 'LOG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
                timestamp: new Date().toISOString(),
                action: entry.action || 'ADJUSTMENT',
                ingredientId: entry.ingredientId || 'N/A',
                ingredientName: entry.ingredientName || 'General',
                changeQty: Number(entry.changeQty) || 0,
                newStock: entry.newStock !== undefined ? Number(entry.newStock) : null,
                unit: entry.unit || '',
                operator: entry.operator || 'System',
                notes: entry.notes || '',
                financialValue: Number(entry.financialValue) || 0
            };
            logs.unshift(newEntry);
            if (logs.length > 500) logs.pop();
            localStorage.setItem('inventory_audit_logs', JSON.stringify(logs));
            broadcastSync('auditLogAdded', newEntry);
            return newEntry;
        } catch (e) {
            console.error('Error logging stock movement:', e);
            return null;
        }
    }

    function clearAuditLogs() {
        try {
            localStorage.setItem('inventory_audit_logs', JSON.stringify([]));
            broadcastSync('auditLogCleared', true);
            return true;
        } catch (e) {
            return false;
        }
    }

    // ── SPOILAGE / WASTAGE SUBSYSTEM ──
    function getSpoilageLogs() {
        try {
            const logs = localStorage.getItem('inventory_wastage_logs');
            return logs ? JSON.parse(logs) : [];
        } catch (e) {
            return [];
        }
    }

    function logSpoilage(ingredientId, qty, reason, notes, operator) {
        const rawList = getRawIngredients();
        const ing = rawList.find(i => i.id === ingredientId);
        if (!ing) return null;

        const deductQty = Math.abs(Number(qty)) || 0;
        if (deductQty <= 0) return null;

        ing.stock = Math.max(0, (Number(ing.stock) || 0) - deductQty);
        saveRawIngredients(rawList);
        syncFoodMenuStockFromIngredients();

        const costPerUnit = Number(ing.unitCost) || 0;
        const totalLoss = deductQty * costPerUnit;

        const wasteEntry = {
            id: 'WASTE-' + Date.now(),
            timestamp: new Date().toISOString(),
            ingredientId: ing.id,
            ingredientName: ing.name,
            qty: deductQty,
            unit: ing.unit,
            unitCost: costPerUnit,
            totalLoss: totalLoss,
            reason: reason || 'Spoilage / Expired',
            notes: notes || '',
            operator: operator || 'Kitchen Staff'
        };

        try {
            const wasteLogs = getSpoilageLogs();
            wasteLogs.unshift(wasteEntry);
            if (wasteLogs.length > 300) wasteLogs.pop();
            localStorage.setItem('inventory_wastage_logs', JSON.stringify(wasteLogs));
        } catch (e) {}

        logStockMovement({
            action: 'WASTAGE_SPOILAGE',
            ingredientId: ing.id,
            ingredientName: ing.name,
            changeQty: -deductQty,
            newStock: ing.stock,
            unit: ing.unit,
            operator: operator || 'Kitchen Staff',
            notes: `[Wastage: ${reason}] ${notes || ''}`,
            financialValue: totalLoss
        });

        return wasteEntry;
    }

    // ── RAW INGREDIENTS STORAGE HELPERS ──
    function getRawIngredients() {
        if (_cachedRawIngredients) return _cachedRawIngredients;
        try {
            const stored = localStorage.getItem('rawIngredients');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    let updated = false;
                    DEFAULT_RAW_INGREDIENTS.forEach(def => {
                        if (!parsed.find(p => p.id === def.id)) {
                            parsed.push(JSON.parse(JSON.stringify(def)));
                            updated = true;
                        }
                    });
                    parsed.forEach(i => {
                        if (i.unitCost === undefined) {
                            const def = DEFAULT_RAW_INGREDIENTS.find(d => d.id === i.id);
                            i.unitCost = def ? def.unitCost : 10.00;
                            updated = true;
                        }
                        if (!i.supplier) {
                            const def = DEFAULT_RAW_INGREDIENTS.find(d => d.id === i.id);
                            i.supplier = def ? def.supplier : 'General Supplier';
                            updated = true;
                        }
                    });
                    if (updated) {
                        localStorage.setItem('rawIngredients', JSON.stringify(parsed));
                    }
                    _cachedRawIngredients = parsed;
                    return _cachedRawIngredients;
                }
            }
        } catch (e) {
            console.error('Error loading raw ingredients:', e);
        }
        saveRawIngredients(DEFAULT_RAW_INGREDIENTS);
        _cachedRawIngredients = DEFAULT_RAW_INGREDIENTS;
        return _cachedRawIngredients;
    }

    function saveRawIngredients(list) {
        try {
            _cachedRawIngredients = list;
            localStorage.setItem('rawIngredients', JSON.stringify(list));
            window.dispatchEvent(new CustomEvent('rawIngredientsUpdated', { detail: list }));
            broadcastSync('rawIngredientsUpdated', list);
        } catch (e) {
            console.error('Error saving raw ingredients:', e);
        }
    }

    function restockRawIngredient(id, addedAmount, operator = 'Staff', notes = '') {
        const list = getRawIngredients();
        const item = list.find(i => i.id === id);
        if (item) {
            const addAmt = Number(addedAmount) || 0;
            item.stock = (Number(item.stock) || 0) + addAmt;
            item.lastRestocked = new Date().toISOString();
            saveRawIngredients(list);
            syncFoodMenuStockFromIngredients();

            logStockMovement({
                action: 'RESTOCK',
                ingredientId: item.id,
                ingredientName: item.name,
                changeQty: addAmt,
                newStock: item.stock,
                unit: item.unit,
                operator: operator,
                notes: notes || 'Routine inventory restock',
                financialValue: addAmt * (Number(item.unitCost) || 0)
            });

            return item;
        }
        return null;
    }

    function setRawIngredientStock(id, newStock, operator = 'Super Admin', notes = '') {
        const list = getRawIngredients();
        const item = list.find(i => i.id === id);
        if (item) {
            const oldStock = Number(item.stock) || 0;
            const target = Math.max(0, Number(newStock));
            const diff = target - oldStock;
            item.stock = target;
            saveRawIngredients(list);
            syncFoodMenuStockFromIngredients();

            logStockMovement({
                action: 'ADJUSTMENT',
                ingredientId: item.id,
                ingredientName: item.name,
                changeQty: diff,
                newStock: target,
                unit: item.unit,
                operator: operator,
                notes: notes || 'Manual stock adjustment',
                financialValue: Math.abs(diff) * (Number(item.unitCost) || 0)
            });

            return item;
        }
        return null;
    }

    function addRawIngredient(newItem, operator = 'Super Admin') {
        const list = getRawIngredients();
        if (!newItem.id) newItem.id = 'ING-CUSTOM-' + Date.now();
        if (!newItem.unitCost) newItem.unitCost = 10.00;
        if (!newItem.supplier) newItem.supplier = 'Local Wholesale';
        newItem.lastRestocked = new Date().toISOString();
        list.push(newItem);
        saveRawIngredients(list);

        logStockMovement({
            action: 'RESTOCK',
            ingredientId: newItem.id,
            ingredientName: newItem.name,
            changeQty: Number(newItem.stock) || 0,
            newStock: Number(newItem.stock) || 0,
            unit: newItem.unit,
            operator: operator,
            notes: 'Added new ingredient to catalog',
            financialValue: (Number(newItem.stock) || 0) * (Number(newItem.unitCost) || 0)
        });

        return newItem;
    }

    function updateRawIngredient(id, data, operator = 'Super Admin') {
        const list = getRawIngredients();
        const idx = list.findIndex(i => i.id === id);
        if (idx !== -1) {
            list[idx] = { ...list[idx], ...data };
            saveRawIngredients(list);
            syncFoodMenuStockFromIngredients();

            logStockMovement({
                action: 'ADJUSTMENT',
                ingredientId: id,
                ingredientName: list[idx].name,
                changeQty: 0,
                newStock: list[idx].stock,
                unit: list[idx].unit,
                operator: operator,
                notes: 'Updated raw ingredient parameters (threshold/cost/unit)',
                financialValue: 0
            });

            return list[idx];
        }
        return null;
    }

    function deleteRawIngredient(id, operator = 'Super Admin') {
        const list = getRawIngredients();
        const idx = list.findIndex(i => i.id === id);
        if (idx !== -1) {
            const removed = list.splice(idx, 1)[0];
            saveRawIngredients(list);
            syncFoodMenuStockFromIngredients();

            logStockMovement({
                action: 'ADJUSTMENT',
                ingredientId: id,
                ingredientName: removed.name,
                changeQty: -removed.stock,
                newStock: 0,
                unit: removed.unit,
                operator: operator,
                notes: 'Deleted ingredient from master catalog',
                financialValue: 0
            });
            return true;
        }
        return false;
    }

    // ── RECIPE MANAGEMENT FOR MENU ITEMS ──
    function getItemRecipe(menuId, menuItemObj) {
        // If item has a custom recipe that was explicitly modified by the user
        if (menuItemObj && menuItemObj.isCustomRecipe && Array.isArray(menuItemObj.recipe) && menuItemObj.recipe.length > 0) {
            return menuItemObj.recipe;
        }

        // If official default recipe exists, use it (guarantees exact user specs for steak, chicken, fish)
        if (menuId && DEFAULT_FOOD_RECIPES[menuId]) {
            return DEFAULT_FOOD_RECIPES[menuId];
        }

        if (menuItemObj && Array.isArray(menuItemObj.recipe) && menuItemObj.recipe.length > 0) {
            return menuItemObj.recipe;
        }

        // Search in inventoryItems by ID or title/name
        try {
            const invStr = localStorage.getItem('inventoryItems');
            if (invStr) {
                const items = JSON.parse(invStr);
                const targetStr = String(menuId || (menuItemObj && (menuItemObj.id || menuItemObj.title || menuItemObj.name)) || '').toLowerCase().trim();
                if (targetStr) {
                    const matched = items.find(i => 
                        (i.id && i.id.toLowerCase() === targetStr) ||
                        (i.title && i.title.toLowerCase() === targetStr) ||
                        (i.name && i.name.toLowerCase() === targetStr)
                    );
                    if (matched) {
                        if (matched.isCustomRecipe && Array.isArray(matched.recipe) && matched.recipe.length > 0) {
                            return matched.recipe;
                        }
                        if (matched.id && DEFAULT_FOOD_RECIPES[matched.id]) {
                            return DEFAULT_FOOD_RECIPES[matched.id];
                        }
                        if (Array.isArray(matched.recipe) && matched.recipe.length > 0) {
                            return matched.recipe;
                        }
                    }
                }
            }
        } catch (e) {}

        return [];
    }

    // ── AUTOMATED RECIPE SYNCHRONIZATION WITH MASTER BOM STANDARDS ──
    function syncMasterRecipes(force = false) {
        try {
            const invStr = localStorage.getItem('inventoryItems');
            if (invStr) {
                const items = JSON.parse(invStr);
                if (Array.isArray(items) && items.length > 0) {
                    let updated = false;
                    items.forEach(item => {
                        if (DEFAULT_FOOD_RECIPES[item.id]) {
                            const def = DEFAULT_FOOD_RECIPES[item.id];
                            
                            // Check if current item still has old legacy recipe
                            const hasOldSteak = (item.category === 'Beef' || item.category === 'T-Bone' || item.category === 'Sirloin Steak') &&
                                item.recipe && item.recipe.some(r => r.ingredientId === 'ING-MUSHROOM-SAUCE' || (r.ingredientId === 'ING-BUTTER' && !item.recipe.some(x => x.ingredientId === 'ING-MARGARINE')));
                            
                            const isOldChicken = (item.category === 'Chicken & Fish' && (item.title || '').toLowerCase().includes('chicken')) &&
                                (!item.recipe || !item.recipe.some(r => r.ingredientId === 'ING-KETCHUP'));

                            const isOldFish = (item.category === 'Chicken & Fish' && ((item.title || '').toLowerCase().includes('fish') || (item.title || '').toLowerCase().includes('bangus') || (item.title || '').toLowerCase().includes('tanigue'))) &&
                                (!item.recipe || !item.recipe.some(r => r.ingredientId === 'ING-TOYO'));

                            if (force || hasOldSteak || isOldChicken || isOldFish || !item.recipe || item.recipe.length === 0 || !item.isCustomRecipe) {
                                item.recipe = JSON.parse(JSON.stringify(def));
                                updated = true;
                            }
                        }
                    });
                    if (updated) {
                        localStorage.setItem('inventoryItems', JSON.stringify(items));
                    }
                }
            }
            localStorage.setItem('roland_recipes_version', '2026_bom_v2.5');
        } catch (e) {
            console.error('Error syncing master recipes:', e);
        }
    }

    // Run sync on initialization
    syncMasterRecipes(false);

    function saveItemRecipe(menuId, recipeArray, operator = 'Super Admin') {
        try {
            const invStr = localStorage.getItem('inventoryItems');
            let items = invStr ? JSON.parse(invStr) : [];
            const idx = items.findIndex(i => i.id === menuId);
            if (idx !== -1) {
                items[idx].recipe = recipeArray;
                items[idx].isCustomRecipe = true;
            } else {
                items.push({ id: menuId, recipe: recipeArray, isCustomRecipe: true });
            }
            localStorage.setItem('inventoryItems', JSON.stringify(items));
            syncFoodMenuStockFromIngredients();

            logStockMovement({
                action: 'RECIPE_UPDATE',
                ingredientId: menuId,
                ingredientName: (items[idx] && items[idx].title) ? items[idx].title : menuId,
                changeQty: 0,
                newStock: null,
                unit: 'recipe',
                operator: operator,
                notes: `Updated Recipe BOM (${recipeArray.length} ingredient items)`,
                financialValue: 0
            });
        } catch (e) {
            console.error('Error saving item recipe:', e);
        }
    }

    // ── DYNAMIC FOOD AVAILABILITY CALCULATION ──
    function calculateFoodAvailability(menuItem, ingredientsCatalog) {
        const catalog = ingredientsCatalog || getRawIngredients();
        const rawMap = {};
        catalog.forEach(ing => { rawMap[ing.id] = ing; });

        const recipe = getItemRecipe(menuItem.id, menuItem);

        if (!recipe || recipe.length === 0) {
            const legacyStock = (menuItem.total_stock !== undefined) ? menuItem.total_stock : (menuItem.stock || 0);
            return {
                availablePortions: Math.max(0, legacyStock),
                isAvailable: legacyStock > 0,
                status: legacyStock <= 0 ? 'Out of Stock' : (legacyStock <= (menuItem.threshold || 5) ? 'Low Stock' : 'Available'),
                recipe: [],
                missingIngredients: legacyStock <= 0 ? ['Legacy Direct Stock depleted'] : []
            };
        }

        let minPossiblePortions = Infinity;
        const missingIngredients = [];
        const recipeDetails = [];

        recipe.forEach(r => {
            const rawIng = rawMap[r.ingredientId];
            if (!rawIng) {
                recipeDetails.push({ name: 'Unknown Ingredient', needed: r.qty, unit: r.unit, availableStock: 0, possiblePortions: 0 });
                minPossiblePortions = 0;
                missingIngredients.push('Unknown ingredient (ID: ' + r.ingredientId + ')');
                return;
            }

            const currentStock = Number(rawIng.stock) || 0;
            const requiredQty = Number(r.qty) || 1;
            const possiblePortions = Math.floor(currentStock / requiredQty);

            recipeDetails.push({
                id: rawIng.id,
                name: rawIng.name,
                needed: requiredQty,
                unit: r.unit || rawIng.unit,
                availableStock: currentStock,
                possiblePortions: possiblePortions
            });

            if (possiblePortions < minPossiblePortions) {
                minPossiblePortions = possiblePortions;
            }

            if (possiblePortions <= 0) {
                missingIngredients.push(rawIng.name + ' (0 ' + (r.unit || rawIng.unit) + ' left)');
            }
        });

        if (minPossiblePortions === Infinity) minPossiblePortions = 0;

        const isAvailable = minPossiblePortions > 0;
        let status = 'Available';
        if (minPossiblePortions <= 0) {
            status = 'Out of Stock';
        } else if (minPossiblePortions <= 5) {
            status = 'Low Stock';
        }

        return {
            availablePortions: minPossiblePortions,
            isAvailable: isAvailable,
            status: status,
            recipe: recipeDetails,
            missingIngredients: missingIngredients
        };
    }

    let isSyncingStock = false;
    function syncFoodMenuStockFromIngredients() {
        if (isSyncingStock) return;
        isSyncingStock = true;
        try {
            const rawList = getRawIngredients();
            const invStr = localStorage.getItem('inventoryItems');
            let items = invStr ? JSON.parse(invStr) : [];

            let mutated = false;
            items.forEach(item => {
                const avail = calculateFoodAvailability(item, rawList);
                if (item.stock !== avail.availablePortions || item.total_stock !== avail.availablePortions) {
                    item.stock = avail.availablePortions;
                    item.total_stock = avail.availablePortions;
                    item.computedStatus = avail.status;
                    item.missingIngredients = avail.missingIngredients;
                    mutated = true;
                }
            });

            if (mutated) {
                localStorage.setItem('inventoryItems', JSON.stringify(items));
                window.dispatchEvent(new CustomEvent('inventoryUpdated', { detail: items }));
                broadcastSync('inventoryUpdated', items);
            }
        } catch (e) {
            console.error('Error syncing food menu stock:', e);
        } finally {
            isSyncingStock = false;
        }
    }

    // ── HELPER TO NORMALIZE CART ITEM INPUT FORMATS ──
    function normalizeCartItemsInput(cartItems) {
        if (!cartItems) return [];
        if (Array.isArray(cartItems)) {
            return cartItems.map(item => {
                if (typeof item === 'string') {
                    const m = item.match(/^(\d+)x\s+(.+)$/);
                    if (m) {
                        return { name: m[2].trim(), title: m[2].trim(), quantity: parseInt(m[1], 10) };
                    }
                    return { name: item, title: item, quantity: 1 };
                }
                return {
                    id: item.id || item.menuId,
                    title: item.title || item.name,
                    name: item.name || item.title,
                    quantity: Number(item.quantity || item.qty) || 1
                };
            });
        } else if (typeof cartItems === 'object') {
            const arr = [];
            for (const key in cartItems) {
                const val = cartItems[key];
                const qty = (typeof val === 'object' && val !== null) ? (val.qty || val.quantity || 1) : Number(val) || 1;
                arr.push({ id: key, quantity: qty });
            }
            return arr;
        }
        return [];
    }

    // ── PRE-CHECKOUT RAW INGREDIENT & SHARED BOTTLENECK VALIDATION ──
    function validateOrderIngredients(cartItems) {
        const normalized = normalizeCartItemsInput(cartItems);
        if (normalized.length === 0) {
            return { isValid: true, shortages: [] };
        }

        const rawList = getRawIngredients();
        const rawMap = {};
        rawList.forEach(ing => { rawMap[ing.id] = Number(ing.stock) || 0; });

        const requiredTotals = {};
        const shortages = [];

        let invItems = [];
        try {
            const invStr = localStorage.getItem('inventoryItems');
            if (invStr) invItems = JSON.parse(invStr);
        } catch (e) {}

        normalized.forEach(cartItem => {
            const itemId = cartItem.id;
            const qtyOrdered = Number(cartItem.quantity) || 1;
            if (qtyOrdered <= 0) return;

            const recipe = getItemRecipe(itemId, cartItem);
            if (recipe && recipe.length > 0) {
                recipe.forEach(r => {
                    const reqQty = Number(r.qty) || 0;
                    requiredTotals[r.ingredientId] = (requiredTotals[r.ingredientId] || 0) + (reqQty * qtyOrdered);
                });
            } else if (itemId) {
                const invItem = invItems.find(i => i.id === itemId);
                if (invItem) {
                    const avail = (invItem.total_stock !== undefined) ? invItem.total_stock : (invItem.stock || 0);
                    if (avail < qtyOrdered) {
                        shortages.push({
                            ingredientId: itemId,
                            ingredientName: invItem.title || invItem.name || itemId,
                            available: avail,
                            needed: qtyOrdered,
                            unit: 'portion(s)'
                        });
                    }
                }
            }
        });

        for (const ingId in requiredTotals) {
            const available = rawMap[ingId] || 0;
            const needed = requiredTotals[ingId];
            if (needed > available) {
                const rawItem = rawList.find(i => i.id === ingId);
                shortages.push({
                    ingredientId: ingId,
                    ingredientName: rawItem ? rawItem.name : ingId,
                    available: available,
                    needed: needed,
                    unit: rawItem ? rawItem.unit : ''
                });
            }
        }

        return {
            isValid: shortages.length === 0,
            shortages: shortages
        };
    }

    // ── AUTOMATED ATOMIC INGREDIENT DEDUCTION ON ORDERS ──
    function deductIngredientsForOrder(cartItems, operator = 'Customer Order System', orderRef = '') {
        const normalized = normalizeCartItemsInput(cartItems);
        if (normalized.length === 0) return { success: false, error: 'Empty cart' };

        // 1. Transaction Safety Pre-flight Check (Prevents negative stock & aborts whole order if shortage)
        const check = validateOrderIngredients(normalized);
        if (!check.isValid) {
            console.warn('Deduction rejected due to ingredient shortage:', check.shortages);
            return {
                success: false,
                error: 'Insufficient ingredients in stock',
                shortages: check.shortages
            };
        }

        const rawList = getRawIngredients();
        const rawMap = {};
        rawList.forEach(ing => { rawMap[ing.id] = ing; });

        let updatedAny = false;

        normalized.forEach(cartItem => {
            const itemId = cartItem.id;
            const itemTitle = cartItem.title || cartItem.name || itemId;
            const qtyOrdered = Number(cartItem.quantity) || 1;
            if (qtyOrdered <= 0) return;

            const recipe = getItemRecipe(itemId, cartItem);
            if (recipe && recipe.length > 0) {
                recipe.forEach(r => {
                    const rawIng = rawMap[r.ingredientId];
                    if (rawIng) {
                        const totalDeduct = (Number(r.qty) || 0) * qtyOrdered;
                        const oldS = Number(rawIng.stock) || 0;
                        rawIng.stock = Math.max(0, oldS - totalDeduct);
                        updatedAny = true;

                        logStockMovement({
                            action: 'ORDER_DEDUCTION',
                            ingredientId: rawIng.id,
                            ingredientName: rawIng.name,
                            changeQty: -totalDeduct,
                            newStock: rawIng.stock,
                            unit: rawIng.unit,
                            operator: operator,
                            notes: `Deducted for Order: ${qtyOrdered}x "${itemTitle}" ${orderRef ? '(' + orderRef + ')' : ''}`,
                            financialValue: totalDeduct * (Number(rawIng.unitCost) || 0)
                        });
                    }
                });
            }
        });

        if (updatedAny) {
            saveRawIngredients(Object.values(rawMap));
            syncFoodMenuStockFromIngredients();
        }

        return { success: true };
    }

    // ── AUTOMATED INGREDIENT RESTORATION ON CANCELLED / REJECTED ORDERS ──
    function restoreIngredientsForOrder(cartItems, reason = 'Order Rejected / Cancelled', operator = 'Admin') {
        const normalized = normalizeCartItemsInput(cartItems);
        if (normalized.length === 0) return { success: false, error: 'Empty items' };

        const rawList = getRawIngredients();
        const rawMap = {};
        rawList.forEach(ing => { rawMap[ing.id] = ing; });

        let updatedAny = false;

        normalized.forEach(cartItem => {
            const itemId = cartItem.id;
            const itemTitle = cartItem.title || cartItem.name || itemId;
            const qtyOrdered = Number(cartItem.quantity) || 1;
            if (qtyOrdered <= 0) return;

            const recipe = getItemRecipe(itemId, cartItem);
            if (recipe && recipe.length > 0) {
                recipe.forEach(r => {
                    const rawIng = rawMap[r.ingredientId];
                    if (rawIng) {
                        const totalAdd = (Number(r.qty) || 0) * qtyOrdered;
                        rawIng.stock = (Number(rawIng.stock) || 0) + totalAdd;
                        updatedAny = true;

                        logStockMovement({
                            action: 'ORDER_REFUND',
                            ingredientId: rawIng.id,
                            ingredientName: rawIng.name,
                            changeQty: totalAdd,
                            newStock: rawIng.stock,
                            unit: rawIng.unit,
                            operator: operator,
                            notes: `Restored stock for cancelled order (${reason}): ${qtyOrdered}x "${itemTitle}"`,
                            financialValue: totalAdd * (Number(rawIng.unitCost) || 0)
                        });
                    }
                });
            }
        });

        if (updatedAny) {
            saveRawIngredients(Object.values(rawMap));
            syncFoodMenuStockFromIngredients();
        }

        return { success: true };
    }

    // ── INTEGRATED RESERVATION & FOOD ORDER CANCELLATION ENGINE ──
    function cancelReservationWithFood(params) {
        const {
            reservationNumber,
            reason = 'Customer Cancelled',
            cancelledBy = 'customer',
            operator = 'Customer Portal',
            treatAsSpoilage = false
        } = params || {};

        if (!reservationNumber) return { success: false, error: 'Missing reservationNumber' };

        let hist = [];
        try {
            const raw = localStorage.getItem('reservationHistory');
            if (raw) hist = JSON.parse(raw);
        } catch (e) {
            return { success: false, error: 'Failed to read reservation history' };
        }

        const resIdx = hist.findIndex(r => r.reservationNumber === reservationNumber);
        if (resIdx === -1) {
            return { success: false, error: 'Reservation not found' };
        }

        const targetRes = hist[resIdx];
        if (targetRes.approvalStatus === 'rejected' || targetRes.approvalStatus === 'cancelled') {
            return { success: false, error: 'Reservation is already cancelled' };
        }

        const foodItems = targetRes.cartItems || targetRes.foods || [];
        const hasFood = Array.isArray(foodItems) && foodItems.length > 0;
        const currentKds = targetRes.kdsStatus || 'pending';
        let stockAction = 'none';

        // 1. Handle Food & Ingredients
        if (hasFood && currentKds !== 'served') {
            if (treatAsSpoilage || currentKds === 'cooking' || currentKds === 'ready') {
                const normalized = normalizeCartItemsInput(foodItems);
                normalized.forEach(item => {
                    const recipe = getItemRecipe(item.id, item);
                    if (recipe && recipe.length > 0) {
                        recipe.forEach(r => {
                            logSpoilage({
                                ingredientId: r.ingredientId,
                                ingredientName: r.ingredientId,
                                quantity: (Number(r.qty) || 0) * (Number(item.quantity) || 1),
                                unit: r.unit,
                                reason: `Order Cancelled during '${currentKds}' prep: ${reason}`,
                                cost: 0,
                                operator: operator
                            });
                        });
                    }
                });
                stockAction = 'logged_spoilage';
            } else {
                restoreIngredientsForOrder(foodItems, `Cancelled by ${cancelledBy}: ${reason}`, operator);
                stockAction = 'restored_to_stock';
            }
        }

        // 2. Update Reservation Record
        targetRes.approvalStatus = 'rejected';
        targetRes.kdsStatus = 'cancelled';
        targetRes.completedAt = new Date().toISOString();
        targetRes.cancelledAt = new Date().toISOString();
        targetRes.cancelledBy = cancelledBy;
        targetRes.cancellationReason = reason;

        // Check refund eligibility
        const isPaid = targetRes.paymentStatus === 'paid' || targetRes.paymentStatus === 'pending_check' || (Number(targetRes.paymentAmount) > 0);
        if (isPaid && targetRes.refundStatus !== 'refunded') {
            targetRes.refundStatus = 'pending_refund';
        } else if (!targetRes.refundStatus) {
            targetRes.refundStatus = 'not_applicable';
        }

        // 3. Release Booked Table
        const tableId = targetRes.bookedTable;
        let tableReleased = false;
        if (tableId) {
            const activeRemaining = hist.filter(r => 
                r.bookedTable === tableId && 
                r !== targetRes && 
                !r.completedAt && 
                r.approvalStatus !== 'rejected' && 
                r.approvalStatus !== 'cancelled'
            );
            if (activeRemaining.length === 0) {
                try {
                    const overrides = JSON.parse(localStorage.getItem('tableOverrides') || '{}');
                    overrides[tableId] = 'available';
                    localStorage.setItem('tableOverrides', JSON.stringify(overrides));
                    tableReleased = true;
                } catch (e) {}
            }
        }

        // 4. Save and Broadcast across tabs (Admin, Superadmin, Kitchen, POS)
        try {
            localStorage.setItem('reservationHistory', JSON.stringify(hist));
            
            const payload = {
                reservationNumber: reservationNumber,
                customerName: targetRes.customerName || 'Guest',
                bookedTable: targetRes.bookedTable,
                hasFood: hasFood,
                foodItems: foodItems,
                cancelledBy: cancelledBy,
                reason: reason,
                cancelledAt: targetRes.cancelledAt,
                stockAction: stockAction,
                tableReleased: tableReleased,
                refundStatus: targetRes.refundStatus
            };

            window.dispatchEvent(new CustomEvent('reservationHistoryUpdated', { detail: hist }));
            window.dispatchEvent(new CustomEvent('customerCancelledReservation', { detail: payload }));
            broadcastSync('customerCancelledReservation', payload);
            broadcastSync('reservationHistoryUpdated', hist);

            if (tableReleased) {
                const updatedOverrides = JSON.parse(localStorage.getItem('tableOverrides') || '{}');
                window.dispatchEvent(new CustomEvent('tableOverridesUpdated', { detail: updatedOverrides }));
                broadcastSync('tableOverridesUpdated', updatedOverrides);
            }

            return {
                success: true,
                reservation: targetRes,
                stockAction: stockAction,
                tableReleased: tableReleased
            };
        } catch (e) {
            console.error('Error saving cancelled reservation:', e);
            return { success: false, error: 'Failed to update reservation storage' };
        }
    }

    // ── PROCESS RESERVATION REFUND ──
    function processReservationRefund(params) {
        const {
            reservationNumber,
            amount,
            method = 'gcash',
            refNumber = '',
            reason = 'Customer requested refund',
            operator = 'Admin'
        } = params || {};

        if (!reservationNumber) return { success: false, error: 'Missing reservationNumber' };

        let hist = [];
        try {
            const raw = localStorage.getItem('reservationHistory');
            if (raw) hist = JSON.parse(raw);
        } catch (e) {
            return { success: false, error: 'Failed to read reservation history' };
        }

        const resIdx = hist.findIndex(r => r.reservationNumber === reservationNumber);
        if (resIdx === -1) {
            return { success: false, error: 'Reservation not found' };
        }

        const targetRes = hist[resIdx];
        const refundAmt = Math.max(0, Number(amount) || 0);

        targetRes.paymentStatus = 'refunded';
        targetRes.refundStatus = 'refunded';
        targetRes.refundAmount = refundAmt;
        targetRes.refundMethod = method;
        targetRes.refundRef = refNumber;
        targetRes.refundReason = reason;
        targetRes.refundedAt = new Date().toISOString();
        targetRes.refundedBy = operator;

        try {
            localStorage.setItem('reservationHistory', JSON.stringify(hist));

            logStockMovement({
                action: 'ORDER_REFUND',
                ingredientId: 'FINANCIAL',
                ingredientName: `Refund #${reservationNumber}`,
                changeQty: 0,
                newStock: 0,
                unit: 'PHP',
                operator: operator,
                notes: `Issued ${method.toUpperCase()} refund of ₱${refundAmt.toLocaleString()} for #${reservationNumber} (${reason}). Ref: ${refNumber || 'N/A'}`,
                financialValue: -refundAmt
            });

            const payload = {
                reservationNumber: reservationNumber,
                refundAmount: refundAmt,
                refundMethod: method,
                refundRef: refNumber,
                refundedAt: targetRes.refundedAt,
                operator: operator
            };

            window.dispatchEvent(new CustomEvent('reservationHistoryUpdated', { detail: hist }));
            window.dispatchEvent(new CustomEvent('reservationRefunded', { detail: payload }));
            broadcastSync('reservationRefunded', payload);
            broadcastSync('reservationHistoryUpdated', hist);

            return { success: true, reservation: targetRes };
        } catch (err) {
            console.error('Error processing refund:', err);
            return { success: false, error: err.message };
        }
    }

    // ── SMART INVENTORY HEALTH & AUTO-RESTOCK ──
    function autoRestockAllLowStock(operator = 'Super Admin') {
        const list = getRawIngredients();
        let restockedCount = 0;

        list.forEach(ing => {
            const minT = Number(ing.minThreshold) || 10;
            const currentS = Number(ing.stock) || 0;

            if (currentS <= minT) {
                const addAmt = (ing.unit === 'g' || ing.unit === 'ml') ? 5000 : 50;
                const targetStock = Math.max(minT * 2, currentS + addAmt);
                const actualAdded = targetStock - currentS;
                ing.stock = targetStock;
                ing.lastRestocked = new Date().toISOString();
                restockedCount++;

                logStockMovement({
                    action: 'RESTOCK',
                    ingredientId: ing.id,
                    ingredientName: ing.name,
                    changeQty: actualAdded,
                    newStock: targetStock,
                    unit: ing.unit,
                    operator: operator,
                    notes: 'Smart Auto-Restock triggered',
                    financialValue: actualAdded * (Number(ing.unitCost) || 0)
                });
            }
        });

        if (restockedCount > 0) {
            saveRawIngredients(list);
            syncFoodMenuStockFromIngredients();
        }
        return restockedCount;
    }

    function getInventoryHealthSummary() {
        const rawList = getRawIngredients();
        const lowIngredients = rawList.filter(i => (Number(i.stock) || 0) > 0 && (Number(i.stock) || 0) <= (Number(i.minThreshold) || 10));
        const outIngredients = rawList.filter(i => (Number(i.stock) || 0) <= 0);

        const invStr = localStorage.getItem('inventoryItems');
        const items = invStr ? JSON.parse(invStr) : [];
        const affectedFood = items.filter(item => {
            const avail = calculateFoodAvailability(item, rawList);
            return !avail.isAvailable || avail.availablePortions <= 0;
        });

        let healthStatus = 'Optimal';
        if (outIngredients.length > 0 || affectedFood.length > 0) healthStatus = 'Critical';
        else if (lowIngredients.length > 0) healthStatus = 'Attention Needed';

        return {
            totalIngredients: rawList.length,
            lowCount: lowIngredients.length,
            outCount: outIngredients.length,
            affectedFoodCount: affectedFood.length,
            healthStatus: healthStatus,
            lowIngredients: lowIngredients,
            outIngredients: outIngredients
        };
    }

    // ── INVENTORY VALUATION & COGS CALCULATOR ──
    function getInventoryValuation() {
        const rawList = getRawIngredients();
        let totalAssetValue = 0;
        const categoryMap = {};

        rawList.forEach(ing => {
            const stock = Number(ing.stock) || 0;
            const cost = Number(ing.unitCost) || 0;
            const itemVal = stock * cost;
            totalAssetValue += itemVal;

            const cat = ing.category || 'Uncategorized';
            if (!categoryMap[cat]) categoryMap[cat] = { count: 0, totalValue: 0 };
            categoryMap[cat].count++;
            categoryMap[cat].totalValue += itemVal;
        });

        return {
            totalAssetValue: totalAssetValue,
            totalIngredients: rawList.length,
            categoryBreakdown: categoryMap
        };
    }

    function calculateDishRecipeCost(menuId, menuItemObj) {
        const recipe = getItemRecipe(menuId, menuItemObj);
        const rawList = getRawIngredients();
        const rawMap = {};
        rawList.forEach(i => { rawMap[i.id] = i; });

        let totalCost = 0;
        const detail = recipe.map(r => {
            const ing = rawMap[r.ingredientId];
            const unitCost = ing ? (Number(ing.unitCost) || 0) : 0;
            const qty = Number(r.qty) || 0;
            const lineCost = qty * unitCost;
            totalCost += lineCost;

            return {
                ingredientId: r.ingredientId,
                name: ing ? ing.name : 'Unknown',
                qty: qty,
                unit: r.unit || (ing ? ing.unit : ''),
                unitCost: unitCost,
                lineCost: lineCost
            };
        });

        const menuPrice = menuItemObj ? (Number(menuItemObj.price) || 0) : 0;
        const profitMargin = menuPrice > 0 ? (menuPrice - totalCost) : 0;
        const marginPct = menuPrice > 0 ? ((profitMargin / menuPrice) * 100).toFixed(1) : '0';

        return {
            totalCost: totalCost,
            menuPrice: menuPrice,
            profitMargin: profitMargin,
            marginPct: marginPct,
            recipeDetail: detail
        };
    }

    // ── UI RENDERING HELPERS FOR ADMIN & SUPER ADMIN ──
    function renderValuationUI(containerEl) {
        if (!containerEl) return;
        const valData = getInventoryValuation();
        const health = getInventoryHealthSummary();
        const storeStatus = getStoreStatus();
        const isOpen = storeStatus === 'open';

        const invStr = localStorage.getItem('inventoryItems');
        const items = invStr ? JSON.parse(invStr) : [];

        const svgStore = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
        const svgLock = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;

        containerEl.innerHTML = `
            <!-- STORE STATUS & QUICK BANNER -->
            <div style="background:${isOpen ? 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)' : 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)'}; color:white; padding:18px 22px; border-radius:14px; margin-bottom:20px; box-shadow:0 6px 20px rgba(0,0,0,0.15); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
                <div style="display:flex; align-items:center; gap:14px;">
                    <span style="background:rgba(255,255,255,0.15); padding:10px; border-radius:10px; display:inline-flex; align-items:center; justify-content:center;">${isOpen ? svgStore : svgLock}</span>
                    <div>
                        <h4 style="margin:0; font-size:15px; font-weight:800; letter-spacing:0.5px;">STORE STATUS: ${isOpen ? 'OPEN FOR ONLINE ORDERS & RESERVATIONS' : 'CLOSED — ONLINE ORDERS & RESERVATIONS DISABLED'}</h4>
                        <p style="margin:3px 0 0 0; font-size:12.5px; opacity:0.95;">${isOpen ? 'Customer website is actively taking orders. Out-of-stock items are automatically disabled.' : 'Customer website display notice: Store is Closed. Reservations and cart checkout are disabled.'}</p>
                    </div>
                </div>
                <button onclick="if(typeof toggleSuperAdminStoreStatus==='function') toggleSuperAdminStoreStatus(); else { window.InventorySystem.toggleStoreStatus(); location.reload(); }" style="background:${isOpen ? '#ef4444' : '#16a34a'}; color:white; border:none; padding:11px 22px; border-radius:30px; font-weight:800; font-size:13px; cursor:pointer; box-shadow:0 4px 14px rgba(0,0,0,0.25); display:inline-flex; align-items:center; gap:8px;">
                    <span style="width:8px; height:8px; border-radius:50%; background:white; display:inline-block;"></span>
                    ${isOpen ? 'Close Website (Stop Orders)' : 'Open Website (Accept Orders)'}
                </button>
            </div>

            <!-- ASSET & HEALTH METRIC CARDS -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-bottom:24px;">
                <div style="background:white; border:1px solid #e2e8f0; border-left:5px solid #16a34a; border-radius:12px; padding:18px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                    <div style="font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase;">Total Raw Asset Value</div>
                    <div style="font-size:24px; font-weight:800; color:#1b5e20; margin-top:4px;">₱${valData.totalAssetValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div style="font-size:11px; color:#64748b; margin-top:4px;">Across ${valData.totalIngredients} Raw Material Items</div>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-left:5px solid #3b82f6; border-radius:12px; padding:18px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                    <div style="font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase;">Master Ingredients Catalog</div>
                    <div style="font-size:24px; font-weight:800; color:#1e3a8a; margin-top:4px;">${health.totalIngredients} Items</div>
                    <div style="font-size:11px; color:#64748b; margin-top:4px;">Meat, Poultry, Produce, Beverages</div>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-left:5px solid ${health.lowCount > 0 || health.outCount > 0 ? '#f59e0b' : '#10b981'}; border-radius:12px; padding:18px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                    <div style="font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase;">Stock Health Status</div>
                    <div style="font-size:20px; font-weight:800; color:${health.outCount > 0 ? '#ef4444' : (health.lowCount > 0 ? '#f59e0b' : '#16a34a')}; margin-top:4px;">
                        ${health.healthStatus.toUpperCase()}
                    </div>
                    <div style="font-size:11px; color:#64748b; margin-top:4px;">${health.lowCount} Low Stock | ${health.outCount} Out of Stock</div>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-left:5px solid #dc2626; border-radius:12px; padding:18px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                    <div style="font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase;">Menu Items Impacted</div>
                    <div style="font-size:24px; font-weight:800; color:#b91c1c; margin-top:4px;">${health.affectedFoodCount} Dishes</div>
                    <div style="font-size:11px; color:#64748b; margin-top:4px;">Dishes currently Out of Stock</div>
                </div>
            </div>

            <!-- DISH COGS & MARGIN ANALYSIS TABLE -->
            <div style="background:white; border:1px solid #e2e8f0; border-radius:14px; padding:20px; margin-bottom:24px; box-shadow:0 2px 10px rgba(0,0,0,0.03);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
                    <div>
                        <h3 style="margin:0; font-family:'Playfair Display',serif; color:#1b5e20; font-size:18px;">Dish Recipe COGS & Profit Margin Breakdown</h3>
                        <span style="font-size:12px; color:#64748b;">Calculated production cost based on raw ingredient BOM recipes vs menu prices</span>
                    </div>
                </div>

                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left;">
                        <thead>
                            <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0; color:#475569;">
                                <th style="padding:12px;">Menu Dish Item</th>
                                <th style="padding:12px;">Category</th>
                                <th style="padding:12px;">Menu Price (₱)</th>
                                <th style="padding:12px;">Recipe Cost (₱)</th>
                                <th style="padding:12px;">Gross Profit (₱)</th>
                                <th style="padding:12px;">Margin %</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => {
                                const cogs = calculateDishRecipeCost(item.id, item);
                                const marginPctNum = parseFloat(cogs.marginPct) || 0;
                                const badgeBg = marginPctNum >= 60 ? '#f0fdf4' : (marginPctNum >= 40 ? '#fffbeb' : '#fef2f2');
                                const badgeColor = marginPctNum >= 60 ? '#15803d' : (marginPctNum >= 40 ? '#b45309' : '#b91c1c');

                                return `
                                    <tr style="border-bottom:1px solid #f1f5f9;">
                                        <td style="padding:12px; font-weight:bold; color:#0f172a;">${item.title || item.name}</td>
                                        <td style="padding:12px; color:#64748b;">${item.category || 'General'}</td>
                                        <td style="padding:12px; font-weight:bold;">₱${(Number(item.price)||0).toFixed(2)}</td>
                                        <td style="padding:12px; color:#0369a1; font-weight:bold;">₱${cogs.totalCost.toFixed(2)}</td>
                                        <td style="padding:12px; color:#15803d; font-weight:bold;">₱${cogs.profitMargin.toFixed(2)}</td>
                                        <td style="padding:12px;">
                                            <span style="background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeColor}40; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:bold;">
                                                ${cogs.marginPct}%
                                            </span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderWastageLogUI(containerEl, role = 'Admin') {
        if (!containerEl) return;
        const wasteLogs = getSpoilageLogs();
        const totalLoss = wasteLogs.reduce((sum, w) => sum + (Number(w.totalLoss) || 0), 0);

        const svgTrash = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:6px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

        containerEl.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
                <div>
                    <h3 style="margin:0; font-family:'Playfair Display',serif; color:#b91c1c; font-size:18px; display:flex; align-items:center;">${svgTrash} Kitchen Spoilage & Wastage Log</h3>
                    <span style="font-size:12px; color:#64748b;">Record expired, damaged, spilled, or staff meal food items with financial loss calculations</span>
                </div>
                <div style="display:flex; gap:10px; align-items:center;">
                    <div style="background:#fef2f2; border:1px solid #fca5a5; padding:8px 14px; border-radius:10px; font-weight:bold; font-size:13px; color:#991b1b;">
                        Total Financial Loss: ₱${totalLoss.toFixed(2)}
                    </div>
                    <button onclick="openLogSpoilageModal()" style="background:#ef4444; color:white; border:none; padding:10px 18px; border-radius:8px; font-weight:bold; cursor:pointer; box-shadow:0 4px 10px rgba(239,68,68,0.25); display:inline-flex; align-items:center; gap:6px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Log Spoilage / Waste
                    </button>
                </div>
            </div>

            <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left;">
                    <thead>
                        <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0; color:#475569;">
                            <th style="padding:12px;">Date & Time</th>
                            <th style="padding:12px;">Ingredient Item</th>
                            <th style="padding:12px;">Quantity Wasted</th>
                            <th style="padding:12px;">Unit Cost</th>
                            <th style="padding:12px;">Total Financial Loss</th>
                            <th style="padding:12px;">Reason</th>
                            <th style="padding:12px;">Logged By</th>
                            <th style="padding:12px;">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${wasteLogs.length === 0 ? `
                            <tr>
                                <td colspan="8" style="padding:30px; text-align:center; color:#94a3b8; font-style:italic;">
                                    No spoilage or wastage logged yet. All kitchen items are in optimal condition.
                                </td>
                            </tr>
                        ` : wasteLogs.map(w => {
                            const dt = new Date(w.timestamp).toLocaleString();
                            return `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:12px; color:#64748b; font-size:12px;">${dt}</td>
                                    <td style="padding:12px; font-weight:bold; color:#0f172a;">${w.ingredientName}</td>
                                    <td style="padding:12px; font-weight:bold; color:#b91c1c;">-${w.qty} ${w.unit}</td>
                                    <td style="padding:12px; color:#64748b;">₱${(Number(w.unitCost)||0).toFixed(2)}</td>
                                    <td style="padding:12px; font-weight:bold; color:#dc2626;">₱${(Number(w.totalLoss)||0).toFixed(2)}</td>
                                    <td style="padding:12px;">
                                        <span style="background:#fee2e2; color:#991b1b; padding:4px 8px; border-radius:10px; font-size:11px; font-weight:bold;">
                                            ${w.reason}
                                        </span>
                                    </td>
                                    <td style="padding:12px; color:#475569; font-weight:600;">${w.operator || 'Staff'}</td>
                                    <td style="padding:12px; color:#64748b; font-style:italic;">${w.notes || '—'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderAuditLogUI(containerEl, role = 'Super Admin') {
        if (!containerEl) return;
        const logs = getAuditLogs();

        const svgAudit = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:6px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
        const svgDownload = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;

        containerEl.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
                <div>
                    <h3 style="margin:0; font-family:'Playfair Display',serif; color:#1b5e20; font-size:18px; display:flex; align-items:center;">${svgAudit} Stock Movement Audit Trail</h3>
                    <span style="font-size:12px; color:#64748b;">Complete append-only audit trail recording restocks, order deductions, refunds, and adjustments</span>
                </div>
                <div style="display:flex; gap:10px;">
                    <button onclick="exportAuditLogsCsv()" style="background:#16a34a; color:white; border:none; padding:9px 16px; border-radius:8px; font-weight:bold; cursor:pointer; box-shadow:0 4px 10px rgba(22,163,74,0.2); display:inline-flex; align-items:center; gap:6px;">
                        ${svgDownload} Export CSV Report
                    </button>
                    ${role === 'Super Admin' ? `
                        <button onclick="if(confirm('Clear all audit logs? This cannot be undone.')) { window.InventorySystem.clearAuditLogs(); window.InventorySystem.renderAuditLogUI(document.getElementById('superadmin-audit-container'), 'Super Admin'); }" style="background:#cbd5e1; color:#334155; border:none; padding:9px 14px; border-radius:8px; font-weight:bold; cursor:pointer;">
                            Clear Logs
                        </button>
                    ` : ''}
                </div>
            </div>

            <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; font-size:12.5px; text-align:left;">
                    <thead>
                        <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0; color:#475569;">
                            <th style="padding:10px 12px;">Timestamp</th>
                            <th style="padding:10px 12px;">Action Type</th>
                            <th style="padding:10px 12px;">Ingredient / Item</th>
                            <th style="padding:10px 12px;">Qty Change</th>
                            <th style="padding:10px 12px;">New Stock</th>
                            <th style="padding:10px 12px;">Operator</th>
                            <th style="padding:10px 12px;">Notes / Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.length === 0 ? `
                            <tr>
                                <td colspan="7" style="padding:30px; text-align:center; color:#94a3b8; font-style:italic;">
                                    No stock movement audit records logged yet.
                                </td>
                            </tr>
                        ` : logs.map(l => {
                            const dt = new Date(l.timestamp).toLocaleString();
                            const isAdd = l.changeQty > 0;
                            const isSubtract = l.changeQty < 0;
                            const actionBg = l.action === 'RESTOCK' ? '#f0fdf4' : (l.action === 'ORDER_REFUND' ? '#eff6ff' : (l.action === 'WASTAGE_SPOILAGE' ? '#fef2f2' : '#f8fafc'));
                            const actionColor = l.action === 'RESTOCK' ? '#166534' : (l.action === 'ORDER_REFUND' ? '#1e40af' : (l.action === 'WASTAGE_SPOILAGE' ? '#991b1b' : '#334155'));

                            return `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:10px 12px; color:#64748b; font-size:11.5px;">${dt}</td>
                                    <td style="padding:10px 12px;">
                                        <span style="background:${actionBg}; color:${actionColor}; border:1px solid ${actionColor}30; padding:3px 8px; border-radius:10px; font-size:10.5px; font-weight:bold;">
                                            ${l.action}
                                        </span>
                                    </td>
                                    <td style="padding:10px 12px; font-weight:bold; color:#0f172a;">${l.ingredientName}</td>
                                    <td style="padding:10px 12px; font-weight:bold; color:${isAdd ? '#16a34a' : (isSubtract ? '#dc2626' : '#64748b')};">
                                        ${isAdd ? '+' : ''}${l.changeQty} ${l.unit}
                                    </td>
                                    <td style="padding:10px 12px; font-weight:600; color:#334155;">
                                        ${l.newStock !== null ? l.newStock + ' ' + l.unit : '—'}
                                    </td>
                                    <td style="padding:10px 12px; color:#475569; font-weight:600;">${l.operator || 'System'}</td>
                                    <td style="padding:10px 12px; color:#64748b; max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${l.notes}">
                                        ${l.notes || '—'}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Attach global helper modals & export functions
    window.openLogSpoilageModal = function () {
        let modal = document.getElementById('spoilage-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'spoilage-modal';
            modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.6); backdrop-filter:blur(4px); z-index:9999; display:flex; justify-content:center; align-items:center; padding:16px;';
            document.body.appendChild(modal);
        }
        const rawList = getRawIngredients();
        modal.innerHTML = `
            <div style="background:white; width:100%; max-width:480px; border-radius:16px; padding:24px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); border:1px solid #e2e8f0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid #f1f5f9; padding-bottom:12px;">
                    <h3 style="margin:0; font-family:'Playfair Display',serif; color:#b91c1c; font-size:18px;">Log Kitchen Spoilage / Wastage</h3>
                    <button onclick="document.getElementById('spoilage-modal').style.display='none'" style="background:none; border:none; font-size:20px; cursor:pointer; color:#64748b;">✕</button>
                </div>
                
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <div>
                        <label style="font-size:12px; font-weight:bold; color:#475569; display:block; margin-bottom:4px;">Select Ingredient:</label>
                        <select id="spoilage-ing-id" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; font-size:13px; font-weight:600;">
                            ${rawList.map(i => `<option value="${i.id}">${i.name} (Stock: ${i.stock} ${i.unit})</option>`).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label style="font-size:12px; font-weight:bold; color:#475569; display:block; margin-bottom:4px;">Wasted Quantity:</label>
                        <input type="number" id="spoilage-qty" placeholder="e.g. 500" min="0.01" step="any" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; font-size:13px; box-sizing:border-box;">
                    </div>

                    <div>
                        <label style="font-size:12px; font-weight:bold; color:#475569; display:block; margin-bottom:4px;">Waste / Spoilage Reason:</label>
                        <select id="spoilage-reason" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; font-size:13px;">
                            <option value="Spoilage / Expired">Spoilage / Expired</option>
                            <option value="Kitchen Spill / Damaged">Kitchen Spill / Damaged</option>
                            <option value="Staff Meal / Consumption">Staff Meal / Consumption</option>
                            <option value="Prep Loss / Trim">Prep Loss / Trim</option>
                        </select>
                    </div>

                    <div>
                        <label style="font-size:12px; font-weight:bold; color:#475569; display:block; margin-bottom:4px;">Additional Notes / Remarks:</label>
                        <textarea id="spoilage-notes" placeholder="Optional details (e.g., dropped during prep)" rows="2" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; font-size:13px; box-sizing:border-box;"></textarea>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
                        <button onclick="document.getElementById('spoilage-modal').style.display='none'" style="padding:10px 16px; border-radius:8px; border:1px solid #cbd5e1; background:white; cursor:pointer; font-weight:bold; font-size:12px;">Cancel</button>
                        <button onclick="submitSpoilageLogModal()" style="padding:10px 20px; border-radius:8px; border:none; background:#ef4444; color:white; cursor:pointer; font-weight:bold; font-size:12px; box-shadow:0 4px 10px rgba(239,68,68,0.3);">Submit Spoilage Record</button>
                    </div>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    };

    window.submitSpoilageLogModal = function () {
        const ingId = document.getElementById('spoilage-ing-id')?.value;
        const qty = Number(document.getElementById('spoilage-qty')?.value) || 0;
        const reason = document.getElementById('spoilage-reason')?.value || 'Spoilage';
        const notes = document.getElementById('spoilage-notes')?.value || '';

        if (!ingId || qty <= 0) {
            alert('Please enter a valid wasted quantity.');
            return;
        }

        const entry = logSpoilage(ingId, qty, reason, notes, 'Kitchen Staff');
        if (entry) {
            alert(`Recorded spoilage for ${entry.ingredientName}. Deducted ${entry.qty} ${entry.unit} (Loss: ₱${entry.totalLoss.toFixed(2)}).`);
            const modal = document.getElementById('spoilage-modal');
            if (modal) modal.style.display = 'none';
            if (typeof refreshActiveAdminInvTab === 'function') refreshActiveAdminInvTab();
            if (typeof refreshActiveSuperAdminInvTab === 'function') refreshActiveSuperAdminInvTab();
        }
    };

    window.exportAuditLogsCsv = function () {
        const logs = getAuditLogs();
        if (!logs || logs.length === 0) {
            alert('No audit logs recorded yet to export.');
            return;
        }

        let csv = 'Log ID,Timestamp,Action,Ingredient ID,Ingredient Name,Change Qty,New Stock,Unit,Operator,Notes,Financial Value (PHP)\n';
        logs.forEach(l => {
            const row = [
                `"${l.id}"`,
                `"${l.timestamp}"`,
                `"${l.action}"`,
                `"${l.ingredientId}"`,
                `"${(l.ingredientName || '').replace(/"/g, '""')}"`,
                l.changeQty,
                l.newStock !== null ? l.newStock : '',
                `"${l.unit}"`,
                `"${l.operator}"`,
                `"${(l.notes || '').replace(/"/g, '""')}"`,
                l.financialValue ? l.financialValue.toFixed(2) : '0.00'
            ];
            csv += row.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Inventory_Audit_Log_${new Date().toISOString().substring(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ── AUTOMATIC TABLE RESET & PAST RESERVATION CLEANUP ──
    function parseReservationDateTime(dateStr, timeStr) {
        if (!dateStr) return null;
        try {
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                const [y, m, d] = dateStr.split('-').map(Number);
                const dateObj = new Date(y, m - 1, d);
                if (timeStr && typeof timeStr === 'string' && timeStr.includes(':')) {
                    const [h, min] = timeStr.split(':').map(Number);
                    if (!isNaN(h)) dateObj.setHours(h, min || 0, 0, 0);
                } else {
                    dateObj.setHours(23, 59, 59, 999);
                }
                return dateObj;
            }
            if (/^\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{4}$/.test(dateStr)) {
                const parts = dateStr.split(/[\/\.-]/).map(Number);
                let d = parts[0], m = parts[1], y = parts[2];
                if (m > 12 && d <= 12) {
                    const temp = d; d = m; m = temp;
                }
                const dateObj = new Date(y, m - 1, d);
                if (timeStr && typeof timeStr === 'string' && timeStr.includes(':')) {
                    const [h, min] = timeStr.split(':').map(Number);
                    if (!isNaN(h)) dateObj.setHours(h, min || 0, 0, 0);
                } else {
                    dateObj.setHours(23, 59, 59, 999);
                }
                return dateObj;
            }
            const parsed = new Date(dateStr + (timeStr ? ' ' + timeStr : ''));
            return isNaN(parsed.getTime()) ? null : parsed;
        } catch (e) {
            return null;
        }
    }

    function autoResetPastTablesAndReservations() {
        try {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            let overrides = JSON.parse(localStorage.getItem('tableOverrides') || '{}');
            let history = JSON.parse(localStorage.getItem('reservationHistory') || '[]');
            let mutatedOverrides = false;
            let mutatedHistory = false;

            // 1. Auto-complete ONLY genuine past reservations (arrival date before today)
            history.forEach(r => {
                const resDate = parseReservationDateTime(r.arrivalDate, r.arrivalTime);
                if (resDate) {
                    if (r.autoExpired && resDate >= todayStart) {
                        // Restore future reservation that was falsely auto-expired by raw string comparison
                        delete r.completedAt;
                        delete r.autoExpired;
                        if (r.approvalStatus === 'completed') r.approvalStatus = 'approved';
                        mutatedHistory = true;
                    } else if (!r.completedAt && resDate < todayStart) {
                        // Genuine past reservation (yesterday or older)
                        r.completedAt = new Date().toISOString();
                        r.autoExpired = true;
                        mutatedHistory = true;
                    }
                }
            });

            // 2. Clear table overrides for tables with past reservations or stale overrides
            const activeTableBookings = new Set(
                history.filter(r => {
                    if (r.completedAt) return false;
                    const d = parseReservationDateTime(r.arrivalDate, r.arrivalTime);
                    return d && d >= todayStart && r.bookedTable;
                }).map(r => r.bookedTable)
            );

            for (const [tId, status] of Object.entries(overrides)) {
                const hasPastBooking = history.some(r => {
                    const d = parseReservationDateTime(r.arrivalDate, r.arrivalTime);
                    return d && d < todayStart && r.bookedTable === tId;
                });
                if (hasPastBooking && !activeTableBookings.has(tId)) {
                    delete overrides[tId];
                    mutatedOverrides = true;
                }
            }

            if (mutatedHistory) {
                localStorage.setItem('reservationHistory', JSON.stringify(history));
                try { window.dispatchEvent(new CustomEvent('reservationHistoryUpdated', { detail: history })); } catch (e) {}
            }

            if (mutatedOverrides) {
                localStorage.setItem('tableOverrides', JSON.stringify(overrides));
                try { window.dispatchEvent(new CustomEvent('tableOverridesUpdated', { detail: overrides })); } catch (e) {}
            }
        } catch (e) {
            console.warn('Auto table reset failed:', e);
        }
    }

    function markTableAvailableAndDone(tId) {
        if (!tId) return;
        try {
            let overrides = JSON.parse(localStorage.getItem('tableOverrides') || '{}');
            let history = JSON.parse(localStorage.getItem('reservationHistory') || '[]');

            overrides[tId] = 'available';

            history.forEach(r => {
                if (r.bookedTable === tId && !r.completedAt) {
                    r.completedAt = new Date().toISOString();
                }
            });

            localStorage.setItem('tableOverrides', JSON.stringify(overrides));
            localStorage.setItem('reservationHistory', JSON.stringify(history));

            try {
                window.dispatchEvent(new CustomEvent('tableOverridesUpdated', { detail: overrides }));
                window.dispatchEvent(new CustomEvent('reservationHistoryUpdated', { detail: history }));
                if (typeof BroadcastChannel !== 'undefined') {
                    const bc = new BroadcastChannel('inventory_sync_channel');
                    bc.postMessage({ action: 'tableOverridesUpdated', payload: overrides });
                    bc.postMessage({ action: 'reservationHistoryUpdated', payload: history });
                }
            } catch (e) {}

            if (typeof window.renderFloorPlan === 'function') window.renderFloorPlan();
            if (typeof window.loadFloorPlan === 'function') window.loadFloorPlan();
            if (typeof window.renderPosTableSelect === 'function') window.renderPosTableSelect();

            const toast = document.getElementById('floor-toast');
            if (toast) toast.style.display = 'none';
        } catch (e) {
            console.error('Error marking table available:', e);
        }
    }

    function resetToDefaultTestInventory() {
        try {
            saveRawIngredients(DEFAULT_RAW_INGREDIENTS);
            _cachedRawIngredients = null;
            syncFoodMenuStockFromIngredients();
            logStockMovement('SYS-RESET', 'SYSTEM', 'Re-seeded inventory raw materials to canonical test baseline', 0, 'Reset');
            if (typeof window.renderRawIngredientsContainer === 'function') window.renderRawIngredientsContainer();
            if (typeof window.renderMenuManagement === 'function') window.renderMenuManagement();
            if (typeof window.refreshActiveSuperAdminInvTab === 'function') window.refreshActiveSuperAdminInvTab();
        } catch (e) {
            console.error('Error resetting test inventory:', e);
        }
    }

    window.autoResetPastTablesAndReservations = autoResetPastTablesAndReservations;
    window.markTableAvailableAndDone = markTableAvailableAndDone;
    window.resetToDefaultTestInventory = resetToDefaultTestInventory;

    // Export module to global scope
    window.InventorySystem = {
        DEFAULT_RAW_INGREDIENTS: DEFAULT_RAW_INGREDIENTS,
        DEFAULT_FOOD_RECIPES: DEFAULT_FOOD_RECIPES,
        getRawIngredients: getRawIngredients,
        saveRawIngredients: saveRawIngredients,
        restockRawIngredient: restockRawIngredient,
        setRawIngredientStock: setRawIngredientStock,
        addRawIngredient: addRawIngredient,
        updateRawIngredient: updateRawIngredient,
        deleteRawIngredient: deleteRawIngredient,
        getItemRecipe: getItemRecipe,
        saveItemRecipe: saveItemRecipe,
        calculateFoodAvailability: calculateFoodAvailability,
        syncFoodMenuStockFromIngredients: syncFoodMenuStockFromIngredients,
        validateOrderIngredients: validateOrderIngredients,
        normalizeCartItemsInput: normalizeCartItemsInput,
        deductIngredientsForOrder: deductIngredientsForOrder,
        restoreIngredientsForOrder: restoreIngredientsForOrder,
        autoRestockAllLowStock: autoRestockAllLowStock,
        getInventoryHealthSummary: getInventoryHealthSummary,
        getInventoryValuation: getInventoryValuation,
        calculateDishRecipeCost: calculateDishRecipeCost,
        logStockMovement: logStockMovement,
        getAuditLogs: getAuditLogs,
        clearAuditLogs: clearAuditLogs,
        logSpoilage: logSpoilage,
        getSpoilageLogs: getSpoilageLogs,
        renderValuationUI: renderValuationUI,
        renderWastageLogUI: renderWastageLogUI,
        renderAuditLogUI: renderAuditLogUI,
        invalidateInventoryCache: invalidateInventoryCache,
        getStoreStatus: getStoreStatus,
        setStoreStatus: setStoreStatus,
        toggleStoreStatus: toggleStoreStatus,
        autoResetPastTablesAndReservations: autoResetPastTablesAndReservations,
        markTableAvailableAndDone: markTableAvailableAndDone,
        syncMasterRecipes: syncMasterRecipes,
        cancelReservationWithFood: cancelReservationWithFood,
        processReservationRefund: processReservationRefund,
        resetToDefaultTestInventory: resetToDefaultTestInventory
    };

    // Auto-sync initial stock and reset past tables on script load
    try {
        setTimeout(function () {
            syncFoodMenuStockFromIngredients();
            autoResetPastTablesAndReservations();
        }, 100);
    } catch (e) {}

})(window);
