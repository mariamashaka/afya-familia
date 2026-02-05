// sickle-cell-analyzer.js
// Analysis and calculations for sickle cell disease management

class SickleCellAnalyzer {
    constructor() {
        this.criticalHbDeviation = 2; // Standard deviations
    }

    // ============ HB ANALYSIS ============

    /**
     * Calculate Hb deviation from baseline in standard deviations
     */
    calculateHbDeviation(currentHb, baselineHb, stdDev = 1.0) {
        return (currentHb - baselineHb) / stdDev;
    }

    /**
     * Check if Hb is critically low
     */
    checkHbStatus(currentHb, baselineHb, stdDev = 1.0) {
        const deviation = this.calculateHbDeviation(currentHb, baselineHb, stdDev);
        
        return {
            isCritical: Math.abs(deviation) >= this.criticalHbDeviation,
            deviation: deviation,
            message: {
                sw: deviation <= -2 ? '⚠️ Hb imepungua sana!' : 
                    deviation >= 2 ? '⚠️ Hb imeongezeka sana!' : 
                    '✅ Hb ni normal',
                en: deviation <= -2 ? '⚠️ Hb dropped significantly!' : 
                    deviation >= 2 ? '⚠️ Hb increased significantly!' : 
                    '✅ Hb is normal'
            }
        };
    }

    /**
     * Analyze Hb trends over time
     */
    analyzeHbTrends(labResults) {
        if (labResults.length < 2) {
            return { trend: 'insufficient_data' };
        }

        const sorted = labResults.sort((a, b) => new Date(a.date) - new Date(b.date));
        const values = sorted.map(r => r.value);
        const avgChange = (values[values.length - 1] - values[0]) / (values.length - 1);
        
        let trend = 'stable';
        if (avgChange > 0.5) trend = 'increasing';
        if (avgChange < -0.5) trend = 'decreasing';
        
        return {
            trend: trend,
            avgChange: avgChange.toFixed(2),
            lowest: Math.min(...values),
            highest: Math.max(...values),
            current: values[values.length - 1],
            dataPoints: values.length
        };
    }

    // ============ BP ANALYSIS ============

    /**
     * Calculate BP percentile (PLACEHOLDER - needs proper tables)
     */
    calculateBPPercentile(systolic, diastolic, age, sex, height) {
        // PLACEHOLDER: Simplified check
        let percentile = 50;
        let status = 'normal';
        
        if (age < 13) {
            if (systolic > 120 || diastolic > 80) {
                percentile = 85;
                status = 'elevated';
            }
            if (systolic > 130 || diastolic > 85) {
                percentile = 95;
                status = 'high';
            }
        } else {
            if (systolic >= 120 || diastolic >= 80) {
                percentile = 85;
                status = 'elevated';
            }
            if (systolic >= 130 || diastolic >= 85) {
                percentile = 95;
                status = 'high';
            }
        }
        
        return {
            percentile: percentile,
            status: status,
            message: {
                sw: status === 'high' ? '⚠️ BP ni juu!' : 
                    status === 'elevated' ? '⚡ BP imeongezeka' : 
                    '✅ BP ni normal',
                en: status === 'high' ? '⚠️ BP is high!' : 
                    status === 'elevated' ? '⚡ BP is elevated' : 
                    '✅ BP is normal'
            },
            note: 'PLACEHOLDER: Needs proper age/height-adjusted percentile tables'
        };
    }

    // ============ WATER INTAKE CALCULATION ============

    /**
     * Calculate daily water needs using Holliday-Segar formula × 1.5
     */
    calculateWaterNeeds(weight) {
        let baseWater = 0;
        
        // Holliday-Segar formula
        if (weight <= 10) {
            baseWater = weight * 100; // 100 mL/kg for first 10 kg
        } else if (weight <= 20) {
            baseWater = 1000 + ((weight - 10) * 50); // + 50 mL/kg for next 10 kg
        } else {
            baseWater = 1500 + ((weight - 20) * 20); // + 20 mL/kg for weight > 20 kg
        }
        
        // Multiply by 1.5 for sickle cell patients
        const sickleCellNeeds = baseWater * 1.5;
        
        return {
            baseWater: baseWater,
            sickleCellNeeds: sickleCellNeeds,
            liters: (sickleCellNeeds / 1000).toFixed(1),
            message: {
                sw: `Lazima kunywa angalau ${(sickleCellNeeds / 1000).toFixed(1)} lita kwa siku`,
                en: `Must drink at least ${(sickleCellNeeds / 1000).toFixed(1)} liters per day`
            }
        };
    }

