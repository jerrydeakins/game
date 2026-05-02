// Конфигурация игры - легко менять балансировку
const GAME_CONFIG = {
    // Начальные здания
    buildings: [
        { id: 'stall', name: 'Ларек с лимонадом', icon: '🍋', baseCost: 10, baseIncome: 1.5, description: 'Первый источник дохода' },
        { id: 'bakery', name: 'Пекарня', icon: '🥖', baseCost: 80, baseIncome: 6, description: 'Среднее производство' },
        { id: 'shop', name: 'Магазин', icon: '🏪', baseCost: 400, baseIncome: 12, description: 'Розничная торговля' },
        { id: 'office', name: 'Офисное здание', icon: '🏢', baseCost: 1500, baseIncome: 30, description: 'Услуги и консалтинг' },
        { id: 'factory', name: 'Фабрика', icon: '🏭', baseCost: 6000, baseIncome: 80, description: 'Массовое производство' },
        { id: 'skyscraper', name: 'Небоскреб', icon: '🏙️', baseCost: 40000, baseIncome: 250, description: 'Премиум недвижимость' },
        { id: 'mall', name: 'Торговый центр', icon: '🛒', baseCost: 200000, baseIncome: 600, description: 'Огромный комплекс' },
        { id: 'bank', name: 'Банк', icon: '🏦', baseCost: 500000, baseIncome: 1500, description: 'Финансовые услуги' },
        { id: 'tech_hub', name: 'Технопарк', icon: '🔬', baseCost: 1000000, baseIncome: 3000, description: 'Инновационный центр' }
    ],

    // Модификаторы
    modifiers: {
        click: [
            { id: 'click_boost_1', name: 'Сильные пальцы', description: '+$1 к доходу за клик', icon: '💪', cost: 40, reward: 50 },
            { id: 'click_boost_2', name: 'Мощный хват', description: '+$5 к доходу за клик', icon: '🔥', cost: 250, reward: 100 },
            { id: 'click_boost_3', name: 'Золотая рука', description: '+$20 к доходу за клик', icon: '✨', cost: 1200, reward: 200 }
        ],
        general: [
            { id: 'efficiency_boost', name: 'Эффективность труда', description: '+20% ко всему доходу', icon: '⚡', cost: 400, reward: 100 },
            { id: 'marketing', name: 'Маркетинг', description: '+30% ко всему доходу', icon: '📢', cost: 1600, reward: 250 },
            { id: 'technology', name: 'Технологии', description: '+50% ко всему доходу', icon: '💻', cost: 8000, reward: 500 }
        ],
        specialty: [
            { id: 'bakery_boost', name: 'Свежая выпечка', description: '+100% доход от пекарни', icon: '🥐', cost: 250, reward: 75 },
            { id: 'shop_upgrade', name: 'Розничная сеть', description: '+150% доход от магазинов', icon: '🛍️', cost: 1200, reward: 150 },
            { id: 'industrial_boom', name: 'Промышленный бум', description: '+100% доход от фабрик', icon: '⚙️', cost: 5000, reward: 300 },
            { id: 'architectural_marvel', name: 'Архитектурный шедевр', description: '+80% доход от небоскребов', icon: '🎨', cost: 35000, reward: 1000 }
        ]
    },

    // Достижения
    achievements: [
        { id: 'first_click', name: 'Первый клик', description: 'Сделайте первый клик', icon: '🖱️', reward: 50 },
        { id: 'first_building', name: 'Строитель', description: 'Постройте первое здание', icon: '🏗️', reward: 100 },
        { id: 'ten_buildings', name: 'Архитектор', description: 'Постройте 10 зданий', icon: '🏛️', reward: 500 },
        { id: 'millionaire', name: 'Миллионер', description: 'Накопите $1,000,000', icon: '💰', reward: 5000 },
        { id: 'city_master', name: 'Мастер города', description: 'Постройте 50 зданий', icon: '🏙️', reward: 2000 },
        { id: 'billionaire', name: 'Миллиардер', description: 'Накопите $1,000,000,000', icon: '👑', reward: 50000 },
        { id: 'all_buildings', name: 'Коллекционер', description: 'Постройте все типы зданий', icon: '🎯', reward: 10000 },
        { id: 'passive_income_1k', name: 'Пассивный доход', description: 'Получайте $1,000 в секунду', icon: '💵', reward: 1000 },
        { id: 'prestige_1', name: 'Начало заново', description: 'Используйте престиж один раз', icon: '🔄', reward: 5000 },
        { id: 'all_modifiers', name: 'Мастер апгрейдов', description: 'Купите все модификаторы', icon: '🎓', reward: 15000 },
        { id: 'lazy_millionaire', name: 'Ленивый миллионер', description: 'Получить $1M от пассивного дохода', icon: '😴', reward: 2000 }
    ],

    // Престиж система
    prestige: {
        multiplier: 1.1,
        threshold: 10000000,
        maxLevel: 100
    },

    // Балансировка
    balance: {
        buildingCostGrowth: 1.15,
        clickIncomePercent: 0.1,
        autoSaveInterval: 5000,
        gameLoopInterval: 100,
        maxCityIcons: 20
    }
};