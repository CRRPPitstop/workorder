script>
// script.js

// ===== CONFIGURATION =====
const CONFIG = {
    DISCORD_WEBHOOK_URL: 'YOUR_DISCORD_WEBHOOK_URL_HERE', // Replace with your webhook URL
    AUTO_SAVE_ENABLED: false // Set to true to enable auto-save to localStorage
};

// ===== STATE =====
let partCounter = 0;
const state = {
    parts: []
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    addPartRow(); // Add initial part row
});

function initializeForm() {
    const now = new Date();
    document.getElementById('date').valueAsDate = now;
    document.getElementById('time').value = now.toTimeString().slice(0, 5);
}

function setupEventListeners() {
    document.getElementById('addPartBtn').addEventListener('click', addPartRow);
    document.getElementById('laborCost').addEventListener('input', calculateTotals);
    document.getElementById('workOrderForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('workOrderForm').addEventListener('reset', handleFormReset);
}

// ===== PARTS MANAGEMENT =====
function addPartRow() {
    partCounter++;
    const partRow = document.createElement('div');
    partRow.className = 'part-row';
    partRow.dataset.partId = partCounter;

    partRow.innerHTML = `
        <select class="part-select" data-row="${partCounter}" required>
            <option value="">Select a part...</option>
            ${ITEMS_DATA.parts.map(part =>
                `<option value="${part.id}" data-price="${part.price}" data-name="${part.name}">${part.name} - $${part.price.toFixed(2)}</option>`
            ).join('')}
        </select>
        <input type="number" class="qty-input" placeholder="Qty" min="1" value="1" data-row="${partCounter}" required>
        <input type="text" class="price-display" placeholder="$0.00" readonly data-row="${partCounter}">
        <button type="button" class="btn-remove" data-row="${partCounter}">Remove</button>
    `;

    document.getElementById('partsContainer').appendChild(partRow);

    const select = partRow.querySelector('.part-select');
    const qtyInput = partRow.querySelector('.qty-input');
    const removeBtn = partRow.querySelector('.btn-remove');

    select.addEventListener('change', () => {
        updatePartPrice(partCounter);
        calculateTotals();
    });

    qtyInput.addEventListener('input', () => {
        updatePartPrice(partCounter);
        calculateTotals();
    });

    removeBtn.addEventListener('click', () => {
        partRow.remove();
        calculateTotals();
    });
}

function updatePartPrice(rowId) {
    const select = document.querySelector(`.part-select[data-row="${rowId}"]`);
    const qtyInput = document.querySelector(`.qty-input[data-row="${rowId}"]`);
    const priceDisplay = document.querySelector(`.price-display[data-row="${rowId}"]`);

    if (!select || !qtyInput || !priceDisplay) return;

    const selectedOption = select.options[select.selectedIndex];
    const price = parseFloat(selectedOption.getAttribute('data-price')) || 0;
    const qty = parseInt(qtyInput.value) || 0;
    const total = price * qty;

    priceDisplay.value = `$${total.toFixed(2)}`;
}

function calculateTotals() {
    let partsTotal = 0;
    const priceDisplays = document.querySelectorAll('.price-display');

    priceDisplays.forEach(display => {
        const value = display.value.replace(/[$,]/g, '');
        partsTotal += parseFloat(value) || 0;
    });

    document.getElementById('partsSubtotal').textContent = partsTotal.toFixed(2);

    const labor = parseFloat(document.getElementById('laborCost').value) || 0;
    const grandTotal = partsTotal + labor;
    document.getElementById('totalCharged').value = `$${grandTotal.toFixed(2)}`;
}

// ===== DATA COLLECTION =====
function collectFormData() {
    const parts = [];
    const partRows = document.querySelectorAll('.part-row');

    partRows.forEach(row => {
        const select = row.querySelector('.part-select');
        const qtyInput = row.querySelector('.qty-input');
        const priceDisplay = row.querySelector('.price-display');

        if (select && select.value) {
            const selectedOption = select.options[select.selectedIndex];
            const partName = selectedOption.getAttribute('data-name') || selectedOption.textContent.split(' - ')[0];
            const unitPrice = parseFloat(selectedOption.getAttribute('data-price')) || 0;
            const quantity = parseInt(qtyInput.value) || 1;
            const total = parseFloat(priceDisplay.value.replace(/[$,]/g, '')) || 0;

            parts.push({
                id: select.value,
                name: partName,
                unitPrice: unitPrice,
                quantity: quantity,
                total: total
            });
        }
    });

    return {
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        vehicle: document.getElementById('vehicle').value,
        plate: document.getElementById('plate').value,
        jobType: document.getElementById('jobType').value,
        workPerformed: document.getElementById('workPerformed').value,
        parts: parts,
        partsSubtotal: parseFloat(document.getElementById('partsSubtotal').textContent) || 0,
        laborCost: parseFloat(document.getElementById('laborCost').value) || 0,
        totalCharged: document.getElementById('totalCharged').value,
        customerName: document.getElementById('customerName').value,
        location: document.getElementById('location').value,
        notes: document.getElementById('notes').value,
        timestamp: new Date().toISOString()
    };
}

// ===== FORM HANDLERS =====
async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = collectFormData();
    console.log('Work Order Data:', formData);

    if (CONFIG.DISCORD_WEBHOOK_URL && CONFIG.DISCORD_WEBHOOK_URL !== 'https://discord.com/api/webhooks/1448101821804445886/HAOQ986Ft1L_nUkZSVb5EzcHWP70Mua-eq9zG-lMkkRJ8hIe-cF1d9ipJyNuHwQzDMDT') {
        await sendToDiscord(formData);
    } else {
        showStatus('Work order data collected (Discord webhook not configured)', 'success');
        console.log('To enable Discord submission, set your webhook URL in CONFIG.DISCORD_WEBHOOK_URL');
    }
}

