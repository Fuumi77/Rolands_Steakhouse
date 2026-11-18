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

    window.__DEFAULT_RAW_INGREDIENTS_TEMPLATE = DEFAULT_RAW_INGREDIENTS;

    function getFreshDefaultRawIngredients() {
        const nowIso = new Date().toISOString();
        return DEFAULT_RAW_INGREDIENTS.map(i => ({ ...i, lastRestocked: nowIso }));
    }

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
            } catch (e) { }
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

    let _pendingSyncMovements = [];
    let _syncMovementTimer = null;
    window.__lastLocalInventoryWrite = 0;

    function flushPendingSyncMovements() {
        if (_pendingSyncMovements.length === 0) return;
        const batch = _pendingSyncMovements.slice();
        _pendingSyncMovements = [];
        window.__lastLocalInventoryWrite = Date.now();

        fetch('https://rolands-steakhouse-vqtr.vercel.app/api/inventory/sync-movement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movements: batch })
        }).catch(e => console.error("MySQL Sync Error:", e));
    }

    function normalizeOperatorName(op) {
        const s = String(op || 'System').trim();
        if (/^(admin staff|admin|staff|kitchen staff|staff\/manager|admin walk-in)$/i.test(s)) {
            return 'Staff';
        }
        if (/^(super admin|manager)$/i.test(s)) {
            return 'Manager';
        }
        return s;
    }

    function logStockMovement(entry) {
        try {
            if (!entry || typeof entry !== 'object') return null;
            const logs = getAuditLogs();
            let finalNewStock = entry.newStock !== undefined ? Number(entry.newStock) : null;
            const rawList = getRawIngredients();
            const matchedIng = (entry.ingredientId && entry.ingredientId !== 'FINANCIAL')
                ? rawList.find(i => i.id === entry.ingredientId)
                : null;

            if (finalNewStock === null && matchedIng) {
                finalNewStock = Number(matchedIng.stock);
            }

            const newEntry = {
                id: 'LOG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
                timestamp: new Date().toISOString(),
                action: entry.action || 'ADJUSTMENT',
                ingredientId: entry.ingredientId || 'N/A',
                ingredientName: entry.ingredientName || (matchedIng ? matchedIng.name : 'General'),
                changeQty: Number(entry.changeQty) || 0,
                newStock: finalNewStock,
                unit: entry.unit || (matchedIng ? matchedIng.unit : ''),
                operator: normalizeOperatorName(entry.operator),
                notes: entry.notes || '',
                financialValue: Number(entry.financialValue) || 0
            };

            logs.unshift(newEntry);
            if (logs.length > 500) logs.pop();
            localStorage.setItem('inventory_audit_logs', JSON.stringify(logs));
            broadcastSync('auditLogAdded', newEntry);

            // Queue movement so 8 deductions in 1ms send in ONE single MySQL connection!
            if (entry.ingredientId && entry.action !== 'SYS-RESET' && entry.ingredientId !== 'FINANCIAL') {
                window.__lastLocalInventoryWrite = Date.now();
                _pendingSyncMovements.push({
                    action: entry.action,
                    ingredientId: entry.ingredientId,
                    ingredientName: entry.ingredientName || (matchedIng ? matchedIng.name : ''),
                    category: matchedIng ? matchedIng.category : 'General',
                    minThreshold: matchedIng ? matchedIng.minThreshold : 100,
                    changeQty: Number(entry.changeQty) || 0,
                    newStock: finalNewStock,
                    unit: entry.unit || (matchedIng ? matchedIng.unit : 'g'),
                    operator: 1,
                    timestamp: newEntry.timestamp
                });
                if (_syncMovementTimer) clearTimeout(_syncMovementTimer);
                _syncMovementTimer = setTimeout(flushPendingSyncMovements, 250);
            }

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

    function roundStockQty(val) {
        const n = Number(val) || 0;
        return Math.max(0, Math.round(n * 1000) / 1000);
    }

    function normalizeUnit(unit) {
        const raw = String(unit || '').trim();
        const low = raw.toLowerCase();
        if (low === 'l' || low === 'liter' || low === 'liters') return 'L';
        if (low === 'ml' || low === 'milliliter' || low === 'milliliters') return 'ml';
        if (low === 'kg' || low === 'kilogram' || low === 'kilograms') return 'kg';
        if (low === 'g' || low === 'gram' || low === 'grams') return 'g';
        if (low === 'pcs' || low === 'pc' || low === 'piece' || low === 'pieces') return 'pcs';
        if (low === 'slice' || low === 'slices') return 'slices';
        return raw || 'pcs';
    }

    function getQuickRestockOptions(unit) {
        const u = normalizeUnit(unit);
        if (u === 'kg') return [{ amount: 1, label: '+1 kg' }, { amount: 5, label: '+5 kg' }];
        if (u === 'g') return [{ amount: 1000, label: '+1 kg' }, { amount: 5000, label: '+5 kg' }];
        if (u === 'L') return [{ amount: 1, label: '+1 L' }, { amount: 5, label: '+5 L' }];
        if (u === 'ml') return [{ amount: 1000, label: '+1 L' }, { amount: 5000, label: '+5 L' }];
        if (u === 'slices') return [{ amount: 10, label: '+10 slices' }, { amount: 50, label: '+50 slices' }];
        if (u === 'pcs') return [{ amount: 10, label: '+10 pcs' }, { amount: 50, label: '+50 pcs' }];
        return [{ amount: 10, label: `+10 ${u}` }, { amount: 50, label: `+50 ${u}` }];
    }

    function getSuggestedInputQty(unit, mode = 'add') {
        const u = normalizeUnit(unit);
        if (u === 'g' || u === 'ml') return mode === 'remove' ? 500 : 1000;
        if (u === 'kg' || u === 'L') return mode === 'remove' ? 1 : 5;
        return mode === 'remove' ? 5 : 10;
    }

    function convertQtyToIngredientUnit(qty, fromUnit, toUnit) {
        const val = Number(qty) || 0;
        const from = normalizeUnit(fromUnit);
        const to = normalizeUnit(toUnit);
        if (!from || !to || from === to) return val;
        if (from === 'kg' && to === 'g') return val * 1000;
        if (from === 'g' && to === 'kg') return val / 1000;
        if (from === 'L' && to === 'ml') return val * 1000;
        if (from === 'ml' && to === 'L') return val / 1000;
        return val;
    }

    function refreshVisibleInventoryPanels() {
        try {
            if (typeof window.refreshActiveAdminInvTab === 'function') window.refreshActiveAdminInvTab(true);
            else {
                if (window.activeAdminInvSubTab === 'raw' && typeof window.renderRawIngredientsContainer === 'function') window.renderRawIngredientsContainer();
                else if (typeof window.renderMenuManagement === 'function') window.renderMenuManagement();
            }
            if (typeof window.refreshActiveSuperAdminInvTab === 'function') window.refreshActiveSuperAdminInvTab(true);
            else {
                if (window.activeSuperAdminInvSubTab === 'raw' && typeof window.renderSuperAdminRawIngredients === 'function') window.renderSuperAdminRawIngredients();
                else if (typeof window.renderInventory === 'function') window.renderInventory();
            }
            if (typeof window.renderProducts === 'function') window.renderProducts();
            if (typeof window.renderMenu === 'function') window.renderMenu();
        } catch (e) { }
    }

    function snapshotRawPortionsOnItems(rawListSnapshot) {
        try {
            const rawList = rawListSnapshot || getRawIngredients();
            const rawMap = {};
            rawList.forEach(ing => { if (ing && ing.id) rawMap[ing.id] = Number(ing.stock) || 0; });
            const items = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
            if (!Array.isArray(items) || items.length === 0) return;
            let changed = false;
            items.forEach(item => {
                if (!item || typeof item._lastRawPortions === 'number') return;
                const recipe = getItemRecipe(item.id, item);
                if (recipe && recipe.length > 0) {
                    let minP = Infinity;
                    recipe.forEach(r => {
                        const avail = rawMap[r.ingredientId] !== undefined ? rawMap[r.ingredientId] : 0;
                        const req = Number(r.qty) || 1;
                        const p = Math.floor(avail / req);
                        if (p < minP) minP = p;
                    });
                    item._lastRawPortions = (minP === Infinity) ? 0 : Math.max(0, minP);
                } else {
                    item._lastRawPortions = item.total_stock !== undefined ? Number(item.total_stock) || 0 : (Number(item.stock) || 0);
                }
                changed = true;
            });
            if (changed) localStorage.setItem('inventoryItems', JSON.stringify(items));
        } catch (e) { }
    }

    function logSpoilage(ingredientId, qty, reason, notes, operator) {
        const rawList = getRawIngredients();
        const ing = rawList.find(i => i.id === ingredientId);
        if (!ing) return null;

        const deductQty = Math.abs(Number(qty)) || 0;
        if (deductQty <= 0) return null;

        snapshotRawPortionsOnItems(rawList);
        ing.stock = roundStockQty(Math.max(0, (Number(ing.stock) || 0) - deductQty));
        saveRawIngredients(rawList);
        syncFoodMenuStockFromIngredients({ applyRawDelta: true });
        refreshVisibleInventoryPanels();

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
        } catch (e) { }

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
            const deletedIds = JSON.parse(localStorage.getItem('deletedRawIngredientIds') || '[]');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    let updated = false;
                    DEFAULT_RAW_INGREDIENTS.forEach(def => {
                        if (!deletedIds.includes(def.id) && !parsed.find(p => p.id === def.id)) {
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
        const freshDefaults = getFreshDefaultRawIngredients();
        saveRawIngredients(freshDefaults, { skipCloud: true });
        _cachedRawIngredients = freshDefaults;
        return _cachedRawIngredients;
    }

    function saveRawIngredients(list, options) {
        try {
            _cachedRawIngredients = list;
            localStorage.setItem('rawIngredients', JSON.stringify(list));
            window.dispatchEvent(new CustomEvent('rawIngredientsUpdated', { detail: list }));
            broadcastSync('rawIngredientsUpdated', list);

            if (!options || !options.skipCloud) {
                const invBranch = window.getInventoryBranch ? window.getInventoryBranch() : (window.getEffectiveBranch ? window.getEffectiveBranch() : 'General Santos City');
                window.__inventoryHoldUntil = Date.now() + 8000;
                fetch(`https://rolands-steakhouse-jsoo.onrender.com/api/memory/raw-ingredients?branch=${encodeURIComponent(invBranch)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(list)
                }).catch(() => { });
            }
        } catch (e) {
            console.error('Error saving raw ingredients:', e);
        }
    }

    function restockRawIngredient(id, addedAmount, operator = 'Staff', notes = '') {
        const list = getRawIngredients();
        const item = list.find(i => i.id === id);
        if (item) {
            snapshotRawPortionsOnItems(list);
            const addAmt = Number(addedAmount) || 0;
            item.stock = roundStockQty((Number(item.stock) || 0) + addAmt);
            item.lastRestocked = new Date().toISOString();
            saveRawIngredients(list);
            syncFoodMenuStockFromIngredients({ applyRawDelta: true });
            refreshVisibleInventoryPanels();

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
            snapshotRawPortionsOnItems(list);
            const oldStock = Number(item.stock) || 0;
            const target = roundStockQty(Math.max(0, Number(newStock)));
            const diff = roundStockQty(target - oldStock) * ((target - oldStock) < 0 ? -1 : 1);
            const signedDiff = Math.round((target - oldStock) * 1000) / 1000;
            item.stock = target;
            saveRawIngredients(list);
            syncFoodMenuStockFromIngredients({ applyRawDelta: true });
            refreshVisibleInventoryPanels();

            logStockMovement({
                action: 'ADJUSTMENT',
                ingredientId: item.id,
                ingredientName: item.name,
                changeQty: signedDiff,
                newStock: target,
                unit: item.unit,
                operator: operator,
                notes: notes || 'Manual stock adjustment',
                financialValue: Math.abs(signedDiff) * (Number(item.unitCost) || 0)
            });

            return item;
        }
        return null;
    }

    function addRawIngredient(newItem, operator = 'Super Admin') {
        const list = getRawIngredients();
        if (!newItem.id) newItem.id = 'ING-CUSTOM-' + Date.now();
        newItem.unit = normalizeUnit(newItem.unit);
        newItem.stock = roundStockQty(newItem.stock);
        if (!newItem.unitCost) newItem.unitCost = 10.00;
        if (!newItem.supplier) newItem.supplier = 'Local Wholesale';
        newItem.lastRestocked = new Date().toISOString();
        list.push(newItem);
        saveRawIngredients(list);
        syncFoodMenuStockFromIngredients();
        refreshVisibleInventoryPanels();

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
            snapshotRawPortionsOnItems(list);
            const cleanData = { ...data };
            if (cleanData.unit !== undefined) cleanData.unit = normalizeUnit(cleanData.unit);
            if (cleanData.stock !== undefined) cleanData.stock = roundStockQty(cleanData.stock);
            list[idx] = { ...list[idx], ...cleanData };
            saveRawIngredients(list);
            syncFoodMenuStockFromIngredients({ applyRawDelta: true });
            refreshVisibleInventoryPanels();

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
            snapshotRawPortionsOnItems(list);
            const removed = list.splice(idx, 1)[0];
            try {
                const delIds = JSON.parse(localStorage.getItem('deletedRawIngredientIds') || '[]');
                if (!delIds.includes(id)) {
                    delIds.push(id);
                    localStorage.setItem('deletedRawIngredientIds', JSON.stringify(delIds));
                }
            } catch (e) { }
            saveRawIngredients(list);
            syncFoodMenuStockFromIngredients({ applyRawDelta: true });
            refreshVisibleInventoryPanels();

            fetch(`https://rolands-steakhouse.onrender.com/api/inventory/raw/${encodeURIComponent(id)}`, {
                method: 'DELETE'
            }).catch(() => { });

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
        } catch (e) { }

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

            // 👉 FIX: PUSH RECIPE UPDATES TO CLOUD SO OTHER DEVICES SEE IT
            const invBranch = window.getInventoryBranch ? window.getInventoryBranch() : (window.getEffectiveBranch ? window.getEffectiveBranch() : 'General Santos City');
            window.__inventoryHoldUntil = Date.now() + 8000;
            window.__lastMenuPush = Date.now();
            fetch(`https://rolands-steakhouse-jsoo.onrender.com/api/memory/inventory-items?branch=${encodeURIComponent(invBranch)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(items)
            }).catch(() => { });

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

    // Helper: computes raw recipe capacity for a single menu item from a raw ingredient map
    function computeRawCapacityPortions(menuItem, rawMap) {
        const recipe = menuItem ? getItemRecipe(menuItem.id, menuItem) : [];
        if (!recipe || recipe.length === 0) return null;
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
            const requiredQtyInIngUnit = convertQtyToIngredientUnit(Number(r.qty) || 0, r.unit || rawIng.unit, rawIng.unit);
            const possiblePortions = requiredQtyInIngUnit > 0 ? Math.floor(currentStock / requiredQtyInIngUnit) : Infinity;

            recipeDetails.push({
                id: rawIng.id,
                name: rawIng.name,
                needed: Number(r.qty) || 0,
                unit: r.unit || rawIng.unit,
                availableStock: currentStock,
                possiblePortions: possiblePortions === Infinity ? 0 : possiblePortions
            });

            if (possiblePortions < minPossiblePortions) minPossiblePortions = possiblePortions;
            if (possiblePortions <= 0) missingIngredients.push(rawIng.name + ' (0 ' + (r.unit || rawIng.unit) + ' left)');
        });

        if (minPossiblePortions === Infinity) minPossiblePortions = 0;
        return { minPossiblePortions, missingIngredients, recipeDetails, recipe };
    }

    // ── DYNAMIC FOOD AVAILABILITY CALCULATION (SYNCED WITH END OF DAY STOCK / PORTIONS) ──
    function calculateFoodAvailability(menuItem, ingredientsCatalog) {
        const catalog = ingredientsCatalog || getRawIngredients();
        const rawMap = {};
        catalog.forEach(ing => { rawMap[ing.id] = ing; });

        // Look up stored item in inventoryItems to get latest total_stock, manualUnavailable, added_stock, sold_stock, and threshold
        let storedItem = null;
        try {
            if (menuItem) {
                const storedInv = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
                const normTitle = String(menuItem.title || menuItem.name || '').trim().toLowerCase();
                storedItem = storedInv.find(i => i && (
                    (menuItem.id && i.id === menuItem.id) ||
                    (normTitle && String(i.title || i.name || '').trim().toLowerCase() === normTitle)
                )) || null;
            }
        } catch (e) { }

        const isManualUnavailable = Boolean((menuItem && menuItem.manualUnavailable) || (storedItem && storedItem.manualUnavailable));
        const addedStock = parseInt(menuItem?.added_stock !== undefined ? menuItem.added_stock : (storedItem?.added_stock || 0), 10) || 0;
        const soldStock = parseInt(menuItem?.sold_stock !== undefined ? menuItem.sold_stock : (storedItem?.sold_stock || 0), 10) || 0;
        const threshold = Number(menuItem?.threshold !== undefined ? menuItem.threshold : (storedItem?.threshold ?? 5));

        const rawTotalCandidate = (menuItem && menuItem.total_stock !== undefined && menuItem.total_stock !== null && !isNaN(Number(menuItem.total_stock)))
            ? Math.max(0, Number(menuItem.total_stock))
            : (storedItem && storedItem.total_stock !== undefined && storedItem.total_stock !== null && !isNaN(Number(storedItem.total_stock)))
                ? Math.max(0, Number(storedItem.total_stock))
                : null;

        const cap = computeRawCapacityPortions(menuItem, rawMap);

        if (!cap) {
            const baseTotal = rawTotalCandidate !== null ? rawTotalCandidate : Math.max(0, Number(menuItem?.stock ?? storedItem?.stock ?? 0) || 0);
            const eodLegacy = isManualUnavailable ? 0 : Math.max(0, baseTotal + addedStock - soldStock);
            return {
                availablePortions: eodLegacy,
                rawPortions: baseTotal,
                possibleFromRaw: baseTotal,
                addedStock: addedStock,
                soldStock: soldStock,
                eodPortions: eodLegacy,
                isAvailable: !isManualUnavailable && eodLegacy > 0,
                isManualUnavailable: isManualUnavailable,
                status: isManualUnavailable ? 'Unavailable (Manual)' : (eodLegacy <= 0 ? 'Out of Stock' : (eodLegacy <= threshold ? 'Low Stock' : 'Available')),
                recipe: [],
                missingIngredients: isManualUnavailable ? ['Manually marked Unavailable'] : (eodLegacy <= 0 ? ['End of Day Stock depleted'] : [])
            };
        }

        const possibleFromRaw = cap.minPossiblePortions;
        const baseTotal = rawTotalCandidate !== null ? rawTotalCandidate : possibleFromRaw;
        // Sync available portions with End of Day (EOD) stock: Total Stock + Added - Sold
        const eodPortions = isManualUnavailable ? 0 : Math.max(0, baseTotal + addedStock - soldStock);

        if (isManualUnavailable) {
            return {
                availablePortions: 0,
                rawPortions: baseTotal,
                possibleFromRaw: possibleFromRaw,
                addedStock: addedStock,
                soldStock: soldStock,
                eodPortions: 0,
                isAvailable: false,
                isManualUnavailable: true,
                status: 'Unavailable (Manual)',
                recipe: cap.recipeDetails,
                missingIngredients: ['Manually marked Unavailable by Staff/Manager']
            };
        }

        const isAvailable = eodPortions > 0;
        let status = 'Available';
        if (eodPortions <= 0) {
            status = 'Out of Stock';
        } else if (eodPortions <= threshold) {
            status = 'Low Stock';
        }

        const missingList = eodPortions <= 0
            ? (cap.missingIngredients.length > 0 ? cap.missingIngredients : ['End of Day Stock depleted'])
            : cap.missingIngredients;

        return {
            availablePortions: eodPortions,
            rawPortions: baseTotal,
            possibleFromRaw: possibleFromRaw,
            addedStock: addedStock,
            soldStock: soldStock,
            eodPortions: eodPortions,
            isAvailable: isAvailable,
            isManualUnavailable: false,
            status: status,
            recipe: cap.recipeDetails,
            missingIngredients: missingList
        };
    }

    function getActiveInvBranchSafe() {
        return window.getInventoryBranch ? window.getInventoryBranch() : (window.getEffectiveBranch ? window.getEffectiveBranch() : 'General Santos City');
    }

    function pushInventoryItemsCloudAndNotify(items, options = {}) {
        const serialized = JSON.stringify(items || []);
        localStorage.setItem('inventoryItems', serialized);
        window.dispatchEvent(new CustomEvent('inventoryUpdated', { detail: items }));
        broadcastSync('inventoryUpdated', items);

        if (!options.skipCloud) {
            const invBranch = getActiveInvBranchSafe();
            window.__inventoryHoldUntil = Date.now() + 8000;
            window.__lastMenuPush = Date.now();
            fetch(`https://rolands-steakhouse-jsoo.onrender.com/api/memory/inventory-items?branch=${encodeURIComponent(invBranch)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: serialized
            }).catch(() => { });
        }

        if (!options.skipRender) {
            if (typeof window.renderInventory === 'function') window.renderInventory();
            if (typeof window.renderMenuManagement === 'function') window.renderMenuManagement();
            if (typeof window.renderRecipeBuilderContainer === 'function') window.renderRecipeBuilderContainer();
            if (typeof window.refreshActiveAdminInvTab === 'function') window.refreshActiveAdminInvTab(true);
            if (typeof window.refreshActiveSuperAdminInvTab === 'function') window.refreshActiveSuperAdminInvTab(true);
            if (typeof window.renderProducts === 'function') window.renderProducts();
            if (typeof window.renderMenu === 'function') window.renderMenu();
        }
    }

    function buildCleanBranchMenuItems(templateItems, rawIngredientsList) {
        const rawList = (Array.isArray(rawIngredientsList) && rawIngredientsList.length > 0)
            ? rawIngredientsList
            : getFreshDefaultRawIngredients();
        const rawMap = {};
        rawList.forEach(ing => { if (ing && ing.id) rawMap[ing.id] = ing; });

        const src = Array.isArray(templateItems) ? templateItems : [];
        const seenIds = new Set();
        const cleaned = [];
        src.forEach(srcItem => {
            if (!srcItem || !srcItem.id || seenIds.has(srcItem.id)) return;
            seenIds.add(srcItem.id);
            const cap = computeRawCapacityPortions(srcItem, rawMap);
            const basePortions = cap ? Math.max(0, cap.minPossiblePortions) : 100;
            cleaned.push({
                id: srcItem.id,
                title: srcItem.title || srcItem.name || srcItem.id,
                name: srcItem.name || srcItem.title || srcItem.id,
                category: srcItem.category || 'Uncategorized',
                price: Number(srcItem.price) || 0,
                threshold: srcItem.threshold !== undefined ? Number(srcItem.threshold) : 5,
                total_stock: basePortions,
                _lastRawPortions: basePortions,
                added_stock: 0,
                sold_stock: 0,
                stock: basePortions,
                manualUnavailable: false,
                stockUpdatedAt: 0,
                image: srcItem.image || '',
                syncPhotoBranches: srcItem.syncPhotoBranches !== false,
                imageUpdatedAt: srcItem.imageUpdatedAt || 0,
                imageRemovedAt: srcItem.imageRemovedAt || 0,
                isCustomRecipe: Boolean(srcItem.isCustomRecipe),
                recipe: Array.isArray(srcItem.recipe) ? JSON.parse(JSON.stringify(srcItem.recipe)) : undefined
            });
        });
        return cleaned;
    }

    // ── GLOBAL HANDLERS FOR ADMIN & SUPERADMIN: TOGGLE AVAILABILITY, ADD/REMOVE PORTIONS, REMOVE/DELETE RAW INGREDIENTS ──
    window.toggleItemManualAvailability = async function (menuId, operator = 'Staff/Manager') {
        try {
            const items = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
            const idx = items.findIndex(i => i && i.id === menuId);
            if (idx === -1) return;

            items[idx].manualUnavailable = !items[idx].manualUnavailable;
            items[idx].stockUpdatedAt = Date.now();
            items[idx].last_updated = new Date().toISOString();
            const isNowOff = items[idx].manualUnavailable;
            const avail = calculateFoodAvailability(items[idx]);
            items[idx].stock = avail.availablePortions;
            items[idx].computedStatus = avail.status;
            items[idx].missingIngredients = avail.missingIngredients;

            pushInventoryItemsCloudAndNotify(items);

            if (window.showToast) {
                window.showToast(
                    `${items[idx].title || menuId} is now ${isNowOff ? '🔴 UNAVAILABLE' : '🟢 AVAILABLE'}`,
                    isNowOff ? 'warning' : 'success',
                    3000
                );
            }
        } catch (e) {
            console.error('Toggle availability error:', e);
        }
    };

    window.adjustMenuAddedStock = function (menuId, delta = 1, operator = 'Staff/Manager') {
        try {
            const items = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
            const item = items.find(i => i && i.id === menuId);
            if (!item) return null;

            const rawList = getRawIngredients();
            const rawMap = {};
            rawList.forEach(ing => { if (ing && ing.id) rawMap[ing.id] = ing; });
            const cap = computeRawCapacityPortions(item, rawMap);
            if (item.total_stock === undefined || item.total_stock === null) {
                item.total_stock = cap ? cap.minPossiblePortions : (Number(item.stock) || 0);
            }
            if (typeof item._lastRawPortions !== 'number') {
                item._lastRawPortions = cap ? cap.minPossiblePortions : Number(item.total_stock) || 0;
            }

            const prevAdded = parseInt(item.added_stock, 10) || 0;
            const d = parseInt(delta, 10) || 0;
            item.added_stock = Math.max(0, prevAdded + d);
            item.stockUpdatedAt = Date.now();
            item.last_updated = new Date().toISOString();

            const avail = calculateFoodAvailability(item, rawList);
            item.stock = avail.availablePortions;
            item.computedStatus = avail.status;
            item.missingIngredients = avail.missingIngredients;

            pushInventoryItemsCloudAndNotify(items);
            logStockMovement({
                action: 'ADJUSTMENT',
                ingredientId: item.id,
                ingredientName: item.title || item.id,
                changeQty: item.added_stock - prevAdded,
                newStock: item.stock,
                unit: 'portions',
                operator: operator,
                notes: `Adjusted Added stock (${d >= 0 ? '+' : ''}${d}) → EOD: ${item.stock}`,
                financialValue: 0
            });
            return item;
        } catch (e) {
            console.error('adjustMenuAddedStock error:', e);
            return null;
        }
    };

    window.adjustMenuTotalStock = function (menuId, delta = -1, operator = 'Staff/Manager') {
        try {
            const items = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
            const item = items.find(i => i && i.id === menuId);
            if (!item) return null;

            const rawList = getRawIngredients();
            const rawMap = {};
            rawList.forEach(ing => { if (ing && ing.id) rawMap[ing.id] = ing; });
            const cap = computeRawCapacityPortions(item, rawMap);
            if (item.total_stock === undefined || item.total_stock === null) {
                item.total_stock = cap ? cap.minPossiblePortions : (Number(item.stock) || 0);
            }
            item._lastRawPortions = cap ? cap.minPossiblePortions : Number(item.total_stock) || 0;

            const prevTotal = Number(item.total_stock) || 0;
            const d = parseInt(delta, 10) || 0;
            item.total_stock = Math.max(0, prevTotal + d);
            item.stockUpdatedAt = Date.now();
            item.last_updated = new Date().toISOString();

            const avail = calculateFoodAvailability(item, rawList);
            item.stock = avail.availablePortions;
            item.computedStatus = avail.status;
            item.missingIngredients = avail.missingIngredients;

            pushInventoryItemsCloudAndNotify(items);
            logStockMovement({
                action: 'ADJUSTMENT',
                ingredientId: item.id,
                ingredientName: item.title || item.id,
                changeQty: item.total_stock - prevTotal,
                newStock: item.stock,
                unit: 'portions',
                operator: operator,
                notes: `Adjusted Total stock (${prevTotal} → ${item.total_stock}) → EOD: ${item.stock}`,
                financialValue: 0
            });
            return item;
        } catch (e) {
            console.error('adjustMenuTotalStock error:', e);
            return null;
        }
    };

    window.promptRemoveMenuPortions = async function (menuId, operator = 'Staff/Manager') {
        try {
            const items = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
            const item = items.find(i => i && i.id === menuId);
            if (!item) return;

            const avail = calculateFoodAvailability(item);
            const currentPortions = avail.availablePortions;

            let amountStr = null;
            if (typeof window.superModal === 'function') {
                amountStr = await window.superModal({
                    title: `➖ Remove Portions — ${item.title}`,
                    message: `Current Available Portions (EOD): <b>${currentPortions}</b> (Total: ${avail.rawPortions} | +${avail.addedStock} | -${avail.soldStock}).<br>Enter how many portions to REMOVE:`,
                    showInput: true,
                    placeholder: 'e.g. 4',
                    inputType: 'number',
                    confirmText: 'Remove Portions',
                    cancelText: 'Cancel'
                });
            } else {
                amountStr = prompt(`Remove portions from ${item.title} (Available: ${currentPortions}):`, '1');
            }

            if (amountStr === null || amountStr === undefined || String(amountStr).trim() === '') return;
            const qty = Math.floor(Number(amountStr));
            if (isNaN(qty) || qty <= 0) {
                if (window.showToast) window.showToast('Please enter a valid positive portion count.', 'warning');
                return;
            }

            const curTotal = (item.total_stock !== undefined && item.total_stock !== null && !isNaN(Number(item.total_stock)))
                ? Math.max(0, Number(item.total_stock))
                : avail.rawPortions;
            const curAdded = parseInt(item.added_stock, 10) || 0;
            if (curTotal >= qty) {
                item.total_stock = curTotal - qty;
            } else {
                const rem = qty - curTotal;
                item.total_stock = 0;
                item.added_stock = Math.max(0, curAdded - rem);
            }

            const recipe = getItemRecipe(item.id, item);
            const rawList = getRawIngredients();
            if (recipe && recipe.length > 0) {
                recipe.forEach(r => {
                    const ing = rawList.find(x => x.id === r.ingredientId);
                    if (ing) {
                        const rawDeductPerServing = convertQtyToIngredientUnit(Number(r.qty) || 0, r.unit || ing.unit, ing.unit);
                        const deductAmt = roundStockQty(rawDeductPerServing * qty);
                        ing.stock = roundStockQty(Math.max(0, (Number(ing.stock) || 0) - deductAmt));
                        logStockMovement({
                            action: 'ADJUSTMENT',
                            ingredientId: ing.id,
                            ingredientName: ing.name,
                            changeQty: -deductAmt,
                            newStock: ing.stock,
                            unit: ing.unit,
                            operator: operator,
                            notes: `Removed ${qty} portion(s) of ${item.title}`,
                            financialValue: deductAmt * (Number(ing.unitCost) || 0)
                        });
                    }
                });
                saveRawIngredients(rawList);
            }

            const rawMap = {};
            rawList.forEach(ing => { if (ing && ing.id) rawMap[ing.id] = ing; });
            // Keep all _lastRawPortions synchronized to the post-removal raw stock so total_stock does not double-drop
            items.forEach(it => {
                if (!it) return;
                const c = computeRawCapacityPortions(it, rawMap);
                if (c) it._lastRawPortions = c.minPossiblePortions;
            });

            const availAfter = calculateFoodAvailability(item, rawList);
            item.stock = availAfter.availablePortions;
            item.computedStatus = availAfter.status;
            item.missingIngredients = availAfter.missingIngredients;
            item.stockUpdatedAt = Date.now();
            item.last_updated = new Date().toISOString();

            pushInventoryItemsCloudAndNotify(items);
            if (window.showToast) window.showToast(`Removed ${qty} portion(s) of ${item.title}. New EOD: ${item.stock}`, 'info');
        } catch (e) {
            console.error('Remove portions error:', e);
        }
    };

    window.promptRemoveRawIngredientStock = async function (ingId, operator = 'Staff/Manager') {
        const rawList = getRawIngredients();
        const ing = rawList.find(i => i.id === ingId);
        if (!ing) return;

        const suggestedRemove = getSuggestedInputQty(ing.unit, 'remove');
        let amountStr = null;
        if (typeof window.superModal === 'function') {
            amountStr = await window.superModal({
                title: `➖ Remove Raw Stock — ${ing.name}`,
                message: `Current Stock: <b>${Number(ing.stock).toLocaleString()} ${ing.unit}</b>.<br>Enter the quantity to REMOVE / DEDUCT (in <b>${ing.unit}</b>):`,
                showInput: true,
                placeholder: `e.g. ${suggestedRemove} (${ing.unit})`,
                inputType: 'number',
                confirmText: 'Remove Stock',
                cancelText: 'Cancel'
            });
        } else {
            amountStr = prompt(`Remove stock from ${ing.name} (Current: ${ing.stock} ${ing.unit}):`, String(suggestedRemove));
        }

        if (amountStr === null || amountStr === undefined || String(amountStr).trim() === '') return;
        const deductAmt = Number(amountStr);
        if (isNaN(deductAmt) || deductAmt <= 0) {
            if (window.showToast) window.showToast('Please enter a valid positive number.', 'warning');
            return;
        }

        const newStock = roundStockQty(Math.max(0, (Number(ing.stock) || 0) - deductAmt));
        setRawIngredientStock(ingId, newStock, operator, `Manual stock removal (-${deductAmt} ${ing.unit})`);

        if (window.showToast) {
            window.showToast(`Removed ${deductAmt} ${ing.unit} from ${ing.name}. New stock: ${newStock} ${ing.unit}`, 'info');
        }
        refreshVisibleInventoryPanels();
    };

    window.confirmDeleteRawIngredient = async function (ingId, operator = 'Staff/Manager') {
        const rawList = getRawIngredients();
        const ing = rawList.find(i => i.id === ingId);
        if (!ing) return;

        let confirmed = false;
        if (typeof window.superModal === 'function') {
            confirmed = await window.superModal({
                title: `🗑️ Delete Raw Ingredient?`,
                message: `Are you sure you want to permanently remove <b>${ing.name}</b> from the Raw Ingredients Catalog?`,
                type: 'confirm',
                confirmText: 'Delete Ingredient',
                cancelText: 'Cancel'
            });
        } else {
            confirmed = confirm(`Delete ${ing.name} from Raw Ingredients?`);
        }

        if (!confirmed) return;
        deleteRawIngredient(ingId, operator);
        if (window.showToast) window.showToast(`Deleted ${ing.name} from Raw Ingredients.`, 'info');
        refreshVisibleInventoryPanels();
    };

    let isSyncingStock = false;
    function syncFoodMenuStockFromIngredients(options = {}) {
        if (isSyncingStock) return;
        isSyncingStock = true;
        try {
            const rawList = getRawIngredients();
            const invStr = localStorage.getItem('inventoryItems');
            let items = invStr ? JSON.parse(invStr) : [];
            if (!Array.isArray(items) || items.length === 0) return;

            let mutated = false;
            let cloudSyncNeeded = Boolean(options.applyRawDelta || options.resetFromRaw || options.pushToCloud);
            const menuStockChanges = [];

            items.forEach(item => {
                if (!item) return;
                const prevStock = item.stock !== undefined ? Number(item.stock) : Number(item.total_stock || 0);
                const availBefore = calculateFoodAvailability(item, rawList);
                const possibleFromRaw = Number(availBefore.possibleFromRaw !== undefined ? availBefore.possibleFromRaw : availBefore.rawPortions);

                if (options.resetFromRaw) {
                    if (item.total_stock !== possibleFromRaw || item._lastRawPortions !== possibleFromRaw || item.added_stock !== 0 || item.sold_stock !== 0 || item.manualUnavailable) {
                        item.total_stock = possibleFromRaw;
                        item._lastRawPortions = possibleFromRaw;
                        item.added_stock = 0;
                        item.sold_stock = 0;
                        item.manualUnavailable = false;
                        mutated = true;
                    }
                } else {
                    if (item.total_stock === undefined || item.total_stock === null || isNaN(Number(item.total_stock))) {
                        item.total_stock = possibleFromRaw;
                        item._lastRawPortions = possibleFromRaw;
                        mutated = true;
                    } else if (options.applyRawDelta && typeof item._lastRawPortions === 'number') {
                        const rawDiff = possibleFromRaw - item._lastRawPortions;
                        if (rawDiff !== 0) {
                            item.total_stock = Math.max(0, Number(item.total_stock) + rawDiff);
                            item._lastRawPortions = possibleFromRaw;
                            item.stockUpdatedAt = Date.now();
                            mutated = true;
                        }
                    } else if (typeof item._lastRawPortions !== 'number') {
                        item._lastRawPortions = possibleFromRaw;
                        mutated = true;
                    }
                }

                const avail = calculateFoodAvailability(item, rawList);
                const newEodPortions = Number(avail.availablePortions);

                if (prevStock !== newEodPortions || item.computedStatus !== avail.status) {
                    if (!isNaN(prevStock) && prevStock !== newEodPortions) {
                        menuStockChanges.push({
                            itemName: item.title || item.name || item.id,
                            previousStock: prevStock,
                            newStock: newEodPortions
                        });
                    }
                    item.stock = newEodPortions;
                    item.computedStatus = avail.status;
                    item.missingIngredients = avail.missingIngredients;
                    mutated = true;
                }
            });

            if (mutated) {
                pushInventoryItemsCloudAndNotify(items, {
                    skipCloud: !cloudSyncNeeded,
                    skipRender: true
                });

                // Push menu portion changes to MySQL menu_stock_change_log!
                if (cloudSyncNeeded && menuStockChanges.length > 0) {
                    const invBranch = getActiveInvBranchSafe();
                    fetch(`https://rolands-steakhouse-jsoo.onrender.com/api/inventory/log-menu-stock?branch=${encodeURIComponent(invBranch)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ changes: menuStockChanges, updatedBy: 1, timestamp: new Date().toISOString() })
                    }).catch(() => { });
                }
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

    // Helper: updates menu sold_stock, _lastRawPortions, and computed EOD stock after order deduction/restoration
    function applyOrderSoldDeltaToMenuItems(normalizedItems, sign, postRawList) {
        try {
            const rawList = postRawList || getRawIngredients();
            const rawMap = {};
            rawList.forEach(ing => { if (ing && ing.id) rawMap[ing.id] = ing; });
            const invItems = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
            if (!Array.isArray(invItems) || invItems.length === 0) return;

            const nowIso = new Date().toISOString();
            const nowMs = Date.now();
            let invMutated = false;

            normalizedItems.forEach(cartItem => {
                const qtyOrdered = Number(cartItem.quantity) || 1;
                if (qtyOrdered <= 0) return;
                const normTitle = String(cartItem.title || cartItem.name || '').trim().toLowerCase();
                const target = invItems.find(i => i && (
                    (cartItem.id && i.id === cartItem.id) ||
                    (normTitle && String(i.title || i.name || '').trim().toLowerCase() === normTitle)
                ));
                if (target) {
                    const prevSold = Number(target.sold_stock) || 0;
                    target.sold_stock = Math.max(0, prevSold + (sign * qtyOrdered));
                    target.stockUpdatedAt = nowMs;
                    target.last_updated = nowIso;
                    invMutated = true;
                }
            });

            invItems.forEach(it => {
                if (!it) return;
                const c = computeRawCapacityPortions(it, rawMap);
                if (c) it._lastRawPortions = c.minPossiblePortions;
                const av = calculateFoodAvailability(it, rawList);
                if (it.stock !== av.availablePortions || it.computedStatus !== av.status) {
                    it.stock = av.availablePortions;
                    it.computedStatus = av.status;
                    it.missingIngredients = av.missingIngredients;
                    invMutated = true;
                }
            });

            if (invMutated) {
                pushInventoryItemsCloudAndNotify(invItems);
            }
        } catch (e) { }
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
        } catch (e) { }

        normalized.forEach(cartItem => {
            const itemId = cartItem.id;
            const qtyOrdered = Number(cartItem.quantity) || 1;
            if (qtyOrdered <= 0) return;

            const normTitle = String(cartItem.title || cartItem.name || '').trim().toLowerCase();
            const invItem = invItems.find(i => i && (
                (itemId && i.id === itemId) ||
                (normTitle && String(i.title || i.name || '').trim().toLowerCase() === normTitle)
            ));

            if (invItem) {
                const availObj = calculateFoodAvailability(invItem, rawList);
                if (availObj.isManualUnavailable || availObj.availablePortions < qtyOrdered) {
                    shortages.push({
                        ingredientId: invItem.id || itemId,
                        ingredientName: invItem.title || invItem.name || itemId,
                        available: availObj.availablePortions,
                        needed: qtyOrdered,
                        unit: 'portion(s)'
                    });
                }
            } else {
                const recipe = getItemRecipe(itemId, cartItem);
                if (recipe && recipe.length > 0) {
                    recipe.forEach(r => {
                        const rawItem = rawList.find(i => i.id === r.ingredientId);
                        const reqQty = rawItem
                            ? convertQtyToIngredientUnit(Number(r.qty) || 0, r.unit || rawItem.unit, rawItem.unit)
                            : (Number(r.qty) || 0);
                        requiredTotals[r.ingredientId] = (requiredTotals[r.ingredientId] || 0) + (reqQty * qtyOrdered);
                    });
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
                        const qtyPerServing = convertQtyToIngredientUnit(Number(r.qty) || 0, r.unit || rawIng.unit, rawIng.unit);
                        const totalDeduct = roundStockQty(qtyPerServing * qtyOrdered);
                        const oldS = Number(rawIng.stock) || 0;
                        rawIng.stock = roundStockQty(Math.max(0, oldS - totalDeduct));
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

        const nextRawList = Object.values(rawMap);
        if (updatedAny) {
            saveRawIngredients(nextRawList);
        }
        applyOrderSoldDeltaToMenuItems(normalized, 1, nextRawList);

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
                        const qtyPerServing = convertQtyToIngredientUnit(Number(r.qty) || 0, r.unit || rawIng.unit, rawIng.unit);
                        const totalAdd = roundStockQty(qtyPerServing * qtyOrdered);
                        rawIng.stock = roundStockQty((Number(rawIng.stock) || 0) + totalAdd);
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

        const nextRawList = Object.values(rawMap);
        if (updatedAny) {
            saveRawIngredients(nextRawList);
        }
        applyOrderSoldDeltaToMenuItems(normalized, -1, nextRawList);

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
                            logSpoilage(
                                r.ingredientId,
                                (Number(r.qty) || 0) * (Number(item.quantity) || 1),
                                `Cancelled during '${currentKds}' prep`,
                                reason,
                                operator
                            );
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
                } catch (e) { }
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
            email = '',
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
        if (email) targetRes.email = email;
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
            fetch('https://rolands-steakhouse-jsoo.onrender.com/api/reservations/refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: reservationNumber,
                    refundAmount: refundAmt,
                    refundMethod: method,
                    refundRef: refNumber,
                    email: email || targetRes.email || '',
                    operator: operator
                })
            }).catch(() => { });
            return { success: true, reservation: targetRes };
        } catch (err) {
            console.error('Error processing refund:', err);
            return { success: false, error: err.message };
        }
    }

    // ── SMART INVENTORY HEALTH & AUTO-RESTOCK ──
    function autoRestockAllLowStock(operator = 'Super Admin') {
        const list = getRawIngredients();
        snapshotRawPortionsOnItems(list);
        let restockedCount = 0;

        list.forEach(ing => {
            const minT = Number(ing.minThreshold) || 10;
            const currentS = Number(ing.stock) || 0;

            if (currentS <= minT) {
                const u = normalizeUnit(ing.unit);
                const addAmt = (u === 'g' || u === 'ml') ? 5000 : ((u === 'kg' || u === 'L') ? 10 : 50);
                const targetStock = roundStockQty(Math.max(minT * 2, currentS + addAmt));
                const actualAdded = roundStockQty(targetStock - currentS);
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
            syncFoodMenuStockFromIngredients({ applyRawDelta: true });
            refreshVisibleInventoryPanels();
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
            const qtyInIngUnit = ing
                ? convertQtyToIngredientUnit(Number(r.qty) || 0, r.unit || ing.unit, ing.unit)
                : (Number(r.qty) || 0);
            const qty = Number(r.qty) || 0;
            const lineCost = qtyInIngUnit * unitCost;
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

            <!-- DISH COGS & MARGIN ANALYSIS TABLE WITH LIVE SEARCH -->
            <div style="background:white; border:1px solid #e2e8f0; border-radius:14px; padding:20px; margin-bottom:24px; box-shadow:0 2px 10px rgba(0,0,0,0.03);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
                    <div>
                        <h3 style="margin:0; font-family:'Playfair Display',serif; color:#1b5e20; font-size:18px;">Dish Recipe COGS & Profit Margin Breakdown</h3>
                        <span style="font-size:12px; color:#64748b;">Calculated production cost based on raw ingredient BOM recipes vs menu prices</span>
                    </div>
                    <div style="position:relative; width:100%; max-width:320px;">
                        <input type="text" id="valuation-dish-search" placeholder="🔍 Search dish or category..." oninput="window.filterValuationTable(this.value)"
                            style="width:100%; padding:9px 14px; border:1.5px solid #cbd5e1; border-radius:8px; font-size:13px; box-sizing:border-box; outline:none; background:#f8fafc;">
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
                        <tbody id="valuation-tbody">
                            ${items.map(item => {
            const cogs = calculateDishRecipeCost(item.id, item);
            const marginPctNum = parseFloat(cogs.marginPct) || 0;
            const badgeBg = marginPctNum >= 60 ? '#f0fdf4' : (marginPctNum >= 40 ? '#fffbeb' : '#fef2f2');
            const badgeColor = marginPctNum >= 60 ? '#15803d' : (marginPctNum >= 40 ? '#b45309' : '#b91c1c');

            return `
                                    <tr class="val-dish-row" data-name="${(item.title || item.name || '').toLowerCase()}" data-cat="${(item.category || '').toLowerCase()}" style="border-bottom:1px solid #f1f5f9;">
                                        <td style="padding:12px; font-weight:bold; color:#0f172a;">${item.title || item.name}</td>
                                        <td style="padding:12px; color:#64748b;">${item.category || 'General'}</td>
                                        <td style="padding:12px; font-weight:bold;">₱${(Number(item.price) || 0).toFixed(2)}</td>
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

        window.filterValuationTable = function (q) {
            const query = (q || '').toLowerCase().trim();
            document.querySelectorAll('#valuation-tbody .val-dish-row').forEach(row => {
                const name = row.getAttribute('data-name') || '';
                const cat = row.getAttribute('data-cat') || '';
                row.style.display = (!query || name.includes(query) || cat.includes(query)) ? '' : 'none';
            });
        };
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
                                    <td style="padding:12px; color:#64748b;">₱${(Number(w.unitCost) || 0).toFixed(2)}</td>
                                    <td style="padding:12px; font-weight:bold; color:#dc2626;">₱${(Number(w.totalLoss) || 0).toFixed(2)}</td>
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

    window.__auditDateFilter = window.__auditDateFilter || 'all';
    window.__auditActionFilter = window.__auditActionFilter || 'ALL';
    window.__auditCustomStart = window.__auditCustomStart || '';
    window.__auditCustomEnd = window.__auditCustomEnd || '';

    window.setAuditLogDateFilter = function (df) {
        window.__auditDateFilter = df;
        window.rerenderAllAuditLogContainers();
    };

    window.applyAuditCustomDate = function (prefix) {
        const sEl = document.getElementById(prefix + '-audit-start');
        const eEl = document.getElementById(prefix + '-audit-end');
        if (!sEl || !eEl || !sEl.value || !eEl.value) {
            alert('Please select both start and end dates.');
            return;
        }
        window.__auditCustomStart = sEl.value;
        window.__auditCustomEnd = eEl.value;
        window.__auditDateFilter = 'custom';
        window.rerenderAllAuditLogContainers();
    };

    window.setAuditLogActionFilter = function (af) {
        window.__auditActionFilter = af;
        window.rerenderAllAuditLogContainers();
    };

    window.rerenderAllAuditLogContainers = function () {
        const saEl = document.getElementById('superadmin-audit-container');
        if (saEl && !saEl.classList.contains('hidden')) renderAuditLogUI(saEl, 'Manager');
        const adEl = document.getElementById('admin-audit-container');
        if (adEl && !adEl.classList.contains('hidden')) renderAuditLogUI(adEl, 'Admin');
    };

    function renderAuditLogUI(containerEl, role = 'Super Admin') {
        if (!containerEl) return;
        const prefix = (role === 'Super Admin' || role === 'Manager') ? 'sa' : 'ad';
        const dateFilter = window.__auditDateFilter || 'all';
        const actionFilter = window.__auditActionFilter || 'ALL';

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);

        const logs = getAuditLogs().filter(l => {
            if (!l) return false;
            if (l.action === 'ORDER_REFUND') {
                const qty = Number(l.changeQty) || 0;
                const unit = String(l.unit || '').toUpperCase();
                if (Math.abs(qty) <= 0 || unit === 'PHP') return false;
            }

            // 1. Action Type Filter
            if (actionFilter !== 'ALL' && l.action !== actionFilter) return false;

            // 2. Date Filter
            if (dateFilter !== 'all') {
                const logDate = new Date(l.timestamp);
                if (isNaN(logDate.getTime())) return false;

                if (dateFilter === 'day') {
                    if (logDate < todayStart) return false;
                } else if (dateFilter === 'week') {
                    if (logDate < weekAgo || logDate > now) return false;
                } else if (dateFilter === 'month') {
                    if (logDate.getFullYear() !== now.getFullYear() || logDate.getMonth() !== now.getMonth()) return false;
                } else if (dateFilter === 'year') {
                    if (logDate.getFullYear() !== now.getFullYear()) return false;
                } else if (dateFilter === 'custom' && window.__auditCustomStart && window.__auditCustomEnd) {
                    const startD = new Date(window.__auditCustomStart + 'T00:00:00');
                    const endD = new Date(window.__auditCustomEnd + 'T23:59:59.999');
                    if (logDate < startD || logDate > endD) return false;
                }
            }
            return true;
        });

        const svgAudit = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:6px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
        const svgDownload = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;

        const dateBtns = [
            { id: 'all', label: 'All Time' },
            { id: 'day', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'year', label: 'This Year' },
            { id: 'custom', label: 'Custom Date' }
        ];

        const actionOptions = [
            { id: 'ALL', label: 'All Action Types' },
            { id: 'RESTOCK', label: '🟢 RESTOCK' },
            { id: 'ORDER_DEDUCTION', label: '🍽️ ORDER_DEDUCTION' },
            { id: 'ADJUSTMENT', label: '⚖️ ADJUSTMENT' },
            { id: 'WASTAGE_SPOILAGE', label: '🗑️ WASTAGE_SPOILAGE' },
            { id: 'ORDER_REFUND', label: '↩️ ORDER_REFUND' },
            { id: 'RECIPE_UPDATE', label: '📋 RECIPE_UPDATE' }
        ];

        containerEl.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:12px;">
                <div>
                    <h3 style="margin:0; font-family:'Playfair Display',serif; color:#1b5e20; font-size:18px; display:flex; align-items:center;">${svgAudit} Stock Movement Audit Trail</h3>
                    <span style="font-size:12px; color:#64748b;">Complete append-only audit trail recording restocks, order deductions, refunds, and adjustments (${logs.length} records shown)</span>
                </div>
                <div style="display:flex; gap:10px;">
                    <button type="button" onclick="exportAuditLogsCsv()" style="background:#16a34a; color:white; border:none; padding:9px 16px; border-radius:8px; font-weight:bold; cursor:pointer; box-shadow:0 4px 10px rgba(22,163,74,0.2); display:inline-flex; align-items:center; gap:6px;">
                        ${svgDownload} Export CSV Report
                    </button>
                    ${(role === 'Super Admin' || role === 'Manager') ? `
                        <button type="button" onclick="if(confirm('Clear all audit logs? This cannot be undone.')) { window.InventorySystem.clearAuditLogs(); window.rerenderAllAuditLogContainers(); }" style="background:#cbd5e1; color:#334155; border:none; padding:9px 14px; border-radius:8px; font-weight:bold; cursor:pointer;">
                            Clear Logs
                        </button>
                    ` : ''}
                </div>
            </div>

            <!-- FILTER TOOLBAR: DATE (TODAY -> YEAR + CUSTOM) & ACTION TYPE -->
            <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:12px 14px; margin-bottom:16px; display:flex; flex-direction:column; gap:10px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                    <!-- Date Filter Pills -->
                    <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                        <span style="font-size:11.5px; font-weight:800; color:#475569; text-transform:uppercase; margin-right:4px;">📅 Date:</span>
                        ${dateBtns.map(b => {
            const active = dateFilter === b.id;
            return `<button type="button" onclick="window.setAuditLogDateFilter('${b.id}')" style="padding:6px 12px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; border:1px solid ${active ? '#1b5e20' : '#cbd5e1'}; background:${active ? '#1b5e20' : '#f8fafc'}; color:${active ? 'white' : '#475569'}; transition:0.15s;">
                                ${b.label}
                            </button>`;
        }).join('')}
                    </div>

                    <!-- Action Type Filter -->
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:11.5px; font-weight:800; color:#475569; text-transform:uppercase;">⚡ Action Type:</span>
                        <select onchange="window.setAuditLogActionFilter(this.value)" style="padding:7px 12px; border-radius:8px; border:1.5px solid #cbd5e1; background:#f8fafc; color:#0f172a; font-size:12.5px; font-weight:700; cursor:pointer; outline:none;">
                            ${actionOptions.map(a => `<option value="${a.id}" ${actionFilter === a.id ? 'selected' : ''}>${a.label}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <!-- Custom Date Range Inputs -->
                <div style="display:${dateFilter === 'custom' ? 'flex' : 'none'}; align-items:center; gap:8px; flex-wrap:wrap; padding-top:8px; border-top:1px dashed #e2e8f0;">
                    <span style="font-size:12px; font-weight:700; color:#475569;">From:</span>
                    <input type="date" id="${prefix}-audit-start" value="${window.__auditCustomStart}" style="padding:6px 10px; border:1px solid #cbd5e1; border-radius:6px; font-size:12px;">
                    <span style="font-size:12px; font-weight:700; color:#475569;">To:</span>
                    <input type="date" id="${prefix}-audit-end" value="${window.__auditCustomEnd}" style="padding:6px 10px; border:1px solid #cbd5e1; border-radius:6px; font-size:12px;">
                    <button type="button" onclick="window.applyAuditCustomDate('${prefix}')" style="background:#16a34a; color:white; border:none; padding:6px 14px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;">Apply Range</button>
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
                                    No stock movement audit records match the selected filters.
                                </td>
                            </tr>
                        ` : logs.map(l => {
            const dt = new Date(l.timestamp).toLocaleString();
            const isAdd = l.changeQty > 0;
            const isSubtract = l.changeQty < 0;
            const actionBg = l.action === 'RESTOCK' ? '#f0fdf4' : (l.action === 'ORDER_REFUND' ? '#eff6ff' : (l.action === 'WASTAGE_SPOILAGE' ? '#fef2f2' : '#f8fafc'));
            const actionColor = l.action === 'RESTOCK' ? '#166534' : (l.action === 'ORDER_REFUND' ? '#1e40af' : (l.action === 'WASTAGE_SPOILAGE' ? '#991b1b' : '#334155'));
            const cleanOperator = normalizeOperatorName(l.operator);

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
                                    <td style="padding:10px 12px; color:#475569; font-weight:700;">${cleanOperator}</td>
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
        const firstUnit = rawList.length > 0 ? normalizeUnit(rawList[0].unit) : 'g';
        const firstSuggested = getSuggestedInputQty(firstUnit, 'remove');
        modal.innerHTML = `
            <div style="background:white; width:100%; max-width:480px; border-radius:16px; padding:24px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); border:1px solid #e2e8f0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid #f1f5f9; padding-bottom:12px;">
                    <h3 style="margin:0; font-family:'Playfair Display',serif; color:#b91c1c; font-size:18px;">Log Kitchen Spoilage / Wastage</h3>
                    <button onclick="document.getElementById('spoilage-modal').style.display='none'" style="background:none; border:none; font-size:20px; cursor:pointer; color:#64748b;">✕</button>
                </div>
                
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <div>
                        <label style="font-size:12px; font-weight:bold; color:#475569; display:block; margin-bottom:4px;">Select Ingredient:</label>
                        <select id="spoilage-ing-id" onchange="window.updateSpoilageUnitHint && window.updateSpoilageUnitHint(this.value)" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; font-size:13px; font-weight:600;">
                            ${rawList.map(i => `<option value="${i.id}">${i.name} (Stock: ${i.stock} ${i.unit})</option>`).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label id="spoilage-qty-label" style="font-size:12px; font-weight:bold; color:#475569; display:block; margin-bottom:4px;">Wasted Quantity (${firstUnit}):</label>
                        <input type="number" id="spoilage-qty" placeholder="e.g. ${firstSuggested} (${firstUnit})" min="0.001" step="any" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; font-size:13px; box-sizing:border-box;">
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
                        <button onclick="document.getElementById('spoilage-modal').style.display='none'" style="padding:10px 16px; border-radius:8px; border:1px solid #cbd5e1; background:white; color:#334155; cursor:pointer; font-weight:bold; font-size:12px;">Cancel</button>
                        <button onclick="submitSpoilageLogModal()" style="padding:10px 20px; border-radius:8px; border:none; background:#ef4444; color:white; cursor:pointer; font-weight:bold; font-size:12px; box-shadow:0 4px 10px rgba(239,68,68,0.3);">Submit Spoilage Record</button>
                    </div>
                </div>
            </div>
        `;
        window.updateSpoilageUnitHint = function (selId) {
            const match = getRawIngredients().find(i => i.id === selId);
            const u = match ? normalizeUnit(match.unit) : 'g';
            const lbl = document.getElementById('spoilage-qty-label');
            const inp = document.getElementById('spoilage-qty');
            if (lbl) lbl.textContent = `Wasted Quantity (${u}):`;
            if (inp) inp.placeholder = `e.g. ${getSuggestedInputQty(u, 'remove')} (${u})`;
        };
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
            refreshVisibleInventoryPanels();
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
            const nowMs = Date.now();
            const THREE_HOURS_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

            let overrides = JSON.parse(localStorage.getItem('tableOverrides') || '{}');
            let history = [];
            try {
                const v = JSON.parse(localStorage.getItem('reservationHistory') || '[]');
                history = Array.isArray(v) ? v : [];
            } catch (e) { history = []; }
            let mutatedOverrides = false;
            let mutatedHistory = false;

            // 1. Auto-complete reservations/POS orders ONLY when 3 full hours have passed since reserved/seated time!
            history.forEach(r => {
                if (!r) return;
                const resDate = parseReservationDateTime(r.arrivalDate, r.arrivalTime || '12:00');
                const seatedMs = r.seatedAt ? new Date(r.seatedAt).getTime() : 0;
                const createdMs = r.createdAt ? new Date(r.createdAt).getTime() : 0;
                const anchorMs = Math.max(resDate ? resDate.getTime() : 0, seatedMs, createdMs);

                if (anchorMs > 0) {
                    const elapsedMs = nowMs - anchorMs;
                    if (r.autoExpired && elapsedMs < THREE_HOURS_MS) {
                        // Restore reservation that was prematurely auto-completed before 3 hours
                        delete r.completedAt;
                        delete r.autoExpired;
                        if (r.approvalStatus === 'completed') r.approvalStatus = 'seated';
                        mutatedHistory = true;
                    } else if (!r.completedAt && r.approvalStatus !== 'rejected' && r.approvalStatus !== 'cancelled' && elapsedMs >= THREE_HOURS_MS) {
                        // 3 hours have passed since reservation/seated time -> Auto-complete!
                        r.completedAt = new Date().toISOString();
                        r.approvalStatus = 'completed';
                        r.kdsStatus = 'served';
                        r.autoExpired = true;
                        mutatedHistory = true;

                        fetch('https://rolands-steakhouse-jsoo.onrender.com/api/reservations/update-status', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: r.reservationNumber, status: 'Completed' })
                        }).catch(() => { });
                    }
                }
            });

            // 2. Release table overrides ONLY if all bookings on that table are completed (>3 hours old)
            const activeTableBookings = new Set(
                history.filter(r => {
                    if (!r || r.completedAt || r.approvalStatus === 'completed' || r.approvalStatus === 'rejected' || r.approvalStatus === 'cancelled') return false;
                    return Boolean(r.bookedTable);
                }).map(r => r.bookedTable)
            );

            for (const [tId, status] of Object.entries(overrides)) {
                if (status === 'unavailable' || status === 'cleaning') continue;
                const hadExpiredBooking = history.some(r => r && r.bookedTable === tId && r.autoExpired);
                if (hadExpiredBooking && !activeTableBookings.has(tId)) {
                    overrides[tId] = 'available';
                    mutatedOverrides = true;
                }
            }

            if (mutatedHistory) {
                localStorage.setItem('reservationHistory', JSON.stringify(history));
                try { window.dispatchEvent(new CustomEvent('reservationHistoryUpdated', { detail: history })); } catch (e) { }
            }

            if (mutatedOverrides) {
                localStorage.setItem('tableOverrides', JSON.stringify(overrides));
                fetch('https://rolands-steakhouse-jsoo.onrender.com/api/memory/table-overrides', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(overrides)
                }).catch(() => { });
                try { window.dispatchEvent(new CustomEvent('tableOverridesUpdated', { detail: overrides })); } catch (e) { }
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
            } catch (e) { }

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
            const freshRaw = getFreshDefaultRawIngredients();
            saveRawIngredients(freshRaw);
            _cachedRawIngredients = freshRaw;
            syncFoodMenuStockFromIngredients({ resetFromRaw: true, pushToCloud: true });
            logStockMovement('SYS-RESET', 'SYSTEM', 'Re-seeded inventory raw materials to canonical test baseline', 0, 'Reset');
            if (typeof window.renderRawIngredientsContainer === 'function') window.renderRawIngredientsContainer();
            if (typeof window.renderMenuManagement === 'function') window.renderMenuManagement();
            if (typeof window.renderInventory === 'function') window.renderInventory();
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
        roundStockQty: roundStockQty,
        normalizeUnit: normalizeUnit,
        getQuickRestockOptions: getQuickRestockOptions,
        getSuggestedInputQty: getSuggestedInputQty,
        convertQtyToIngredientUnit: convertQtyToIngredientUnit,
        getFreshDefaultRawIngredients: getFreshDefaultRawIngredients,
        buildCleanBranchMenuItems: buildCleanBranchMenuItems,
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
        adjustMenuAddedStock: window.adjustMenuAddedStock,
        adjustMenuTotalStock: window.adjustMenuTotalStock,
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
    } catch (e) { }

    // ── 👉 UPGRADED: LIVE CLOUD INVENTORY SYNC (BRANCH-ISOLATED, ANTI-REVERT & CACHE BUSTED) ──
    (function startInventoryCloudSync() {
        const API = 'https://rolands-steakhouse-jsoo.onrender.com';

        async function pullInventory() {
            // Pause polling for 8 seconds after you make a local change to prevent overriding your typing
            if (Date.now() < (window.__inventoryHoldUntil || 0)) return;
            // Do not update UI if the manager is currently typing in an input box
            if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

            const invBranch = getActiveInvBranchSafe();
            const fetchOpts = {
                headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
            };

            try {
                // Sync Raw Ingredients for active branch (menu items synced with photo preservation & timestamps in menuCloudSync)
                const rawRes = await fetch(`${API}/api/memory/raw-ingredients?branch=${encodeURIComponent(invBranch)}&nocache=${Date.now()}`, fetchOpts);
                if (rawRes.ok) {
                    const cloudRaw = await rawRes.json();
                    const localRawStr = localStorage.getItem('rawIngredients');
                    const localRaw = localRawStr ? JSON.parse(localRawStr) : [];

                    if (Array.isArray(cloudRaw)) {
                        // Cloud sleep protection only when cloud actually holds partial/non-empty data; NEVER push Gensan/local into a fresh empty branch
                        if (cloudRaw.length > 0 && cloudRaw.length < localRaw.length - 2) {
                            fetch(`${API}/api/memory/raw-ingredients?branch=${encodeURIComponent(invBranch)}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: localRawStr
                            }).catch(() => { });
                        } else if (cloudRaw.length > 0 && JSON.stringify(cloudRaw) !== localRawStr) {
                            if (typeof _cachedRawIngredients !== 'undefined') _cachedRawIngredients = cloudRaw;
                            localStorage.setItem('rawIngredients', JSON.stringify(cloudRaw));
                            syncFoodMenuStockFromIngredients();
                            window.dispatchEvent(new CustomEvent('rawIngredientsUpdated', { detail: cloudRaw }));
                            if (typeof broadcastSync === 'function') broadcastSync('rawIngredientsUpdated', cloudRaw);
                            if (typeof window.renderRawIngredientsContainer === 'function') window.renderRawIngredientsContainer();
                            if (typeof window.renderInventory === 'function') window.renderInventory();
                            if (typeof window.renderMenuManagement === 'function') window.renderMenuManagement();
                            if (typeof window.renderProducts === 'function') window.renderProducts();
                            if (typeof window.renderMenu === 'function') window.renderMenu();
                        }
                    }
                }
            } catch (e) { }
        }

        setInterval(pullInventory, 30000);
        document.addEventListener('visibilitychange', () => { if (!document.hidden) pullInventory(); });
    })();
})(window);

/* ==========================================
   MYSQL DATABASE SYNC (Core Poller)
========================================== */
(function initDatabaseBridge() {
    const API_BASE_URL = 'https://rolands-steakhouse-vqtr.vercel.app';
    if (!window.InventorySystem) return;

    async function syncRawIngredientsFromMySQL() {
        // Shield: Don't overwrite local stock while a local deduction/restock is being pushed
        if (Date.now() < (window.__inventoryHoldUntil || 0)) return;
        if (window.__lastLocalInventoryWrite && (Date.now() - window.__lastLocalInventoryWrite < 15000)) {
            return;
        }

        try {
            const invBranch = window.getInventoryBranch ? window.getInventoryBranch() : (window.getEffectiveBranch ? window.getEffectiveBranch() : 'General Santos City');
            const res = await fetch(`${API_BASE_URL}/api/inventory/raw?branch=${encodeURIComponent(invBranch)}&nocache=${Date.now()}`);
            if (!res.ok) return;
            const liveData = await res.json();
            if (!Array.isArray(liveData) || liveData.length === 0) return;

            let rawList = window.InventorySystem.getRawIngredients();
            const auditLogs = window.InventorySystem.getAuditLogs ? window.InventorySystem.getAuditLogs() : [];
            let updatedLocal = false;
            const pushToCloudBatch = [];

            liveData.forEach(dbItem => {
                const dbStockNum = parseFloat(dbItem.stock);
                if (isNaN(dbStockNum)) return;

                const localItem = rawList.find(i => i.id === dbItem.id || i.name === dbItem.name);
                if (localItem) {
                    const localStockNum = Number(localItem.stock) || 0;

                    // Check if this browser has a newer audit log for this ingredient that failed to reach MySQL earlier
                    const latestAudit = auditLogs.find(l => l.ingredientId === localItem.id && l.newStock !== null);
                    const auditStock = latestAudit ? Number(latestAudit.newStock) : null;

                    if (auditStock !== null && Math.abs(auditStock - dbStockNum) > 0.001 && Math.abs(localStockNum - auditStock) < 0.001) {
                        // Local has a recorded movement that MySQL missed -> Push to MySQL!
                        pushToCloudBatch.push({
                            action: latestAudit.action || 'SYNC',
                            ingredientId: localItem.id,
                            ingredientName: localItem.name,
                            category: localItem.category || 'General',
                            minThreshold: localItem.minThreshold || 100,
                            changeQty: Number(latestAudit.changeQty) || (localStockNum - dbStockNum),
                            newStock: localStockNum,
                            unit: localItem.unit || 'g',
                            operator: 1
                        });
                    } else if (Math.abs(localStockNum - dbStockNum) > 0.001) {
                        localItem.stock = dbStockNum;
                        updatedLocal = true;
                    }

                    if (dbItem.minThreshold && dbItem.minThreshold > 10 && localItem.minThreshold !== dbItem.minThreshold) {
                        localItem.minThreshold = Number(dbItem.minThreshold);
                        updatedLocal = true;
                    }
                } else {
                    rawList.push({
                        id: dbItem.id,
                        name: dbItem.name,
                        category: dbItem.category || 'General',
                        stock: dbStockNum,
                        minThreshold: Number(dbItem.minThreshold) || 100,
                        unit: dbItem.unit || 'g',
                        unitCost: 10.00,
                        supplier: 'General Supplier',
                        lastRestocked: new Date().toISOString()
                    });
                    updatedLocal = true;
                }
            });

            if (pushToCloudBatch.length > 0) {
                fetch(`${API_BASE_URL}/api/inventory/sync-movement?branch=${encodeURIComponent(invBranch)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ movements: pushToCloudBatch })
                }).catch(() => { });
            }

            if (updatedLocal) {
                window.InventorySystem.saveRawIngredients(rawList, { skipCloud: true });
                window.InventorySystem.syncFoodMenuStockFromIngredients();
            }
        } catch (e) { }
    }

    setTimeout(syncRawIngredientsFromMySQL, 800);
    setInterval(syncRawIngredientsFromMySQL, 60000);
})();

/* ── MENU ITEMS CLOUD SYNC (pull everywhere, push only from admin pages, strictly branch-isolated) ── */
(function menuCloudSync() {
    const API = 'https:' + '//rolands-steakhouse-jsoo.onrender.com';
    const isAdminPage = /admin/i.test(location.pathname);
    const isSuperAdminPage = /\/superadmin\.html/i.test(location.pathname);
    const initialPullDoneByBranch = {};
    const lastPushedByBranch = {};

    const getBranch = () => (window.getInventoryBranch ? window.getInventoryBranch() : (window.getEffectiveBranch ? window.getEffectiveBranch() : 'General Santos City'));

    // NOTE: Do NOT strip stock or total_stock — manual adjustments (e.g. 63 -> 59) & EOD must sync everywhere!
    const strip = arr => JSON.stringify((arr || []).map(i => {
        const c = { ...i };
        delete c.computedStatus;
        delete c.missingIngredients;
        delete c.stockUpdatedAt;
        delete c.last_updated;
        return c;
    }));

    function preserveNewerLocalStock(merged, local) {
        if (!Array.isArray(local) || local.length === 0) return merged;
        const now = Date.now();
        return merged.map(cloudItem => {
            if (!cloudItem || !cloudItem.id) return cloudItem;
            const localItem = local.find(l => l && l.id === cloudItem.id);
            if (!localItem) return cloudItem;
            const localTs = Number(localItem.stockUpdatedAt) || 0;
            const cloudTs = Number(cloudItem.stockUpdatedAt) || 0;
            if (localTs > cloudTs && (now - localTs < 20000)) {
                return {
                    ...cloudItem,
                    total_stock: localItem.total_stock,
                    added_stock: localItem.added_stock,
                    sold_stock: localItem.sold_stock,
                    stock: localItem.stock,
                    manualUnavailable: localItem.manualUnavailable,
                    _lastRawPortions: localItem._lastRawPortions,
                    stockUpdatedAt: localItem.stockUpdatedAt,
                    last_updated: localItem.last_updated
                };
            }
            return cloudItem;
        });
    }

    async function pull() {
        if (Date.now() < (window.__inventoryHoldUntil || 0)) return;
        if (Date.now() - (window.__lastMenuPush || 0) < 8000) return;
        const pullBranch = getBranch();
        try {
            const r = await fetch(`${API}/api/memory/inventory-items?branch=${encodeURIComponent(pullBranch)}&nocache=${Date.now()}`);
            if (!r.ok) { initialPullDoneByBranch[pullBranch] = true; return; }
            const cloud = await r.json();
            if (!Array.isArray(cloud) || cloud.length === 0) {
                initialPullDoneByBranch[pullBranch] = true;
                return;
            }
            // Abort if active inventory branch changed mid-flight
            if (getBranch() !== pullBranch) return;
            const local = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
            const withPhotos = typeof window.mergeInventoryWithSharedPhotos === 'function'
                ? window.mergeInventoryWithSharedPhotos(cloud, local)
                : cloud;
            const merged = preserveNewerLocalStock(withPhotos, local);
            initialPullDoneByBranch[pullBranch] = true;
            if (strip(local) === strip(merged)) {
                lastPushedByBranch[pullBranch] = localStorage.getItem('inventoryItems') || '[]';
                return;
            }
            const nextStr = JSON.stringify(merged);
            localStorage.setItem('inventoryItems', nextStr);
            lastPushedByBranch[pullBranch] = nextStr;
            window.InventorySystem?.syncFoodMenuStockFromIngredients?.();
            lastPushedByBranch[pullBranch] = localStorage.getItem('inventoryItems') || nextStr;
            window.dispatchEvent(new CustomEvent('inventoryUpdated', { detail: merged }));
            if (typeof window.renderInventory === 'function') window.renderInventory();
            if (typeof window.renderMenuManagement === 'function') window.renderMenuManagement();
            if (typeof window.renderProducts === 'function') window.renderProducts();
            if (typeof window.renderMenu === 'function') window.renderMenu();
        } catch (e) {
            initialPullDoneByBranch[pullBranch] = true;
        }
    }

    window.syncMenuCloudNow = pull;
    setTimeout(pull, 400);
    setInterval(pull, 10000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) pull(); });

    // 👉 Push whenever menu/stock changes from Admin or SuperAdmin, keyed PER BRANCH so switching branches never overwrites another branch!
    if (isAdminPage || isSuperAdminPage) {
        setInterval(() => {
            const curBranch = getBranch();
            if (!initialPullDoneByBranch[curBranch]) return;
            if (Date.now() < (window.__inventoryHoldUntil || 0)) return;
            const local = localStorage.getItem('inventoryItems') || '[]';
            if (!lastPushedByBranch[curBranch]) {
                lastPushedByBranch[curBranch] = local;
                return;
            }
            if (local === lastPushedByBranch[curBranch]) return;
            lastPushedByBranch[curBranch] = local;
            window.__lastMenuPush = Date.now();
            fetch(`${API}/api/memory/inventory-items?branch=${encodeURIComponent(curBranch)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: local
            }).catch(() => { });
        }, 5000);
    }
})();
/* ── AUDIT LOG CLOUD SYNC (shared across all devices) ── */
(function auditLogCloudSync() {
    const API = 'https:' + '//rolands-steakhouse-vqtr.vercel.app';
    const KEY = 'inventory_audit_logs';
    let pushTimer = null;
    let pushing = false;

    const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
    const sig = arr => JSON.stringify((arr || []).map(l => l.id).sort());

    function rerender() {
        [['superadmin-audit-container', 'Super Admin'], ['admin-audit-container', 'Admin']].forEach(([id, role]) => {
            const el = document.getElementById(id);
            if (el && !el.classList.contains('hidden') && window.InventorySystem && window.InventorySystem.renderAuditLogUI) {
                window.InventorySystem.renderAuditLogUI(el, role);
            }
        });
    }

    async function pull() {
        if (pushing) return;
        try {
            const r = await fetch(`${API}/api/inventory/audit-log?nocache=${Date.now()}`);
            if (!r.ok) return;
            const cloud = await r.json();

            const local = read();
            const cloudIds = new Set(cloud.map(l => l.id));
            const localOnly = local.filter(l => !cloudIds.has(l.id));
            const byId = {};
            local.forEach(l => { if (l && l.id) byId[l.id] = l; });
            cloud.forEach(l => { if (l && l.id) byId[l.id] = l; });
            const merged = Object.values(byId)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 500);

            if (sig(merged) === sig(local)) return;
            localStorage.setItem(KEY, JSON.stringify(merged));
            rerender();
            if (localOnly.length > 0) push(); // this device had entries the cloud didn't
        } catch (e) { }
    }

    async function push() {
        const logs = read();
        if (logs.length === 0) return;
        pushing = true;
        try {
            await fetch(`${API}/api/inventory/audit-log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logs })
            });
        } catch (e) { } finally { pushing = false; }
    }

    let lastPushed = '';
    setInterval(() => {
        const s = sig(read());
        if (s !== lastPushed) { lastPushed = s; push(); }
    }, 10000);

    setTimeout(push, 2500);
    setTimeout(pull, 4000);
    setInterval(pull, 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) pull(); });
})();