    /**
     * Check if water intake is adequate
     */
    checkWaterIntake(actualIntake, weight) {
        const needs = this.calculateWaterNeeds(weight);
        const actualML = actualIntake * 1000;
        const percentOfNeeds = (actualML / needs.sickleCellNeeds * 100).toFixed(0);
        
        let status = 'adequate';
        if (percentOfNeeds < 80) status = 'low';
        if (percentOfNeeds < 60) status = 'critically_low';
        if (percentOfNeeds > 120) status = 'good';
        
        return {
            status: status,
            percentOfNeeds: percentOfNeeds,
            shortfall: Math.max(0, needs.sickleCellNeeds - actualML),
            message: {
                sw: status === 'critically_low' ? '🚨 Maji ni kidogo sana!' :
                    status === 'low' ? '⚠️ Ongeza maji!' :
                    status === 'good' ? '✅ Vizuri sana!' :
                    '✅ Maji ni ya kutosha',
                en: status === 'critically_low' ? '🚨 Water intake is critically low!' :
                    status === 'low' ? '⚠️ Increase water!' :
                    status === 'good' ? '✅ Excellent!' :
                    '✅ Water intake is adequate'
            }
        };
    }

    // ============ TRANSFUSION ANALYSIS ============

    /**
     * Check for iron overload risk from transfusions
     */
    checkTransfusionRisk(transfusions, yearsBack = 5) {
        const cutoffDate = new Date();
        cutoffDate.setFullYear(cutoffDate.getFullYear() - yearsBack);
        
        const recentTransfusions = transfusions.filter(t => 
            new Date(t.date) >= cutoffDate
        );
        
        const count = recentTransfusions.length;
        const riskThreshold = 20;
        
        return {
            count: count,
            yearsBack: yearsBack,
            hasRisk: count > riskThreshold,
            riskLevel: count > riskThreshold ? 'high' : count > 15 ? 'moderate' : 'low',
            message: {
                sw: count > riskThreshold ? 
                    `⚠️ Hatari ya iron overload! (${count} transfusions kwa miaka ${yearsBack})` :
                    count > 15 ?
                    `⚡ Fuatilia iron levels (${count} transfusions)` :
                    `✅ Hakuna hatari (${count} transfusions)`,
                en: count > riskThreshold ? 
                    `⚠️ Iron overload risk! (${count} transfusions in ${yearsBack} years)` :
                    count > 15 ?
                    `⚡ Monitor iron levels (${count} transfusions)` :
                    `✅ No risk (${count} transfusions)`
            }
        };
    }

    // ============ LAB VALUES NORMAL RANGES (PLACEHOLDERS) ============

    getNormalRange(testType, age = null, sex = null) {
        // PLACEHOLDER: Simplified ranges
        const ranges = {
            hb: {
                unit: 'g/dL',
                note: 'Individual baseline varies - use patient\'s steady-state Hb',
                placeholder: true
            },
            creatinine: {
                min: 0.5,
                max: 1.2,
                unit: 'mg/dL',
                note: 'PLACEHOLDER: Needs age/sex adjustment',
                placeholder: true
            },
            urea: {
                min: 7,
                max: 20,
                unit: 'mg/dL',
                note: 'PLACEHOLDER: Needs age adjustment',
                placeholder: true
            },
            liver: {
                alt_max: 40,
                ast_max: 40,
                unit: 'U/L',
                note: 'PLACEHOLDER: Needs age/sex adjustment',
                placeholder: true
            },
            vitB12: {
                min: 200,
                max: 900,
                unit: 'pg/mL',
                note: 'PLACEHOLDER: Verify range',
                placeholder: true
            },
            vitD: {
                min: 30,
                max: 100,
                unit: 'ng/mL',
                note: 'PLACEHOLDER: Verify range',
                placeholder: true
            }
        };
        
        return ranges[testType] || { note: 'Range not defined', placeholder: true };
    }

