let investmentData = [];
let autoSaveTimeout;
let config = {
  apiKey: localStorage.getItem('jsonbin_apikey') || '',
  binId: localStorage.getItem('jsonbin_binid') || '',
  monthlyContribution: parseFloat(localStorage.getItem('monthly_contribution')) || 0
};

// Calculate running totals
function calculateTotals() {
  let totalInvested = 0;
  let balance = 0;

  investmentData.forEach((row, index) => {
    if (index > 0) {
      totalInvested += row.actual + row.dividend;
      balance = totalInvested;
      row.totalInvested = totalInvested;
      row.balance = balance;
      row.monthlyDividend = balance * 0.115 / 12;
      row.remaining = 230000 - balance;
    } else {
      row.totalInvested = 0;
      row.balance = 0;
      row.monthlyDividend = 0;
      row.remaining = 230000;
    }
  });
}

// Calculate average of last 3 contributions
function calculateAverageContribution() {
  const actualContributions = investmentData
    .filter(row => row.actual > 0 && row.month > 0)
    .slice(-3)
    .map(row => row.actual);

  if (actualContributions.length > 0) {
    return actualContributions.reduce((sum, val) => sum + val, 0) / actualContributions.length;
  }
  return 6500; // Default if no contributions yet
}

// Update summary
function updateSummary() {
  const lastActualRow = investmentData.filter(row => row.actual > 0).pop();
  const currentBalance = lastActualRow ? lastActualRow.balance : 0;
  const remaining = 230000 - currentBalance;
  const progress = (currentBalance / 230000) * 100;
  const monthlyDividend = currentBalance * 0.115 / 12;

  // Use stored contribution or calculate average
  let monthlyContribution = config.monthlyContribution;
  if (!monthlyContribution || monthlyContribution === 0) {
    monthlyContribution = calculateAverageContribution();
    config.monthlyContribution = monthlyContribution;
    document.getElementById('monthlyContribution').value = Math.round(monthlyContribution);
  }

  const monthsToTarget = monthlyContribution > 0 ? remaining / monthlyContribution : 0;

  document.getElementById('currentBalance').textContent = `$${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById('remainingGoal').textContent = `$${remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById('progress').textContent = `${progress.toFixed(2)}%`;
  document.getElementById('monthlyDividend').textContent = `$${monthlyDividend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById('monthsToTarget').textContent = monthlyContribution > 0 ? Math.ceil(monthsToTarget) : '∞';
}

// Render table
function renderTable() {
  const tbody = document.querySelector('#investmentTable tbody');
  tbody.innerHTML = '';

  investmentData.forEach((row, index) => {
    const tr = document.createElement('tr');
    const isDividendMonth = row.month > 0 && row.month % 3 === 0;
    const isFuture = row.actual === 0 && index > 2;

    if (isDividendMonth) tr.classList.add('dividend-quarter');
    if (isFuture) tr.classList.add('future-row');

    tr.innerHTML = `
            <td>${row.month}</td>
            <td>${row.date}</td>
            <td>${row.month === 0 ? '-' : `$${row.target.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</td>
            <td class="${index > 0 ? 'editable' : ''}" data-field="contribution" data-index="${index}">
                ${row.month === 0 ? '-' : `$${row.actual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </td>
            <td class="${index > 0 ? 'editable' : ''}" data-field="dividend" data-index="${index}">
                ${row.month === 0 ? '-' : `$${row.dividend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </td>
            <td>$${row.totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>$${row.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>$${row.monthlyDividend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>$${row.remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="${index > 0 ? 'editable notes' : 'notes'}" data-field="notes" data-index="${index}">${row.notes}</td>
        `;

    tbody.appendChild(tr);
  });
}

// Auto-save function
function autoSave() {
  clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    if (config.apiKey && config.binId) {
      saveToJSONBin(true); // true = auto-save mode (silent)
    }
  }, 2000); // Save 2 seconds after last edit
}

// Handle cell editing (both click and touch)
['click', 'touchend'].forEach(eventType => {
  document.addEventListener(eventType, function (e) {
    if (e.target.classList.contains('editable') && !e.target.querySelector('input')) {
      // Prevent default touch behavior
      if (eventType === 'touchend') {
        e.preventDefault();
      }

      const field = e.target.dataset.field;
      const index = parseInt(e.target.dataset.index);
      const currentValue = investmentData[index][field === 'contribution' ? 'actual' : field];

      const input = document.createElement('input');
      input.className = 'cell-input';
      input.type = field === 'notes' ? 'text' : 'number';
      input.value = field === 'notes' ? currentValue : currentValue;
      input.step = '0.01';

      // Add inputmode for better mobile keyboards
      if (field !== 'notes') {
        input.inputMode = 'decimal';
      }

      e.target.innerHTML = '';
      e.target.appendChild(input);
      input.focus();

      // Don't select on mobile to avoid issues
      if (window.innerWidth > 768) {
        input.select();
      }

      input.addEventListener('blur', function () {
        let newValue = input.value;
        if (field !== 'notes') {
          newValue = parseFloat(newValue) || 0;
        }

        if (field === 'contribution') {
          investmentData[index].actual = newValue;
        } else {
          investmentData[index][field] = newValue;
        }

        calculateTotals();
        updateSummary();
        renderTable();
        autoSave(); // Trigger auto-save
      });

      input.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
          input.blur();
        }
      });
    }
  });
});

