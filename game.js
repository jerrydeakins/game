const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

const app = createApp({
    setup() {
        // Состояние игры
        const stats = ref({
            money: 0,
            totalBuildings: 0,
            incomePerSecond: 0,
            cityLevel: 1,
            clickValue: 1,
            totalClicks: 0,
            passiveIncome: 0
        });

        const buildings = ref([]);
        const modifiers = ref([]);
        const achievements = ref([]);
        const unlockedAchievements = ref([]);
        const leaderboard = ref([]);
        const prestige = ref({ level: 0, multiplier: 1 });
        const cityIcons = ref([]);
        const isDarkTheme = ref(true);
        const isAnimating = ref(false);
        const saveStatus = ref('💾 Автосохранение включено');
        
        let autoSaveInterval;
        let gameLoopInterval;

        // Инициализация данных из конфига
        function initializeFromConfig() {
            if (typeof GAME_CONFIG === 'undefined') {
                console.error('GAME_CONFIG не загружен!');
                return;
            }

            // Инициализация зданий
            buildings.value = GAME_CONFIG.buildings.map(b => ({
                ...b,
                count: 0,
                type: 'building'
            }));

            // Инициализация модификаторов
            modifiers.value = [
                ...GAME_CONFIG.modifiers.click,
                ...GAME_CONFIG.modifiers.general,
                ...GAME_CONFIG.modifiers.specialty
            ].map(m => ({ ...m, purchased: false }));

            // Инициализация достижений
            achievements.value = GAME_CONFIG.achievements.map(a => ({ ...a }));

            // Инициализация престижа
            prestige.value = { level: 0, multiplier: 1 };
        }

        // Текст интерфейса
        const subtitleText = computed(() => {
            if (prestige.value.level > 0) {
                return `Престиж: ${prestige.value.level} | Множитель: ${prestige.value.multiplier.toFixed(2)}x`;
            }
            return 'Постройте империю и станьте магнатом!';
        });

        const clickHintText = computed(() => {
            if (stats.value.incomePerSecond > 0) {
                return `Пассивный доход: +${formatNumber(stats.value.incomePerSecond)}/сек`;
            }
            return 'Нажимайте, чтобы заработать первые деньги';
        });

        // Форматирование чисел
        function formatNumber(num) {
            if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
            if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
            return Math.floor(num);
        }

        // Получение иконки для статистики
        function getStatIcon(key) {
            const icons = { money: '💰', totalBuildings: '🏢', incomePerSecond: '💵', cityLevel: '🏆', clickValue: '⚡' };
            return icons[key] || '?';
        }

        // Получение значения статистики
        function getStatValue(key) {
            return stats.value[key] || 0;
        }

        // Получение label для статистики
        function getStatLabel(key) {
            const labels = { money: 'Деньги', totalBuildings: 'Здания', incomePerSecond: 'Доход/сек', cityLevel: 'Уровень', clickValue: 'Клик' };
            return labels[key] || key;
        }

        // Расчет стоимости здания
        function getBuildingCost(building) {
            let cost = building.baseCost * Math.pow(GAME_CONFIG.balance.buildingCostGrowth, building.count);
            if (prestige.value.level > 0) {
                cost = cost * prestige.value.multiplier;
            }
            return Math.floor(cost);
        }

        // Проверка доступности покупки
        function canAfford(item) {
            if (item.purchased && item.id && !item.baseCost) return false;
            const cost = item.baseCost ? getBuildingCost(item) : item.cost;
            return stats.value.money >= cost;
        }

        // Обработка клика по главной кнопке
        function handleClick() {
            isAnimating.value = true;
            stats.value.money += stats.value.clickValue;
            stats.value.totalClicks++;
            createParticleEffect();
            checkAchievements();
            updateStats();
            setTimeout(() => { isAnimating.value = false; }, 100);
        }

        // Эффект частиц при клике
        function createParticleEffect() {
            const button = document.querySelector('.main-button');
            if (!button) return;
            const rect = button.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            for (let i = 0; i < 5; i++) {
                setTimeout(() => createParticle(centerX, centerY), i * 30);
            }
        }

        function createParticle(x, y) {
            const particle = document.createElement('div');
            particle.style.cssText = `position:fixed;width:12px;height:12px;background:#FFD700;border-radius:50%;pointer-events:none;left:${x}px;top:${y}px;z-index:9999;font-weight:bold;font-size:10px;line-height:12px;text-align:center;`;
            particle.textContent = '+';
            document.body.appendChild(particle);
            
            const angle = Math.PI * 2 * Math.random();
            const velocity = 50 + Math.random() * 100;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            let opacity = 1;
            function animate() {
                const currentX = parseFloat(particle.style.left);
                const currentY = parseFloat(particle.style.top);
                particle.style.left = (currentX + vx / 60) + 'px';
                particle.style.top = (currentY + vy / 60) + 'px';
                opacity -= 0.03;
                particle.style.opacity = opacity;
                if (opacity > 0) requestAnimationFrame(animate);
                else particle.remove();
            }
            animate();
        }

        // Покупка здания
        function buyBuilding(index) {
            const building = buildings.value[index];
            const cost = getBuildingCost(building);
            if (stats.value.money >= cost) {
                stats.value.money -= cost;
                building.count++;
                showNotification(`🏗️ ${building.name} построено!`);
                addCityIcon(building.icon);
                recalculateStats();
                checkAchievements();
                updateUI();
            } else {
                showNotification('❌ Недостаточно средств!', 'error');
            }
        }

        // Покупка модификатора
        function buyModifier(index) {
            const modifier = modifiers.value[index];
            if (!modifier || modifier.purchased) return;
            if (stats.value.money >= modifier.cost) {
                stats.value.money -= modifier.cost;
                modifier.purchased = true;
                showNotification(`⚡ ${modifier.name} активирован!`);
                recalculateStats();
                checkAchievements();
                updateUI();
            } else {
                showNotification('❌ Недостаточно средств!', 'error');
            }
        }

        // Пересчет статистики
        function recalculateStats() {
            let baseIncome = buildings.value.reduce((total, building) => {
                let buildingIncome = building.baseIncome * building.count;
                
                // Применяем специальные бустеры
                const specialBoosts = {
                    'bakery': 'bakery_boost',
                    'shop': 'shop_upgrade',
                    'factory': 'industrial_boom',
                    'skyscraper': 'architectural_marvel'
                };
                
                if (specialBoosts[building.id]) {
                    const boost = modifiers.value.find(m => m.id === specialBoosts[building.id] && m.purchased);
                    if (boost) {
                        buildingIncome *= 2; // 100% бонус
                    }
                }
                
                return total + buildingIncome;
            }, 0);
            
            // Применяем глобальные бустеры
            let multiplier = 1;
            modifiers.value.forEach(m => {
                if (m.purchased) {
                    if (m.id === 'efficiency_boost') multiplier *= 1.2;
                    if (m.id === 'marketing') multiplier *= 1.3;
                    if (m.id === 'technology') multiplier *= 1.5;
                }
            });
            
            stats.value.incomePerSecond = baseIncome * multiplier;
            
            // Расчет силы клика
            let clickBase = 1;
            modifiers.value.forEach(m => {
                if (m.purchased) {
                    if (m.id === 'click_boost_1') clickBase += 1;
                    if (m.id === 'click_boost_2') clickBase += 5;
                    if (m.id === 'click_boost_3') clickBase += 20;
                }
            });
            
            const incomeBonus = Math.floor(stats.value.incomePerSecond * GAME_CONFIG.balance.clickIncomePercent);
            stats.value.clickValue = (clickBase + incomeBonus) * prestige.value.multiplier;
        }

        // Добавление иконки в город
        function addCityIcon(icon) {
            if (cityIcons.value.length < GAME_CONFIG.balance.maxCityIcons) {
                cityIcons.value.push(icon);
            } else {
                cityIcons.value.shift();
                cityIcons.value.push(icon);
            }
        }

        // Расчет порога уровня
        function getLevelThreshold() {
            return stats.value.cityLevel * 10000;
        }

        // Вычисление прогресса
        function getProgressPercentage() {
            const current = stats.value.money % getLevelThreshold();
            const threshold = getLevelThreshold();
            return Math.min(100, Math.max(0, (current / threshold) * 100));
        }

        // Уведомление
        function showNotification(message, type = 'success') {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: type === 'error' ? 'error' : 'success',
                    title: type === 'error' ? '❌ Ошибка!' : '✅ Успех!',
                    text: message,
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        }

        // Система достижений
        function checkAchievements() {
            achievements.value.forEach(achievement => {
                if (unlockedAchievements.value.includes(achievement.id)) return;

                let unlocked = false;
                switch(achievement.id) {
                    case 'first_click':
                        unlocked = stats.value.totalClicks >= 1;
                        break;
                    case 'first_building':
                        unlocked = buildings.value.some(b => b.count > 0);
                        break;
                    case 'ten_buildings':
                        unlocked = buildings.value.reduce((sum, b) => sum + b.count, 0) >= 10;
                        break;
                    case 'millionaire':
                        unlocked = stats.value.money >= 1000000;
                        break;
                    case 'city_master':
                        unlocked = buildings.value.reduce((sum, b) => sum + b.count, 0) >= 50;
                        break;
                    case 'billionaire':
                        unlocked = stats.value.money >= 1000000000;
                        break;
                    case 'all_buildings':
                        unlocked = buildings.value.every(b => b.count > 0);
                        break;
                    case 'passive_income_1k':
                        unlocked = stats.value.incomePerSecond >= 1000;
                        break;
                    case 'prestige_1':
                        unlocked = prestige.value.level >= 1;
                        break;
                    case 'all_modifiers':
                        unlocked = modifiers.value.every(m => m.purchased);
                        break;
                    case 'lazy_millionaire':
                        unlocked = stats.value.passiveIncome >= 1000000;
                        break;
                }

                if (unlocked) {
                    unlockedAchievements.value.push(achievement.id);
                    stats.value.money += achievement.reward;
                    showNotification(`🎯 Достижение разблокировано: ${achievement.name}! +${achievement.reward}💰`);
                }
            });
        }

        function isAchievementUnlocked(id) {
            return unlockedAchievements.value.includes(id);
        }

        // Система престижа
        function activatePrestige() {
            if (stats.value.money < GAME_CONFIG.prestige.threshold) return;
            if (prestige.value.level >= GAME_CONFIG.prestige.maxLevel) return;

            Swal.fire({
                title: '✨ Активировать престиж?',
                text: `Текущий уровень: ${prestige.value.level}\nНовый множитель: ${(prestige.value.multiplier * GAME_CONFIG.prestige.multiplier).toFixed(2)}x`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Да, перезагрузиться!',
                cancelButtonText: 'Отмена'
            }).then((result) => {
                if (result.isConfirmed) {
                    prestige.value.level++;
                    prestige.value.multiplier *= GAME_CONFIG.prestige.multiplier;
                    
                    // Сброс прогресса
                    stats.value.money = 0;
                    stats.value.passiveIncome = 0;
                    buildings.value.forEach(b => b.count = 0);
                    modifiers.value.forEach(m => m.purchased = false);
                    cityIcons.value = [];
                    
                    recalculateStats();
                    saveGame();
                    showNotification(`🌟 Престиж активирован! Уровень: ${prestige.value.level}`);
                }
            });
        }

        // Таблица лидеров
        function updateLeaderboard() {
            const entry = {
                money: stats.value.money,
                buildings: buildings.value.reduce((sum, b) => sum + b.count, 0),
                prestige: prestige.value.level,
                timestamp: new Date().getTime()
            };
            
            let lb = JSON.parse(localStorage.getItem('leaderboard') || '[]');
            lb.push(entry);
            lb.sort((a, b) => b.money - a.money);
            lb = lb.slice(0, 10);
            localStorage.setItem('leaderboard', JSON.stringify(lb));
            leaderboard.value = lb;
        }

        function showLeaderboard() {
            updateLeaderboard();
            let html = '<table style="width:100%;text-align:left;"><tr><th>#</th><th>💰</th><th>🏢</th><th>✨</th></tr>';
            leaderboard.value.forEach((entry, i) => {
                html += `<tr><td>${i+1}</td><td>${formatNumber(entry.money)}</td><td>${entry.buildings}</td><td>${entry.prestige}</td></tr>`;
            });
            html += '</table>';
            
            Swal.fire({
                title: '🏆 Таблица лидеров',
                html: html,
                icon: 'info'
            });
        }

        // Справка
        function showHelp() {
            Swal.fire({
                title: '📖 Справка',
                html: `
                    <div style="text-align:left;">
                        <p><b>🖱️ Клик:</b> Пробел для клика</p>
                        <p><b>🏢 Здания:</b> Клавиши 1-9 для покупки</p>
                        <p><b>⚡ Модификаторы:</b> Усиливают доход</p>
                        <p><b>✨ Престиж:</b> Перезагрузка с бонусом</p>
                        <p><b>🎯 Достижения:</b> Получайте награды</p>
                        <p><b>🌙 Тема:</b> Нажмите кнопку в углу</p>
                    </div>
                `,
                icon: 'info'
            });
        }

        // Импорт/экспорт
        function exportSave() {
            const saveData = {
                stats: stats.value,
                buildings: buildings.value,
                modifiers: modifiers.value,
                achievements: unlockedAchievements.value,
                prestige: prestige.value,
                cityIcons: cityIcons.value
            };
            
            const dataStr = JSON.stringify(saveData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `game-save-${Date.now()}.json`;
            link.click();
            showNotification('✅ Сохранение экспортировано!');
        }

        function importSave() {
            const input = document.getElementById('saveFileInput');
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const saveData = JSON.parse(event.target.result);
                        Object.assign(stats.value, saveData.stats);
                        buildings.value = saveData.buildings || buildings.value;
                        modifiers.value = saveData.modifiers || modifiers.value;
                        unlockedAchievements.value = saveData.achievements || [];
                        prestige.value = saveData.prestige || { level: 0, multiplier: 1 };
                        cityIcons.value = saveData.cityIcons || [];
                        
                        recalculateStats();
                        saveGame();
                        showNotification('✅ Сохранение загружено!');
                    } catch (err) {
                        showNotification('❌ Ошибка при загрузке!', 'error');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        }

        // Автосохранение
        function saveGame() {
            updateLeaderboard();
            const gameData = {
                stats: stats.value,
                buildings: buildings.value,
                modifiers: modifiers.value,
                achievements: unlockedAchievements.value,
                prestige: prestige.value,
                cityIcons: cityIcons.value
            };
            localStorage.setItem('gameClickerSave', JSON.stringify(gameData));
            saveStatus.value = '✅ Сохранено';
            setTimeout(() => { saveStatus.value = '💾 Автосохранение'; }, 2000);
        }

        function loadGame() {
            const saved = localStorage.getItem('gameClickerSave');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    Object.assign(stats.value, data.stats);
                    buildings.value = data.buildings || buildings.value;
                    modifiers.value = data.modifiers || modifiers.value;
                    unlockedAchievements.value = data.achievements || [];
                    prestige.value = data.prestige || { level: 0, multiplier: 1 };
                    cityIcons.value = data.cityIcons || [];
                    recalculateStats();
                } catch (e) {
                    console.error('Ошибка загрузки:', e);
                }
            }
        }

        function resetGame() {
            Swal.fire({
                title: '⚠️ Сброс?',
                text: 'Весь прогресс будет удален!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Сбросить',
                cancelButtonText: 'Отмена'
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem('gameClickerSave');
                    location.reload();
                }
            });
        }

        // Переключение темы
        function toggleTheme() {
            isDarkTheme.value = !isDarkTheme.value;
            document.body.classList.toggle('light-theme');
            localStorage.setItem('theme', isDarkTheme.value ? 'dark' : 'light');
        }

        // Игровой цикл
        function gameLoop() {
            if (stats.value.incomePerSecond > 0) {
                const gain = stats.value.incomePerSecond / 10;
                stats.value.money += gain;
                stats.value.passiveIncome += gain;
                updateStats();
                
                const levelThreshold = getLevelThreshold();
                if (stats.value.money >= levelThreshold && stats.value.cityLevel < 10) {
                    stats.value.cityLevel++;
                    showNotification(`🏆 Уровень города: ${stats.value.cityLevel}!`);
                }
            }
        }

        function updateStats() {
            stats.value.totalBuildings = buildings.value.reduce((sum, b) => sum + b.count, 0);
        }

        // Обработка клавиш
        function handleKeyPress(e) {
            if (e.code === 'Space') {
                e.preventDefault();
                handleClick();
            } else if (e.key >= '1' && e.key <= '9') {
                const index = parseInt(e.key) - 1;
                if (index < buildings.value.length) {
                    buyBuilding(index);
                }
            }
        }

        // Вычисляемые свойства
        const clickModifiers = computed(() => modifiers.value.filter(m => ['click_boost_1', 'click_boost_2', 'click_boost_3'].includes(m.id)));
        const generalModifiers = computed(() => modifiers.value.filter(m => ['efficiency_boost', 'marketing', 'technology'].includes(m.id)));
        const specialtyModifiers = computed(() => modifiers.value.filter(m => ['bakery_boost', 'shop_upgrade', 'industrial_boom', 'architectural_marvel'].includes(m.id)));

        // Инициализация
        onMounted(() => {
            initializeFromConfig();
            loadGame();
            
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light') {
                isDarkTheme.value = false;
                document.body.classList.add('light-theme');
            }
            
            window.addEventListener('keydown', handleKeyPress);
            autoSaveInterval = setInterval(saveGame, GAME_CONFIG.balance.autoSaveInterval);
            gameLoopInterval = setInterval(gameLoop, GAME_CONFIG.balance.gameLoopInterval);
        });

        onUnmounted(() => {
            window.removeEventListener('keydown', handleKeyPress);
            if (autoSaveInterval) clearInterval(autoSaveInterval);
            if (gameLoopInterval) clearInterval(gameLoopInterval);
        });

        return {
            stats, buildings, modifiers, achievements, leaderboard, prestige, cityIcons,
            isDarkTheme, isAnimating, saveStatus, subtitleText, clickHintText,
            clickModifiers, generalModifiers, specialtyModifiers,
            unlockedAchievements,
            formatNumber, getBuildingCost, canAfford, handleClick, buyBuilding, buyModifier,
            getStatIcon, getStatValue, getStatLabel, getLevelThreshold, getProgressPercentage,
            isAchievementUnlocked, activatePrestige, showLeaderboard, showHelp,
            exportSave, importSave, resetGame, toggleTheme
        };
    }
}).mount('#app');