    checkLabValue(testType, value, age = null, sex = null) {
        const range = this.getNormalRange(testType, age, sex);
        
        if (range.placeholder) {
            return {
                status: 'unknown',
                message: {
                    sw: '⚠️ Taarifa za kawaida hazijapatikana - angalia na daktari',
                    en: '⚠️ Normal range not available - consult doctor'
                },
                note: range.note
            };
        }
        
        let status = 'normal';
        if (range.min && value < range.min) status = 'low';
        if (range.max && value > range.max) status = 'high';
        
        return {
            status: status,
            value: value,
            range: range,
            message: {
                sw: status === 'low' ? '⬇️ Chini ya kawaida' :
                    status === 'high' ? '⬆️ Juu ya kawaida' :
                    '✅ Normal',
                en: status === 'low' ? '⬇️ Below normal' :
                    status === 'high' ? '⬆️ Above normal' :
                    '✅ Normal'
            }
        };
    }

    // ============ EXAMINATION SCHEDULING ============

    calculateNextExamDate(lastExamDate, frequency) {
        const nextDate = new Date(lastExamDate);
        
        switch(frequency) {
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case '6months':
                nextDate.setMonth(nextDate.getMonth() + 6);
                break;
            case 'yearly':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
        }
        
        return nextDate;
    }

    checkExamStatus(scheduledDate, graceDays = 7) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const scheduled = new Date(scheduledDate);
        scheduled.setHours(0, 0, 0, 0);
        
        const daysUntil = Math.floor((scheduled - today) / (1000 * 60 * 60 * 24));
        
        let status = 'upcoming';
        if (daysUntil < -graceDays) status = 'overdue';
        else if (daysUntil < 0) status = 'grace_period';
        else if (daysUntil <= 30) status = 'soon';
        else if (daysUntil <= 90) status = 'scheduled';
        
        return {
            status: status,
            daysUntil: daysUntil,
            scheduledDate: scheduled,
            message: {
                sw: status === 'overdue' ? `🔴 Imechelewa (${Math.abs(daysUntil)} siku)` :
                    status === 'grace_period' ? `🟡 Chelewa kidogo (${Math.abs(daysUntil)} siku)` :
                    status === 'soon' ? `⏰ Siku ${daysUntil} zimebaki` :
                    status === 'scheduled' ? `📅 ${scheduled.toLocaleDateString('sw-TZ')}` :
                    '✅ Umepangwa',
                en: status === 'overdue' ? `🔴 Overdue (${Math.abs(daysUntil)} days)` :
                    status === 'grace_period' ? `🟡 Slightly overdue (${Math.abs(daysUntil)} days)` :
                    status === 'soon' ? `⏰ ${daysUntil} days left` :
                    status === 'scheduled' ? `📅 ${scheduled.toLocaleDateString('en-US')}` :
                    '✅ Scheduled'
            }
        };
    }

    // ============ REPORT GENERATION ============

    async generateReport(memberId, startDate, endDate, allData) {
        const report = {
            period: {
                start: startDate,
                end: endDate
            },
            hbTrends: this.analyzeHbTrends(allData.labResults.filter(r => r.testType === 'hb')),
            transfusionRisk: this.checkTransfusionRisk(allData.transfusions),
            redFlagCount: allData.redFlagEvents.length,
            hospitalizationCount: allData.hospitalizations.length,
            totalBedDays: allData.hospitalizations.reduce((sum, h) => sum + (h.bedDays || 0), 0),
            medications: allData.medications.filter(m => m.active),
            upcomingExams: [],
            criticalAlerts: []
        };
        
        // Add critical alerts
        if (report.hbTrends.trend === 'decreasing') {
            report.criticalAlerts.push({
                type: 'hb_trend',
                severity: 'warning',
                message: {
                    sw: 'Hb inaendelea kupungua',
                    en: 'Hb is decreasing over time'
                }
            });
        }
        
        if (report.transfusionRisk.hasRisk) {
            report.criticalAlerts.push({
                type: 'transfusion_risk',
                severity: 'critical',
                message: report.transfusionRisk.message
            });
        }
        
        return report;
    }
}

// Export for use
window.SickleCellAnalyzer = SickleCellAnalyzer;