// JSONBin functions
async function saveToJSONBin(isAutoSave = false) {
  if (!config.apiKey) {
    if (!isAutoSave) showStatus('Please configure JSONBin settings first', 'error');
    return;
  }

  try {
    const dataToSave = {
      investmentData: investmentData,
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    };

    let response;
    if (config.binId) {
      // Update existing bin
      response = await fetch(`https://api.jsonbin.io/v3/b/${config.binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': config.apiKey
        },
        body: JSON.stringify(dataToSave)
      });
    } else {
      // Create new bin
      response = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': config.apiKey,
          'X-Bin-Name': 'REIT-Investment-Tracker'
        },
        body: JSON.stringify(dataToSave)
      });
    }

    if (response.ok) {
      const result = await response.json();
      if (!config.binId && result.metadata?.id) {
        config.binId = result.metadata.id;
        localStorage.setItem('jsonbin_binid', config.binId);
      }
      if (!isAutoSave) {
        showStatus('Saved successfully!', 'success');
      }
    } else {
      throw new Error('Failed to save');
    }
  } catch (error) {
    if (!isAutoSave) {
      showStatus('Error saving: ' + error.message, 'error');
    }
  }
}

async function loadFromJSONBin() {
  if (!config.apiKey || !config.binId) {
    showStatus('Please configure JSONBin settings first', 'error');
    return;
  }

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${config.binId}/latest`, {
      headers: {
        'X-Access-Key': config.apiKey
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.record?.investmentData) {
        investmentData = result.record.investmentData;
        calculateTotals();
        updateSummary();
        renderTable();
        showStatus('Loaded successfully!', 'success');
      }
    } else {
      throw new Error('Failed to load');
    }
  } catch (error) {
    showStatus('Error loading: ' + error.message, 'error');
  }
}

// Status display
function showStatus(message, type = 'info') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status ' + type;
  setTimeout(() => {
    status.textContent = '';
    status.className = 'status';
  }, 3000);
}

// Configuration modal
function showConfig() {
  document.getElementById('apiKey').value = config.apiKey;
  document.getElementById('binId').value = config.binId;
  document.getElementById('configModal').classList.add('show');
}

function hideConfig() {
  document.getElementById('configModal').classList.remove('show');
}

function saveConfig() {
  config.apiKey = document.getElementById('apiKey').value;
  config.binId = document.getElementById('binId').value;

  localStorage.setItem('jsonbin_apikey', config.apiKey);
  localStorage.setItem('jsonbin_binid', config.binId);

  hideConfig();
  showStatus('Configuration saved!', 'success');

  // If we have data but no bin ID yet, save it
  if (config.apiKey && !config.binId) {
    saveToJSONBin();
  }
}

// Close modal when clicking outside
document.getElementById('configModal').addEventListener('click', function (e) {
  if (e.target === this) {
    hideConfig();
  }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', function () {
  // Load from JSONBin on startup
  if (config.apiKey && config.binId) {
    loadFromJSONBin();
  } else {
    // Load default data if no JSONBin configured
    loadDefaultData();
  }

  // Set up contribution input
  const contributionInput = document.getElementById('monthlyContribution');
  if (config.monthlyContribution > 0) {
    contributionInput.value = Math.round(config.monthlyContribution);
  }

  // Handle contribution input changes
  contributionInput.addEventListener('input', function () {
    const value = parseFloat(this.value) || 0;
    config.monthlyContribution = value;
    localStorage.setItem('monthly_contribution', value);
    updateSummary();
  });
});

function loadDefaultData() {
  const defaultData = {
    "investmentData": [
      {
        "month": 0,
        "date": "5/31/2025",
        "target": 0,
        "actual": 0,
        "dividend": 0,
        "notes": "Starting Point",
        "totalInvested": 0,
        "balance": 0,
        "monthlyDividend": 0,
        "remaining": 230000
      },
      {
        "month": 1,
        "date": "6/1/2025",
        "target": 6500,
        "actual": 5000,
        "dividend": 0,
        "notes": "Initial investment",
        "totalInvested": 5000,
        "balance": 5000,
        "monthlyDividend": 47.916666666666664,
        "remaining": 225000
      },
      {
        "month": 2,
        "date": "7/1/2025",
        "target": 6500,
        "actual": 2500,
        "dividend": 0,
        "notes": "July contribution",
        "totalInvested": 7500,
        "balance": 7500,
        "monthlyDividend": 71.875,
        "remaining": 222500
      },
      {
        "month": 3,
        "date": "8/1/2025",
        "target": 6500,
        "actual": 0,
        "dividend": 0,
        "notes": "Quarterly dividend",
        "totalInvested": 7500,
        "balance": 7500,
        "monthlyDividend": 71.875,
        "remaining": 222500
      },
      {
        "month": 4,
        "date": "9/1/2025",
        "target": 6500,
        "actual": 0,
        "dividend": 0,
        "notes": "",
        "totalInvested": 7500,
        "balance": 7500,
        "monthlyDividend": 71.875,
        "remaining": 222500
      },
      {
        "month": 5,
        "date": "10/1/2025",
        "target": 6500,
        "actual": 0,
        "dividend": 0,
        "notes": "",
        "totalInvested": 7500,
        "balance": 7500,
        "monthlyDividend": 71.875,
        "remaining": 222500
      },
      {
        "month": 6,
        "date": "11/1/2025",
        "target": 6500,
        "actual": 0,
        "dividend": 0,
        "notes": "Quarterly dividend",
        "totalInvested": 7500,
        "balance": 7500,
        "monthlyDividend": 71.875,
        "remaining": 222500
      }
    ]
  };

  investmentData = defaultData.investmentData;
  calculateTotals();
  updateSummary();
  renderTable();
}
