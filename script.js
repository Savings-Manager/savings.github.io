document.addEventListener('DOMContentLoaded', () => {
    const currencySelect = document.getElementById('currency');
    const customCurrencySelect = document.getElementById('customCurrencies');
    const newCurrencyInput = document.getElementById('newCurrency');
    const newCurrencyValueInput = document.getElementById('newCurrencyValue');
    const addNewCurrencyButton = document.getElementById('addNewCurrency');
    const addSelectedCurrencyButton = document.getElementById('addSelectedCurrency');
    const removeCustomButton = document.getElementById('removeCustom');
    const quantityInput = document.getElementById('quantity');
    const addSavingsButton = document.getElementById('addSavings');
    const savingsTableBody = document.querySelector('#savingsTable tbody');
    const totalSavingsSpan = document.getElementById('totalSavings');
    const moneyLeftSpan = document.getElementById('moneyLeft'); 
    const goalInput = document.getElementById('goalInput');
    const goalAmountInput = document.getElementById('goalAmountInput');
    const addGoalButton = document.getElementById('addGoal');
    const goalsTableBody = document.querySelector('#goalsTable tbody');

    let rates = {};

    const formatTL = new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    function parseCurrencyToNumber(currencyString) {
        // Para birimi sembolü ve boşlukları kaldır
        const cleanString = currencyString.replace('₺', '').replace('TRY', '').trim();
        
        // Noktayı kaldır ve virgülü noktaya çevir
        const numberString = cleanString.replace(/\./g, '').replace(',', '.');
        
        // Sayıyı parse et
        return parseFloat(numberString);
    }

    // Fetch currency rates from API
    function fetchRates() {
        const apiUrl = 'https://api.exchangerate-api.com/v4/latest/TRY';

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                rates = data.rates;
                populateCurrencySelect();
                loadCustomCurrencies();
                loadGoals();
                loadSavings();
            })
            .catch(error => {
                console.error('Error fetching rates:', error);
                loadCustomCurrencies();
                loadGoals();
                loadSavings();
            });
    }

    // Populate currency select with rates from API
    function populateCurrencySelect() {
        currencySelect.innerHTML = '';
        for (const currency in rates) {
            const option = document.createElement('option');
            option.value = rates[currency];
            option.textContent = currency;
            currencySelect.appendChild(option);
        }
    }

    // Add predefined custom currencies
    function addPredefinedCurrencies() {
        let gramAltinValue = 2500;
        const predefinedCurrencies = {
            'Gram Altın': gramAltinValue,
            'Çeyrek Altın': 1.65 * gramAltinValue,
            'Yarım Altın': 3.3 * gramAltinValue,
            'Tam Altın': 6.63 * gramAltinValue
        };

        saveCustomCurrencies(predefinedCurrencies);

        for (const currency in predefinedCurrencies) {
            addOptionToCustomCurrencies(currency, predefinedCurrencies[currency]);
        }
    }

    // Update predefined currencies based on gram altın value
    function updatePredefinedCurrencies(gramAltinValue) {
        const predefinedCurrencies = {
            'Gram Altın': gramAltinValue,
            'Çeyrek Altın': 1.65 * gramAltinValue,
            'Yarım Altın': 3.3 * gramAltinValue,
            'Tam Altın': 6.63 * gramAltinValue
        };

        for (const option of customCurrencySelect.options) {
            if (predefinedCurrencies[option.textContent] !== undefined) {
                option.value = predefinedCurrencies[option.textContent];
            }
        }

        // Update savings table if gram altın value changes
        updateSavingsTable();
    }

    // Add selected currency to customCurrencies
    addSelectedCurrencyButton.addEventListener('click', () => {
        const selectedCurrency = currencySelect.options[currencySelect.selectedIndex].textContent;
        const rate = currencySelect.value;

        if (selectedCurrency && rate) {
            const customCurrencies = getCustomCurrencies();
            if (!customCurrencies[selectedCurrency]) {
                customCurrencies[selectedCurrency] = (1 / rate).toFixed(2);
                saveCustomCurrencies(customCurrencies);
                addOptionToCustomCurrencies(selectedCurrency, (1 / rate).toFixed(2));
            }
        }
    });

    // Add new custom currency
    addNewCurrencyButton.addEventListener('click', () => {
        const newCurrency = newCurrencyInput.value;
        const newCurrencyValue = parseFloat(newCurrencyValueInput.value);

        if (newCurrency && !isNaN(newCurrencyValue)) {
            const customCurrencies = getCustomCurrencies();
            if (newCurrency === 'Gram Altın') {
                updatePredefinedCurrencies(newCurrencyValue);
            } else if (!customCurrencies[newCurrency]) {
                customCurrencies[newCurrency] = newCurrencyValue;
                saveCustomCurrencies(customCurrencies);
                addOptionToCustomCurrencies(newCurrency, newCurrencyValue);
            }
            newCurrencyInput.value = '';
            newCurrencyValueInput.value = '';
        }
    });

    // Remove selected custom currency
    removeCustomButton.addEventListener('click', () => {
        const selectedCurrency = customCurrencySelect.options[customCurrencySelect.selectedIndex].textContent;
        if (selectedCurrency) {
            const customCurrencies = getCustomCurrencies();
            if (customCurrencies[selectedCurrency]) {
                delete customCurrencies[selectedCurrency];
                saveCustomCurrencies(customCurrencies);
                loadCustomCurrencies();
            }
        }
    });

    // Add savings
    addSavingsButton.addEventListener('click', () => {
        const selectedCurrencyText = customCurrencySelect.options[customCurrencySelect.selectedIndex].textContent;
        const selectedCurrencyValue = parseFloat(customCurrencySelect.value);
        const quantity = parseFloat(quantityInput.value);

        if (selectedCurrencyText && !isNaN(selectedCurrencyValue) && !isNaN(quantity)) {
            const total = (quantity * selectedCurrencyValue).toFixed(2);
            addRowToSavingsTable(selectedCurrencyText, quantity, total);
            updateTotalSavings();
            quantityInput.value = '';
        }
    });

    // Add goal
    addGoalButton.addEventListener('click', () => {
        const goalText = goalInput.value;
        const goalAmount = parseFloat(goalAmountInput.value);

        if (goalText && !isNaN(goalAmount)) {
            addRowToGoalsTable(goalText, goalAmount);
            saveGoals();
            goalInput.value = '';
            goalAmountInput.value = '';
        }
    });

    // Add row to savings table
    function addRowToSavingsTable(currency, quantity, total) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${currency}</td>
            <td>${quantity}</td>
            <td>${formatTL.format(total)}</td>
            <td><button class="btn btn-danger btn-sm delete-savings">X</button></td>
        `;
        row.querySelector('.delete-savings').addEventListener('click', () => {
            row.remove();
            updateTotalSavings();
            saveSavings();
        });
        savingsTableBody.appendChild(row);
        saveSavings();
    }

    // Add row to goals table
    function addRowToGoalsTable(goal, amount) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${goal}</td>
            <td>${formatTL.format(amount)}</td>
            <td><button class="btn btn-danger btn-sm delete-goal">X</button></td>
        `;
        row.querySelector('.delete-goal').addEventListener('click', () => {
            row.remove();
            saveGoals();
        });
        goalsTableBody.appendChild(row);
        saveGoals();
    }

    // Update total savings
    function updateTotalSavings() {
        let total = 0;
        document.querySelectorAll('#savingsTable tbody tr').forEach(row => {
            const totalCell = row.children[2].textContent;
            
            const amount = parseCurrencyToNumber(totalCell);
            total += amount;
        });
        totalSavingsSpan.textContent = formatTL.format(total);

        let goalsTotal = 0;
        document.querySelectorAll('#goalsTable tbody tr').forEach(row => {
            const totalCell = row.children[1].textContent;
            const amount = parseCurrencyToNumber(totalCell);
            goalsTotal += amount;
        });
        moneyLeftSpan.textContent = formatTL.format(goalsTotal - total);

    }

    // Save custom currencies to local storage
    function saveCustomCurrencies(currencies) {
        localStorage.setItem('customCurrencies', JSON.stringify(currencies));
    }

    // Get custom currencies from local storage
    function getCustomCurrencies() {
        const jsonStr = localStorage.getItem('customCurrencies');
        if (jsonStr === '{}' || !jsonStr) return null;
        return JSON.parse(jsonStr);
    }

    // update currencies by latest rates
    function updateCurrencies(customCurrencies) {
        for (const currency in customCurrencies) {
            if(rates[currency]) {
                customCurrencies[currency] = (1 / rates[currency]).toFixed(2);
            }
        }
        saveCustomCurrencies(customCurrencies);     
    }

    // Load custom currencies
    function loadCustomCurrencies() {
        const customCurrencies = getCustomCurrencies();
        if (!customCurrencies) {
            addPredefinedCurrencies();
            customCurrencies = getCustomCurrencies();
        }
        else {
            updateCurrencies(customCurrencies);
        }
        customCurrencySelect.innerHTML = '';

        for (const currency in customCurrencies) {
            addOptionToCustomCurrencies(currency, customCurrencies[currency]);
        }
    }

    function addOptionToCustomCurrencies(currency, value) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = currency;
        customCurrencySelect.appendChild(option);
    }

    // Save savings to local storage
    function saveSavings() {
        const savings = [];
        document.querySelectorAll('#savingsTable tbody tr').forEach(row => {
            const currency = row.children[0].textContent;
            const quantity = parseFloat(row.children[1].textContent);
            const total = parseCurrencyToNumber(row.children[2].textContent);
            savings.push({ currency, quantity, total });
        });
        localStorage.setItem('savings', JSON.stringify(savings));
    }

    // Load savings from local storage
    function loadSavings() {
        const savings = JSON.parse(localStorage.getItem('savings')) || [];
        savings.forEach(({ currency, quantity, total }) => {
            if(rates[currency]) {
                total = (quantity / rates[currency]).toFixed(2);
            }
            addRowToSavingsTable(currency, quantity, total);
        });
        updateTotalSavings();
    }

    // Save goals to local storage
    function saveGoals() {
        const goals = [];
        document.querySelectorAll('#goalsTable tbody tr').forEach(row => {
            const goal = row.children[0].textContent;
            const amount = parseCurrencyToNumber(row.children[1].textContent);
            goals.push({ goal, amount });
        });
        localStorage.setItem('goals', JSON.stringify(goals));
    }

    // Load goals from local storage
    function loadGoals() {
        const goals = JSON.parse(localStorage.getItem('goals')) || [];
        goals.forEach(({ goal, amount }) => {
            addRowToGoalsTable(goal, amount);
        });
    }

    // Initialize the app
    fetchRates();
});