/* ============================================================================
   🏬 ROLAND'S MULTI-BRANCH ENGINE (General Santos City & Koronadal City)
   Fixed: No recursion, automatic cloud branch memory, and full UI sync!
============================================================================ */
(function initMultiBranchEngine() {
    const DEFAULT_BACKEND_URL = 'https://rolands-steakhouse-jsoo.onrender.com';

    // Bind native storage methods FIRST so we never trigger infinite recursion!
    const rawGet = Storage.prototype.getItem.bind(localStorage);
    const rawSet = Storage.prototype.setItem.bind(localStorage);
    const rawRem = Storage.prototype.removeItem.bind(localStorage);
    window.__rawGetStorage = rawGet;
    window.__rawSetStorage = rawSet;

    const DEFAULT_BRANCHES = [
        {
            id: 'General Santos City',
            branchKey: 'General Santos City',
            name: 'General Santos City',
            shortName: 'Gensan (Main)',
            tagline: 'Fine Dining Excellence in Gensan',
            address: 'Jose Catolico Sr. Ave., General Santos City (Dadiangas), 9500 South Cotabato',
            tel: '(083) 123-4567',
            apiUrl: DEFAULT_BACKEND_URL,
            isDefault: true,
            mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.386053151522!2d125.190588!3d6.123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32f09fb579f4695d%3A0x3498bc0e23698fc3!2sRoland's%20Steak%20House!5e0!3m2!1sen!2sph!4v1711000000000!5m2!1sen!2sph"
        },
        {
            id: 'Koronadal City',
            branchKey: 'Koronadal City',
            name: 'Koronadal City',
            shortName: 'Koronadal Branch',
            tagline: 'Fine Dining Excellence in Koronadal',
            address: 'Gensan Drive, Zone II, Koronadal City (Marbel), 9506 South Cotabato',
            tel: '(083) 228-9876',
            apiUrl: DEFAULT_BACKEND_URL,
            isDefault: true,
            mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15855.77258843554!2d124.8415!3d6.4975!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32f81891f88f8889%3A0x123456789abcdef!2sKoronadal%20City%2C%20South%20Cotabato!5e0!3m2!1sen!2sph!4v1711000000000!5m2!1sen!2sph"
        }
    ];

    function cleanBranchText(val, maxLen = 160) {
        return String(val == null ? '' : val).replace(/[<>]/g, '').trim().slice(0, maxLen);
    }

    function normalizeBranchApiUrl(rawUrl) {
        const cleaned = String(rawUrl == null ? '' : rawUrl).trim().replace(/\/+$/, '');
        if (!cleaned || /\[.*\]\(.*\)/.test(cleaned)) return DEFAULT_BACKEND_URL;
        if (/^https?:\/\/[a-z0-9.-]+(?::\d+)?(\/.*)?$/i.test(cleaned)) return cleaned;
        return DEFAULT_BACKEND_URL;
    }

    function normalizeBranchEntry(entry) {
        if (!entry || typeof entry !== 'object') return null;
        const name = cleanBranchText(entry.name || entry.branchKey || entry.id, 80);
        if (!name || name.toLowerCase() === 'all' || name.toLowerCase() === 'all branches') return null;
        const address = cleanBranchText(entry.address, 220) || `${name} Branch`;
        const tel = cleanBranchText(entry.tel, 40) || '(083) 123-4567';
        const apiUrl = normalizeBranchApiUrl(entry.apiUrl || entry.api);
        const mapEmbed = (entry.mapEmbed && /^https:\/\//i.test(String(entry.mapEmbed)))
            ? String(entry.mapEmbed)
            : `https://maps.google.com/maps?q=${encodeURIComponent(address || name)}&output=embed`;
        return {
            id: cleanBranchText(entry.id, 80) || name,
            branchKey: cleanBranchText(entry.branchKey, 80) || name,
            name,
            shortName: cleanBranchText(entry.shortName, 80) || name,
            tagline: cleanBranchText(entry.tagline, 140) || `Fine Dining Excellence in ${name}`,
            address,
            tel,
            apiUrl,
            isDefault: Boolean(entry.isDefault),
            mapEmbed
        };
    }

    function mergeBranchLists(rawList) {
        const result = DEFAULT_BRANCHES.map(b => ({ ...b }));
        const seen = new Map(result.map((b, idx) => [b.name.toLowerCase(), idx]));
        (Array.isArray(rawList) ? rawList : []).forEach(item => {
            const norm = normalizeBranchEntry(item);
            if (!norm) return;
            const key = norm.name.toLowerCase();
            if (seen.has(key)) {
                const idx = seen.get(key);
                const def = result[idx];
                result[idx] = {
                    ...def,
                    address: item.address ? norm.address : def.address,
                    tel: item.tel ? norm.tel : def.tel,
                    apiUrl: (item.apiUrl || item.api) ? norm.apiUrl : def.apiUrl
                };
            } else {
                seen.set(key, result.length);
                norm.isDefault = false;
                result.push(norm);
            }
        });
        return result;
    }

    let initialCachedBranches = [];
    try {
        const rawCachedBranches = rawGet('rolandsBranches');
        if (rawCachedBranches) initialCachedBranches = JSON.parse(rawCachedBranches);
    } catch (e) { initialCachedBranches = []; }

    const BRANCHES = mergeBranchLists(initialCachedBranches);

    const pagePath = window.location.pathname.toLowerCase();
    const isSuperAdminPage = pagePath.includes('superadmin');
    const isAdminPage = !isSuperAdminPage && (pagePath.includes('admin') || pagePath.includes('kitchen') || pagePath.includes('pos'));

    window.DEFAULT_ROLANDS_BACKEND_URL = DEFAULT_BACKEND_URL;
    window.ROLANDS_BRANCHES = BRANCHES;
    window.getBranches = function () {
        return BRANCHES.map(b => ({ ...b }));
    };
    window.normalizeBranchApiUrl = normalizeBranchApiUrl;

    // Persistent map of reservationNumber -> branch from the cloud database
    let cloudBranchMap = {};
    try { cloudBranchMap = JSON.parse(rawGet('__cloudBranchMap') || '{}') || {}; } catch (e) { cloudBranchMap = {}; }

    // 1. Get / Set Active Branch depending on role
    window.getCurrentBranch = function () {
        if (isSuperAdminPage) {
            return rawGet('superAdminSelectedBranch') || 'ALL';
        }
        if (isAdminPage) {
            return rawGet('adminSelectedBranch') || 'General Santos City';
        }
        return rawGet('selectedBranch') || 'General Santos City';
    };

    window.getEffectiveBranch = function () {
        const b = window.getCurrentBranch();
        return (!b || b === 'ALL') ? 'General Santos City' : b;
    };

    window.getBranchInfo = function (branchName) {
        const target = String(branchName || window.getEffectiveBranch() || 'General Santos City').trim();
        const lower = target.toLowerCase();
        const found = BRANCHES.find(b => b.name.toLowerCase() === lower || String(b.id).toLowerCase() === lower);
        if (found) return found;
        const fallback = BRANCHES[0] || { tel: '(083) 123-4567', apiUrl: DEFAULT_BACKEND_URL };
        return {
            id: target,
            branchKey: target,
            name: target,
            shortName: target,
            tagline: `Fine Dining Excellence in ${target}`,
            address: `${target} Branch`,
            tel: fallback.tel || '(083) 123-4567',
            apiUrl: fallback.apiUrl || DEFAULT_BACKEND_URL,
            isDefault: false,
            mapEmbed: `https://maps.google.com/maps?q=${encodeURIComponent(target)}&output=embed`
        };
    };

    window.getBranchApiUrl = function (branchName) {
        const b = window.getBranchInfo(branchName);
        return (b && b.apiUrl) ? b.apiUrl : DEFAULT_BACKEND_URL;
    };

    window.NEW_RESERVATION_WINDOW_MS = 3 * 60 * 1000;
    window.ARRIVING_SOON_WINDOW_MINS = 120;

    /**
     * Checks whether a reservation record's creation timestamp is within the 3-minute NEW highlight window.
     */
    window.isReservationNew = function (r, nowMs = Date.now()) {
        if (!r || !r.createdAt) return false;
        const createdMs = new Date(r.createdAt).getTime();
        if (isNaN(createdMs) || createdMs <= 0) return false;
        const ageMs = nowMs - createdMs;
        // Allow up to 60s clock skew without triggering on future scheduled arrival times.
        return ageMs >= -60000 && ageMs < window.NEW_RESERVATION_WINDOW_MS;
    };

    /**
     * Resolves createdAt when syncing cloud records so future arrival timestamps are never treated as creation times.
     */
    window.resolveSyncedCreatedAt = function (match, dbRes, nowMs = Date.now()) {
        if (dbRes && dbRes.createdAt) {
            return dbRes.createdAt;
        }
        const existing = match ? match.createdAt : null;
        if (!existing) return null;
        const naiveArrivalIso = dbRes && dbRes.arrivalDate
            ? `${dbRes.arrivalDate}T${dbRes.arrivalTime || '12:00'}:00`
            : '';
        if (naiveArrivalIso && existing === naiveArrivalIso) {
            return null;
        }
        const ms = new Date(existing).getTime();
        if (isNaN(ms) || ms - nowMs > 60000) {
            return null;
        }
        return existing;
    };

    /**
     * Parses a reservation's scheduled local arrival Date from arrivalDate and arrivalTime.
     */
    window.parseReservationArrivalDateTime = function (r) {
        if (!r || !r.arrivalTime) return null;
        const timeRaw = String(r.arrivalTime).trim();
        const ampmMatch = timeRaw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
        if (!ampmMatch) return null;
        let h = parseInt(ampmMatch[1], 10);
        const m = parseInt(ampmMatch[2], 10);
        const mer = (ampmMatch[3] || '').toUpperCase();
        if (isNaN(h) || isNaN(m)) return null;
        if (mer === 'PM' && h < 12) h += 12;
        if (mer === 'AM' && h === 12) h = 0;

        const rawDate = String(r.arrivalDate || '').trim();
        if (!rawDate) return null;

        const ymd = rawDate.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        if (ymd) {
            return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]), h, m, 0, 0);
        }
        const parsedDate = new Date(rawDate);
        if (isNaN(parsedDate.getTime())) return null;
        return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), h, m, 0, 0);
    };

    /**
     * Returns rounded minutes remaining if a confirmed booking is within (0, 120] minutes of arrival, else null.
     */
    window.getReservationArrivalMinsLeft = function (r, now = new Date()) {
        if (!r) return null;
        const aStatus = String(r.approvalStatus || '').toLowerCase();
        const kds = String(r.kdsStatus || '').toLowerCase();
        if (['seated', 'completed', 'cancelled', 'rejected'].includes(aStatus)) return null;
        if (kds === 'served' || kds === 'cancelled') return null;
        if (String(r.paymentStatus || '').toLowerCase() === 'refunded') return null;

        const isConfirmed = aStatus === 'approved' || (!aStatus && String(r.status || '').toLowerCase() === 'approved');
        if (!isConfirmed) return null;

        const arrival = window.parseReservationArrivalDateTime(r);
        if (!arrival) return null;

        const diffMins = (arrival - now) / 60000;
        if (diffMins > 0 && diffMins <= window.ARRIVING_SOON_WINDOW_MINS) {
            return Math.max(1, Math.round(diffMins));
        }
        return null;
    };

    /**
     * Formats remaining minutes (1..120) cleanly as "1h 53m" or "45m".
     */
    window.formatArrivalCountdown = function (minsLeft) {
        const mins = Math.max(1, Math.round(Number(minsLeft) || 0));
        if (mins < 60) return `${mins}m`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    /**
     * Formats a reservation's table label without duplicating "Table" prefixes.
     */
    window.formatActivityTableLabel = function (tableName) {
        const raw = String(tableName || '').trim();
        if (!raw || raw.toLowerCase() === 'n/a' || raw.toLowerCase() === 'unassigned') return 'No Table';
        if (/^\d+$/.test(raw)) return `Table ${raw}`;
        return raw.replace(/^(table\s+)+/i, 'Table ');
    };

    /**
     * Formats an activity timestamp into a non-negative relative age string.
     */
    window.formatActivityTimeAgo = function (timestampMs, nowMs) {
        const ts = Number(timestampMs);
        if (!Number.isFinite(ts) || ts <= 0) return 'Just now';
        const refNow = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
        const diffMs = refNow - ts;
        if (diffMs <= 5000) return 'Just now';
        const secs = Math.floor(diffMs / 1000);
        if (secs < 60) return `${secs}s ago`;
        const mins = Math.floor(secs / 60);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        let timeStr = '';
        try {
            timeStr = new Date(ts).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {}
        const rel = remMins > 0 ? `${hrs}h ${remMins}m ago` : `${hrs}h ago`;
        return timeStr ? `${rel} · ${timeStr}` : rel;
    };

    function parseActivityTimestampMs(value) {
        if (value === null || value === undefined || value === '') return 0;
        if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
        const ms = new Date(value).getTime();
        return Number.isFinite(ms) ? ms : 0;
    }

    function deriveFallbackActivityMeta(r) {
        const approval = String(r.approvalStatus || r.status || '').toLowerCase().trim();
        const kds = String(r.kdsStatus || '').toLowerCase().trim();
        const isRefunded = r.refundStatus === 'refunded' || r.paymentStatus === 'refunded' || Number(r.refundAmount) > 0;
        const isCancelled = approval === 'cancelled' || approval === 'rejected';
        const isCompleted = !!r.completedAt || approval === 'completed';

        if (isRefunded) {
            const method = r.refundMethod ? ` (${String(r.refundMethod).toUpperCase()})` : '';
            return {
                category: 'completed',
                statusKey: isCancelled ? 'cancelled_refunded' : 'refunded',
                icon: '💸',
                label: isCancelled ? `Cancelled & Refunded${method}` : `Refund Processed${method}`,
                color: '#2563eb'
            };
        }
        if (isCancelled) {
            return {
                category: 'completed',
                statusKey: 'cancelled',
                icon: '🚫',
                label: approval === 'rejected' ? 'Rejected' : 'Cancelled',
                color: '#ef4444'
            };
        }
        if (isCompleted) {
            return { category: 'completed', statusKey: 'completed', icon: '💰', label: 'Billed & Completed', color: '#16a34a' };
        }
        if (kds === 'served') {
            return { category: 'served', statusKey: 'served', icon: '🍽️', label: 'Served to Table', color: '#4f46e5' };
        }
        if (kds === 'ready') {
            return { category: 'kitchen', statusKey: 'ready', icon: '✅', label: 'Cooked & Ready', color: '#10b981' };
        }
        if (kds === 'cooking') {
            return { category: 'kitchen', statusKey: 'cooking', icon: '👨‍🍳', label: 'Kitchen Cooking', color: '#f97316' };
        }
        if (approval === 'seated') {
            return { category: 'reserved', statusKey: 'seated', icon: '🪑', label: 'Customer Seated', color: '#0ea5e9' };
        }
        if (approval === 'approved') {
            return { category: 'reserved', statusKey: 'approved', icon: '👍', label: 'Approved / Waiting', color: '#8b5cf6' };
        }
        return { category: 'reserved', statusKey: 'new', icon: '🆕', label: 'New Order', color: '#3b82f6' };
    }

    /**
     * Merges cloud live activity events with 24h fallback reservation states (excluding future bogus timestamps).
     */
    window.buildMergedActivityItems = function (cloudEvents, reservationHistory, activeBranch, nowMs) {
        const now = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
        const cutoff = now - 24 * 60 * 60 * 1000;
        const maxFuture = now + 60000;
        const targetBranch = String(activeBranch || 'ALL').trim();
        const filterByBranch = targetBranch && targetBranch !== 'ALL';

        const merged = [];
        const cloudResNums = new Set();

        (Array.isArray(cloudEvents) ? cloudEvents : []).forEach(ev => {
            if (!ev || typeof ev !== 'object') return;
            const ts = parseActivityTimestampMs(ev.timestamp);
            if (!ts || ts <= cutoff || ts > maxFuture) return;
            const evBranch = String(ev.branch || 'General Santos City').trim();
            if (filterByBranch && evBranch !== targetBranch) return;

            const resNum = String(ev.reservationNumber || '').trim();
            if (resNum) cloudResNums.add(resNum);

            merged.push({
                id: ev.id || `cloud-${resNum}-${ts}`,
                source: 'cloud',
                reservationNumber: resNum,
                customerName: String(ev.customerName || 'Guest').trim(),
                bookedTable: String(ev.bookedTable || '').trim(),
                reservationType: String(ev.reservationType || 'standard').toLowerCase(),
                bookedBy: String(ev.bookedBy || 'online').toLowerCase(),
                branch: evBranch,
                paymentAmount: Number(ev.paymentAmount || 0),
                foods: Array.isArray(ev.foods) ? ev.foods.filter(f => !/^\[\[ORDER_NOTE:/i.test(String(f || '').trim())) : [],
                category: String(ev.category || 'reserved'),
                statusKey: String(ev.statusKey || ''),
                icon: String(ev.icon || '🆕'),
                label: String(ev.label || 'Activity'),
                color: String(ev.color || '#3b82f6'),
                actor: String(ev.actor || '').trim(),
                timestamp: ts
            });
        });

        (Array.isArray(reservationHistory) ? reservationHistory : []).forEach(r => {
            if (!r || typeof r !== 'object') return;
            const resNum = String(r.reservationNumber || '').trim();
            if (resNum && cloudResNums.has(resNum)) return;

            const rBranch = String(r.branch || 'General Santos City').trim();
            if (filterByBranch && rBranch !== targetBranch) return;

            // Use only real action timestamps; never fall back to arrivalDate or Date.now()
            const candidates = [
                parseActivityTimestampMs(r.refundedAt),
                parseActivityTimestampMs(r.updatedAt),
                parseActivityTimestampMs(r.completedAt),
                parseActivityTimestampMs(r.createdAt)
            ].filter(t => t > 0 && t <= maxFuture);
            const eventTs = candidates.length ? Math.max(...candidates) : 0;
            if (!eventTs || eventTs <= cutoff) return;

            const meta = deriveFallbackActivityMeta(r);
            const foods = Array.isArray(r.foods)
                ? r.foods.filter(f => !/^\[\[ORDER_NOTE:/i.test(String(f || '').trim()))
                : [];

            merged.push({
                id: `hist-${resNum || eventTs}-${meta.statusKey}`,
                source: 'history',
                reservationNumber: resNum,
                customerName: String(r.customerName || 'Walk-in Guest').trim(),
                bookedTable: String(r.bookedTable || '').trim(),
                reservationType: String(r.reservationType || 'standard').toLowerCase(),
                bookedBy: String(r.bookedBy || 'online').toLowerCase(),
                branch: rBranch,
                paymentAmount: Number(r.paymentAmount || 0),
                foods,
                category: meta.category,
                statusKey: meta.statusKey,
                icon: meta.icon,
                label: meta.label,
                color: meta.color,
                actor: '',
                timestamp: eventTs
            });
        });

        merged.sort((a, b) => {
            const diff = Number(b.timestamp || 0) - Number(a.timestamp || 0);
            if (diff !== 0) return diff;
            const idA = parseInt(String(a.reservationNumber || '').replace(/[^0-9]/g, ''), 10) || 0;
            const idB = parseInt(String(b.reservationNumber || '').replace(/[^0-9]/g, ''), 10) || 0;
            return idB - idA;
        });

        return merged;
    };

    function healFullLocalStorage() {
        try {
            const histRaw = rawGet('reservationHistory');
            if (histRaw && histRaw.length > 250000) {
                const list = JSON.parse(histRaw);
                if (Array.isArray(list)) {
                    list.forEach(r => { if (r && !r.hasCustomProof) delete r.paymentProof; });
                    rawSet('reservationHistory', JSON.stringify(list));
                }
            }
        } catch (e) { }
    }

    function safeRawSet(k, v) {
        try {
            rawSet(k, v);
        } catch (quotaErr) {
            try {
                healFullLocalStorage();
                // 👉 FIX: NEVER delete food pictures! If storage is completely full, delete heavy audit logs instead.
                const logsRaw = rawGet('inventory_audit_logs');
                if (logsRaw && logsRaw.length > 100000) rawSet('inventory_audit_logs', '[]');
                rawSet(k, v);
            } catch (e2) {
                console.warn('Storage quota full, skipped write for:', k);
            }
        }
    }

    const DEFAULT_POS_BRANCH_PINS = {
        'General Santos City': '1111',
        'Koronadal City': '2222'
    };

    const DEFAULT_TERMINAL_PINS = {
        posPassword: '0000',
        kitchenPassword: '1234'
    };

    window.getTerminalPin = function (role) {
        if (role === 'kitchen') {
            return String(rawGet('kitchenPassword') || DEFAULT_TERMINAL_PINS.kitchenPassword).trim();
        }
        return String(rawGet('posPassword') || DEFAULT_TERMINAL_PINS.posPassword).trim();
    };

    window.setTerminalPin = async function (role, newPin) {
        const cleanPin = String(newPin || '').trim().slice(0, 12);
        if (!cleanPin) return null;
        const key = role === 'kitchen' ? 'kitchenPassword' : 'posPassword';
        safeRawSet(key, cleanPin);
        const payload = { [key]: cleanPin };
        try {
            await origFetch(`${DEFAULT_BACKEND_URL}/api/memory/terminal-pins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) { }
        return cleanPin;
    };

    window.getPosBranchPinMap = function () {
        let saved = {};
        try {
            saved = JSON.parse(rawGet('posBranchSwitchPins') || '{}') || {};
        } catch (e) { saved = {}; }
        return { ...DEFAULT_POS_BRANCH_PINS, ...saved };
    };

    window.getPosBranchPin = function (branchName) {
        const map = window.getPosBranchPinMap();
        return map[branchName] || DEFAULT_POS_BRANCH_PINS[branchName] || '1234';
    };

    window.setPosBranchPin = async function (branchName, newPin) {
        const map = window.getPosBranchPinMap();
        map[branchName] = String(newPin).trim();
        safeRawSet('posBranchSwitchPins', JSON.stringify(map));
        try {
            await origFetch(`${DEFAULT_BACKEND_URL}/api/memory/pos-branch-pins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(map)
            });
        } catch (e) { }
        return map;
    };

    window.syncPosBranchPinsFromCloud = async function () {
        try {
            const [pinsRes, termRes] = await Promise.all([
                origFetch(`${DEFAULT_BACKEND_URL}/api/memory/pos-branch-pins?nocache=${Date.now()}`).catch(() => null),
                origFetch(`${DEFAULT_BACKEND_URL}/api/memory/terminal-pins?nocache=${Date.now()}`).catch(() => null)
            ]);
            if (pinsRes && pinsRes.ok) {
                const cloudPins = await pinsRes.json();
                if (cloudPins && typeof cloudPins === 'object' && Object.keys(cloudPins).length > 0) {
                    const merged = { ...DEFAULT_POS_BRANCH_PINS, ...cloudPins };
                    safeRawSet('posBranchSwitchPins', JSON.stringify(merged));
                    if (typeof window.loadPosBranchPinInput === 'function') window.loadPosBranchPinInput();
                }
            }
            if (termRes && termRes.ok) {
                const cloudTerm = await termRes.json();
                if (cloudTerm && typeof cloudTerm === 'object') {
                    if (cloudTerm.posPassword) safeRawSet('posPassword', String(cloudTerm.posPassword).trim());
                    if (cloudTerm.kitchenPassword) safeRawSet('kitchenPassword', String(cloudTerm.kitchenPassword).trim());
                    if (typeof window.loadTerminalPinInputs === 'function') window.loadTerminalPinInputs();
                }
            }
        } catch (e) { }
        return window.getPosBranchPinMap();
    };

    // Sync terminal & per-branch PINs from cloud immediately on startup
    window.syncPosBranchPinsFromCloud();

    function resetBranchDropdownsToCurrent() {
        const curr = window.getCurrentBranch();
        ['admin-branch-select', 'rsh-staff-branch-select', 'superadmin-branch-select', 'customer-branch-select'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = curr;
        });
    }

    window.setActiveBranch = async function (branchName) {
        const previousBranch = window.getCurrentBranch();
        if (!branchName || branchName === previousBranch) return;

        const isPosPage = pagePath.includes('pos');
        const isKitchenPage = pagePath.includes('kitchen');
        const loggedInStaff = sessionStorage.getItem('adminLoggedInUser');
        const assignedBranch = sessionStorage.getItem('adminAssignedBranch');

        // 1. STAFF BRANCH ASSIGNMENT LOCK: Block staff from switching to an unassigned branch
        if (isAdminPage && loggedInStaff && assignedBranch && assignedBranch !== 'ALL' && branchName !== assignedBranch) {
            resetBranchDropdownsToCurrent();
            if (typeof window.superModal === 'function') {
                await window.superModal({
                    title: '🚫 Branch Access Restricted',
                    message: `Staff account <b>${loggedInStaff}</b> is assigned exclusively to <b>${assignedBranch}</b>.<br><br>You are not authorized to access <b>${branchName}</b>.`,
                    confirmText: 'Understood'
                });
            } else {
                alert(`🚫 Access Denied: Your account (${loggedInStaff}) is assigned to ${assignedBranch} only.`);
            }
            return;
        }

        // 2. PER-BRANCH POS & KITCHEN SWITCH PIN GUARD:
        // Never show a modal popup or reload back to Step 1; open Step 2 Branch PIN directly for the target branch.
        if (isPosPage || isKitchenPage) {
            if (isKitchenPage && typeof window.requestKitchenBranchSwitch === 'function') {
                await window.requestKitchenBranchSwitch(branchName, previousBranch);
                return;
            }
            if (isPosPage && typeof window.requestPosBranchSwitch === 'function') {
                await window.requestPosBranchSwitch(branchName, previousBranch);
                return;
            }
            safeRawSet('adminSelectedBranch', branchName);
            window.dispatchEvent(new CustomEvent('branchChanged', { detail: branchName }));
            if (isKitchenPage && typeof window.showKitchenBranchGate === 'function') {
                await window.showKitchenBranchGate();
            } else if (isPosPage && typeof window.showPosBranchGate === 'function') {
                await window.showPosBranchGate();
            }
            return;
        }

        // 3. Save new branch using quota-safe storage and reload
        if (isSuperAdminPage) {
            safeRawSet('superAdminSelectedBranch', branchName);
        } else if (isAdminPage) {
            safeRawSet('adminSelectedBranch', branchName);
        } else {
            safeRawSet('selectedBranch', branchName);
        }
        window.dispatchEvent(new CustomEvent('branchChanged', { detail: branchName }));
        window.location.reload();
    };

    // 2. Smart LocalStorage Proxy — Automatically separates inventory, floorplan, promos, holidays, and chats per branch!
    const SCOPED_KEYS = new Set([
        'tableOverrides',
        'floorPlanConfig',
        'inventoryItems',
        'rawIngredients',
        'inventory_audit_logs',
        'inventory_wastage_logs',
        'activePromos',
        'liveChats',
        'store_status',
        'ph_holiday_config',
        'vouchers'
    ]);

    const INV_OVERRIDE_KEYS = new Set(['inventoryItems', 'rawIngredients', 'inventory_audit_logs', 'inventory_wastage_logs']);

    window.getInventoryBranch = function () {
        if (isSuperAdminPage && window.__invBranchOverride) {
            return window.__invBranchOverride;
        }
        return window.getEffectiveBranch();
    };

    function resolveScopedKey(key) {
        if (key === 'ph_holiday_config' && window.__holidayBranchOverride) {
            return window.__holidayBranchOverride === 'General Santos City'
                ? key
                : `${window.__holidayBranchOverride}__${key}`;
        }
        if (isSuperAdminPage && window.__invBranchOverride && INV_OVERRIDE_KEYS.has(key)) {
            return window.__invBranchOverride === 'General Santos City'
                ? key
                : `${window.__invBranchOverride}__${key}`;
        }
        const activeBranch = window.getCurrentBranch();
        if (SCOPED_KEYS.has(key) && activeBranch !== 'General Santos City' && activeBranch !== 'ALL') {
            return `${activeBranch}__${key}`;
        }
        return key;
    }

    Storage.prototype.getItem = function (key) {
        if (this === localStorage) {
            const activeBranch = window.getCurrentBranch();

            if (key === 'reservationHistory') {
                const raw = rawGet('reservationHistory');
                if (!raw) return raw;
                try {
                    const list = JSON.parse(raw);
                    if (!Array.isArray(list)) return raw;
                    list.forEach(r => {
                        if (r) {
                            if (cloudBranchMap[r.reservationNumber]) r.branch = cloudBranchMap[r.reservationNumber];
                            if (!r.branch) r.branch = 'General Santos City';
                        }
                    });

                    if (isSuperAdminPage && activeBranch === 'ALL') {
                        return JSON.stringify(list);
                    }
                    const target = window.getEffectiveBranch();
                    return JSON.stringify(list.filter(r => (r.branch || 'General Santos City') === target));
                } catch (e) {
                    return raw;
                }
            }

            const scopedKey = resolveScopedKey(key);
            let val = rawGet(scopedKey);

            // Brand-new branch isolation: NEVER inherit Gensan's sold_stock, added_stock, or manual adjustments!
            if (val === null && scopedKey !== key) {
                const sepIdx = scopedKey.indexOf('__');
                const branchPrefix = sepIdx > 0 ? scopedKey.slice(0, sepIdx) : '';
                if (key === 'rawIngredients') {
                    const freshRaw = (window.InventorySystem && typeof window.InventorySystem.getFreshDefaultRawIngredients === 'function')
                        ? window.InventorySystem.getFreshDefaultRawIngredients()
                        : (Array.isArray(window.__DEFAULT_RAW_INGREDIENTS_TEMPLATE)
                            ? window.__DEFAULT_RAW_INGREDIENTS_TEMPLATE.map(i => ({ ...i, lastRestocked: new Date().toISOString() }))
                            : []);
                    if (freshRaw.length > 0) {
                        const serialized = JSON.stringify(freshRaw);
                        safeRawSet(scopedKey, serialized);
                        return serialized;
                    }
                } else if (key === 'inventoryItems') {
                    const gensanRawStr = rawGet('inventoryItems');
                    if (gensanRawStr) {
                        try {
                            const gensanItems = JSON.parse(gensanRawStr);
                            if (Array.isArray(gensanItems) && gensanItems.length > 0 && window.InventorySystem && typeof window.InventorySystem.buildCleanBranchMenuItems === 'function') {
                                const branchRawKey = branchPrefix ? `${branchPrefix}__rawIngredients` : 'rawIngredients';
                                let branchRawList = null;
                                try {
                                    const bRawStr = rawGet(branchRawKey);
                                    if (bRawStr) branchRawList = JSON.parse(bRawStr);
                                } catch (e) { }
                                if (!branchRawList) branchRawList = window.InventorySystem.getFreshDefaultRawIngredients();
                                const cleaned = window.InventorySystem.buildCleanBranchMenuItems(gensanItems, branchRawList);
                                const serialized = JSON.stringify(cleaned);
                                safeRawSet(scopedKey, serialized);
                                return serialized;
                            }
                        } catch (e) { }
                    }
                }
            }
            return val;
        }
        return rawGet(key);
    };

    Storage.prototype.setItem = function (key, value) {
        if (this === localStorage) {
            const activeBranch = window.getCurrentBranch();

            if (key === 'reservationHistory') {
                try {
                    const incoming = JSON.parse(value);
                    if (Array.isArray(incoming)) {
                        const targetBranch = window.getEffectiveBranch();
                        const existingRaw = rawGet('reservationHistory');
                        const existingList = existingRaw ? JSON.parse(existingRaw) : [];
                        const existingBranchByRes = {};
                        if (Array.isArray(existingList)) {
                            existingList.forEach(r => {
                                if (r && r.reservationNumber && r.branch) {
                                    existingBranchByRes[r.reservationNumber] = r.branch;
                                }
                            });
                        }

                        incoming.forEach(r => {
                            if (!r) return;
                            if (cloudBranchMap[r.reservationNumber]) {
                                r.branch = cloudBranchMap[r.reservationNumber];
                            } else if (r.branch) {
                                cloudBranchMap[r.reservationNumber] = r.branch;
                            } else if (existingBranchByRes[r.reservationNumber]) {
                                r.branch = existingBranchByRes[r.reservationNumber];
                            } else {
                                // Only tag brand-new reservations (<15s old) with targetBranch; older untagged ones belong to Gensan
                                const createdAgeMs = r.createdAt ? (Date.now() - new Date(r.createdAt).getTime()) : NaN;
                                const isBrandNew = !isNaN(createdAgeMs) && createdAgeMs >= -60000 && createdAgeMs < 15000;
                                r.branch = isBrandNew ? targetBranch : 'General Santos City';
                            }
                        });

                        if (!(isSuperAdminPage && activeBranch === 'ALL')) {
                            const otherBranches = Array.isArray(existingList)
                                ? existingList.filter(r => {
                                    const b = cloudBranchMap[r.reservationNumber] || r.branch || 'General Santos City';
                                    return b !== targetBranch;
                                })
                                : [];
                            return safeRawSet('reservationHistory', JSON.stringify([...otherBranches, ...incoming]));
                        }
                        return safeRawSet('reservationHistory', JSON.stringify(incoming));
                    }
                } catch (e) { }
            }

            return safeRawSet(resolveScopedKey(key), value);
        }
        return safeRawSet(key, value);
    };

    Storage.prototype.removeItem = function (key) {
        if (this === localStorage && SCOPED_KEYS.has(key)) {
            return rawRem(resolveScopedKey(key));
        }
        return rawRem(key);
    };

    // 3. Intercept fetch() so every API call sends & receives the active branch + remembers dbRes.branch!
    const origFetch = window.fetch.bind(window);
    window.__origFetch = origFetch;

    // 👉 AUTO-REDIRECT OLD VERCEL & OLD RENDER URLS TO YOUR NEW RENDER BACKEND!
    const NEW_BACKEND_URL = 'https://rolands-steakhouse-jsoo.onrender.com';

    const isBranchScopedEndpoint = (u) => {
        if (!u) return false;
        if (u.includes('/api/memory/branches') || u.includes('/api/memory/pos-branch-pins')) return false;
        return u.includes('/reservations') || u.includes('/reserve') || u.includes('/api/inventory/') || u.includes('/api/memory/');
    };

    window.fetch = async function (input, init = {}) {
        let url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
        if (url) {
            if (url.includes('rolands-steakhouse-vqtr.vercel.app')) {
                url = url.replace('https://rolands-steakhouse-vqtr.vercel.app', NEW_BACKEND_URL);
                input = url;
            } else if (url.includes('https://rolands-steakhouse.onrender.com')) {
                url = url.replace('https://rolands-steakhouse.onrender.com', NEW_BACKEND_URL);
                input = url;
            } else if (url.includes('https://rolands-steakhouse-hz8o.onrender.com')) {
                url = url.replace('https://rolands-steakhouse-hz8o.onrender.com', NEW_BACKEND_URL);
                input = url;
            }
        }
        const activeBranch = window.getCurrentBranch();
        const isInvEndpoint = url && (url.includes('/api/inventory/') || url.includes('/api/memory/inventory-items') || url.includes('/api/memory/raw-ingredients'));
        const effectiveBranch = (url && url.includes('/api/memory/holidays') && isSuperAdminPage && (window.__holidayBranchOverride || window.__holidayManagerBranch))
            ? (window.__holidayBranchOverride || window.__holidayManagerBranch)
            : (isInvEndpoint ? window.getInventoryBranch() : window.getEffectiveBranch());

        if (url && url.startsWith(NEW_BACKEND_URL) && isBranchScopedEndpoint(url)) {
            const branchApi = window.getBranchApiUrl ? window.getBranchApiUrl(effectiveBranch) : NEW_BACKEND_URL;
            if (branchApi && branchApi !== NEW_BACKEND_URL) {
                url = branchApi + url.slice(NEW_BACKEND_URL.length);
                input = url;
            }
        }

        if (url && (url.includes('/api/memory/') || url.includes('/api/inventory/') || url.includes('/reservations'))) {
            const skipBranchParam = isSuperAdminPage && activeBranch === 'ALL' && url.includes('/reservations');
            if (!skipBranchParam && !url.includes('branch=')) {
                const sep = url.includes('?') ? '&' : '?';
                url = `${url}${sep}branch=${encodeURIComponent(effectiveBranch)}`;
                input = url;
            }
        }

        if (init && init.body && typeof init.body === 'string' && (url.includes('/reserve') || url.includes('/api/reservations/update-order') || url.includes('/api/inventory/'))) {
            try {
                const parsed = JSON.parse(init.body);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    if (!parsed.branch) parsed.branch = effectiveBranch;
                    // Attach POS Discount (Senior / PWD / Voucher) if active on POS
                    if (url.includes('/reserve') && window.__posActiveDiscount && window.__posActiveDiscount.type !== 'none') {
                        const d = window.__posActiveDiscount;
                        parsed.discountType = d.type;
                        parsed.discountAmount = d.discountAmount || 0;
                        parsed.voucherCode = d.voucherCode || '';
                        if (d.finalTotal > 0 && parsed.paymentAmount === d.rawSubtotal) {
                            parsed.paymentAmount = d.finalTotal;
                        }
                    } else if (url.includes('/reserve') && (!parsed.discountType || parsed.discountType === 'none')) {
                        // Attach Online Pre-Order Discount (PWD / Senior / Voucher) if active on payment.html / payment-success.html
                        const preDiscType = localStorage.getItem('discountType') || 'none';
                        const preDiscAmt = parseFloat(localStorage.getItem('discountAmount') || '0') || 0;
                        const preVoucher = localStorage.getItem('voucherCode') || '';
                        if (preDiscType !== 'none' && preDiscAmt > 0) {
                            parsed.discountType = preDiscType;
                            parsed.discountAmount = preDiscAmt;
                            parsed.voucherCode = preVoucher;
                        }
                    }

                    // Embed Doneness, Kitchen Timing, and Notes into `foods` as [[ORDER_NOTE: ...]] for cross-device / Incognito sync
                    if (url.includes('/reserve') || url.includes('/api/reservations/update-order')) {
                        const cleanFoodItems = Array.isArray(parsed.foods) ? parsed.foods.filter(f => !/^\[\[ORDER_NOTE:/i.test(String(f || '').trim())) : [];
                        const isStandardNoFood = String(parsed.reservationType || '').toLowerCase() === 'standard' && cleanFoodItems.length === 0;
                        const isCustomerCheckoutPage = !isAdminPage && !isSuperAdminPage && !pagePath.includes('pos') && !pagePath.includes('kitchen');
                        let noteStr = String(parsed.beefNote || parsed.notes || '').trim();
                        if (!noteStr && url.includes('/reserve') && isCustomerCheckoutPage && !isStandardNoFood) {
                            const d = localStorage.getItem('beefDoneness') || '';
                            const n = localStorage.getItem('beefNote') || '';
                            const kt = parsed.kitchenTiming || localStorage.getItem('kitchenTiming') || '';
                            noteStr = [d ? `Doneness: ${d}` : '', n, kt ? `[[KITCHEN_TIMING: ${kt}]]` : ''].filter(Boolean).join(' | ');
                        } else if (!isStandardNoFood && parsed.kitchenTiming && !/KITCHEN_TIMING/i.test(noteStr)) {
                            noteStr = noteStr ? `${noteStr} | [[KITCHEN_TIMING: ${parsed.kitchenTiming}]]` : `[[KITCHEN_TIMING: ${parsed.kitchenTiming}]]`;
                        }
                        if (isStandardNoFood && noteStr) {
                            noteStr = noteStr
                                .replace(/\[\[KITCHEN_TIMING:[^\]]+\]\]/gi, '')
                                .replace(/(?:^|\|\s*)Doneness:\s*[^|]+/gi, '')
                                .replace(/^\s*\|\s*|\s*\|\s*$/g, '')
                                .trim();
                        }
                        if (Array.isArray(parsed.foods)) {
                            parsed.foods = cleanFoodItems;
                            if (noteStr) {
                                parsed.foods.push(`[[ORDER_NOTE: ${noteStr}]]`);
                                parsed.beefNote = noteStr;
                            }
                        }
                    }

                    init.body = JSON.stringify(parsed);
                }
            } catch (e) { }
        }

        const response = await origFetch(input, init);

        // Automatically capture each reservation's branch and unpack [[ORDER_NOTE: ...]] from /reservations
        if (url && url.includes('/reservations') && response.ok) {
            try {
                const origJson = response.json.bind(response);
                response.json = async function () {
                    const arr = await origJson();
                    if (Array.isArray(arr)) {
                        arr.forEach(r => {
                            if (!r || typeof r !== 'object') return;
                            if (r.reservationNumber && r.branch) {
                                cloudBranchMap[r.reservationNumber] = r.branch;
                            }
                            if (Array.isArray(r.foods) && typeof window.unpackCloudFoodsAndNote === 'function') {
                                const unpacked = window.unpackCloudFoodsAndNote(r.foods, r.beefNote || r.notes);
                                r.foods = unpacked.foods;
                                if (unpacked.beefNote) {
                                    r.beefNote = unpacked.beefNote;
                                    r.notes = unpacked.beefNote;
                                }
                            }
                        });
                        safeRawSet('__cloudBranchMap', JSON.stringify(cloudBranchMap));
                    }
                    return arr;
                };
            } catch (e) { }
        }

        return response;
    };

    // Helper to pack/unpack order notes (Doneness, Kitchen Timing, Special Requests) inside the cloud `foods` array
    // so notes carry over across all devices & Incognito windows without requiring SQL schema changes on live servers.
    window.unpackCloudFoodsAndNote = function (rawFoods, existingNote) {
        let extractedNote = '';
        const cleanFoods = [];
        if (Array.isArray(rawFoods)) {
            rawFoods.forEach(item => {
                const str = String(item || '').trim();
                const m = str.match(/^\[\[ORDER_NOTE:\s*([\s\S]*?)\]\]$/i);
                if (m) {
                    if (m[1] && m[1].trim()) extractedNote = m[1].trim();
                } else if (str) {
                    cleanFoods.push(item);
                }
            });
        }
        return {
            foods: cleanFoods,
            beefNote: extractedNote || String(existingNote || '').trim()
        };
    };

    function setSelectOptions(el, optionDefs, preferredValue) {
        if (!el) return;
        const current = preferredValue !== undefined && preferredValue !== null ? String(preferredValue) : String(el.value || '');
        el.innerHTML = '';
        optionDefs.forEach(def => {
            const opt = document.createElement('option');
            opt.value = def.value;
            opt.textContent = def.label;
            if (def.style) opt.setAttribute('style', def.style);
            el.appendChild(opt);
        });
        if (current && optionDefs.some(o => o.value === current)) {
            el.value = current;
        } else if (el.options.length > 0) {
            el.value = el.options[0].value;
        }
    }

    window.syncAllBranchSelects = function () {
        if (typeof document === 'undefined') return;
        const list = window.getBranches();
        const curr = window.getCurrentBranch();

        setSelectOptions(
            document.getElementById('customer-branch-select'),
            list.map(b => ({ value: b.name, label: b.name, style: 'color:#0f172a;' })),
            curr
        );
        setSelectOptions(
            document.getElementById('admin-branch-select'),
            list.map(b => ({ value: b.name, label: b.name, style: 'color:#0f172a;' })),
            curr
        );
        setSelectOptions(
            document.getElementById('rsh-staff-branch-select'),
            list.map(b => ({ value: b.name, label: b.name, style: 'color:#0f172a;' })),
            curr
        );
        setSelectOptions(
            document.getElementById('superadmin-branch-select'),
            [
                { value: 'ALL', label: '🌐 All Branches (Total)', style: 'color:#0f172a;' },
                ...list.map(b => ({ value: b.name, label: `📍 ${b.name}`, style: 'color:#0f172a;' }))
            ],
            curr
        );
        const recSel = document.getElementById('records-branch-filter');
        if (recSel) {
            setSelectOptions(
                recSel,
                [
                    { value: 'ALL', label: '🌐 All Branches' },
                    ...list.map(b => ({ value: b.name, label: `📍 ${b.name}` }))
                ],
                recSel.value || 'ALL'
            );
        }
        const newStaffSel = document.getElementById('new-staff-branch');
        if (newStaffSel) {
            setSelectOptions(
                newStaffSel,
                [
                    ...list.map(b => ({ value: b.name, label: `📍 ${b.name} Only` })),
                    { value: 'ALL', label: '🌐 All Branches (Floating Staff)' }
                ],
                newStaffSel.value || list[0].name
            );
        }
        const saInvSel = document.getElementById('sa-inv-branch-select');
        if (saInvSel) {
            setSelectOptions(
                saInvSel,
                list.map(b => ({ value: b.name, label: `📍 ${b.name}` })),
                window.__invBranchOverride || saInvSel.value || window.getEffectiveBranch()
            );
        }
        const pinSel = document.getElementById('pos-branch-pin-select');
        if (pinSel) {
            setSelectOptions(
                pinSel,
                list.map(b => ({ value: b.name, label: `📍 ${b.name}` })),
                pinSel.value || list[0].name
            );
        }
        const promoSel = document.getElementById('superadmin-promo-branch-select');
        if (promoSel) {
            setSelectOptions(
                promoSel,
                [
                    { value: 'ALL', label: '🌐 All Branches (Sync Everywhere)' },
                    ...list.map(b => ({ value: b.name, label: `🥩 ${b.name}` }))
                ],
                window.superadminPromoBranch || window.__promoBranchOverride || promoSel.value || 'ALL'
            );
        }
        const holSel = document.getElementById('holiday-branch-select');
        if (holSel) {
            setSelectOptions(
                holSel,
                list.map(b => ({ value: b.name, label: `📍 ${b.name}` })),
                window.__holidayBranchOverride || holSel.value || window.getEffectiveBranch()
            );
        }
        const brFilterSel = document.getElementById('br-filter');
        if (brFilterSel) {
            setSelectOptions(
                brFilterSel,
                [
                    { value: 'all', label: '🌐 All Branches' },
                    ...list.map(b => ({ value: b.name, label: `📍 ${b.name}` }))
                ],
                brFilterSel.value || 'all'
            );
        }
        ['pos-branch-gate-select', 'kds-branch-gate-select'].forEach(gateSelId => {
            const gEl = document.getElementById(gateSelId);
            if (gEl) {
                setSelectOptions(
                    gEl,
                    list.map(b => ({ value: b.name, label: `📍 ${b.name}` })),
                    window.getEffectiveBranch()
                );
            }
        });
        document.querySelectorAll('select.sa-staff-branch-select').forEach(el => {
            setSelectOptions(
                el,
                [
                    ...list.map(b => ({ value: b.name, label: `📍 ${b.name}` })),
                    { value: 'ALL', label: '🌐 All Branches' }
                ],
                el.dataset.branch || el.value || 'General Santos City'
            );
        });
    };

    window.applySyncedBranchList = function (rawList) {
        const prevSig = JSON.stringify(BRANCHES);
        const merged = mergeBranchLists(rawList);
        BRANCHES.length = 0;
        merged.forEach(b => BRANCHES.push(b));
        const nextSig = JSON.stringify(BRANCHES);
        safeRawSet('rolandsBranches', nextSig);

        window.syncAllBranchSelects();
        if (!isAdminPage && !isSuperAdminPage && typeof window.applyCustomerBranchUI === 'function') {
            window.applyCustomerBranchUI();
        }
        if (isSuperAdminPage && typeof window.brRefresh === 'function' && prevSig !== nextSig) {
            window.brRefresh(false);
        }
        if (prevSig !== nextSig && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('branchesUpdated', { detail: window.getBranches() }));
        }
        return window.getBranches();
    };

    window.syncBranchesFromCloud = async function () {
        try {
            const res = await origFetch(`${DEFAULT_BACKEND_URL}/api/memory/branches?nocache=${Date.now()}`);
            if (!res.ok) return window.getBranches();
            const cloudList = await res.json();
            if (Array.isArray(cloudList)) {
                return window.applySyncedBranchList(cloudList);
            }
        } catch (e) { }
        return window.getBranches();
    };

    window.saveBranchesToCloud = async function (nextRawList) {
        const updated = window.applySyncedBranchList(nextRawList);
        const res = await origFetch(`${DEFAULT_BACKEND_URL}/api/memory/branches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ list: updated })
        });
        if (!res.ok) {
            const msg = await res.text().catch(() => '');
            throw new Error(msg || 'Failed to save branches to server.');
        }
        return updated;
    };

    window.addEventListener('storage', (e) => {
        if (e && e.key === 'rolandsBranches' && e.newValue) {
            try {
                const parsed = JSON.parse(e.newValue);
                if (Array.isArray(parsed)) window.applySyncedBranchList(parsed);
            } catch (err) { }
        }
    });

    // 4. Update Customer UI (index.html, payment.html, receipt.html, pos.html, superadmin.html)
    window.applyCustomerBranchUI = function () {
        const bName = window.getEffectiveBranch();
        const branchObj = window.getBranchInfo(bName);

        const heroSub = document.querySelector('#home .hero-content p');
        if (heroSub) heroSub.textContent = branchObj.tagline;

        const locAddress = document.querySelector('#location p');
        if (locAddress) locAddress.textContent = branchObj.address;
        const locIframe = document.querySelector('#location iframe');
        if (locIframe && branchObj.mapEmbed && locIframe.src !== branchObj.mapEmbed) {
            locIframe.src = branchObj.mapEmbed;
        }

        const modalSub = document.querySelector('#reservation-modal-overlay h2 + p');
        if (modalSub) {
            modalSub.textContent = `Booking for Roland's Steakhouse — ${branchObj.name} Branch`;
        }
    };

    // Sync branch-specific Floor Plan, Table Overrides, Promotions, Holidays, AND INVENTORY from Cloud across all devices!
    window.syncBranchFloorPlanFromCloud = async function () {
        try {
            const branch = window.getEffectiveBranch();
            const holBranch = window.__holidayBranchOverride || branch;
            const invBranch = window.getInventoryBranch ? window.getInventoryBranch() : branch;
            const baseUrl = 'https://rolands-steakhouse-jsoo.onrender.com';

            const [cfgRes, ovrRes, promoRes, holRes, rawMemRes, rawRes, menuRes] = await Promise.all([
                fetch(`${baseUrl}/api/memory/floor-plan-config?branch=${encodeURIComponent(branch)}&nocache=${Date.now()}`),
                fetch(`${baseUrl}/api/memory/table-overrides?branch=${encodeURIComponent(branch)}&nocache=${Date.now()}`),
                fetch(`${baseUrl}/api/memory/promos?branch=${encodeURIComponent(branch)}&nocache=${Date.now()}`),
                fetch(`${baseUrl}/api/memory/holidays?branch=${encodeURIComponent(holBranch)}&nocache=${Date.now()}`),
                fetch(`${baseUrl}/api/memory/raw-ingredients?branch=${encodeURIComponent(invBranch)}&nocache=${Date.now()}`),
                fetch(`${baseUrl}/api/inventory/raw?branch=${encodeURIComponent(invBranch)}&nocache=${Date.now()}`),
                fetch(`${baseUrl}/api/memory/inventory-items?branch=${encodeURIComponent(invBranch)}&nocache=${Date.now()}`)
            ]);
            let changed = false;
            let menuChanged = false;
            const holdInventoryPull = (Date.now() < (window.__inventoryHoldUntil || 0)) || (Date.now() - (window.__lastMenuPush || 0) < 8000);

            if (cfgRes.ok) {
                const cloudCfg = await cfgRes.json();
                if (Array.isArray(cloudCfg) && cloudCfg.length > 0) {
                    const prev = localStorage.getItem('floorPlanConfig');
                    const next = JSON.stringify(cloudCfg);
                    if (prev !== next) {
                        localStorage.setItem('floorPlanConfig', next);
                        changed = true;
                    }
                }
            }
            if (ovrRes.ok) {
                const cloudOvr = await ovrRes.json();
                if (cloudOvr && typeof cloudOvr === 'object') {
                    const prevOvr = localStorage.getItem('tableOverrides');
                    const nextOvr = JSON.stringify(cloudOvr);
                    if (prevOvr !== nextOvr) {
                        localStorage.setItem('tableOverrides', nextOvr);
                        changed = true;
                    }
                }
            }
            if (promoRes.ok) {
                const cloudPromos = await promoRes.json();
                if (Array.isArray(cloudPromos)) {
                    const promoKey = branch === 'General Santos City' ? 'activePromos' : `${branch}__activePromos`;
                    const prevPromos = rawGet(promoKey);
                    const nextPromos = JSON.stringify(cloudPromos);
                    if (prevPromos !== nextPromos) {
                        safeRawSet(promoKey, nextPromos);
                        if (typeof window.renderPromoAdManager === 'function') window.renderPromoAdManager();
                        if (typeof window.renderPromosAdmin === 'function') window.renderPromosAdmin();
                        if (typeof window.renderPromotions === 'function') window.renderPromotions();
                        if (typeof window.loadPromotions === 'function') window.loadPromotions();
                        window.dispatchEvent(new CustomEvent('promosUpdated', { detail: cloudPromos }));
                        changed = true;
                    }
                }
            }
            if (holRes.ok) {
                const cloudHol = await holRes.json();
                if (Array.isArray(cloudHol) && cloudHol.length > 0) {
                    const prevHol = localStorage.getItem('ph_holiday_config');
                    const nextHol = JSON.stringify(cloudHol);
                    if (prevHol !== nextHol) {
                        localStorage.setItem('ph_holiday_config', nextHol);
                        if (typeof window.renderHolidayCalendar === 'function') window.renderHolidayCalendar();
                        if (typeof window.renderPhHolidayManagerTable === 'function') window.renderPhHolidayManagerTable();
                        window.dispatchEvent(new CustomEvent('holidayConfigUpdated', { detail: cloudHol }));
                    }
                }
            }
            let adoptedMemRaw = false;
            if (!holdInventoryPull && rawMemRes && rawMemRes.ok) {
                const cloudMemRaw = await rawMemRes.json();
                if (Array.isArray(cloudMemRaw) && cloudMemRaw.length > 0) {
                    const nextMemRaw = JSON.stringify(cloudMemRaw);
                    if (localStorage.getItem('rawIngredients') !== nextMemRaw) {
                        localStorage.setItem('rawIngredients', nextMemRaw);
                        menuChanged = true;
                    }
                    adoptedMemRaw = true;
                }
            }
            if (!holdInventoryPull && !adoptedMemRaw && rawRes.ok) {
                const dbRaw = await rawRes.json();
                if (Array.isArray(dbRaw) && dbRaw.length > 0) {
                    const existingRaw = window.InventorySystem ? window.InventorySystem.getRawIngredients() : [];
                    const mergedRaw = existingRaw.map(loc => {
                        const found = dbRaw.find(d => d.id === loc.id || d.name === loc.name);
                        return found ? { ...loc, stock: Number(found.stock) || 0, minThreshold: Number(found.minThreshold) || loc.minThreshold } : loc;
                    });
                    const nextRaw = JSON.stringify(mergedRaw);
                    if (localStorage.getItem('rawIngredients') !== nextRaw) {
                        localStorage.setItem('rawIngredients', nextRaw);
                        menuChanged = true;
                    }
                }
            }
            if (!holdInventoryPull && menuRes.ok) {
                const cloudInv = await menuRes.json();
                if (Array.isArray(cloudInv) && cloudInv.length > 0) {
                    let existingLocalInv = [];
                    try {
                        existingLocalInv = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
                    } catch (e) { }

                    // Also harvest custom photos from other branches in cloud so cross-branch photos stay synced on Incognito/other devices
                    const allBranches = (window.ROLANDS_BRANCHES || []).map(b => b.name).filter(Boolean);
                    const otherBranches = allBranches.filter(b => b !== invBranch);
                    const otherCloudArrays = [];
                    try {
                        const otherResList = await Promise.all(
                            otherBranches.map(b => fetch(`${baseUrl}/api/memory/inventory-items?branch=${encodeURIComponent(b)}&nocache=${Date.now()}`).catch(() => null))
                        );
                        for (const r of otherResList) {
                            if (r && r.ok) {
                                const arr = await r.json().catch(() => null);
                                if (Array.isArray(arr) && arr.length > 0) otherCloudArrays.push(arr);
                            }
                        }
                    } catch (e) { }

                    const mergedInv = window.mergeInventoryWithSharedPhotos(cloudInv, existingLocalInv, otherCloudArrays);
                    const nextInv = JSON.stringify(mergedInv);
                    if (localStorage.getItem('inventoryItems') !== nextInv) {
                        localStorage.setItem('inventoryItems', nextInv);
                        menuChanged = true;
                    }

                    // If mergedInv healed a missing photo that cloudInv didn't have, push the healed list back to cloud for this branch
                    const cloudHadMissingPhoto = mergedInv.some((m, idx) => {
                        const c = cloudInv[idx];
                        return m && m.image && m.image.length > 50 && (!c || !c.image || c.image !== m.image);
                    });
                    if (cloudHadMissingPhoto && (Date.now() - (window.__lastMenuPush || 0) > 5000)) {
                        window.__lastMenuPush = Date.now();
                        fetch(`${baseUrl}/api/memory/inventory-items?branch=${encodeURIComponent(invBranch)}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: nextInv
                        }).catch(() => { });
                    }
                }
            }

            if (menuChanged) {
                if (window.InventorySystem && typeof window.InventorySystem.invalidateInventoryCache === 'function') window.InventorySystem.invalidateInventoryCache();
                if (window.InventorySystem && typeof window.InventorySystem.syncFoodMenuStockFromIngredients === 'function') window.InventorySystem.syncFoodMenuStockFromIngredients();
                if (typeof window.renderMenu === 'function') window.renderMenu();
                if (typeof window.renderMenuManagement === 'function') window.renderMenuManagement();
                if (typeof window.renderInventory === 'function') window.renderInventory();
                if (typeof window.renderProducts === 'function') window.renderProducts();
                changed = true;
            }

            if (changed) {
                if (typeof window.renderFloorPlan === 'function') window.renderFloorPlan();
                if (typeof window.loadFloorPlan === 'function') window.loadFloorPlan();
                if (typeof window.renderTables === 'function') window.renderTables();
                if (typeof window.renderWalkinTableOptions === 'function') window.renderWalkinTableOptions();
                if (typeof window.renderEditTableOptions === 'function') window.renderEditTableOptions();
                if (typeof window.renderPosTableSelect === 'function') window.renderPosTableSelect();
                window.dispatchEvent(new Event('storage'));
            }
        } catch (e) { }
    };

    // ============================================================================
    // 📸 CROSS-BRANCH MENU PHOTO SYNC ENGINE (Syncs pictures across branches by ID or Title)
    // ============================================================================
    function normMenuKey(val) {
        return String(val || '').trim().toLowerCase().replace(/\s+/g, ' ');
    }

    function isValidCustomPhoto(img) {
        return Boolean(img && typeof img === 'string' && img.length > 50 && !img.includes('placehold.co'));
    }

    function getSharedPhotoRegistry() {
        try {
            const raw = rawGet('__sharedMenuPhotos');
            return raw ? (JSON.parse(raw) || {}) : {};
        } catch (e) {
            return {};
        }
    }

    function saveSharedPhotoRegistry(reg) {
        try {
            safeRawSet('__sharedMenuPhotos', JSON.stringify(reg || {}));
        } catch (e) { }
    }

    // Merges cloud inventory items with local & cross-branch shared photos (when syncPhotoBranches !== false)
    window.mergeInventoryWithSharedPhotos = function (primaryItems, fallbackLocalItems = [], extraBranchArrays = []) {
        if (!Array.isArray(primaryItems)) return [];
        const reg = getSharedPhotoRegistry();
        let regMutated = false;

        // Gather all local branch arrays to harvest any existing custom photos
        const branchNames = (window.ROLANDS_BRANCHES || [{ name: 'General Santos City' }, { name: 'Koronadal City' }]).map(b => b.name);
        const allLocalBranchArrays = [];
        branchNames.forEach(bName => {
            try {
                const key = bName === 'General Santos City' ? 'inventoryItems' : `${bName}__inventoryItems`;
                const str = rawGet(key);
                if (str) {
                    const parsed = JSON.parse(str);
                    if (Array.isArray(parsed)) allLocalBranchArrays.push(parsed);
                }
            } catch (e) { }
        });

        const harvestSources = [
            ...(Array.isArray(fallbackLocalItems) ? [fallbackLocalItems] : []),
            ...allLocalBranchArrays,
            ...(Array.isArray(extraBranchArrays) ? extraBranchArrays : []),
            primaryItems
        ];

        harvestSources.forEach(arr => {
            if (!Array.isArray(arr)) return;
            arr.forEach(item => {
                if (!item || item.syncPhotoBranches === false) return;
                const idKey = item.id ? `id:${normMenuKey(item.id)}` : '';
                const titleKey = (item.title || item.name) ? `title:${normMenuKey(item.title || item.name)}` : '';
                const itemUpd = Number(item.imageUpdatedAt) || 1;
                const itemRem = Number(item.imageRemovedAt) || 0;

                if (itemRem > 0 && !isValidCustomPhoto(item.image)) {
                    [idKey, titleKey].filter(Boolean).forEach(k => {
                        const cur = reg[k];
                        if (!cur || itemRem >= (Number(cur.updatedAt) || 0)) {
                            reg[k] = { image: '', updatedAt: itemRem, removedAt: itemRem };
                            regMutated = true;
                        }
                    });
                } else if (isValidCustomPhoto(item.image)) {
                    [idKey, titleKey].filter(Boolean).forEach(k => {
                        const cur = reg[k];
                        const curUpd = Number(cur?.updatedAt) || 0;
                        const curRem = Number(cur?.removedAt) || 0;
                        if (itemUpd >= curUpd && itemUpd > curRem && (!cur || cur.image !== item.image)) {
                            reg[k] = { image: item.image, updatedAt: itemUpd, removedAt: 0 };
                            regMutated = true;
                        }
                    });
                }
            });
        });

        if (regMutated) saveSharedPhotoRegistry(reg);

        return primaryItems.map(cloudItem => {
            if (!cloudItem) return cloudItem;
            const normTitle = normMenuKey(cloudItem.title || cloudItem.name);
            const localMatch = Array.isArray(fallbackLocalItems)
                ? fallbackLocalItems.find(l => l && ((cloudItem.id && l.id === cloudItem.id) || (normTitle && normMenuKey(l.title || l.name) === normTitle)))
                : null;

            const syncEnabled = (cloudItem.syncPhotoBranches !== undefined)
                ? (cloudItem.syncPhotoBranches !== false)
                : (localMatch && localMatch.syncPhotoBranches !== undefined ? localMatch.syncPhotoBranches !== false : true);

            let resolvedImage = isValidCustomPhoto(cloudItem.image)
                ? cloudItem.image
                : (isValidCustomPhoto(localMatch?.image) ? localMatch.image : '');

            const itemRemAt = Math.max(Number(cloudItem.imageRemovedAt) || 0, Number(localMatch?.imageRemovedAt) || 0);
            const itemUpdAt = Math.max(Number(cloudItem.imageUpdatedAt) || 0, Number(localMatch?.imageUpdatedAt) || 0);

            if (syncEnabled) {
                const idEntry = cloudItem.id ? reg[`id:${normMenuKey(cloudItem.id)}`] : null;
                const titleEntry = normTitle ? reg[`title:${normTitle}`] : null;
                const sharedEntry = (idEntry && titleEntry)
                    ? ((Number(idEntry.updatedAt) || 0) >= (Number(titleEntry.updatedAt) || 0) ? idEntry : titleEntry)
                    : (idEntry || titleEntry);

                if (sharedEntry) {
                    if ((Number(sharedEntry.removedAt) || 0) >= (Number(sharedEntry.updatedAt) || 0) && (Number(sharedEntry.removedAt) || 0) >= itemUpdAt) {
                        resolvedImage = '';
                    } else if (isValidCustomPhoto(sharedEntry.image) && ((Number(sharedEntry.updatedAt) || 0) >= itemRemAt)) {
                        if (!resolvedImage || (Number(sharedEntry.updatedAt) || 0) >= itemUpdAt) {
                            resolvedImage = sharedEntry.image;
                        }
                    }
                }
            } else if (itemRemAt > itemUpdAt) {
                resolvedImage = '';
            }

            return {
                ...cloudItem,
                image: resolvedImage,
                syncPhotoBranches: syncEnabled
            };
        });
    };

    // Syncs a menu item's picture across all branches (or only the current branch when syncAllBranches === false)
    window.syncMenuItemPhotoAcrossBranches = async function ({ id, title, image, syncAllBranches = true }) {
        const now = Date.now();
        const cleanImg = isValidCustomPhoto(image) ? image : '';
        const normId = id ? normMenuKey(id) : '';
        const normTitle = normMenuKey(title);
        const activeInvBranch = window.getInventoryBranch ? window.getInventoryBranch() : window.getEffectiveBranch();
        const baseUrl = 'https://rolands-steakhouse-jsoo.onrender.com';

        const matchesTarget = (item) => {
            if (!item) return false;
            if (normId && normMenuKey(item.id) === normId) return true;
            if (normTitle && normMenuKey(item.title || item.name) === normTitle) return true;
            return false;
        };

        if (syncAllBranches) {
            const reg = getSharedPhotoRegistry();
            const entry = cleanImg
                ? { image: cleanImg, updatedAt: now, removedAt: 0 }
                : { image: '', updatedAt: now, removedAt: now };
            if (normId) reg[`id:${normId}`] = entry;
            if (normTitle) reg[`title:${normTitle}`] = entry;
            saveSharedPhotoRegistry(reg);

            const branchNames = Array.from(new Set([
                'General Santos City',
                'Koronadal City',
                ...((window.ROLANDS_BRANCHES || []).map(b => b.name).filter(Boolean))
            ]));

            // 1. Update all branch localStorage keys immediately
            let templateItems = [];
            try {
                templateItems = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
            } catch (e) { }

            branchNames.forEach(bName => {
                try {
                    const key = bName === 'General Santos City' ? 'inventoryItems' : `${bName}__inventoryItems`;
                    const rawStr = rawGet(key);
                    const rawKey = bName === 'General Santos City' ? 'rawIngredients' : `${bName}__rawIngredients`;
                    let branchRawList = null;
                    try { const brs = rawGet(rawKey); if (brs) branchRawList = JSON.parse(brs); } catch (e) { }
                    let list = rawStr
                        ? JSON.parse(rawStr)
                        : (templateItems.length && window.InventorySystem?.buildCleanBranchMenuItems
                            ? window.InventorySystem.buildCleanBranchMenuItems(templateItems, branchRawList)
                            : []);
                    if (Array.isArray(list) && list.length > 0) {
                        let changed = false;
                        list.forEach(item => {
                            if (matchesTarget(item)) {
                                item.image = cleanImg;
                                item.syncPhotoBranches = true;
                                item.imageUpdatedAt = now;
                                item.imageRemovedAt = cleanImg ? 0 : now;
                                changed = true;
                            }
                        });
                        if (changed) safeRawSet(key, JSON.stringify(list));
                    }
                } catch (e) { }
            });

            // 2. Push to cloud for every branch
            window.__lastMenuPush = Date.now();
            await Promise.all(branchNames.map(async (bName) => {
                try {
                    let branchList = [];
                    if (bName === activeInvBranch && templateItems.length > 0) {
                        branchList = JSON.parse(JSON.stringify(templateItems));
                    } else {
                        const r = await fetch(`${baseUrl}/api/memory/inventory-items?branch=${encodeURIComponent(bName)}&nocache=${now}`);
                        if (r.ok) {
                            const cloudArr = await r.json();
                            if (Array.isArray(cloudArr) && cloudArr.length > 0) branchList = cloudArr;
                        }
                        if (branchList.length === 0 && templateItems.length > 0) {
                            const rawKey = bName === 'General Santos City' ? 'rawIngredients' : `${bName}__rawIngredients`;
                            let branchRawList = null;
                            try { const brs = rawGet(rawKey); if (brs) branchRawList = JSON.parse(brs); } catch (e) { }
                            branchList = window.InventorySystem?.buildCleanBranchMenuItems
                                ? window.InventorySystem.buildCleanBranchMenuItems(templateItems, branchRawList)
                                : [];
                        }
                    }
                    if (branchList.length > 0) {
                        branchList.forEach(item => {
                            if (matchesTarget(item)) {
                                item.image = cleanImg;
                                item.syncPhotoBranches = true;
                                item.imageUpdatedAt = now;
                                item.imageRemovedAt = cleanImg ? 0 : now;
                            }
                        });
                        await fetch(`${baseUrl}/api/memory/inventory-items?branch=${encodeURIComponent(bName)}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(branchList)
                        });
                    }
                } catch (e) { }
            }));
        } else {
            // Only update active inventory branch
            try {
                const list = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
                list.forEach(item => {
                    if (matchesTarget(item)) {
                        item.image = cleanImg;
                        item.syncPhotoBranches = false;
                        item.imageUpdatedAt = now;
                        item.imageRemovedAt = cleanImg ? 0 : now;
                    }
                });
                localStorage.setItem('inventoryItems', JSON.stringify(list));
                window.__lastMenuPush = Date.now();
                await fetch(`${baseUrl}/api/memory/inventory-items?branch=${encodeURIComponent(activeInvBranch)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(list)
                });
            } catch (e) { }
        }

        if (window.InventorySystem && typeof window.InventorySystem.invalidateInventoryCache === 'function') {
            window.InventorySystem.invalidateInventoryCache();
        }
        window.dispatchEvent(new CustomEvent('inventoryUpdated'));
    };

    document.addEventListener('DOMContentLoaded', () => {
        const currentBranch = window.getCurrentBranch();
        const effectiveInfo = window.getBranchInfo();

        // Inject branch selector into POS (pos.html) & Kitchen (kitchen.html) if not already on page
        if (isAdminPage && !document.getElementById('admin-branch-select') && !document.getElementById('rsh-staff-branch-select')) {
            const targetBar = document.querySelector('header .metrics-bar') || document.querySelector('header > div:last-child');
            if (targetBar) {
                const wrap = document.createElement('div');
                wrap.style.cssText = 'display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.15); padding:6px 12px; border-radius:20px; border:1px solid rgba(255,255,255,0.3); color:white; font-size:12.5px; font-weight:800;';
                wrap.innerHTML = `
                    <span>🏬 Branch:</span>
                    <select id="rsh-staff-branch-select" onchange="window.setActiveBranch(this.value)"
                        style="background:transparent; border:none; color:white; font-weight:800; font-size:12.5px; cursor:pointer; outline:none;">
                    </select>
                `;
                targetBar.insertBefore(wrap, targetBar.firstChild);
            }
        }

        window.syncAllBranchSelects();
        window.syncBranchesFromCloud();
        setInterval(window.syncBranchesFromCloud, 30000);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) window.syncBranchesFromCloud();
        });

        window.syncBranchFloorPlanFromCloud();
        setInterval(window.syncBranchFloorPlanFromCloud, 15000);

        if (!isAdminPage && !isSuperAdminPage) {
            window.applyCustomerBranchUI();
        }

        // Show Branch on payment.html & standard-payment.html
        const summaryTableEl = document.getElementById('summary-table');
        if (summaryTableEl && summaryTableEl.parentElement && !document.getElementById('summary-branch')) {
            const tableRow = summaryTableEl.parentElement;
            const branchRow = document.createElement('div');
            branchRow.className = 'order-row';
            branchRow.innerHTML = `<span>Branch</span><span id="summary-branch" style="font-weight:700; color:#1b5e20;">📍 ${effectiveInfo.name}</span>`;
            tableRow.parentElement.insertBefore(branchRow, tableRow);
        }

        // Show Branch & Branch Address on receipt.html
        const receiptTableEl = document.getElementById('table-id');
        if (receiptTableEl && receiptTableEl.parentElement && !document.getElementById('receipt-branch-id')) {
            const receiptParams = new URLSearchParams(window.location.search);
            const urlRes = receiptParams.get('res');
            const urlBranch = (receiptParams.get('branch') || '').trim();
            let resBranch = urlBranch || effectiveInfo.name;
            if (urlRes) {
                try {
                    const allHist = JSON.parse(rawGet('reservationHistory') || '[]');
                    const found = allHist.find(r => r && r.reservationNumber === urlRes);
                    if (found && found.branch) resBranch = found.branch;
                } catch (e) { }
            }
            const bInfo = window.getBranchInfo(resBranch);
            const tableRow = receiptTableEl.parentElement;
            const bRow = document.createElement('div');
            bRow.className = 'info-row';
            bRow.innerHTML = `<span>BRANCH</span><span id="receipt-branch-id" style="font-weight:bold;">${bInfo.name}</span>`;
            tableRow.parentElement.insertBefore(bRow, tableRow);

            const centerPs = document.querySelectorAll('#receipt-capture-area .center p');
            if (centerPs.length >= 2) {
                centerPs[1].innerHTML = `${bInfo.address}<br>Tel: ${bInfo.tel}`;
            }
        }

        // Add Branch badge to every row in SuperAdmin "All Records" table
        if (isSuperAdminPage) {
            const histTbody = document.getElementById('history-tbody');
            if (histTbody) {
                const tagRowsWithBranch = () => {
                    const allHist = JSON.parse(rawGet('reservationHistory') || '[]');
                    const map = {};
                    allHist.forEach(r => { if (r && r.reservationNumber) map[r.reservationNumber] = cloudBranchMap[r.reservationNumber] || r.branch || 'General Santos City'; });
                    histTbody.querySelectorAll('tr').forEach(tr => {
                        if (tr.dataset.branchTagged || tr.children.length < 4) return;
                        const orderCellText = (tr.children[0].innerText || '').replace(/^NEW\s*/i, '').trim();
                        const bName = map[orderCellText] || 'General Santos City';
                        const tableCell = tr.children[3];
                        if (tableCell) {
                            tr.dataset.branchTagged = 'true';
                            const badge = document.createElement('div');
                            badge.style.cssText = 'font-size:10px; font-weight:800; color:#166534; background:#dcfce7; border:1px solid #86efac; padding:2px 6px; border-radius:6px; display:inline-block; margin-top:4px;';
                            badge.textContent = '📍 ' + bName;
                            tableCell.appendChild(badge);
                        }
                    });
                };
                new MutationObserver(tagRowsWithBranch).observe(histTbody, { childList: true });
                setTimeout(tagRowsWithBranch, 800);
            }
        }

        // 5. UNIVERSAL HEADER LAYOUT FIX (index.html, admin.html, superadmin.html)
        const headerFixStyle = document.createElement('style');
        headerFixStyle.innerHTML = `
            header {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                flex-wrap: wrap !important;
                gap: 10px 16px !important;
                padding: 10px 22px !important;
                box-sizing: border-box !important;
                width: 100% !important;
                max-width: 100vw !important;
            }
            header .header-right,
            header .actions,
            header nav {
                display: flex !important;
                align-items: center !important;
                flex-wrap: wrap !important;
                gap: 8px 12px !important;
            }
            header #live-clock {
                white-space: nowrap !important;
                font-size: 12.5px !important;
                font-weight: 600 !important;
                color: rgba(255,255,255,0.92) !important;
                margin: 0 !important;
            }
            body:not(:has(#dashboard-section)) header {
                padding: 10px 24px !important;
                gap: 8px 14px !important;
            }
            body:not(:has(#dashboard-section)) header nav,
            body:not(:has(#dashboard-section)) header ul {
                display: flex !important;
                align-items: center !important;
                flex-wrap: wrap !important;
                gap: 6px 14px !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            @media (max-width: 900px) {
                header {
                    padding: 10px 14px !important;
                    gap: 8px !important;
                }
                header .header-right,
                header .actions {
                    width: 100% !important;
                    justify-content: space-between !important;
                    padding-top: 8px !important;
                    border-top: 1px solid rgba(255,255,255,0.16) !important;
                }
                header #live-clock {
                    font-size: 11px !important;
                    max-width: none !important;
                }
            }
        `;
        document.head.appendChild(headerFixStyle);

        // 6. POS TERMINAL DISCOUNT ENGINE (PWD 20%, SENIOR 20%, VOUCHER CODE)
        if (pagePath.includes('pos')) {
            window.__posActiveDiscount = { type: 'none', voucherCode: '', customOff: 0, rawSubtotal: 0, discountAmount: 0, finalTotal: 0 };

            const VOUCHER_CATALOG = {
                'ROLANDS10': { mode: 'pct', val: 10, label: '10% Off Promo' },
                'ROLANDS20': { mode: 'pct', val: 20, label: '20% Off VIP Promo' },
                'STEAK100': { mode: 'flat', val: 100, label: '₱100 Off Steak Voucher' },
                'STEAK200': { mode: 'flat', val: 200, label: '₱200 Off Dining Voucher' },
                'VIP500': { mode: 'flat', val: 500, label: '₱500 Off VIP Voucher' }
            };

            function parsePesoText(txt) {
                const n = parseFloat(String(txt || '').replace(/[^0-9.]/g, ''));
                return isNaN(n) ? 0 : n;
            }

            window.recalculatePosDiscount = function () {
                const typeSel = document.getElementById('rsh-pos-disc-type');
                const codeWrap = document.getElementById('rsh-pos-voucher-wrap');
                const codeInput = document.getElementById('rsh-pos-voucher-code');
                const customInput = document.getElementById('rsh-pos-voucher-amt');
                const summaryBox = document.getElementById('rsh-pos-disc-summary');
                if (!typeSel) return;

                const discType = typeSel.value || 'none';
                if (codeWrap) codeWrap.style.display = discType === 'voucher' ? 'flex' : 'none';

                const subEl = document.getElementById('pos-subtotal') || document.getElementById('cart-subtotal') || document.getElementById('pos-total') || document.getElementById('cart-total') || document.querySelector('.pos-total-amount, .total-amount, #total-amount');
                let rawSubtotal = 0;
                if (Array.isArray(window.posCart) && window.posCart.length > 0) {
                    rawSubtotal = window.posCart.reduce((s, i) => s + (Number(i.price || 0) * Number(i.qty || i.quantity || 1)), 0);
                } else if (subEl) {
                    rawSubtotal = parsePesoText(subEl.dataset.rawSubtotal || subEl.textContent);
                    if (!window.__posDiscountAppliedToDom) subEl.dataset.rawSubtotal = String(rawSubtotal);
                    else if (subEl.dataset.rawSubtotal) rawSubtotal = Number(subEl.dataset.rawSubtotal);
                }

                let discountAmt = 0;
                let voucherCode = '';

                if (discType === 'senior' || discType === 'pwd') {
                    discountAmt = Math.round(rawSubtotal * 0.20 * 100) / 100;
                    voucherCode = (codeInput?.value || '').trim();
                } else if (discType === 'voucher') {
                    voucherCode = (codeInput?.value || '').trim().toUpperCase();
                    const customVal = Number(customInput?.value || 0);
                    if (customVal > 0) {
                        discountAmt = customVal <= 100 && voucherCode.endsWith('%')
                            ? (rawSubtotal * (customVal / 100))
                            : customVal;
                    } else if (VOUCHER_CATALOG[voucherCode]) {
                        const v = VOUCHER_CATALOG[voucherCode];
                        discountAmt = v.mode === 'pct' ? (rawSubtotal * (v.val / 100)) : v.val;
                    }
                    discountAmt = Math.min(rawSubtotal, Math.round(discountAmt * 100) / 100);
                }

                const finalTotal = Math.max(0, Math.round((rawSubtotal - discountAmt) * 100) / 100);
                window.__posActiveDiscount = {
                    type: discType,
                    voucherCode,
                    rawSubtotal,
                    discountAmount: discountAmt,
                    finalTotal
                };

                window.posDiscountType = discType;
                window.posDiscountAmount = discountAmt;

                if (summaryBox) {
                    if (discType === 'none' || discountAmt <= 0) {
                        summaryBox.style.display = 'none';
                    } else {
                        summaryBox.style.display = 'block';
                        const badgeLabel = discType === 'senior' ? 'SENIOR 20% OFF' : (discType === 'pwd' ? 'PWD 20% OFF' : `VOUCHER (${voucherCode || 'PROMO'})`);
                        summaryBox.innerHTML = `
                            <div style="display:flex; justify-content:space-between; font-size:12px; color:#64748b;">
                                <span>Original Subtotal:</span><span>₱${rawSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:12.5px; font-weight:800; color:#c2410c; margin-top:2px;">
                                <span>🏷️ ${badgeLabel}:</span><span>-₱${discountAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:14px; font-weight:900; color:#15803d; margin-top:4px; padding-top:4px; border-top:1px dashed #cbd5e1;">
                                <span>Discounted Total:</span><span>₱${finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        `;
                    }
                }
            };

            function injectPosDiscountControls() {
                if (document.getElementById('rsh-pos-disc-type')) return;
                const existingSelect = document.querySelector('select[id*="discount"], select[onchange*="Discount"], select[onchange*="discount"]');
                if (existingSelect) {
                    if (!Array.from(existingSelect.options).some(o => o.value === 'voucher')) {
                        const opt = document.createElement('option');
                        opt.value = 'voucher';
                        opt.textContent = '🎟️ Promo Voucher Code';
                        existingSelect.appendChild(opt);
                    }
                    return;
                }

                const targetContainer = document.querySelector('.cart-summary, .pos-summary, .order-summary, .checkout-section, .cart-footer')
                    || (document.getElementById('pos-total') && document.getElementById('pos-total').parentElement?.parentElement);
                if (!targetContainer) return;

                const box = document.createElement('div');
                box.id = 'rsh-pos-discount-box';
                box.style.cssText = 'background:#f8fafc; border:1.5px solid #cbd5e1; border-radius:10px; padding:10px 12px; margin:10px 0;';
                box.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
                        <label for="rsh-pos-disc-type" style="font-size:11.5px; font-weight:800; color:#334155; text-transform:uppercase;">🏷️ Discount / Voucher:</label>
                        <select id="rsh-pos-disc-type" onchange="window.recalculatePosDiscount()" style="flex:1; padding:6px 8px; border-radius:6px; border:1px solid #cbd5e1; background:white; font-weight:700; font-size:12px; color:#0f172a; cursor:pointer;">
                            <option value="none">No Discount (Regular)</option>
                            <option value="senior">👵 Senior Citizen (20% Off)</option>
                            <option value="pwd">♿ PWD Discount (20% Off)</option>
                            <option value="voucher">🎟️ Promo Voucher</option>
                        </select>
                    </div>
                    <div id="rsh-pos-voucher-wrap" style="display:none; gap:6px; margin-top:6px;">
                        <input type="text" id="rsh-pos-voucher-code" oninput="window.recalculatePosDiscount()" placeholder="Code (e.g. ROLANDS10, STEAK100)" style="flex:1.3; padding:6px 8px; border:1px solid #cbd5e1; border-radius:6px; font-size:12px; text-transform:uppercase;">
                        <input type="number" id="rsh-pos-voucher-amt" oninput="window.recalculatePosDiscount()" placeholder="Or ₱ Off" min="0" style="flex:0.8; padding:6px 8px; border:1px solid #cbd5e1; border-radius:6px; font-size:12px;">
                    </div>
                    <div id="rsh-pos-disc-summary" style="display:none; margin-top:8px; padding-top:6px; border-top:1px solid #e2e8f0;"></div>
                `;
                targetContainer.insertBefore(box, targetContainer.firstChild);
                setInterval(window.recalculatePosDiscount, 800);
            }

            setTimeout(injectPosDiscountControls, 500);
        }
    });

    // ============================================================================
    // 🎟️ ROLAND'S VOUCHER & DISCOUNT ELIGIBILITY ENGINE (POS, PRE-ORDER, ADMIN & MANAGER)
    // ============================================================================
    const DEFAULT_VOUCHERS = [
        {
            code: 'ROLANDS10',
            title: '10% Off Dining Promo',
            discountMode: 'pct', // 'pct' or 'flat'
            value: 10,
            minSpend: 1000,
            minQty: 1,
            requiredCategory: 'ANY',
            expiryDate: '',
            active: true
        },
        {
            code: 'STEAK100',
            title: '₱100 Off Steak Lover Voucher',
            discountMode: 'flat',
            value: 100,
            minSpend: 700,
            minQty: 1,
            requiredCategory: 'Beef',
            expiryDate: '',
            active: true
        },
        {
            code: 'VIP500',
            title: '₱500 Off Family / Feast Voucher',
            discountMode: 'flat',
            value: 500,
            minSpend: 3000,
            minQty: 3,
            requiredCategory: 'ANY',
            expiryDate: '',
            active: true
        }
    ];

    window.VoucherSystem = {
        getTargetBranch: function () {
            const domSel = isSuperAdminPage && typeof document !== 'undefined' ? document.getElementById('superadmin-promo-branch-select') : null;
            if (domSel && domSel.value) return domSel.value;
            if (isSuperAdminPage && window.__promoBranchOverride) return window.__promoBranchOverride;
            if (isSuperAdminPage && window.getCurrentBranch && window.getCurrentBranch() === 'ALL') return 'ALL';
            return window.getEffectiveBranch ? window.getEffectiveBranch() : 'General Santos City';
        },

        _getStorageKey: function (branchName) {
            const b = (!branchName || branchName === 'ALL' || branchName === 'General Santos City') ? 'General Santos City' : branchName;
            return b === 'General Santos City' ? 'vouchers' : `${b}__vouchers`;
        },

        getVouchers: function (branchOverride) {
            try {
                const rawTarget = branchOverride || this.getTargetBranch();
                const key = this._getStorageKey(rawTarget);
                const raw = rawGet(key);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) return parsed;
                }
                const seeded = JSON.parse(JSON.stringify(DEFAULT_VOUCHERS));
                safeRawSet(key, JSON.stringify(seeded));
                return seeded;
            } catch (e) { }
            return JSON.parse(JSON.stringify(DEFAULT_VOUCHERS));
        },

        saveVouchers: async function (list, branchOverride) {
            const cleanList = Array.isArray(list) ? list : [];
            const target = branchOverride || this.getTargetBranch();
            const targets = target === 'ALL' ? BRANCHES.map(b => b.name) : [target];
            const payload = JSON.stringify(cleanList);

            await Promise.all(targets.map(async (b) => {
                safeRawSet(this._getStorageKey(b), payload);
                try {
                    await origFetch(`https://rolands-steakhouse-jsoo.onrender.com/api/memory/vouchers?branch=${encodeURIComponent(b)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ branch: b, vouchers: cleanList })
                    });
                } catch (e) { }
            }));

            window.dispatchEvent(new CustomEvent('vouchersUpdated', { detail: cleanList }));
            if (typeof window.renderPromoAdManager === 'function') window.renderPromoAdManager();
            return cleanList;
        },

        pullFromCloud: async function (branchOverride) {
            try {
                const rawTarget = branchOverride || this.getTargetBranch();
                const readBranch = (!rawTarget || rawTarget === 'ALL') ? 'General Santos City' : rawTarget;
                const res = await origFetch(`https://rolands-steakhouse-jsoo.onrender.com/api/memory/vouchers?branch=${encodeURIComponent(readBranch)}&nocache=${Date.now()}`);
                if (res.ok) {
                    const cloudList = await res.json();
                    if (Array.isArray(cloudList)) {
                        const key = this._getStorageKey(readBranch);
                        const prev = rawGet(key);
                        const next = JSON.stringify(cloudList);
                        if (prev !== next) {
                            safeRawSet(key, next);
                            window.dispatchEvent(new CustomEvent('vouchersUpdated', { detail: cloudList }));
                            if (typeof window.renderVoucherAdminManager === 'function') window.renderVoucherAdminManager();
                            if (typeof window.renderPromoAdManager === 'function') window.renderPromoAdManager();
                        }
                    }
                }
            } catch (e) { }
        },

        // Validates a voucher code against current cart items and subtotal
        // cartItemsArray: [{ id, title, category, price, qty }]
        validateVoucher: function (code, subtotal, cartItemsArray) {
            const cleanCode = String(code || '').trim().toUpperCase();
            if (!cleanCode) {
                return { valid: false, discountAmount: 0, reason: 'Please select or enter a voucher code.' };
            }

            const all = this.getVouchers();
            const v = all.find(x => String(x.code || '').toUpperCase() === cleanCode);
            if (!v) {
                return { valid: false, discountAmount: 0, reason: `Voucher "${cleanCode}" does not exist.` };
            }
            if (v.active === false) {
                return { valid: false, discountAmount: 0, reason: `Voucher "${cleanCode}" is currently inactive.` };
            }

            // 1. Check Expiry Date
            if (v.expiryDate) {
                const exp = new Date(v.expiryDate + 'T23:59:59');
                if (!isNaN(exp.getTime()) && Date.now() > exp.getTime()) {
                    return { valid: false, discountAmount: 0, reason: `Voucher "${cleanCode}" expired on ${v.expiryDate}.` };
                }
            }

            // 2. Check Minimum Spend
            const minSpend = Number(v.minSpend) || 0;
            if (subtotal < minSpend) {
                const diff = minSpend - subtotal;
                return {
                    valid: false,
                    discountAmount: 0,
                    reason: `Requires ₱${minSpend.toLocaleString()} minimum order (Add ₱${diff.toLocaleString()} more).`,
                    voucher: v
                };
            }

            // 3. Check Minimum Item Quantity
            const items = Array.isArray(cartItemsArray) ? cartItemsArray : [];
            const totalQty = items.reduce((s, i) => s + (Number(i.qty || i.quantity) || 1), 0);
            const minQty = Number(v.minQty) || 1;
            if (totalQty < minQty) {
                return {
                    valid: false,
                    discountAmount: 0,
                    reason: `Requires at least ${minQty} item(s) in your order (Currently ${totalQty}).`,
                    voucher: v
                };
            }

            // 4. Check Required Category
            const reqCat = String(v.requiredCategory || 'ANY').trim();
            if (reqCat && reqCat !== 'ANY') {
                const hasCat = items.some(i => String(i.category || '').toLowerCase() === reqCat.toLowerCase());
                if (!hasCat) {
                    return {
                        valid: false,
                        discountAmount: 0,
                        reason: `Requires at least 1 "${reqCat}" item in your cart.`,
                        voucher: v
                    };
                }
            }

            // Compute discount amount
            let discAmt = 0;
            if (v.discountMode === 'pct') {
                discAmt = subtotal * ((Number(v.value) || 0) / 100);
            } else {
                discAmt = Number(v.value) || 0;
            }
            discAmt = Math.min(subtotal, Math.round(discAmt * 100) / 100);

            return {
                valid: true,
                discountAmount: discAmt,
                voucher: v,
                label: `${v.code} (${v.discountMode === 'pct' ? v.value + '% OFF' : '₱' + v.value + ' OFF'})`,
                reason: 'Eligible! Discount applied.'
            };
        },

        formatRequirementSummary: function (v) {
            if (!v) return '';
            const parts = [];
            if (Number(v.minSpend) > 0) parts.push(`Min. spend ₱${Number(v.minSpend).toLocaleString()}`);
            if (Number(v.minQty) > 1) parts.push(`Min. ${v.minQty} items`);
            if (v.requiredCategory && v.requiredCategory !== 'ANY') parts.push(`Requires ${v.requiredCategory}`);
            if (v.expiryDate) parts.push(`Until ${v.expiryDate}`);
            return parts.length ? parts.join(' • ') : 'No minimum requirements';
        }
    };

    // Pull latest vouchers on load & every 20s
    setTimeout(() => window.VoucherSystem.pullFromCloud(), 700);
    setInterval(() => window.VoucherSystem.pullFromCloud(), 20000);

    // Inject Modifiable Voucher Manager into Admin (Promotions tab) & SuperAdmin (Branding/Promos or Inventory)
    window.renderVoucherAdminManager = function () {
        const targets = [
            document.getElementById('voucher-manager-mount'),
            document.getElementById('superadmin-voucher-mount')
        ].filter(Boolean);
        if (targets.length === 0) return;

        const vouchers = window.VoucherSystem.getVouchers();

        const html = `
            <div class="card" style="margin-top:24px; border:1.5px solid #bbf7d0; background:#ffffff; border-radius:14px; padding:22px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:16px; border-bottom:1px solid #e2e8f0; padding-bottom:12px;">
                    <div>
                        <h3 style="margin:0; font-family:'Playfair Display',serif; color:#1b5e20; font-size:20px;">🎟️ Voucher & Eligibility Rules Manager</h3>
                        <p style="margin:4px 0 0; font-size:12.5px; color:#64748b;">Create and modify promo vouchers with custom eligibility rules for both <b>Customer Pre-Order</b> and <b>POS Terminal</b>.</p>
                    </div>
                    <span style="background:#dcfce7; color:#166534; font-weight:800; font-size:11.5px; padding:4px 12px; border-radius:20px;">${vouchers.length} Configured</span>
                </div>

                <!-- Create / Update Voucher Form -->
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:20px;">
                    <div style="font-size:12px; font-weight:800; color:#1b5e20; text-transform:uppercase; margin-bottom:10px;" id="vch-form-heading">+ Create or Modify Voucher</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:12px; margin-bottom:12px;">
                        <div>
                            <label style="display:block; font-size:11px; font-weight:800; color:#475569; margin-bottom:4px;">VOUCHER CODE *</label>
                            <input type="text" id="vch-code" placeholder="e.g. STEAK200" style="width:100%; padding:9px 11px; border:1px solid #cbd5e1; border-radius:8px; font-weight:800; text-transform:uppercase; box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="display:block; font-size:11px; font-weight:800; color:#475569; margin-bottom:4px;">PROMO TITLE *</label>
                            <input type="text" id="vch-title" placeholder="e.g. ₱200 Off Steak Night" style="width:100%; padding:9px 11px; border:1px solid #cbd5e1; border-radius:8px; box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="display:block; font-size:11px; font-weight:800; color:#475569; margin-bottom:4px;">DISCOUNT TYPE</label>
                            <select id="vch-mode" style="width:100%; padding:9px 11px; border:1px solid #cbd5e1; border-radius:8px; background:white; font-weight:700; box-sizing:border-box;">
                                <option value="flat">Fixed Amount (₱ Off)</option>
                                <option value="pct">Percentage (% Off)</option>
                            </select>
                        </div>
                        <div>
                            <label style="display:block; font-size:11px; font-weight:800; color:#475569; margin-bottom:4px;">DISCOUNT VALUE *</label>
                            <input type="number" id="vch-val" placeholder="e.g. 200 or 10" min="1" step="any" style="width:100%; padding:9px 11px; border:1px solid #cbd5e1; border-radius:8px; font-weight:700; box-sizing:border-box;">
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:12px; margin-bottom:14px;">
                        <div>
                            <label style="display:block; font-size:11px; font-weight:800; color:#475569; margin-bottom:4px;">MIN. SPEND REQUIRED (₱)</label>
                            <input type="number" id="vch-min-spend" placeholder="0 (No minimum)" min="0" value="0" style="width:100%; padding:9px 11px; border:1px solid #cbd5e1; border-radius:8px; box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="display:block; font-size:11px; font-weight:800; color:#475569; margin-bottom:4px;">MIN. ITEMS IN CART</label>
                            <input type="number" id="vch-min-qty" placeholder="1" min="1" value="1" style="width:100%; padding:9px 11px; border:1px solid #cbd5e1; border-radius:8px; box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="display:block; font-size:11px; font-weight:800; color:#475569; margin-bottom:4px;">REQUIRED FOOD CATEGORY</label>
                            <select id="vch-req-cat" style="width:100%; padding:9px 11px; border:1px solid #cbd5e1; border-radius:8px; background:white; box-sizing:border-box;">
                                <option value="ANY">Any Menu Category</option>
                                <option value="Beef">🥩 Beef Steaks</option>
                                <option value="T-Bone">🦴 T-Bone</option>
                                <option value="Sirloin Steak">🥩 Sirloin Steak</option>
                                <option value="Chicken & Fish">🍗 Chicken & Fish</option>
                                <option value="Sandwich">🍔 Sandwich</option>
                                <option value="Side Orders">🍟 Side Orders</option>
                                <option value="Drinks">🍹 Drinks</option>
                                <option value="Wines">🍷 Wines</option>
                            </select>
                        </div>
                        <div>
                            <label style="display:block; font-size:11px; font-weight:800; color:#475569; margin-bottom:4px;">EXPIRY DATE (OPTIONAL)</label>
                            <input type="date" id="vch-expiry" style="width:100%; padding:9px 11px; border:1px solid #cbd5e1; border-radius:8px; box-sizing:border-box;">
                        </div>
                    </div>

                    <div style="display:flex; gap:10px; justify-content:flex-end;">
                        <button type="button" onclick="window.clearVoucherForm()" style="padding:9px 16px; border-radius:8px; border:1px solid #cbd5e1; background:white; color:#475569; font-weight:700; font-size:12.5px; cursor:pointer;">Clear</button>
                        <button type="button" onclick="window.saveVoucherFromForm()" style="padding:9px 20px; border-radius:8px; border:none; background:#16a34a; color:white; font-weight:800; font-size:13px; cursor:pointer; box-shadow:0 4px 10px rgba(22,163,74,0.25);">💾 Save Voucher & Sync</button>
                    </div>
                </div>

                <!-- Active Vouchers Table -->
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left;">
                        <thead>
                            <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0; color:#475569;">
                                <th style="padding:10px;">Code</th>
                                <th style="padding:10px;">Title</th>
                                <th style="padding:10px;">Discount</th>
                                <th style="padding:10px;">Eligibility Requirements</th>
                                <th style="padding:10px;">Status</th>
                                <th style="padding:10px; text-align:right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${vouchers.length === 0 ? `<tr><td colspan="6" style="padding:20px; text-align:center; color:#94a3b8;">No vouchers configured.</td></tr>` : vouchers.map(v => `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:10px;"><span style="background:#f0fdf4; border:1px solid #86efac; color:#166534; font-weight:900; padding:4px 8px; border-radius:6px; font-family:monospace;">${v.code}</span></td>
                                    <td style="padding:10px; font-weight:700; color:#0f172a;">${v.title || v.code}</td>
                                    <td style="padding:10px; font-weight:800; color:#15803d;">${v.discountMode === 'pct' ? v.value + '% OFF' : '₱' + Number(v.value).toLocaleString() + ' OFF'}</td>
                                    <td style="padding:10px; font-size:12px; color:#475569;">${window.VoucherSystem.formatRequirementSummary(v)}</td>
                                    <td style="padding:10px;">
                                        <span style="background:${v.active !== false ? '#dcfce7' : '#fee2e2'}; color:${v.active !== false ? '#166534' : '#991b1b'}; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:800;">
                                            ${v.active !== false ? '🟢 ACTIVE' : '🔴 DISABLED'}
                                        </span>
                                    </td>
                                    <td style="padding:10px; text-align:right;">
                                        <div style="display:inline-flex; gap:6px;">
                                            <button type="button" onclick="window.editVoucherInForm('${v.code}')" style="background:#e0f2fe; color:#0369a1; border:1px solid #7dd3fc; padding:5px 10px; border-radius:6px; font-size:11px; font-weight:800; cursor:pointer;">✏️ Edit</button>
                                            <button type="button" onclick="window.toggleVoucherActive('${v.code}')" style="background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; padding:5px 10px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">${v.active !== false ? 'Disable' : 'Enable'}</button>
                                            <button type="button" onclick="window.deleteVoucherByCode('${v.code}')" style="background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; padding:5px 10px; border-radius:6px; font-size:11px; font-weight:800; cursor:pointer;">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        targets.forEach(t => { t.innerHTML = html; });
    };

    window.clearVoucherForm = function () {
        if (document.getElementById('vch-code')) document.getElementById('vch-code').value = '';
        if (document.getElementById('vch-title')) document.getElementById('vch-title').value = '';
        if (document.getElementById('vch-mode')) document.getElementById('vch-mode').value = 'flat';
        if (document.getElementById('vch-val')) document.getElementById('vch-val').value = '';
        if (document.getElementById('vch-min-spend')) document.getElementById('vch-min-spend').value = '0';
        if (document.getElementById('vch-min-qty')) document.getElementById('vch-min-qty').value = '1';
        if (document.getElementById('vch-req-cat')) document.getElementById('vch-req-cat').value = 'ANY';
        if (document.getElementById('vch-expiry')) document.getElementById('vch-expiry').value = '';
        if (document.getElementById('vch-form-heading')) document.getElementById('vch-form-heading').textContent = '+ Create or Modify Voucher';
    };

    window.editVoucherInForm = function (code) {
        const v = window.VoucherSystem.getVouchers().find(x => x.code === code);
        if (!v) return;
        if (document.getElementById('vch-code')) document.getElementById('vch-code').value = v.code;
        if (document.getElementById('vch-title')) document.getElementById('vch-title').value = v.title || '';
        if (document.getElementById('vch-mode')) document.getElementById('vch-mode').value = v.discountMode || 'flat';
        if (document.getElementById('vch-val')) document.getElementById('vch-val').value = v.value || 0;
        if (document.getElementById('vch-min-spend')) document.getElementById('vch-min-spend').value = v.minSpend || 0;
        if (document.getElementById('vch-min-qty')) document.getElementById('vch-min-qty').value = v.minQty || 1;
        if (document.getElementById('vch-req-cat')) document.getElementById('vch-req-cat').value = v.requiredCategory || 'ANY';
        if (document.getElementById('vch-expiry')) document.getElementById('vch-expiry').value = v.expiryDate || '';
        if (document.getElementById('vch-form-heading')) document.getElementById('vch-form-heading').textContent = `✏️ Editing Voucher: ${v.code}`;
    };

    window.saveVoucherFromForm = async function () {
        const code = (document.getElementById('vch-code')?.value || '').trim().toUpperCase().replace(/\s+/g, '');
        const title = (document.getElementById('vch-title')?.value || '').trim() || code;
        const discountMode = document.getElementById('vch-mode')?.value || 'flat';
        const value = parseFloat(document.getElementById('vch-val')?.value);
        const minSpend = Math.max(0, parseFloat(document.getElementById('vch-min-spend')?.value) || 0);
        const minQty = Math.max(1, parseInt(document.getElementById('vch-min-qty')?.value, 10) || 1);
        const requiredCategory = document.getElementById('vch-req-cat')?.value || 'ANY';
        const expiryDate = document.getElementById('vch-expiry')?.value || '';

        if (!code || isNaN(value) || value <= 0) {
            alert('Please enter a valid Voucher Code and a Discount Value greater than 0.');
            return;
        }
        if (discountMode === 'pct' && value > 100) {
            alert('Percentage discount cannot exceed 100%.');
            return;
        }

        const list = window.VoucherSystem.getVouchers();
        const idx = list.findIndex(x => String(x.code).toUpperCase() === code);
        const newObj = { code, title, discountMode, value, minSpend, minQty, requiredCategory, expiryDate, active: true };

        if (idx >= 0) list[idx] = { ...list[idx], ...newObj };
        else list.push(newObj);

        await window.VoucherSystem.saveVouchers(list);
        window.clearVoucherForm();
        window.renderVoucherAdminManager();
        if (window.showToast) window.showToast(`Voucher ${code} saved & synced across all terminals!`, 'success');
    };

    window.toggleVoucherActive = async function (code) {
        const list = window.VoucherSystem.getVouchers();
        const v = list.find(x => x.code === code);
        if (!v) return;
        v.active = v.active === false ? true : false;
        await window.VoucherSystem.saveVouchers(list);
        window.renderVoucherAdminManager();
    };

    window.deleteVoucherByCode = async function (code) {
        let confirmed = false;
        if (typeof window.superModal === 'function') {
            confirmed = await window.superModal({
                title: 'Delete Voucher? 🗑️',
                message: `Delete voucher <b>${code}</b> permanently?`,
                type: 'confirm',
                confirmText: 'Delete',
                cancelText: 'Cancel'
            });
        } else {
            confirmed = confirm(`Delete voucher "${code}" permanently?`);
        }
        if (!confirmed) return;
        let list = window.VoucherSystem.getVouchers().filter(x => x.code !== code);
        await window.VoucherSystem.saveVouchers(list);
        window.renderVoucherAdminManager();
        if (window.showToast) window.showToast(`Voucher ${code} deleted across branches.`, 'info');
    };

    // ============================================================================
    // 📣 MODIFIABLE CUSTOMER POP-UP ADVERTISEMENT & CROSS-DEVICE SYNC ENGINE
    // ============================================================================
    function escPromoHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function notifyPromoFeedback(message, type = 'success', title = 'Promotions') {
        if (typeof window.showToast === 'function') window.showToast(message, type);
        else if (typeof window.showNotification === 'function') window.showNotification(message, type, title);
    }

    function getLocalDateIsoStr(nowMs = Date.now()) {
        const d = new Date(nowMs);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    window.PromoAdSystem = {
        getTargetBranch: function () {
            const domSel = isSuperAdminPage && typeof document !== 'undefined' ? document.getElementById('superadmin-promo-branch-select') : null;
            if (domSel && domSel.value) return domSel.value;
            if (isSuperAdminPage && window.__promoBranchOverride) return window.__promoBranchOverride;
            if (isSuperAdminPage && window.getCurrentBranch && window.getCurrentBranch() === 'ALL') return 'ALL';
            return window.getEffectiveBranch ? window.getEffectiveBranch() : 'General Santos City';
        },

        _getStorageKey: function (branchName) {
            const b = (!branchName || branchName === 'ALL' || branchName === 'General Santos City') ? 'General Santos City' : branchName;
            return b === 'General Santos City' ? 'activePromos' : `${b}__activePromos`;
        },

        getPromos: function (branchOverride) {
            try {
                const rawTarget = branchOverride || this.getTargetBranch();
                const raw = rawGet(this._getStorageKey(rawTarget));
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) return parsed;
                }
            } catch (e) { }
            return [];
        },

        savePromos: async function (list, branchOverride) {
            const cleanList = Array.isArray(list) ? list : [];
            const target = branchOverride || this.getTargetBranch();
            const targets = target === 'ALL' ? BRANCHES.map(b => b.name) : [target];
            const payload = JSON.stringify(cleanList);

            await Promise.all(targets.map(async (b) => {
                safeRawSet(this._getStorageKey(b), payload);
                try {
                    await origFetch(`https://rolands-steakhouse-jsoo.onrender.com/api/memory/promos?branch=${encodeURIComponent(b)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: payload
                    });
                } catch (e) { }
            }));

            window.dispatchEvent(new CustomEvent('promosUpdated', { detail: cleanList }));
            if (typeof window.renderPromoAdManager === 'function') window.renderPromoAdManager();
            return cleanList;
        },

        pullFromCloud: async function (branchOverride) {
            try {
                const rawTarget = branchOverride || this.getTargetBranch();
                const readBranch = (!rawTarget || rawTarget === 'ALL') ? 'General Santos City' : rawTarget;
                const res = await origFetch(`https://rolands-steakhouse-jsoo.onrender.com/api/memory/promos?branch=${encodeURIComponent(readBranch)}&nocache=${Date.now()}`);
                if (!res.ok) return null;
                const cloudPromos = await res.json();
                if (!Array.isArray(cloudPromos)) return null;
                const key = this._getStorageKey(readBranch);
                const prev = rawGet(key);
                const next = JSON.stringify(cloudPromos);
                if (prev !== next) {
                    safeRawSet(key, next);
                    window.dispatchEvent(new CustomEvent('promosUpdated', { detail: cloudPromos }));
                    if (typeof window.renderPromoAdManager === 'function') window.renderPromoAdManager();
                }
                return cloudPromos;
            } catch (e) {
                return null;
            }
        },

        compressImageFile: function (file, maxWidth = 1000, quality = 0.82) {
            return new Promise((resolve, reject) => {
                if (!file) return reject(new Error('No file provided'));
                const reader = new FileReader();
                reader.onerror = () => reject(new Error('Could not read file'));
                reader.onload = (ev) => {
                    const dataUrl = ev.target.result;
                    if (typeof document === 'undefined' || typeof Image === 'undefined') {
                        return resolve(dataUrl);
                    }
                    const img = new Image();
                    img.onerror = () => resolve(dataUrl);
                    img.onload = () => {
                        try {
                            let w = img.width || maxWidth;
                            let h = img.height || maxWidth;
                            if (w > maxWidth) {
                                h = Math.round(h * (maxWidth / w));
                                w = maxWidth;
                            }
                            const canvas = document.createElement('canvas');
                            canvas.width = w;
                            canvas.height = h;
                            const ctx = canvas.getContext('2d');
                            if (!ctx) return resolve(dataUrl);
                            ctx.drawImage(img, 0, 0, w, h);
                            const out = canvas.toDataURL('image/jpeg', quality);
                            resolve(out && out.length < dataUrl.length ? out : dataUrl);
                        } catch (err) {
                            resolve(dataUrl);
                        }
                    };
                    img.src = dataUrl;
                };
                reader.readAsDataURL(file);
            });
        },

        pickActiveCustomerPromo: function (promos) {
            const source = promos !== undefined ? promos : this.getPromos();
            const list = (Array.isArray(source) ? source : []).filter(p => p && p.active !== false);
            if (!list.length) return null;
            return list.slice().sort((a, b) => {
                const tsA = Number(a.updatedAt) || Number(String(a.id || '').replace(/[^0-9]/g, '')) || 0;
                const tsB = Number(b.updatedAt) || Number(String(b.id || '').replace(/[^0-9]/g, '')) || 0;
                return tsB - tsA;
            })[0];
        },

        resolvePopupVouchers: function (promo, vouchersList, todayIso) {
            if (!promo || promo.showVouchers === false) return [];
            const vCode = String(promo.voucherCode || 'ALL').trim().toUpperCase();
            if (vCode === 'NONE') return [];

            const today = todayIso || getLocalDateIsoStr();
            const activeList = (Array.isArray(vouchersList) ? vouchersList : []).filter(v => {
                if (!v || !v.code || v.active === false) return false;
                if (v.expiryDate && today > String(v.expiryDate)) return false;
                return true;
            });
            if (!activeList.length) return [];

            if (!vCode || vCode === 'ALL') {
                return activeList.map(v => ({ ...v }));
            }
            const exact = activeList.find(v => String(v.code).toUpperCase() === vCode);
            return exact ? [{ ...exact, featured: true }] : [];
        },

        getPromoSignature: function (promo, resolvedVouchers) {
            if (!promo) return '';
            const vSig = (Array.isArray(resolvedVouchers) ? resolvedVouchers : [])
                .map(v => `${v.code}:${v.discountMode}:${v.value}:${v.minSpend || 0}`)
                .join('|');
            const imgLen = promo.image ? String(promo.image).length : 0;
            return `${promo.id || ''}::${promo.updatedAt || promo.publishedAt || ''}::${promo.title || ''}::${promo.desc || ''}::${promo.voucherCode || ''}::${imgLen}::${vSig}`;
        }
    };

    const promoEditorState = {
        editingId: null,
        imageData: '',
        removedImage: false
    };

    function buildPromoVoucherSelectHtml(selectedCode) {
        const activeVouchers = window.VoucherSystem.getVouchers().filter(v => v && v.active !== false);
        const sel = String(selectedCode || 'ALL').toUpperCase();
        const opts = [
            `<option value="ALL" ${sel === 'ALL' ? 'selected' : ''}>🎟️ Include All Active Vouchers (${activeVouchers.length})</option>`
        ];
        activeVouchers.forEach(v => {
            const dTxt = v.discountMode === 'pct' ? `${v.value}% OFF` : `₱${Number(v.value).toLocaleString()} OFF`;
            opts.push(`<option value="${escPromoHtml(v.code)}" ${sel === String(v.code).toUpperCase() ? 'selected' : ''}>🎯 Only ${escPromoHtml(v.code)} — ${dTxt} (${escPromoHtml(v.title || v.code)})</option>`);
        });
        opts.push(`<option value="NONE" ${sel === 'NONE' ? 'selected' : ''}>🚫 Hide Vouchers on This Pop-up</option>`);
        return opts.join('');
    }

    function renderPromoListIntoMounts(promos) {
        const activeTop = window.PromoAdSystem.pickActiveCustomerPromo(promos);
        const vouchers = window.VoucherSystem.getVouchers();
        const cardsHtml = promos.length === 0
            ? `<div style="grid-column:1/-1; background:#f8fafc; border:1.5px dashed #cbd5e1; border-radius:12px; padding:32px; text-align:center; color:#64748b; font-size:13.5px;">No pop-up advertisements published yet. Create one above to show it live to customers!</div>`
            : promos.map(p => {
                const isLiveTop = activeTop && p.id === activeTop.id;
                const isPaused = p.active === false;
                const statusBadge = isPaused
                    ? `<span style="background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; font-size:10.5px; font-weight:800; padding:3px 9px; border-radius:20px;">⏸️ PAUSED</span>`
                    : (isLiveTop
                        ? `<span style="background:#dcfce7; color:#166534; border:1px solid #86efac; font-size:10.5px; font-weight:800; padding:3px 9px; border-radius:20px;">🟢 LIVE ON CUSTOMER SITE</span>`
                        : `<span style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; font-size:10.5px; font-weight:800; padding:3px 9px; border-radius:20px;">✅ ACTIVE</span>`);
                const vList = window.PromoAdSystem.resolvePopupVouchers(p, vouchers);
                const voucherSummary = vList.length
                    ? `🎟️ ${vList.map(v => escPromoHtml(v.code)).join(', ')}`
                    : (String(p.voucherCode || '').toUpperCase() === 'NONE' ? 'No voucher attached' : 'No active vouchers matched');
                const imgBlock = p.image
                    ? `<img src="${escPromoHtml(p.image)}" alt="${escPromoHtml(p.title || 'Promo')}" style="width:100%; height:150px; object-fit:cover; border-radius:10px; margin-bottom:10px; border:1px solid #e2e8f0;">`
                    : `<div style="width:100%; height:90px; border-radius:10px; background:linear-gradient(135deg,#f0fdf4,#ecfdf5); border:1px dashed #86efac; display:flex; align-items:center; justify-content:center; color:#166534; font-size:12px; font-weight:700; margin-bottom:10px;">📝 Text & Voucher Pop-up (No Picture)</div>`;

                return `
                    <div class="card" style="padding:15px; border:1.5px solid ${isLiveTop ? '#86efac' : '#e2e8f0'}; border-radius:14px; display:flex; flex-direction:column; justify-content:space-between; background:white;">
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:10px; flex-wrap:wrap;">
                                ${statusBadge}
                                <span style="font-size:11px; color:#94a3b8; font-weight:600;">${escPromoHtml(p.publishedAt || '')}</span>
                            </div>
                            ${imgBlock}
                            <div style="font-weight:800; font-size:16px; color:#1b5e20; margin-bottom:6px;">${escPromoHtml(p.title || 'Special Offer')}</div>
                            <div style="font-size:13px; color:#475569; margin-bottom:10px; line-height:1.45;">${escPromoHtml(p.desc || '')}</div>
                            <div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:7px 10px; font-size:11.5px; font-weight:700; color:#334155; margin-bottom:12px;">${voucherSummary}</div>
                        </div>
                        <div style="display:flex; gap:6px; flex-wrap:wrap;">
                            <button type="button" onclick="window.editPromoAd('${escPromoHtml(p.id)}')" style="flex:1; min-width:70px; background:#e0f2fe; color:#0369a1; border:1px solid #7dd3fc; padding:7px 8px; border-radius:8px; font-size:11.5px; font-weight:800; cursor:pointer;">✏️ Modify</button>
                            <button type="button" onclick="window.togglePromoAdActive('${escPromoHtml(p.id)}')" style="flex:1; min-width:70px; background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; padding:7px 8px; border-radius:8px; font-size:11.5px; font-weight:700; cursor:pointer;">${isPaused ? '▶️ Activate' : '⏸️ Pause'}</button>
                            <button type="button" onclick="window.openPromoPreviewModal('${escPromoHtml(p.id)}')" style="background:#f0fdf4; color:#166534; border:1px solid #86efac; padding:7px 10px; border-radius:8px; font-size:11.5px; font-weight:800; cursor:pointer;" title="Preview Customer Pop-up">👁️</button>
                            <button type="button" onclick="window.deletePromoAd('${escPromoHtml(p.id)}')" style="background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; padding:7px 10px; border-radius:8px; font-size:11.5px; font-weight:800; cursor:pointer;" title="Delete Promo">🗑️</button>
                        </div>
                    </div>
                `;
            }).join('');

        document.querySelectorAll('.rsh-promo-list-grid').forEach(el => {
            el.innerHTML = cardsHtml;
        });
        document.querySelectorAll('.rsh-promo-count-badge').forEach(el => {
            el.textContent = `${promos.length} Pop-up Ad${promos.length === 1 ? '' : 's'}`;
        });
    }

    function updatePromoPreviewThumb() {
        const imgEl = document.getElementById('rsh-promo-preview-img');
        const clearBtn = document.getElementById('rsh-promo-clear-img-btn');
        const hintEl = document.getElementById('rsh-promo-img-hint');
        if (!imgEl) return;
        if (promoEditorState.imageData) {
            imgEl.src = promoEditorState.imageData;
            imgEl.style.display = 'inline-block';
            if (clearBtn) clearBtn.style.display = 'inline-flex';
            if (hintEl) hintEl.textContent = promoEditorState.editingId ? 'Current picture attached (upload to replace or remove below)' : 'Picture ready for pop-up ad';
        } else {
            imgEl.src = '';
            imgEl.style.display = 'none';
            if (clearBtn) clearBtn.style.display = 'none';
            if (hintEl) hintEl.textContent = 'Click to upload a promo banner picture (PNG / JPG / WebP)';
        }
    }

    window.renderPromoAdManager = function () {
        const mount = document.getElementById('superadmin-promo-mount') || document.getElementById('admin-promo-mount');
        if (!mount) return;

        const promos = window.PromoAdSystem.getPromos();
        const voucherOptsHtml = buildPromoVoucherSelectHtml(
            document.getElementById('rsh-promo-voucher-select')?.value || 'ALL'
        );

        // If editor shell already exists, update only list + voucher dropdown without disrupting typing
        if (mount.querySelector('#rsh-promo-editor-card')) {
            const vSel = document.getElementById('rsh-promo-voucher-select');
            if (vSel) {
                const curVal = vSel.value || 'ALL';
                vSel.innerHTML = buildPromoVoucherSelectHtml(curVal);
            }
            renderPromoListIntoMounts(promos);
            return;
        }

        mount.innerHTML = `
            <div id="rsh-promo-editor-card" class="card" style="margin-bottom:24px; border:1.5px solid #bbf7d0; background:#ffffff; border-radius:14px; padding:22px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:16px; border-bottom:1px solid #e2e8f0; padding-bottom:12px;">
                    <div>
                        <h3 id="rsh-promo-form-heading" style="margin:0; font-family:'Playfair Display',serif; color:#1b5e20; font-size:20px;">+ Create or Modify Pop-up Advertisement</h3>
                        <p style="margin:4px 0 0; font-size:12.5px; color:#64748b;">Shown automatically on the customer homepage with picture, title, description, vouchers, <b>Maybe Later</b> and <b>Reserve Now!</b> buttons.</p>
                    </div>
                    <span class="rsh-promo-count-badge" style="background:#dcfce7; color:#166534; font-weight:800; font-size:11.5px; padding:4px 12px; border-radius:20px;">0 Pop-up Ads</span>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; margin-bottom:14px;">
                    <div>
                        <label style="display:block; font-size:11.5px; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:5px;">Promo Title *</label>
                        <input type="text" id="rsh-promo-title" placeholder="e.g. Weekend Wagyu & Steak Special" style="width:100%; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:14px; box-sizing:border-box;">
                    </div>
                    <div>
                        <label style="display:block; font-size:11.5px; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:5px;">Voucher Shown in Pop-up</label>
                        <select id="rsh-promo-voucher-select" style="width:100%; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px; background:white; font-size:13.5px; font-weight:700; box-sizing:border-box;">
                            ${voucherOptsHtml}
                        </select>
                    </div>
                </div>

                <div style="margin-bottom:14px;">
                    <label style="display:block; font-size:11.5px; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:5px;">Advertisement Description *</label>
                    <textarea id="rsh-promo-desc" rows="2" placeholder="e.g. Enjoy 10% off your dining reservation + claim an exclusive voucher below!" style="width:100%; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:14px; box-sizing:border-box; resize:vertical; font-family:inherit;"></textarea>
                </div>

                <div style="margin-bottom:16px;">
                    <label style="display:block; font-size:11.5px; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:6px;">Advertisement Picture (Modifiable)</label>
                    <div onclick="document.getElementById('rsh-promo-upload-input').click()" style="border:2px dashed #bbf7d0; border-radius:10px; padding:18px; text-align:center; cursor:pointer; background:#f0fdf4;">
                        <div style="font-size:24px; margin-bottom:4px;">🖼️</div>
                        <div id="rsh-promo-img-hint" style="font-size:13.5px; color:#166534; font-weight:700;">Click to upload a promo banner picture (PNG / JPG / WebP)</div>
                        <input type="file" id="rsh-promo-upload-input" accept="image/*" style="display:none;" onchange="window.handlePromoAdImageChange(this)">
                    </div>
                    <div style="display:flex; align-items:flex-end; gap:12px; flex-wrap:wrap; margin-top:10px;">
                        <img id="rsh-promo-preview-img" src="" alt="Promo Preview" style="display:none; max-height:160px; max-width:100%; border-radius:10px; border:1px solid #cbd5e1;">
                        <button type="button" id="rsh-promo-clear-img-btn" onclick="window.clearPromoAdImage()" style="display:none; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; border:1px solid #fca5a5; background:#fee2e2; color:#dc2626; font-size:12px; font-weight:700; cursor:pointer;">🗑️ Remove Picture</button>
                    </div>
                </div>

                <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;">
                    <button type="button" onclick="window.openPromoPreviewModal()" style="padding:10px 16px; border-radius:8px; border:1px solid #86efac; background:#f0fdf4; color:#166534; font-weight:800; font-size:13px; cursor:pointer;">👁️ Preview Customer Pop-up</button>
                    <button type="button" id="rsh-promo-cancel-edit-btn" onclick="window.resetPromoAdForm()" style="display:none; padding:10px 16px; border-radius:8px; border:1px solid #cbd5e1; background:white; color:#475569; font-weight:700; font-size:13px; cursor:pointer;">Cancel Edit</button>
                    <button type="button" id="rsh-promo-save-btn" onclick="window.savePromoAdFromForm()" style="padding:10px 22px; border-radius:8px; border:none; background:#16a34a; color:white; font-weight:800; font-size:13.5px; cursor:pointer; box-shadow:0 4px 10px rgba(22,163,74,0.25);">🚀 Publish Pop-up & Sync</button>
                </div>
            </div>

            <div class="card" style="border:1px solid #e2e8f0; border-radius:14px; padding:20px; background:white;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
                    <h3 style="margin:0; color:#1b5e20; font-size:16px; text-transform:uppercase; letter-spacing:0.5px;">Published Pop-up Advertisements</h3>
                    <span style="font-size:12px; color:#64748b; font-weight:600;">Most recently published / updated active ad shows first</span>
                </div>
                <div class="rsh-promo-list-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:16px;"></div>
            </div>
        `;

        renderPromoListIntoMounts(promos);
    };

    window.handlePromoAdImageChange = async function (input) {
        const file = input && input.files && input.files[0];
        if (!file) return;
        try {
            promoEditorState.imageData = await window.PromoAdSystem.compressImageFile(file, 1000, 0.82);
            promoEditorState.removedImage = false;
            updatePromoPreviewThumb();
        } catch (err) {
            notifyPromoFeedback('Could not load image file.', 'error', 'Image Error');
        }
    };

    window.clearPromoAdImage = function () {
        promoEditorState.imageData = '';
        promoEditorState.removedImage = true;
        const fileInput = document.getElementById('rsh-promo-upload-input');
        if (fileInput) fileInput.value = '';
        updatePromoPreviewThumb();
    };

    window.resetPromoAdForm = function () {
        promoEditorState.editingId = null;
        promoEditorState.imageData = '';
        promoEditorState.removedImage = false;
        if (document.getElementById('rsh-promo-title')) document.getElementById('rsh-promo-title').value = '';
        if (document.getElementById('rsh-promo-desc')) document.getElementById('rsh-promo-desc').value = '';
        if (document.getElementById('rsh-promo-voucher-select')) document.getElementById('rsh-promo-voucher-select').value = 'ALL';
        if (document.getElementById('rsh-promo-upload-input')) document.getElementById('rsh-promo-upload-input').value = '';
        if (document.getElementById('rsh-promo-form-heading')) document.getElementById('rsh-promo-form-heading').textContent = '+ Create or Modify Pop-up Advertisement';
        if (document.getElementById('rsh-promo-save-btn')) document.getElementById('rsh-promo-save-btn').textContent = '🚀 Publish Pop-up & Sync';
        if (document.getElementById('rsh-promo-cancel-edit-btn')) document.getElementById('rsh-promo-cancel-edit-btn').style.display = 'none';
        updatePromoPreviewThumb();
    };

    window.editPromoAd = function (id) {
        const promos = window.PromoAdSystem.getPromos();
        const found = promos.find(p => p && p.id === id);
        if (!found) return;
        promoEditorState.editingId = found.id;
        promoEditorState.imageData = found.image || '';
        promoEditorState.removedImage = false;
        if (document.getElementById('rsh-promo-title')) document.getElementById('rsh-promo-title').value = found.title || '';
        if (document.getElementById('rsh-promo-desc')) document.getElementById('rsh-promo-desc').value = found.desc || '';
        const vSel = document.getElementById('rsh-promo-voucher-select');
        if (vSel) {
            vSel.innerHTML = buildPromoVoucherSelectHtml(found.voucherCode || 'ALL');
            vSel.value = found.voucherCode || (found.showVouchers === false ? 'NONE' : 'ALL');
        }
        if (document.getElementById('rsh-promo-form-heading')) document.getElementById('rsh-promo-form-heading').textContent = `✏️ Modifying Pop-up: ${found.title || 'Ad'}`;
        if (document.getElementById('rsh-promo-save-btn')) document.getElementById('rsh-promo-save-btn').textContent = '💾 Save Modifications & Sync';
        if (document.getElementById('rsh-promo-cancel-edit-btn')) document.getElementById('rsh-promo-cancel-edit-btn').style.display = 'inline-flex';
        updatePromoPreviewThumb();
        document.getElementById('rsh-promo-editor-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    window.savePromoAdFromForm = async function () {
        const title = (document.getElementById('rsh-promo-title')?.value || '').trim();
        const desc = (document.getElementById('rsh-promo-desc')?.value || '').trim();
        const voucherCode = (document.getElementById('rsh-promo-voucher-select')?.value || 'ALL').trim();

        if (!title || !desc) {
            notifyPromoFeedback('Please enter both a promo title and description.', 'warning', 'Action Required');
            return;
        }

        const promos = window.PromoAdSystem.getPromos();
        const nowMs = Date.now();
        if (promoEditorState.editingId) {
            const idx = promos.findIndex(p => p && p.id === promoEditorState.editingId);
            if (idx >= 0) {
                promos[idx] = {
                    ...promos[idx],
                    title,
                    desc,
                    image: promoEditorState.removedImage ? '' : (promoEditorState.imageData || promos[idx].image || ''),
                    voucherCode,
                    showVouchers: voucherCode !== 'NONE',
                    active: true,
                    updatedAt: nowMs
                };
            }
        } else {
            promos.push({
                id: 'promo_' + nowMs,
                title,
                desc,
                image: promoEditorState.imageData || '',
                voucherCode,
                showVouchers: voucherCode !== 'NONE',
                active: true,
                publishedAt: new Date(nowMs).toLocaleDateString(),
                updatedAt: nowMs
            });
        }

        await window.PromoAdSystem.savePromos(promos);
        window.resetPromoAdForm();
        notifyPromoFeedback('Pop-up advertisement saved & synced across all devices!', 'success', 'Promo Synced');
    };

    window.togglePromoAdActive = async function (id) {
        const promos = window.PromoAdSystem.getPromos();
        const item = promos.find(p => p && p.id === id);
        if (!item) return;
        item.active = item.active === false ? true : false;
        item.updatedAt = Date.now();
        await window.PromoAdSystem.savePromos(promos);
        notifyPromoFeedback(item.active ? 'Pop-up activated across devices.' : 'Pop-up paused.', 'info', 'Promo Status');
    };

    window.deletePromoAd = async function (id) {
        let confirmed = false;
        if (typeof window.superModal === 'function') {
            confirmed = await window.superModal({
                title: 'Delete Promotion? 🗑️',
                message: 'Are you sure you want to delete this pop-up advertisement across devices?',
                type: 'confirm',
                confirmText: 'Delete',
                cancelText: 'Cancel'
            });
        } else {
            confirmed = confirm('Delete this promotion permanently?');
        }
        if (!confirmed) return;
        const nextList = window.PromoAdSystem.getPromos().filter(p => p && p.id !== id);
        await window.PromoAdSystem.savePromos(nextList);
        if (promoEditorState.editingId === id) window.resetPromoAdForm();
        notifyPromoFeedback('Promotion removed across all devices.', 'success', 'Promo Deleted');
    };

    window.openPromoPreviewModal = function (promoId) {
        const promos = window.PromoAdSystem.getPromos();
        let targetPromo = promoId ? promos.find(p => p && p.id === promoId) : null;
        if (!targetPromo) {
            const titleVal = (document.getElementById('rsh-promo-title')?.value || '').trim();
            const descVal = (document.getElementById('rsh-promo-desc')?.value || '').trim();
            const vVal = document.getElementById('rsh-promo-voucher-select')?.value || 'ALL';
            targetPromo = {
                title: titleVal || 'Special Dining Offer',
                desc: descVal || 'Reserve your table today and enjoy exclusive steakhouse privileges.',
                image: promoEditorState.imageData || '',
                voucherCode: vVal,
                showVouchers: vVal !== 'NONE'
            };
        }

        const matchedVouchers = window.PromoAdSystem.resolvePopupVouchers(targetPromo, window.VoucherSystem.getVouchers());
        const vouchersHtml = matchedVouchers.length
            ? `<div style="margin:14px 0 18px; padding:12px; background:#f0fdf4; border:1.5px dashed #86efac; border-radius:12px; text-align:left;">
                    <div style="font-size:11px; font-weight:800; color:#166534; text-transform:uppercase; margin-bottom:8px;">🎟️ Available Promo Voucher${matchedVouchers.length > 1 ? 's' : ''}</div>
                    ${matchedVouchers.map(v => {
                        const dTxt = v.discountMode === 'pct' ? `${v.value}% OFF` : `₱${Number(v.value).toLocaleString()} OFF`;
                        return `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; background:white; border:1px solid #bbf7d0; border-radius:8px; padding:8px 10px; margin-bottom:6px;">
                            <div>
                                <span style="font-family:monospace; font-weight:900; color:#15803d; background:#dcfce7; padding:2px 7px; border-radius:5px; font-size:12px;">${escPromoHtml(v.code)}</span>
                                <span style="font-weight:800; color:#166534; font-size:12px; margin-left:6px;">${dTxt}</span>
                                <div style="font-size:11px; color:#64748b; margin-top:3px;">${escPromoHtml(window.VoucherSystem.formatRequirementSummary(v))}</div>
                            </div>
                        </div>`;
                    }).join('')}
               </div>`
            : '';

        let ov = document.getElementById('rsh-admin-promo-preview-overlay');
        if (!ov) {
            ov = document.createElement('div');
            ov.id = 'rsh-admin-promo-preview-overlay';
            ov.style.cssText = 'position:fixed; inset:0; z-index:99999; background:rgba(0,0,0,0.55); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:16px;';
            ov.onclick = (e) => { if (e.target === ov) ov.style.display = 'none'; };
            document.body.appendChild(ov);
        }
        ov.innerHTML = `
            <div style="width:100%; max-width:480px; background:white; border-radius:22px; overflow:hidden; box-shadow:0 25px 60px rgba(0,0,0,0.35); position:relative; max-height:92vh; overflow-y:auto;">
                <button type="button" onclick="document.getElementById('rsh-admin-promo-preview-overlay').style.display='none'" style="position:absolute; top:12px; right:12px; width:38px; height:38px; border-radius:50%; border:none; background:rgba(255,255,255,0.92); color:#1e293b; font-size:18px; font-weight:800; display:flex; align-items:center; justify-content:center; padding:0; cursor:pointer; box-shadow:0 2px 10px rgba(0,0,0,0.2);">✕</button>
                ${targetPromo.image ? `<img src="${escPromoHtml(targetPromo.image)}" style="width:100%; height:230px; object-fit:cover; display:block;" alt="Promo Preview">` : ''}
                <div style="padding:24px; text-align:center;">
                    <span style="display:inline-block; background:#dcfce7; color:#166534; font-size:10.5px; font-weight:800; padding:3px 10px; border-radius:20px; text-transform:uppercase; margin-bottom:8px;">Customer Preview</span>
                    <h2 style="font-family:'Playfair Display',serif; font-size:25px; color:#1b5e20; margin:0 0 10px;">${escPromoHtml(targetPromo.title || 'Special Offer')}</h2>
                    <p style="color:#64748b; line-height:1.55; margin:0 0 14px; font-size:14.5px;">${escPromoHtml(targetPromo.desc || '')}</p>
                    ${vouchersHtml}
                    <div style="display:flex; gap:12px; margin-top:16px;">
                        <button type="button" onclick="document.getElementById('rsh-admin-promo-preview-overlay').style.display='none'" style="flex:1; padding:13px; border-radius:12px; border:none; background:#f1f5f9; color:#475569; font-weight:700; font-size:14px; cursor:pointer;">Maybe Later</button>
                        <button type="button" onclick="document.getElementById('rsh-admin-promo-preview-overlay').style.display='none'" style="flex:1; padding:13px; border-radius:12px; border:none; background:#1b5e20; color:white; font-weight:800; font-size:14px; cursor:pointer;">Reserve Now!</button>
                    </div>
                </div>
            </div>
        `;
        ov.style.display = 'flex';
    };

    window.renderPromosAdmin = window.renderPromoAdManager;

    // Mount Promo Manager & Voucher Manager cleanly in Admin & SuperAdmin + sync on load
    document.addEventListener('DOMContentLoaded', () => {
        // 1. Mount in Admin Promotions Tab
        const adminPromoTab = document.getElementById('tab-promotions');
        if (adminPromoTab && isAdminPage) {
            if (document.getElementById('admin-promo-mount')) {
                window.renderPromoAdManager();
            }
            if (!document.getElementById('voucher-manager-mount')) {
                const m = document.createElement('div');
                m.id = 'voucher-manager-mount';
                adminPromoTab.appendChild(m);
            }
            window.renderVoucherAdminManager();
        }

        // 2. Mount in SuperAdmin Promotions Tab (preferred) or Branding fallback if custom layout
        const saPromoTab = document.getElementById('tab-promotions');
        if (saPromoTab && isSuperAdminPage) {
            window.renderPromoAdManager();
            window.renderVoucherAdminManager();
        } else {
            const saBrandingTab = document.getElementById('tab-branding') || document.getElementById('tab-kitchen');
            if (saBrandingTab && !document.getElementById('superadmin-voucher-mount')) {
                const m2 = document.createElement('div');
                m2.id = 'superadmin-voucher-mount';
                saBrandingTab.appendChild(m2);
                window.renderVoucherAdminManager();
            }
        }

        // Trigger fast initial promo + voucher sync on all pages
        setTimeout(() => {
            window.VoucherSystem.pullFromCloud();
            window.PromoAdSystem.pullFromCloud();
        }, 120);

        // 3. Bridge Pre-Order Discount & Mandatory ID/Voucher Photo Proof onto payment.html & reservationHistory!
        if (pagePath.includes('payment')) {
            const discType = localStorage.getItem('discountType') || 'none';
            const discAmt = parseFloat(localStorage.getItem('discountAmount') || '0') || 0;
            const discLabel = localStorage.getItem('discountLabel') || '';
            const vchCode = localStorage.getItem('voucherCode') || '';
            const discProof = localStorage.getItem('discountProofImage') || '';

            if (discType !== 'none' && discAmt > 0) {
                // Show discount row in payment.html summary if present
                const totalRow = document.getElementById('summary-total')?.parentElement || document.querySelector('.total-row');
                if (totalRow && !document.getElementById('payment-disc-row')) {
                    const dRow = document.createElement('div');
                    dRow.id = 'payment-disc-row';
                    dRow.className = 'order-row';
                    dRow.style.cssText = 'display:flex; justify-content:space-between; color:#c2410c; font-weight:800; padding:6px 0;';
                    dRow.innerHTML = `<span>🏷️ Discount (${discLabel || discType.toUpperCase()})</span><span>-₱${discAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>`;
                    totalRow.parentElement.insertBefore(dRow, totalRow);
                }

                // Ensure any reservation saved on payment.html includes the discount & uploaded ID/Voucher photo proof!
                const attachPreOrderDiscountToHistory = () => {
                    try {
                        const rawHist = rawGet('reservationHistory');
                        if (!rawHist) return;
                        const list = JSON.parse(rawHist);
                        if (!Array.isArray(list) || list.length === 0) return;
                        const newest = list[list.length - 1];
                        const newestAgeMs = newest && newest.createdAt ? (Date.now() - new Date(newest.createdAt).getTime()) : NaN;
                        if (!isNaN(newestAgeMs) && newestAgeMs >= -60000 && newestAgeMs < 30000) {
                            let changed = false;
                            if (!newest.discountType || newest.discountType === 'none') {
                                newest.discountType = discType;
                                newest.discountAmount = discAmt;
                                newest.voucherCode = vchCode;
                                changed = true;
                            }
                            if (discProof && !newest.discountProofImage) {
                                newest.discountProofImage = discProof;
                                changed = true;
                            }
                            if (changed) safeRawSet('reservationHistory', JSON.stringify(list));
                        }
                    } catch (e) { }
                };
                window.addEventListener('beforeunload', attachPreOrderDiscountToHistory);
                setInterval(attachPreOrderDiscountToHistory, 1000);
            }
        }

        // 7. AUTO-HEAL GHOST & TRIPLICATED RESERVATIONS
        window.healGhostReservationsFromCloud = async function () {
            try {
                const res = await fetch('https://rolands-steakhouse-jsoo.onrender.com/reservations?branch=ALL&nocache=' + Date.now());
                if (!res.ok) return;
                const cloudData = await res.json();

                const localStr = rawGet('reservationHistory');
                if (!localStr) return;
                const localHist = JSON.parse(localStr);

                const validSet = new Set();
                cloudData.forEach(c => {
                    if (c.reservationNumber) {
                        validSet.add(String(c.reservationNumber).trim());
                        const numericOnly = String(c.reservationNumber).replace(/[^0-9]/g, '');
                        if (numericOnly) validSet.add(numericOnly);
                    }
                });

                const now = Date.now();
                const uniqueMap = new Map();
                let mutated = false;

                localHist.forEach(r => {
                    if (!r || !r.reservationNumber) { mutated = true; return; }
                    const fullNo = String(r.reservationNumber).trim();
                    const numNo = fullNo.replace(/[^0-9]/g, '');

                    let keep = false;
                    if (validSet.has(fullNo) || (numNo && validSet.has(numNo))) {
                        keep = true;
                    } else if (r.createdAt) {
                        const createdAge = now - new Date(r.createdAt).getTime();
                        if (!isNaN(createdAge) && createdAge >= -60000 && createdAge < 10 * 60 * 1000) keep = true;
                        else mutated = true;
                    } else {
                        mutated = true;
                    }

                    // 👉 STRICT DEDUPLICATION: Only 1 record per reservation number allowed!
                    if (keep) {
                        if (!uniqueMap.has(fullNo)) {
                            uniqueMap.set(fullNo, r);
                        } else {
                            mutated = true; // Drop duplicate
                        }
                    }
                });

                if (mutated) {
                    const cleanedHist = Array.from(uniqueMap.values());
                    safeRawSet('reservationHistory', JSON.stringify(cleanedHist));
                    console.log('🧹 Purged duplicate/ghost reservations.');
                    if (typeof window.syncReservations === 'function') window.syncReservations();
                    if (typeof renderDashboard === 'function') setTimeout(renderDashboard, 300);
                }
            } catch (e) { }
        };

        setTimeout(window.healGhostReservationsFromCloud, 1000);
        setInterval(window.healGhostReservationsFromCloud, 60000);

    });
})();
