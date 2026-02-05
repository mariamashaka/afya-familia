// sickle-cell-manager.js
// Manages sickle cell patient data using IndexedDB
// Works with window.familyDB for basic patient info

class SickleCellManager {
    constructor() {
        this.dbName = 'SickleCellDB';
        this.dbVersion = 1;
        this.db = null;
    }

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Lab Results Store
                if (!db.objectStoreNames.contains('labResults')) {
                    const labStore = db.createObjectStore('labResults', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    labStore.createIndex('memberId', 'memberId', { unique: false });
                    labStore.createIndex('date', 'date', { unique: false });
                    labStore.createIndex('testType', 'testType', { unique: false });
                }

                // Medications Store
                if (!db.objectStoreNames.contains('medications')) {
                    const medStore = db.createObjectStore('medications', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    medStore.createIndex('memberId', 'memberId', { unique: false });
                    medStore.createIndex('active', 'active', { unique: false });
                }

                // Transfusions Store
                if (!db.objectStoreNames.contains('transfusions')) {
                    const transStore = db.createObjectStore('transfusions', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    transStore.createIndex('memberId', 'memberId', { unique: false });
                    transStore.createIndex('date', 'date', { unique: false });
                }

                // Hospitalizations Store
                if (!db.objectStoreNames.contains('hospitalizations')) {
                    const hospStore = db.createObjectStore('hospitalizations', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    hospStore.createIndex('memberId', 'memberId', { unique: false });
                    hospStore.createIndex('admissionDate', 'admissionDate', { unique: false });
                }

                // Operations Store
                if (!db.objectStoreNames.contains('operations')) {
                    const opStore = db.createObjectStore('operations', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    opStore.createIndex('memberId', 'memberId', { unique: false });
                    opStore.createIndex('date', 'date', { unique: false });
                }

                // Vaccinations Store
                if (!db.objectStoreNames.contains('vaccinations')) {
                    const vaccStore = db.createObjectStore('vaccinations', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    vaccStore.createIndex('memberId', 'memberId', { unique: false });
                    vaccStore.createIndex('date', 'date', { unique: false });
                }

                // Annual Examinations Store
                if (!db.objectStoreNames.contains('annualExams')) {
                    const examStore = db.createObjectStore('annualExams', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    examStore.createIndex('memberId', 'memberId', { unique: false });
                    examStore.createIndex('examType', 'examType', { unique: false });
                    examStore.createIndex('date', 'date', { unique: false });
                }

                // Daily Tracking Store
                if (!db.objectStoreNames.contains('dailyTracking')) {
                    const dailyStore = db.createObjectStore('dailyTracking', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    dailyStore.createIndex('memberId', 'memberId', { unique: false });
                    dailyStore.createIndex('date', 'date', { unique: false });
                }

                // Red Flag Events Store
                if (!db.objectStoreNames.contains('redFlagEvents')) {
                    const flagStore = db.createObjectStore('redFlagEvents', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    flagStore.createIndex('memberId', 'memberId', { unique: false });
                    flagStore.createIndex('date', 'date', { unique: false });
                }

                // Doctor Visits Store
                if (!db.objectStoreNames.contains('doctorVisits')) {
                    const visitStore = db.createObjectStore('doctorVisits', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    visitStore.createIndex('memberId', 'memberId', { unique: false });
                    visitStore.createIndex('date', 'date', { unique: false });
                }

                // Baseline Data Store (one per member)
                if (!db.objectStoreNames.contains('baselineData')) {
                    const baseStore = db.createObjectStore('baselineData', { 
                        keyPath: 'memberId'
                    });
                }
            };
        });
    }

    // ============ LAB RESULTS METHODS ============

    async saveLabResult(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['labResults'], 'readwrite');
            const store = transaction.objectStore('labResults');

            const labResult = {
                memberId: data.memberId,
                date: data.date,
                testType: data.testType,
                value: data.value,
                unit: data.unit,
                photo: data.photo,
                notes: data.notes,
                createdAt: new Date().toISOString()
            };

            const request = store.add(labResult);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getLabResults(memberId, testType = null, daysBack = 365) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['labResults'], 'readonly');
            const store = transaction.objectStore('labResults');
            const index = store.index('memberId');
            const request = index.getAll(memberId);

            request.onsuccess = () => {
                let results = request.result;
                
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysBack);
                results = results.filter(r => new Date(r.date) >= cutoffDate);

                if (testType) {
                    results = results.filter(r => r.testType === testType);
                }

                results.sort((a, b) => new Date(b.date) - new Date(a.date));
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getLatestLabResult(memberId, testType) {
        const results = await this.getLabResults(memberId, testType);
        return results.length > 0 ? results[0] : null;
    }

    // ============ MEDICATIONS METHODS ============

    async saveMedication(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['medications'], 'readwrite');
            const store = transaction.objectStore('medications');

            const medication = {
                memberId: data.memberId,
                name: data.name,
                dosage: data.dosage,
                startDate: data.startDate,
                photo: data.photo,
                active: true,
                createdAt: new Date().toISOString()
            };

            const request = store.add(medication);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async stopMedication(id, reason) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['medications'], 'readwrite');
            const store = transaction.objectStore('medications');

            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const med = getRequest.result;
                med.active = false;
                med.stopDate = new Date().toISOString();
                med.stopReason = reason;

                const updateRequest = store.put(med);
                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = () => reject(updateRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async getMedications(memberId, activeOnly = true) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['medications'], 'readonly');
            const store = transaction.objectStore('medications');
            const index = store.index('memberId');
            const request = index.getAll(memberId);

            request.onsuccess = () => {
                let meds = request.result;
                if (activeOnly) {
                    meds = meds.filter(m => m.active);
                }
                resolve(meds);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ============ TRANSFUSIONS METHODS ============

    async saveTransfusion(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['transfusions'], 'readwrite');
            const store = transaction.objectStore('transfusions');

            const transfusion = {
                memberId: data.memberId,
                date: data.date,
                reason: data.reason,
                amount: data.amount,
                notes: data.notes,
                createdAt: new Date().toISOString()
            };

            const request = store.add(transfusion);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getTransfusions(memberId, daysBack = 365 * 5) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['transfusions'], 'readonly');
            const store = transaction.objectStore('transfusions');
            const index = store.index('memberId');
            const request = index.getAll(memberId);

            request.onsuccess = () => {
                let results = request.result;
                
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysBack);
                results = results.filter(r => new Date(r.date) >= cutoffDate);
                
                results.sort((a, b) => new Date(b.date) - new Date(a.date));
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getTransfusionCount(memberId, daysBack = 365 * 5) {
        const transfusions = await this.getTransfusions(memberId, daysBack);
        return transfusions.length;
    }

    // ============ HOSPITALIZATIONS METHODS ============

    async saveHospitalization(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hospitalizations'], 'readwrite');
            const store = transaction.objectStore('hospitalizations');

            const hospitalization = {
                memberId: data.memberId,
                admissionDate: data.admissionDate,
                dischargeDate: data.dischargeDate,
                reason: data.reason,
                bedDays: data.bedDays,
                notes: data.notes,
                createdAt: new Date().toISOString()
            };

            const request = store.add(hospitalization);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getHospitalizations(memberId, monthsBack = 12) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hospitalizations'], 'readonly');
            const store = transaction.objectStore('hospitalizations');
            const index = store.index('memberId');
            const request = index.getAll(memberId);

            request.onsuccess = () => {
                let results = request.result;
                
                const cutoffDate = new Date();
                cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
                results = results.filter(r => new Date(r.admissionDate) >= cutoffDate);
                
                results.sort((a, b) => new Date(b.admissionDate) - new Date(a.admissionDate));
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ============ OPERATIONS METHODS ============

    async saveOperation(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['operations'], 'readwrite');
            const store = transaction.objectStore('operations');

            const operation = {
                memberId: data.memberId,
                date: data.date,
                type: data.type,
                outcome: data.outcome,
                notes: data.notes,
                createdAt: new Date().toISOString()
            };

            const request = store.add(operation);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getOperations(memberId, monthsBack = 12) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['operations'], 'readonly');
            const store = transaction.objectStore('operations');
            const index = store.index('memberId');
            const request = index.getAll(memberId);

            request.onsuccess = () => {
                let results = request.result;
                
                const cutoffDate = new Date();
                cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
                results = results.filter(r => new Date(r.date) >= cutoffDate);
                
                results.sort((a, b) => new Date(b.date) - new Date(a.date));
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ============ VACCINATIONS METHODS ============

    async saveVaccination(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['vaccinations'], 'readwrite');
            const store = transaction.objectStore('vaccinations');

            const vaccination = {
                memberId: data.memberId,
                date: data.date,
                vaccineName: data.vaccineName,
                notes: data.notes,
                createdAt: new Date().toISOString()
            };

            const request = store.add(vaccination);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getVaccinations(memberId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['vaccinations'], 'readonly');
            const store = transaction.objectStore('vaccinations');
            const index = store.index('memberId');
            const request = index.getAll(memberId);

            request.onsuccess = () => {
                const results = request.result.sort((a, b) => 
                    new Date(b.date) - new Date(a.date)
                );
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ============ ANNUAL EXAMS METHODS ============

    async saveAnnualExam(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['annualExams'], 'readwrite');
            const store = transaction.objectStore('annualExams');

            const exam = {
                memberId: data.memberId,
                date: data.date,
                examType: data.examType,
                result: data.result,
                nextScheduled: data.nextScheduled,
                notes: data.notes,
                createdAt: new Date().toISOString()
            };

            const request = store.add(exam);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAnnualExams(memberId, examType = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['annualExams'], 'readonly');
            const store = transaction.objectStore('annualExams');
            const index = store.index('memberId');
            const request = index.getAll(memberId);

            request.onsuccess = () => {
                let results = request.result;
                if (examType) {
                    results = results.filter(e => e.examType === examType);
                }
                results.sort((a, b) => new Date(b.date) - new Date(a.date));
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ============ DAILY TRACKING METHODS ============

    async saveDailyTracking(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['dailyTracking'], 'readwrite');
            const store = transaction.objectStore('dailyTracking');

            const tracking = {
                memberId: data.memberId,
                date: data.date,
                waterIntake: data.waterIntake,
                clothing: data.clothing,
                urinationFrequency: data.urinationFrequency,
                notes: data.notes,
                createdAt: new Date().toISOString()
            };

            const request = store.add(tracking);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getDailyTracking(memberId, daysBack = 30) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['dailyTracking'], 'readonly');
            const store = transaction.objectStore('dailyTracking');
            const index = store.index('memberId');
            const request = index.getAll(memberId);

            request.onsuccess = () => {
                let results = request.result;
                
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysBack);
                results = results.filter(r => new Date(r.date) >= cutoffDate);
                
                results.sort((a, b) => new Date(b.date) - new Date(a.date));
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ============ RED FLAG EVENTS METHODS ============

    async saveRedFlagEvent(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['redFlagEvents'], 'readwrite');
            const store = transaction.objectStore('redFlagEvents');

            const event = {
                memberId: data.memberId,
                date: data.date,
                symptoms: data.symptoms,
                actionTaken: data.actionTaken,
                outcome: data.outcome,
                notes: data.notes,
                createdAt: new Date().toISOString()
            };

            const request = store.add(event);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getRedFlagEvents(memberId, daysBack = 30) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['redFlagEvents'], 'readonly');
            const store = transaction.objectStore('redFlagEvents');
            const index = store.index('memberId');
            const request = index.getAll(memberId);

            request.onsuccess = () => {
                let results = request.result;
                
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysBack);
                results = results.filter(r => new Date(r.date) >= cutoffDate);
                
                results.sort((a, b) => new Date(b.date) - new Date(a.date));
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ============ DOCTOR VISITS METHODS ============

    async saveDoctorVisit(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['doctorVisits'], 'readwrite');
            const store = transaction.objectStore('doctorVisits');

            const visit = {
                memberId: data.memberId,
                date: data.date,
                nextVisit: data.nextVisit,
                discussed: data.discussed,
                prescriptions: data.prescriptions,
                notes: data.notes,
                createdAt: new Date().toISOString()
            };

            const request = store.add(visit);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getDoctorVisits(memberId, limit = 10) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['doctorVisits'], 'readonly');
            const store = transaction.objectStore('doctorVisits');
            const index = store.index('memberId');
            const request = index.getAll(memberId);

            request.onsuccess = () => {
                const results = request.result
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, limit);
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ============ BASELINE DATA METHODS ============

    async saveBaselineData(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['baselineData'], 'readwrite');
            const store = transaction.objectStore('baselineData');

            const baseline = {
                memberId: data.memberId,
                normalHb: data.normalHb,
                hbStdDev: data.hbStdDev || 1.0,
                currentWeight: data.currentWeight,
                knownComplications: data.knownComplications || [],
                environmentalRisks: data.environmentalRisks || {},
                updatedAt: new Date().toISOString()
            };

            const request = store.put(baseline);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getBaselineData(memberId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['baselineData'], 'readonly');
            const store = transaction.objectStore('baselineData');
            const request = store.get(memberId);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }
}

// Create global instance
const sickleCellManager = new SickleCellManager();
