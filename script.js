<script>
// items.json data (editable)
const ITEMS_DATA = {
    "parts": [
        {
            "id": "oil_filter",
            "name": "Oil Filter",
            "price": 12.99
        },
        {
            "id": "air_filter",
            "name": "Air Filter",
            "price": 18.50
        },
        {
            "id": "brake_pads",
            "name": "Brake Pads (Set)",
            "price": 65.00
        },
        {
            "id": "brake_rotors",
            "name": "Brake Rotors (Pair)",
            "price": 95.00
        },
        {
            "id": "spark_plugs",
            "name": "Spark Plugs (Set of 4)",
            "price": 32.00
        },
        {
            "id": "battery",
            "name": "Car Battery",
            "price": 145.00
        },
        {
            "id": "wiper_blades",
            "name": "Wiper Blades (Pair)",
            "price": 28.00
        },
        {
            "id": "cabin_filter",
            "name": "Cabin Air Filter",
            "price": 22.50
        },
        {
            "id": "motor_oil",
            "name": "Motor Oil (5 Quarts)",
            "price": 35.00
        },
        {
            "id": "coolant",
            "name": "Coolant (1 Gallon)",
            "price": 18.00
        },
        {
            "id": "transmission_fluid",
            "name": "Transmission Fluid",
            "price": 24.00
        },
        {
            "id": "serpentine_belt",
            "name": "Serpentine Belt",
            "price": 42.00
        },
        {
            "id": "tire",
            "name": "Tire",
            "price": 125.00
        },
        {
            "id": "headlight_bulb",
            "name": "Headlight Bulb",
            "price": 15.00
        },
        {
            "id": "taillight_bulb",
            "name": "Taillight Bulb",
            "price": 8.50
        }
    ]
};


// script.js
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('workOrderForm');
    const successMessage = document.getElementById('successMessage');
    const partsContainer = document.getElementById('partsContainer');
    const addPartBtn = document.getElementById('addPartBtn');
    const partsSubtotal = document.getElementById('partsSubtotal');
    const totalCharged = document.getElementById('totalCharged');
    const laborCost = document.getElementById('laborCost');

    let partCounter = 0;

    // Set current date and time as defaults
    const now = new Date();
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');

    dateInput.valueAsDate = now;
    timeInput.value = now.toTimeString().slice(0, 5);

    // Add part row
    function addPartRow() {
        partCounter++;
        const partRow = document.createElement('div');
        partRow.className = 'part-row';
        partRow.dataset.partId = partCounter;

        partRow.innerHTML = `
            <select class="part-select" data-row="${partCounter}" required>
                <option value="">-- Select Part --</option>
                ${ITEMS_DATA.parts.map(part =>
                    `<option value="${part.id}" data-price="${part.price}">${part.name} - $${part.price.toFixed(2)}</option>`
                ).join('')}
            </select>
            <input type="number" class="qty-input" placeholder="Qty" min="1" value="1" data-row="${partCounter}" required>
            <input type="text" class="price-display" placeholder="$0.00" readonly data-row="${partCounter}">
            <button type="button" class="btn-remove-part" data-row="${partCounter}">Remove</button>
        `;

        partsContainer.appendChild(partRow);

        // Add event listeners
        const select = partRow.querySelector('.part-select');
        const qtyInput = partRow.querySelector('.qty-input');
        const priceDisplay = partRow.querySelector('.price-display');
        const removeBtn = partRow.querySelector('.btn-remove-part');

        select.addEventListener('change', function() {
            updatePartPrice(partCounter);
            calculateTotals();
        });

        qtyInput.addEventListener('input', function() {
            updatePartPrice(partCounter);
            calculateTotals();
        });

        removeBtn.addEventListener('click', function() {
            partRow.remove();
            calculateTotals();
        });
    }

    // Update individual part price
    function updatePartPrice(rowId) {
        const select = document.querySelector(`.part-select[data-row="${rowId}"]`);
        const qtyInput = document.querySelector(`.qty-input[data-row="${rowId}"]`);
        const priceDisplay = document.querySelector(`.price-display[data-row="${rowId}"]`);

        const selectedOption = select.options[select.selectedIndex];
        const price = parseFloat(selectedOption.dataset.price) || 0;
        const qty = parseInt(qtyInput.value) || 0;
        const total = price * qty;

        priceDisplay.value = `$${total.toFixed(2)}`;
    }

    // Calculate totals
    function calculateTotals() {
        let partsTotal = 0;
        const priceDisplays = document.querySelectorAll('.price-display');

        priceDisplays.forEach(display => {
            const value = display.value.replace('$', '');
            partsTotal += parseFloat(value) || 0;
        });

        partsSubtotal.textContent = partsTotal.toFixed(2);

        const labor = parseFloat(laborCost.value) || 0;
        const grandTotal = partsTotal + labor;
        totalCharged.value = `$${grandTotal.toFixed(2)}`;
    }

    // Labor cost change listener
    laborCost.addEventListener('input', calculateTotals);

    // Add part button
    addPartBtn.addEventListener('click', addPartRow);

    // Add initial part row
    addPartRow();

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Collect parts data
        const parts = [];
        const partRows = document.querySelectorAll('.part-row');

        partRows.forEach(row => {
            const select = row.querySelector('.part-select');
            const qtyInput = row.querySelector('.qty-input');
            const priceDisplay = row.querySelector('.price-display');

            if (select.value) {
                const selectedOption = select.options[select.selectedIndex];
                parts.push({
                    name: selectedOption.text.split(' - ')[0],
                    unitPrice: parseFloat(selectedOption.dataset.price),
                    quantity: parseInt(qtyInput.value),
                    total: parseFloat(priceDisplay.value.replace('$', ''))
                });
            }
        });

        // Collect form data
        const formData = {
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            vehicle: document.getElementById('vehicle').value,
            plate: document.getElementById('plate').value,
            jobType: document.getElementById('jobType').value,
            workPerformed: document.getElementById('workPerformed').value,
            parts: parts,
            partsSubtotal: parseFloat(partsSubtotal.textContent),
            laborCost: parseFloat(laborCost.value) || 0,
            totalCharged: totalCharged.value,
            customerName: document.getElementById('customerName').value,
            location: document.getElementById('location').value,
            notes: document.getElementById('notes').value
        };

        console.log('Work Order Submitted:', formData);

        // Show success message
        successMessage.classList.remove('hidden');

        // Hide success message after 3 seconds
        setTimeout(function() {
            successMessage.classList.add('hidden');
        }, 3000);
    });

    // Reset form handler
    form.addEventListener('reset', function() {
        setTimeout(function() {
            // Clear parts container and add one row
            partsContainer.innerHTML = '';
            partCounter = 0;
            addPartRow();
            calculateTotals();

            // Reset date/time to current
            dateInput.valueAsDate = new Date();
            timeInput.value = new Date().toTimeString().slice(0, 5);
        }, 0);
    });
});
</script>


