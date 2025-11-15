// Простое локальное хранилище на localStorage пока
// Потом переделаем на IndexedDB

class FamilyHealthDB {
    constructor() {
        this.dbName = 'AfyaFamilia';
        this.initDB();
    }

    initDB() {
        // Проверяем есть ли уже данные
        if (!localStorage.getItem(this.dbName)) {
            const initialData = {
                families: [],
                members: [],
                chronicConditions: [],
                acuteEpisodes: [],
                monitoringRecords: []
            };
            localStorage.setItem(this.dbName, JSON.stringify(initialData));
        }
    }

    // Получить все данные
    getData() {
        return JSON.parse(localStorage.getItem(this.dbName));
    }

    // Сохранить данные
    saveData(data) {
        localStorage.setItem(this.dbName, JSON.stringify(data));
    }

    // Добавить хроническое заболевание
    addChronicCondition(condition) {
        const data = this.getData();
        condition.id = 'chronic_' + Date.now();
        condition.createdAt = new Date().toISOString();
        data.chronicConditions.push(condition);
        this.saveData(data);
        return condition.id;
    }

    // Получить хронические заболевания члена семьи
    getChronicConditions(memberId) {
        const data = this.getData();
        return data.chronicConditions.filter(c => c.memberId === memberId);
    }
    // Добавьте эти методы в класс FamilyHealthDB:

// Сохранить запись дневника питания
addFoodDiary(entry) {
    const data = this.getData();
    if (!data.foodDiaries) {
        data.foodDiaries = [];
    }
    entry.id = 'diary_' + Date.now();
    data.foodDiaries.push(entry);
    this.saveData(data);
    return entry.id;
}

// Получить записи дневника для ребенка
getFoodDiaries(childId, daysBack = 30) {
    const data = this.getData();
    if (!data.foodDiaries) return [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    return data.foodDiaries
        .filter(entry => entry.childId === childId && new Date(entry.date) >= cutoffDate)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Сохранить план элиминации
saveEliminationPlan(plan) {
    const data = this.getData();
    if (!data.eliminationPlans) {
        data.eliminationPlans = [];
    }
    plan.id = 'plan_' + Date.now();
    plan.createdAt = new Date().toISOString();
    data.eliminationPlans.push(plan);
    this.saveData(data);
    return plan.id;
}
}

// Создаем глобальный объект БД
window.familyDB = new FamilyHealthDB();