function handleFormReset() {
    setTimeout(() => {
        document.getElementById('partsContainer').innerHTML = '';
        partCounter = 0;
        addPartRow();
        calculateTotals();
        initializeForm();
    }, 0);
}

// ===== DISCORD INTEGRATION =====
async function sendToDiscord(data) {
    let partsText = 'No parts used';

    if (data.parts && data.parts.length > 0) {
        partsText = data.parts.map(part =>
            `• **${part.name}** x${part.quantity} @ $${part.unitPrice.toFixed(2)} = $${part.total.toFixed(2)}`
        ).join('\n');

        if (partsText.length > 1000) {
            partsText = partsText.substring(0, 997) + '...';
        }
    }

    const embed = {
        title: '🔧 New Vehicle Work Order',
        color: 6667498,
        fields: [
            {
                name: '📅 Date & Time',
                value: `${data.date} at ${data.time}`,
                inline: false
            },
            {
                name: '🚗 Vehicle',
                value: `**${data.vehicle}**\nPlate: ${data.plate}`,
                inline: true
            },
            {
                name: '🔨 Job Type',
                value: data.jobType,
                inline: true
            },
            {
                name: '👤 Customer',
                value: data.customerName,
                inline: true
            },
            {
                name: '📝 Work Performed',
                value: data.workPerformed.substring(0, 1024),
                inline: false
            },
            {
                name: '🔩 Parts Used',
                value: partsText,
                inline: false
            },
            {
                name: '💰 Costs',
                value: `Parts: $${data.partsSubtotal.toFixed(2)}\nLabor: $${data.laborCost.toFixed(2)}\n**Total: ${data.totalCharged}**`,
                inline: false
            }
        ],
        timestamp: data.timestamp,
        footer: {
            text: 'Vehicle Work Order System'
        }
    };

    if (data.location && data.location.trim()) {
        embed.fields.push({
            name: '📍 Tow Location',
            value: data.location,
            inline: false
        });
    }

    if (data.notes && data.notes.trim()) {
        embed.fields.push({
            name: '📋 Notes',
            value: data.notes.substring(0, 1024),
            inline: false
        });
    }

    try {
        const response = await fetch(CONFIG.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ embeds: [embed] })
        });

        if (response.ok) {
            showStatus('Work order submitted successfully to Discord!', 'success');
        } else {
            throw new Error(`HTTP error ${response.status}`);
        }
    } catch (error) {
        console.error('Discord submission error:', error);
        showStatus('Error submitting to Discord. Check console for details.', 'error');
    }
}

// ===== UI HELPERS =====
function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message show ${type}`;

    setTimeout(() => {
        statusEl.classList.remove('show');
    }, type === 'success' ? 3000 : 5000);
}
</script>
