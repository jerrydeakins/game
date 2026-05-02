// Инициализация приложения Vue.js
const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

createApp({
    setup() {
        // Состояние игры
        const stats = ref({
            money: 0,
            totalBuildings: 0,
            incomePerSecond: 0,
            cityLevel: 1,
            clickValue: 1
        });

        const buildings = ref([
            { id: 'stall', name: 'Ларек с лимонадом', icon: '🍋', baseCost: 15, baseIncome: 0.5, count: 0 },
            { id: 'bakery', name: 'Пекарня', icon: '🥖', baseCost: 100, baseIncome: 3, count: 0 },
            { id: 'shop', name: 'Магазин', icon: '🏪', baseCost: 500, baseIncome: 8, count: 0 },
            { id: 'office', name: 'Офисное здание', icon: '🏢', baseCost: 2000, baseIncome: 15, count: 0 },
            { id: 'factory', name: 'Фабрика', icon: '🏭', baseCost: 8000, baseIncome: 40, count: 0 },
            { id: 'skyscraper', name: 'Небоскреб', icon: '🏙️', baseCost: 50000, baseIncome: 120, count: 0 }
        ]);

        const modifiers = ref([
            { id: 'efficiency_boost', name: 'Эффективность труда', description: '+20% ко всему доходу', icon: '⚡', cost: 500, purchased: false },
            { id: 'marketing', name: 'Маркетинг', description: '+30% ко всему доходу', icon: '📢', cost: 2000, purchased: false },
            { id: 'technology', name: 'Технологии', description: '+50% ко всему доходу', icon: '💻', cost: 10000, purchased: false },
            { id: 'bakery_boost', name: 'Свежая выпечка', description: '+100% доход от пекарни', icon: '🥐', cost: 300, purchased: false },
            { id: 'shop_upgrade', name: 'Розничная сеть', description: '+150% доход от магазинов', icon: '🛍️', cost: 1500, purchased: false }
        ]);

        const cityIcons = ref([]);
        const isAnimating = ref(false);
        const saveStatus = ref('💾 Автосохранение включено');
        
        let autoSaveInterval;
        let gameLoopInterval;

        // Текст интерфейса
        const subtitleText = computed(() => {
            return stats.value.cityLevel === 1 ? 'Постройте империю и станьте магнатом!' : `Уровень города: ${stats.value.cityLevel}`;
        });

        const clickHintText = computed(() => {
            if (stats.value.incomePerSecond > 0) {
                return 'Кликайте для быстрого заработка!';
            }
            return 'Нажимайте, чтобы заработать первые деньги';
        });

        // Форматирование чисел
        function formatNumber(num) {
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
            if (key === 'money') return stats.value.money;
            if (key === 'totalBuildings') return stats.value.totalBuildings;
            if (key === 'incomePerSecond') return stats.value.incomePerSecond;
            if (key === 'cityLevel') return stats.value.cityLevel;
            if (key === 'clickValue') return stats.value.clickValue;
            return 0;
        }

        // Получение label для статистики
        function getStatLabel(key) {
            const labels = { money: 'Деньги', totalBuildings: 'Здания', incomePerSecond: 'Доход/сек', cityLevel: 'Уровень', clickValue: 'Клик' };
            return labels[key] || key;
        }

        // Расчет стоимости здания
        function getBuildingCost(building) {
            return Math.floor(building.baseCost * Math.pow(1.15, building.count));
        }

        // Проверка доступности покупки
        function canAfford(item) {
            if (item.purchased && item.id !== undefined) return false;
            const cost = typeof item.cost !== 'undefined' ? item.cost : getBuildingCost(item);
            return stats.value.money >= cost;
        }

        // Обработка клика по главной кнопке
        function handleClick() {
            isAnimating.value = true;
            
            // Добавляем деньги
            stats.value.money += stats.value.clickValue;
            
            // Создаем частицы (упрощенно)
            createParticleEffect();
            
            // Обновляем UI
            updateStats();
            
            setTimeout(() => {
                isAnimating.value = false;
            }, 100);
        }

        // Эффект частиц при клике
        function createParticleEffect() {
            const button = document.querySelector('.main-button');
            if (!button) return;
            
            const rect = button.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    createParticle(centerX, centerY);
                }, i * 50);
            }
        }

        function createParticle(x, y) {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.width = '12px';
            particle.style.height = '12px';
            particle.style.background = '#FFD700';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            document.body.appendChild(particle);
            
            const angle = (Math.PI * 2 * Math.random());
            const velocity = 50 + Math.random() * 100;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            let opacity = 1;
            function animateParticle() {
                const currentX = parseFloat(particle.style.left);
                const currentY = parseFloat(particle.style.top);
                
                particle.style.left = (currentX + vx / 60) + 'px';
                particle.style.top = (currentY + vy / 60) + 'px';
                opacity -= 0.03;
                particle.style.opacity = opacity;
                
                if (opacity > 0) {
                    requestAnimationFrame(animateParticle);
                } else {
                    particle.remove();
                }
            }
            
            animateParticle();
        }

        // Покупка здания
        function buyBuilding(index) {
            const building = buildings.value[index];
            const cost = getBuildingCost(building);
            
            if (stats.value.money >= cost) {
                stats.value.money -= cost;
                building.count++;
                
                showNotification(`Вы построили ${building.name}!`);
                addCityIcon(building.icon);
                
                recalculateStats();
                updateUI();
            } else {
                showNotification('Недостаточно средств!', 'error');
            }
        }

        // Покупка модификатора
        function buyModifier(index) {
            const modifier = modifiers.value[index];
            
            if (modifier.purchased) return;
            
            if (stats.value.money >= modifier.cost) {
                stats.value.money -= modifier.cost;
                modifier.purchased = true;
                
                showNotification(`${modifier.name} активирован!`);
                
                recalculateStats();
                updateUI();
            } else {
                showNotification('Недостаточно средств!', 'error');
            }
        }

        // Пересчет статистики
        function recalculateStats() {
            let baseIncome = buildings.value.reduce((total, building) => 
                total + (building.baseIncome * building.count), 0);
            
            // Применяем глобальные бустеры
            const globalBoosts = modifiers.value.filter(m => m.purchased && ['efficiency_boost', 'marketing', 'technology'].includes(m.id));
            let multiplier = 1;
            
            globalBoosts.forEach(boost => {
                if (boost.id === 'efficiency_boost') multiplier += 0.2;
                if (boost.id === 'marketing') multiplier += 0.3;
                if (boost.id === 'technology') multiplier += 0.5;
            });
            
            // Применяем специализированные бустеры
            const specialtyBoosts = modifiers.value.filter(m => m.purchased && ['bakery_boost', 'shop_upgrade'].includes(m.id));
            
            buildings.value.forEach(building => {
                let buildingMultiplier = 1;
                
                if (building.id === 'bakery' && specialtyBoosts.find(b => b.id === 'bakery_boost')) {
                    buildingMultiplier += 1.0; // +100%
                }
                if (building.id === 'shop' && specialtyBoosts.find(b => b.id === 'shop_upgrade')) {
                    buildingMultiplier += 1.5; // +150%
                }
                
                baseIncome *= buildingMultiplier;
            });
            
            stats.value.incomePerSecond = baseIncome * multiplier;
            stats.value.clickValue = Math.floor(1 + stats.value.incomePerSecond * 0.1);
        }

        // Добавление иконки в город
        function addCityIcon(icon) {
            if (cityIcons.value.length < 20) {
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
            const current = stats.value.money % (stats.value.cityLevel * 10000);
            const threshold = getLevelThreshold();
            return Math.min(100, Math.max(0, (current / threshold) * 100));
        }

        // Цвет дохода в зависимости от типа
        function getIncomeColor(type) {
            if (type === 'global') return '#006400';
            return '#28a745';
        }

        // Обновление UI
        function updateUI() {
            updateStats();
        }

        function updateStats() {
            stats.value.totalBuildings = buildings.value.reduce((total, b) => total + b.count, 0);
            
            document.getElementById('app').querySelectorAll('.building-card').forEach(card => {
                const buildingId = card.dataset.id;
                const building = buildings.value.find(b => b.id === buildingId);
                if (building) {
                    const cost = getBuildingCost(building);
                    if (stats.value.money >= cost && !card.classList.contains('purchased')) {
                        card.classList.add('affordable');
                    } else {
                        card.classList.remove('affordable');
                    }
                }
            });
            
            document.getElementById('app').querySelectorAll('.modifier-card').forEach(card => {
                const modifierId = card.dataset.id;
                const modifier = modifiers.value.find(m => m.id === modifierId);
                if (modifier) {
                    if (stats.value.money >= modifier.cost && !modifier.purchased) {
                        card.classList.add('affordable');
                    } else {
                        card.classList.remove('affordable');
                    }
                }
            });
        }

        // Уведомление SweetAlert2
        function showNotification(message, type = 'success') {
            Swal.fire({
                icon: type === 'error' ? 'error' : 'success',
                title: type === 'error' ? 'Ошибка!' : 'Успех!',
                text: message,
                timer: 2000,
                showConfirmButton: false,
                background: '#fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'48\' fill=\'%23FFD700\'/%3E%3Ctext x=\'50\' y=\'60\' text-anchor=\'middle\' font-size=\'40\' fill=\'%23006400\'%3E🏆%3C/text%3E%3C/svg%3E")',
                color: '#006400'
            });
        }

        // Автосохранение
        function saveGame() {
            const gameData = {
                stats: stats.value,
                buildings: buildings.value,
                modifiers: modifiers.value,
                cityIcons: cityIcons.value
            };
            
            localStorage.setItem('monopolyClickerSave', JSON.stringify(gameData));
            saveStatus.value = '💾 Сохранено!';
            
            setTimeout(() => {
                saveStatus.value = '💾 Автосохранение включено';
            }, 2000);
        }

        // Загрузка игры
        function loadGame() {
            const savedData = localStorage.getItem('monopolyClickerSave');
            
            if (savedData) {
                try {
                    const gameData = JSON.parse(savedData);
                    
                    stats.value = { ...stats.value, ...gameData.stats };
                    buildings.value = gameData.buildings || buildings.value;
                    modifiers.value = gameData.modifiers || modifiers.value;
                    cityIcons.value = gameData.cityIcons || [];
                    
                    showNotification('Игра загружена! Добро пожаловать назад!', 'success');
                } catch (e) {
                    console.error('Ошибка загрузки сохранения:', e);
                }
            }
        }

        // Сброс игры
        function resetGame() {
            Swal.fire({
                title: 'Вы уверены?',
                text: "Весь прогресс будет удален!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DC143C',
                cancelButtonColor: '#888',
                confirmButtonText: 'Да, сбросить!',
                cancelButtonText: 'Отмена'
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem('monopolyClickerSave');
                    
                    stats.value = { money: 0, totalBuildings: 0, incomePerSecond: 0, cityLevel: 1, clickValue: 1 };
                    buildings.value.forEach(b => b.count = 0);
                    modifiers.value.forEach(m => m.purchased = false);
                    cityIcons.value = [];
                    
                    updateUI();
                    showNotification('Игра сброшена!');
                }
            });
        }

        // Игровой цикл (пассивный доход)
        function gameLoop() {
            if (stats.value.incomePerSecond > 0) {
                stats.value.money += stats.value.incomePerSecond / 10; // Обновляем каждые 100мс для плавности
                updateStats();
                
                // Уровень города
                const levelThreshold = getLevelThreshold();
                if (stats.value.money >= levelThreshold && stats.value.cityLevel < 10) {
                    stats.value.cityLevel++;
                    showNotification(`Уровень города повышен! Теперь уровень ${stats.value.cityLevel}!`);
                }
            }
        }

        // Инициализация при загрузке
        onMounted(() => {
            loadGame();
            
            // Автосохранение каждые 5 секунд
            autoSaveInterval = setInterval(saveGame, 5000);
            
            // Игровой цикл (обновление каждые 100мс)
            gameLoopInterval = setInterval(gameLoop, 100);
        });

        // Очистка при размонтировании
        onUnmounted(() => {
            if (autoSaveInterval) clearInterval(autoSaveInterval);
            if (gameLoopInterval) clearInterval(gameLoopInterval);
        });

        return {
            stats,
            buildings,
            modifiers,
            cityIcons,
            isAnimating,
            saveStatus,
            subtitleText,
            clickHintText,
            formatNumber,
            getBuildingCost,
            canAfford,
            handleClick,
            buyBuilding,
            buyModifier,
            resetGame,
            getLevelThreshold,
            getProgressPercentage,
            getStatIcon,
            getStatValue,
            getStatLabel,
            getIncomeColor
        };
    }
}).mount('#app');
