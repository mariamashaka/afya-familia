// Анализатор пищевых аллергий
class AllergyAnalyzer {
    constructor() {
        this.historyDays = 30; // Анализируем последние 30 дней
        this.minOccurrences = 2; // Минимум 2 раза для подозрения
        this.confidenceThreshold = 0.6; // 60% для подозрения
    }

    // Анализировать все записи и найти паттерны
    analyzeAllergies(foodDiaryEntries) {
        const suspiciousFoods = new Map();
        const safeFoods = new Set();
        
        // Собрать все дни с реакциями
        const reactionDays = foodDiaryEntries.filter(day => day.reactions && day.reactions.length > 0);
        
        // Собрать все дни без реакций
        const safeDays = foodDiaryEntries.filter(day => !day.reactions || day.reactions.length === 0);
        
        // Подсчитать частоту продуктов в дни с реакциями
        reactionDays.forEach(day => {
            day.foods.forEach(food => {
                const foodName = this.normalizeFood(food.name);
                
                if (!suspiciousFoods.has(foodName)) {
                    suspiciousFoods.set(foodName, {
                        name: foodName,
                        reactionCount: 0,
                        totalCount: 0,
                        reactions: [],
                        severity: []
                    });
                }
                
                const foodData = suspiciousFoods.get(foodName);
                foodData.reactionCount++;
                foodData.reactions.push(...day.reactions);
                if (day.severity) foodData.severity.push(day.severity);
            });
        });
        
        // Подсчитать общую частоту всех продуктов
        foodDiaryEntries.forEach(day => {
            day.foods.forEach(food => {
                const foodName = this.normalizeFood(food.name);
                if (suspiciousFoods.has(foodName)) {
                    suspiciousFoods.get(foodName).totalCount++;
                }
            });
        });
        
        // Вычислить уверенность для каждого продукта
        const analysis = [];
        suspiciousFoods.forEach((data, foodName) => {
            const confidence = data.reactionCount / data.totalCount;
            
            if (confidence >= this.confidenceThreshold && data.reactionCount >= this.minOccurrences) {
                analysis.push({
                    food: foodName,
                    confidence: Math.round(confidence * 100),
                    reactionCount: data.reactionCount,
                    totalCount: data.totalCount,
                    commonReactions: this.getMostCommon(data.reactions),
                    maxSeverity: this.getMaxSeverity(data.severity),
                    recommendation: this.getRecommendation(confidence, data.severity)
                });
            }
        });
        
        // Сортировать по уверенности
        analysis.sort((a, b) => b.confidence - a.confidence);
        
        // Найти безопасные продукты (ели много раз без реакций)
        safeDays.forEach(day => {
            day.foods.forEach(food => {
                const foodName = this.normalizeFood(food.name);
                if (!suspiciousFoods.has(foodName)) {
                    safeFoods.add(foodName);
                }
            });
        });
        
        return {
            suspicious: analysis,
            safe: Array.from(safeFoods),
            reactionDaysCount: reactionDays.length,
            totalDaysCount: foodDiaryEntries.length
        };
    }
    
    // Нормализовать название продукта
    normalizeFood(name) {
        return name.toLowerCase().trim();
    }
    
    // Найти самые частые реакции
    getMostCommon(reactions) {
        const counts = {};
        reactions.forEach(r => {
            counts[r] = (counts[r] || 0) + 1;
        });
        
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([reaction]) => reaction);
    }
    
    // Получить максимальную степень тяжести
    getMaxSeverity(severities) {
        if (severities.includes('severe')) return 'severe';
        if (severities.includes('moderate')) return 'moderate';
        if (severities.includes('mild')) return 'mild';
        return null;
    }
    
    // Дать рекомендацию
    getRecommendation(confidence, severities) {
        const maxSeverity = this.getMaxSeverity(severities);
        
        if (maxSeverity === 'severe' || confidence > 0.9) {
            return {
                action: 'eliminate',
                duration: '4 wiki', // 4 недели
                reintroduction: 'Hospitalini tu!',
                priority: 'high'
            };
        } else if (confidence > 0.7) {
            return {
                action: 'eliminate', 
                duration: '2 wiki',
                reintroduction: 'Pole pole, anza na kiasi kidogo',
                priority: 'medium'
            };
        } else {
            return {
                action: 'monitor',
                duration: 'Endelea kufuatilia',
                reintroduction: 'Jaribu tena baada ya wiki 1',
                priority: 'low'
            };
        }
    }
    
    // Создать план элиминации
    createEliminationPlan(suspiciousFoods) {
        const plan = [];
        const startDate = new Date();
        
        // Сортировать по приоритету
        const sorted = suspiciousFoods.sort((a, b) => {
            const priorityOrder = {high: 0, medium: 1, low: 2};
            return priorityOrder[a.recommendation.priority] - priorityOrder[b.recommendation.priority];
        });
        
        let currentDate = new Date(startDate);
        
        sorted.forEach(item => {
            const duration = parseInt(item.recommendation.duration) || 2;
            const endDate = new Date(currentDate);
            endDate.setDate(endDate.getDate() + (duration * 7)); // недели в дни
            
            plan.push({
                food: item.food,
                startDate: new Date(currentDate),
                endDate: endDate,
                status: 'pending',
                reintroductionProtocol: this.getReintroductionProtocol(item)
            });
            
            // Следующий продукт начинаем после окончания текущего
            currentDate = new Date(endDate);
            currentDate.setDate(currentDate.getDate() + 3); // 3 дня перерыв
        });
        
        return plan;
    }
    
    // Протокол повторного введения
    getReintroductionProtocol(item) {
        if (item.maxSeverity === 'severe') {
            return {
                location: 'Hospitali',
                steps: [
                    {day: 1, amount: 'Tone kidogo tu (1/8 kijiko)', wait: 'Saa 2'},
                    {day: 2, amount: 'Kijiko 1/4', wait: 'Saa 4'},
                    {day: 3, amount: 'Kijiko 1/2', wait: 'Siku 1'}
                ]
            };
        }
        
        // Для молочных продуктов особый протокол
        if (item.food.includes('maziwa') || item.food.includes('milk')) {
            return {
                location: 'Nyumbani',
                steps: [
                    {day: 1, amount: 'Yogurt kijiko 1', wait: 'Siku 3'},
                    {day: 4, amount: 'Kefir kijiko 2', wait: 'Siku 3'},
                    {day: 7, amount: 'Maziwa fresh ml 30', wait: 'Siku 3'},
                    {day: 10, amount: 'Maziwa kiasi cha kawaida', wait: 'Siku 3'}
                ]
            };
        }
        
        // Стандартный протокол
        return {
            location: 'Nyumbani',
            steps: [
                {day: 1, amount: 'Kijiko 1/4', wait: 'Siku 3'},
                {day: 4, amount: 'Kijiko 1/2', wait: 'Siku 3'}, 
                {day: 7, amount: 'Kijiko 1', wait: 'Siku 3'},
                {day: 10, amount: 'Kiasi cha kawaida', wait: 'Fuatilia'}
            ]
        };
    }
}

// Экспорт для использования
window.AllergyAnalyzer = AllergyAnalyzer;
