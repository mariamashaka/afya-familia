// epilepsy-manager.js

class EpilepsyManager {
    constructor() {
        this.dbName = 'AfyaFamiliaDB';
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

                // Seizures store
                if (!db.objectStoreNames.contains('seizures')) {
                    const seizureStore = db.createObjectStore('seizures', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    seizureStore.createIndex('dateTime', 'dateTime', { unique: false });
                    seizureStore.createIndex('childId', 'childId', { unique: false });
                }

                // Basic therapy store (medications)
                if (!db.objectStoreNames.contains('basicTherapy')) {
                    const therapyStore = db.createObjectStore('basicTherapy', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    therapyStore.createIndex('childId', 'childId', { unique: false });
                    therapyStore.createIndex('active', 'active', { unique: false });
                }

                // Therapy history (track changes)
                if (!db.objectStoreNames.contains('therapyHistory')) {
                    const historyStore = db.createObjectStore('therapyHistory', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    historyStore.createIndex('changeDate', 'changeDate', { unique: false });
                    historyStore.createIndex('therapyId', 'therapyId', { unique: false });
                }

                // Development tracking
                if (!db.objectStoreNames.contains('development')) {
                    const devStore = db.createObjectStore('development', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    devStore.createIndex('recordDate', 'recordDate', { unique: false });
                    devStore.createIndex('childId', 'childId', { unique: false });
                }
            };
        });
    }

    // ============ SEIZURE METHODS ============

    async saveSeizure(seizureData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['seizures'], 'readwrite');
            const store = transaction.objectStore('seizures');

            const seizure = {
                dateTime: seizureData.dateTime,
                duration: seizureData.duration,
                beforeSeizure: seizureData.beforeSeizure,
                aura: seizureData.aura,
                onset: seizureData.onset, // Array of checked values
                onsetOther: seizureData.onsetOther,
                bodyParts: seizureData.bodyParts, // Array
                bodyPartsDetails: seizureData.bodyPartsDetails,
                lostConsciousness: seizureData.lostConsciousness,
                triggers: seizureData.triggers, // Array
                triggersOther: seizureData.triggersOther,
                afterSeizure: seizureData.afterSeizure, // Array
                afterSeizureDetails: seizureData.afterSeizureDetails,
                emergencyMeds: seizureData.emergencyMeds,
                location: seizureData.location,
                tookMeds: seizureData.tookMeds,
                video: seizureData.video, // File data
                additionalNotes: seizureData.additionalNotes,
                childId: seizureData.childId || 'default', // For multi-child support later
                createdAt: new Date().toISOString()
            };

            const request = store.add(seizure);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllSeizures(childId = 'default') {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['seizures'], 'readonly');
            const store = transaction.objectStore('seizures');
            const index = store.index('childId');
            const request = index.getAll(childId);

            request.onsuccess = () => {
                // Sort by date descending (newest first)
                const seizures = request.result.sort((a, b) => 
                    new Date(b.dateTime) - new Date(a.dateTime)
                );
                resolve(seizures);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getSeizureById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['seizures'], 'readonly');
            const store = transaction.objectStore('seizures');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteSeizure(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['seizures'], 'readwrite');
            const store = transaction.objectStore('seizures');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ============ BASIC THERAPY METHODS ============

    async saveMedication(medData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['basicTherapy', 'therapyHistory'], 'readwrite');
            const therapyStore = transaction.objectStore('basicTherapy');
            const historyStore = transaction.objectStore('therapyHistory');

            const medication = {
                medicationName: medData.medicationName,
                dosage: medData.dosage,
                timing: medData.timing, // {asubuhi: '150mg', mchana: '150mg', jioni: '150mg', usiku: '30mg'}
                childWeight: medData.childWeight,
                photo: medData.photo, // Base64 or file reference
                childId: medData.childId || 'default',
                active: true,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };

            const therapyRequest = therapyStore.add(medication);

            therapyRequest.onsuccess = () => {
                const therapyId = therapyRequest.result;

                // Record in history
                const historyEntry = {
                    therapyId: therapyId,
                    changeType: 'created',
                    changeDate: new Date().toISOString(),
                    oldValue: null,
                    newValue: medication,
                    notes: 'Dawa imeongezwa'
                };

                historyStore.add(historyEntry);
                resolve(therapyId);
            };

            therapyRequest.onerror = () => reject(therapyRequest.error);
        });
    }

    async updateMedication(id, updates) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['basicTherapy', 'therapyHistory'], 'readwrite');
            const therapyStore = transaction.objectStore('basicTherapy');
            const historyStore = transaction.objectStore('therapyHistory');

            const getRequest = therapyStore.get(id);

            getRequest.onsuccess = () => {
                const oldMed = getRequest.result;
                const updatedMed = {
                    ...oldMed,
                    ...updates,
                    lastModified: new Date().toISOString()
                };

                const updateRequest = therapyStore.put(updatedMed);

                updateRequest.onsuccess = () => {
                    // Record change in history
                    const historyEntry = {
                        therapyId: id,
                        changeType: 'updated',
                        changeDate: new Date().toISOString(),
                        oldValue: oldMed,
                        newValue: updatedMed,
                        notes: 'Dawa imebadilishwa'
                    };

                    historyStore.add(historyEntry);
                    resolve();
                };

                updateRequest.onerror = () => reject(updateRequest.error);
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async getAllMedications(childId = 'default') {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['basicTherapy'], 'readonly');
            const store = transaction.objectStore('basicTherapy');
            const index = store.index('childId');
            const request = index.getAll(childId);

            request.onsuccess = () => {
                // Only return active medications
                const meds = request.result.filter(med => med.active);
                resolve(meds);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deactivateMedication(id, reason) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['basicTherapy', 'therapyHistory'], 'readwrite');
            const therapyStore = transaction.objectStore('basicTherapy');
            const historyStore = transaction.objectStore('therapyHistory');

            const getRequest = therapyStore.get(id);

            getRequest.onsuccess = () => {
                const med = getRequest.result;
                med.active = false;
                med.deactivatedAt = new Date().toISOString();

                therapyStore.put(med);

                // Record in history
                const historyEntry = {
                    therapyId: id,
                    changeType: 'deactivated',
                    changeDate: new Date().toISOString(),
                    oldValue: { active: true },
                    newValue: { active: false },
                    notes: reason || 'Dawa imeondolewa'
                };

                historyStore.add(historyEntry);
                resolve();
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async getTherapyHistory(therapyId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['therapyHistory'], 'readonly');
            const store = transaction.objectStore('therapyHistory');
            const index = store.index('therapyId');
            const request = index.getAll(therapyId);

            request.onsuccess = () => {
                const history = request.result.sort((a, b) => 
                    new Date(b.changeDate) - new Date(a.changeDate)
                );
                resolve(history);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ============ DEVELOPMENT TRACKING ============

    async saveDevelopment(devData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['development'], 'readwrite');
            const store = transaction.objectStore('development');

            const development = {
                recordDate: new Date().toISOString(),
                childId: devData.childId || 'default',
                speech: devData.speech, // true/false
                socialInteraction: devData.socialInteraction,
                recognizesParents: devData.recognizesParents,
                schoolPerformance: devData.schoolPerformance,
                bladderControl: devData.bladderControl,
                bowelControl: devData.bowelControl,
                notes: devData.notes
            };

            const request = store.add(development);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getLatestDevelopment(childId = 'default') {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['development'], 'readonly');
            const store = transaction.objectStore('development');
            const index = store.index('childId');
            const request = index.getAll(childId);

            request.onsuccess = () => {
                const records = request.result.sort((a, b) => 
                    new Date(b.recordDate) - new Date(a.recordDate)
                );
                resolve(records[0] || null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getAllDevelopmentRecords(childId = 'default') {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['development'], 'readonly');
            const store = transaction.objectStore('development');
            const index = store.index('childId');
            const request = index.getAll(childId);

            request.onsuccess = () => {
                const records = request.result.sort((a, b) => 
                    new Date(b.recordDate) - new Date(a.recordDate)
                );
                resolve(records);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ============ REPORT GENERATION ============

    async generateReport(startDate, endDate, childId = 'default') {
        const seizures = await this.getAllSeizures(childId);
        const medications = await this.getAllMedications(childId);
        const development = await getLatestDevelopment(childId);

        // Filter seizures by date range
        const filteredSeizures = seizures.filter(s => {
            const sDate = new Date(s.dateTime);
            return (!startDate || sDate >= new Date(startDate)) && 
                   (!endDate || sDate <= new Date(endDate));
        });

        return {
            seizures: filteredSeizures,
            medications: medications,
            development: development,
            summary: {
                totalSeizures: filteredSeizures.length,
                averagePerWeek: this.calculateAveragePerWeek(filteredSeizures, startDate, endDate),
                commonTriggers: this.analyzeCommonTriggers(filteredSeizures),
                peakTimes: this.analyzePeakTimes(filteredSeizures)
            }
        };
    }

    calculateAveragePerWeek(seizures, startDate, endDate) {
        if (seizures.length === 0) return 0;

        const start = startDate ? new Date(startDate) : new Date(seizures[seizures.length - 1].dateTime);
        const end = endDate ? new Date(endDate) : new Date(seizures[0].dateTime);
        const weeks = (end - start) / (7 * 24 * 60 * 60 * 1000);

        return weeks > 0 ? (seizures.length / weeks).toFixed(1) : seizures.length;
    }

    analyzeCommonTriggers(seizures) {
        const triggerCount = {};

        seizures.forEach(s => {
            if (s.triggers && Array.isArray(s.triggers)) {
                s.triggers.forEach(trigger => {
                    triggerCount[trigger] = (triggerCount[trigger] || 0) + 1;
                });
            }
        });

        return Object.entries(triggerCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
    }

    analyzePeakTimes(seizures) {
        const hourCount = {};

        seizures.forEach(s => {
            const hour = new Date(s.dateTime).getHours();
            hourCount[hour] = (hourCount[hour] || 0) + 1;
        });

        return Object.entries(hourCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
    }
}

// Export for use in HTML
const epilepsyManager = new EpilepsyManager();
