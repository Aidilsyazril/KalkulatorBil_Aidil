class ElectricityBillCalculator {
    constructor() {
        console.log('ElectricityBillCalculator constructor called');
        this.rates = {
            peakEnergy: 0.3132,
            offPeakEnergy: 0.2723,
            capacity: 30.19,
            network: 66.87,
            retail: 200.00,
            rebate: 0.10,
            kwtbb: 0.016,
            afa: 0.00
        };
        
        console.log('Initializing event listeners...');
        this.initializeEventListeners();
        this.initializeDateListeners();
        this.updateAfaRateDisplay(); // Initialize AFA display
        this.calculateBill(); // Calculate on initial load
        console.log('Constructor completed');
    }

    initializeDateListeners() {
        const calculateDays = () => {
            const startDateElement = document.getElementById('periodStart');
            const endDateElement = document.getElementById('periodEnd');
            const durationElement = document.getElementById('periodDuration');
            
            if (!startDateElement || !endDateElement || !durationElement) {
                console.log('Date elements not found');
                return;
            }
            
            const startDate = new Date(startDateElement.value);
            const endDate = new Date(endDateElement.value);
            
            // Check if both dates are selected and valid
            if (startDateElement.value && endDateElement.value && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                // Calculate the difference in time
                const diffTime = Math.abs(endDate - startDate);
                // Convert to days and add 1 to include both start and end dates
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                
                durationElement.textContent = `(${diffDays} Hari)`;
                console.log(`Calculated days: ${diffDays} for period ${startDateElement.value} to ${endDateElement.value}`);
            } else {
                // No dates selected or invalid dates
                durationElement.textContent = '(0 Hari)';
                console.log('Dates not selected or invalid, duration set to 0 days');
            }
        };

        // Add event listeners with error checking
        const startElement = document.getElementById('periodStart');
        const endElement = document.getElementById('periodEnd');
        
        if (startElement && endElement) {
            startElement.addEventListener('change', () => {
                console.log('Start date changed');
                calculateDays();
                this.calculateBill();
            });
            
            endElement.addEventListener('change', () => {
                console.log('End date changed');
                calculateDays();
                this.calculateBill();
            });
            
            // Initialize with 0 days since no dates are selected yet
            calculateDays();
        } else {
            console.log('Date input elements not found');
        }
    }

    initializeEventListeners() {
        // Automatic calculation on input changes
        document.getElementById('peakUsage').addEventListener('input', () => this.calculateBill());
        document.getElementById('offPeakUsage').addEventListener('input', () => this.calculateBill());
        document.getElementById('maxDemand').addEventListener('input', () => this.calculateBill());
        document.getElementById('totalUsage').addEventListener('input', () => this.calculateBill());
        
        // AFA rate selection
        document.getElementById('afaRate').addEventListener('change', () => {
            this.updateAfaRateDisplay();
            this.calculateBill();
        });

        // Manual buttons
        document.getElementById('calculateBill').addEventListener('click', () => this.calculateBill());
        document.getElementById('printBill').addEventListener('click', () => this.printBill());
        
        const clearButton = document.getElementById('clearBill');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                console.log('Clear button clicked');
                this.clearBill();
            });
            console.log('Clear button event listener attached');
        } else {
            console.log('Clear button not found');
        }
    }

    calculateBill() {
        const peakUsage = parseFloat(document.getElementById('peakUsage').value) || 0;
        const offPeakUsage = parseFloat(document.getElementById('offPeakUsage').value) || 0;
        const maxDemand = parseFloat(document.getElementById('maxDemand').value) || 0;
        const totalUsage = parseFloat(document.getElementById('totalUsage').value) || 0;

        this.updateDisplayValues(peakUsage, offPeakUsage, totalUsage, maxDemand);
        const calculations = this.calculateCharges(peakUsage, offPeakUsage, totalUsage, maxDemand);
        this.updateChargesTable(calculations);
    }

    updateDisplayValues(peakUsage, offPeakUsage, totalUsage, maxDemand) {
        const format = num => num.toFixed(2);
        
        document.getElementById('peakUsageDisplay').textContent = format(peakUsage);
        document.getElementById('peakUsageTotal').textContent = format(peakUsage);
        document.getElementById('offPeakUsageDisplay').textContent = format(offPeakUsage);
        document.getElementById('offPeakUsageTotal').textContent = format(offPeakUsage);
        document.getElementById('totalUsageDisplay').textContent = format(totalUsage);
        document.getElementById('totalUsageTotal').textContent = format(totalUsage);
        document.getElementById('maxDemandDisplay').textContent = format(maxDemand);
        document.getElementById('maxDemandTotal').textContent = format(maxDemand);
    }

    calculateCharges(peakUsage, offPeakUsage, totalUsage, maxDemand) {
        // Get AFA rate from dropdown
        const afaRate = parseFloat(document.getElementById('afaRate').value) || 0;
        
        const peakEnergyAmount = peakUsage * this.rates.peakEnergy;
        const offPeakEnergyAmount = offPeakUsage * this.rates.offPeakEnergy;
        const afaAmount = totalUsage * afaRate;
        const capacityAmount = maxDemand * this.rates.capacity;
        const networkAmount = maxDemand * this.rates.network;
        const retailAmount = this.rates.retail;
        
        // Calculate rebate only on base charges (excluding AFA)
        const baseCharges = peakEnergyAmount + offPeakEnergyAmount + capacityAmount + networkAmount + retailAmount;
        const rebateAmount = baseCharges * this.rates.rebate;
        const chargesAfterRebate = baseCharges - rebateAmount;
        
        // Add AFA after rebate calculation
        const currentMonthCharge = chargesAfterRebate + afaAmount;
        const kwtbbAmount = currentMonthCharge * this.rates.kwtbb;
        const subtotalBeforeRounding = currentMonthCharge + kwtbbAmount;
        
        // Calculate rounding adjustment
        const roundingData = this.calculateRoundingAdjustment(subtotalBeforeRounding);
        const grandTotal = subtotalBeforeRounding + roundingData.amount;

        // Debug logging
        console.log('Calculation Debug:');
        console.log('- AFA Rate:', afaRate);
        console.log('- AFA Amount:', afaAmount);
        console.log('- Subtotal before rounding:', subtotalBeforeRounding);
        console.log('- Rounding adjustment:', roundingData.amount);
        console.log('- Final Grand Total:', grandTotal);

        return {
            peakEnergyAmount,
            offPeakEnergyAmount,
            afaAmount,
            capacityAmount,
            networkAmount,
            retailAmount,
            rebateAmount,
            currentMonthCharge,
            kwtbbAmount,
            roundingAdjustment: roundingData,
            grandTotal
        };
    }

    updateChargesTable(calculations) {
        const format = num => num.toFixed(2);
        
        document.getElementById('peakEnergyAmount').textContent = format(calculations.peakEnergyAmount);
        document.getElementById('offPeakEnergyAmount').textContent = format(calculations.offPeakEnergyAmount);
        document.getElementById('afaAmount').textContent = format(calculations.afaAmount);
        document.getElementById('capacityAmount').textContent = format(calculations.capacityAmount);
        document.getElementById('networkAmount').textContent = format(calculations.networkAmount);
        document.getElementById('rebateAmount').textContent = `-${format(calculations.rebateAmount)}`;
        document.getElementById('currentMonthCharge').textContent = format(calculations.currentMonthCharge);
        document.getElementById('currentMonthChargeTotal').textContent = format(calculations.currentMonthCharge);
        document.getElementById('kwtbbAmount').textContent = format(calculations.kwtbbAmount);
        document.getElementById('roundingAdjustmentRate').textContent = calculations.roundingAdjustment.description;
        document.getElementById('roundingAdjustmentAmount').textContent = format(calculations.roundingAdjustment.amount);
        document.getElementById('grandTotal').innerHTML = `<strong>${format(calculations.grandTotal)}</strong>`;
    }

    addCalculationAnimation() {
        const table = document.querySelector('.charges-table');
        table.classList.add('calculating');
        setTimeout(() => table.classList.remove('calculating'), 300);
    }



    updatePrintPeriod() {
        const startDate = document.getElementById('periodStart').value;
        const endDate = document.getElementById('periodEnd').value;
        const durationText = document.getElementById('periodDuration').textContent;
        const accountNumber = document.getElementById('accountNumber').value;
        
        // Update the print period display - target the correct element
        const printPeriodElement = document.getElementById('paymentPeriod');
        if (printPeriodElement) {
            if (startDate && endDate) {
                // Format dates for display (DD.MM.YYYY format to match user requirement)
                const startFormatted = new Date(startDate).toLocaleDateString('en-GB').replace(/\//g, '.');
                const endFormatted = new Date(endDate).toLocaleDateString('en-GB').replace(/\//g, '.');
                printPeriodElement.textContent = `NO. AKAUN: ${accountNumber || 'Belum diisi'}\nTEMPOH BIL: ${startFormatted} - ${endFormatted} ${durationText}`;
                console.log('Print period updated:', `${startFormatted} - ${endFormatted} ${durationText}`);
            } else {
                // No dates selected yet
                printPeriodElement.textContent = `NO. AKAUN: ${accountNumber || 'Belum diisi'}\nTEMPOH BIL: Belum dipilih`;
                console.log('Print period updated: No dates selected yet');
            }
        }
    }

    printBill() {
        this.updatePrintPeriod();
        this.updatePrintInfo();
        window.print();
    }

    updatePrintInfo() {
        // Get data from form fields
        const premiseAddress = document.getElementById('premiseAddress').value;
        const accountNumber = document.getElementById('accountNumber').value;
        const startDate = document.getElementById('periodStart').value;
        const endDate = document.getElementById('periodEnd').value;
        const durationText = document.getElementById('periodDuration').textContent;

        // Update print-only sections
        const printPremiseAddress = document.getElementById('printPremiseAddress');
        const printAccountNumber = document.getElementById('printAccountNumber');
        const printBillingPeriod = document.getElementById('printBillingPeriod');

        if (printPremiseAddress) {
            printPremiseAddress.textContent = premiseAddress;
        }

        if (printAccountNumber) {
            printAccountNumber.textContent = accountNumber;
        }

        if (printBillingPeriod && startDate && endDate) {
            // Format dates for display (DD.MM.YYYY format)
            const startFormatted = new Date(startDate).toLocaleDateString('en-GB').replace(/\//g, '.');
            const endFormatted = new Date(endDate).toLocaleDateString('en-GB').replace(/\//g, '.');
            printBillingPeriod.textContent = `${startFormatted} - ${endFormatted} ${durationText}`;
        }

        console.log('Print info sections updated');
    }

    calculateRoundingAdjustment(amount) {
        // Get the last two digits of the amount (cents)
        const cents = Math.round((amount % 1) * 100);
        
        console.log('Rounding Debug - Amount:', amount, 'Cents:', cents);
        
        if (cents === 1 || cents === 2) {
            // Round down (ke bawah)
            return {
                amount: -cents / 100,
                description: cents === 1 ? '-0.01' : '-0.02'
            };
        } else if (cents >= 3 && cents <= 7) {
            // Round to nearest 5 cents
            const adjustment = (5 - cents) / 100;
            return {
                amount: adjustment,
                description: `+${adjustment.toFixed(2)}`
            };
        } else if (cents === 8 || cents === 9) {
            // Round up (ke atas)
            const adjustment = (10 - cents) / 100;
            return {
                amount: adjustment,
                description: `+${adjustment.toFixed(2)}`
            };
        } else if (cents === 0 || cents === 5) {
            // No adjustment needed (ends in 0 or 5)
            return {
                amount: 0,
                description: '0.00'
            };
        } else {
            // Handle other cases (like 13 cents from 10097.13)
            const lastDigit = cents % 10;
            if (lastDigit >= 1 && lastDigit <= 2) {
                return {
                    amount: -lastDigit / 100,
                    description: `-0.0${lastDigit}`
                };
            } else if (lastDigit >= 3 && lastDigit <= 7) {
                const adjustment = (5 - lastDigit) / 100;
                return {
                    amount: adjustment,
                    description: `${adjustment >= 0 ? '+' : ''}${adjustment.toFixed(2)}`
                };
            } else if (lastDigit >= 8 && lastDigit <= 9) {
                const adjustment = (10 - lastDigit) / 100;
                return {
                    amount: adjustment,
                    description: `+${adjustment.toFixed(2)}`
                };
            }
            return {
                amount: 0,
                description: '0.00'
            };
        }
    }

    updateAfaRateDisplay() {
        const afaRate = document.getElementById('afaRate').value;
        const afaRateDisplay = document.getElementById('afaRateDisplay');
        if (afaRateDisplay) {
            afaRateDisplay.textContent = afaRate;
        }
        console.log('AFA rate updated to:', afaRate);
    }

    clearBill() {
        console.log('clearBill function called');
        if (confirm('Adakah anda pasti mahu mengosongkan semua data?')) {
            console.log('User confirmed clear operation');
            
            // Clear input fields
            const peakUsage = document.getElementById('peakUsage');
            const offPeakUsage = document.getElementById('offPeakUsage');
            const maxDemand = document.getElementById('maxDemand');
            const totalUsage = document.getElementById('totalUsage');
            
            if (peakUsage) peakUsage.value = '';
            if (offPeakUsage) offPeakUsage.value = '';
            if (maxDemand) maxDemand.value = '';
            if (totalUsage) totalUsage.value = '';
            
            console.log('Input fields cleared');
            
            // Reset display values
            this.updateDisplayValues(0, 0, 0, 0);
            this.updateChargesTable({
                peakEnergyAmount: 0,
                offPeakEnergyAmount: 0,
                afaAmount: 0,
                capacityAmount: 0,
                networkAmount: 0,
                retailAmount: 0,
                rebateAmount: 0,
                currentMonthCharge: 0,
                kwtbbAmount: 0,
                grandTotal: 0
            });
            
            console.log('Bill cleared successfully');
        } else {
            console.log('User cancelled clear operation');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing ElectricityBillCalculator...');
    try {
        new ElectricityBillCalculator();
        console.log('ElectricityBillCalculator initialized successfully');
    } catch (error) {
        console.error('Error initializing ElectricityBillCalculator:', error);
    }
});
