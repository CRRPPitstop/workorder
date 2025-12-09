<script>
// DEFINE YOUR DISCORD WEBHOOK URL HERE
const DISCORD_WEBHOOK_URL = 'YOUR_WEBHOOK_URL_HERE';

// Load items from items.json
let partsData = [];

async function loadItemsData() {
    try {
        const response = await fetch('items.json');
        partsData = await response.json();
    } catch (e) {
        console.log('items.json not found, using manual entry');
    }
}

loadItemsData();

function addPart() {
    const container = document.getElementById('partsContainer');
    const partEntry = document.createElement('div');
    partEntry.className = 'part-entry';
    partEntry.innerHTML = `
        <input type="text" class="part-name" placeholder="Part name" required>
        <input type="number" class="part-cost" placeholder="Cost" step="0.01" min="0" required>
        <button type="button" class="remove-part" onclick="removePart(this)">Remove</button>
    `;
    container.appendChild(partEntry);
}

function removePart(button) {
    const container = document.getElementById('partsContainer');
    if (container.children.length > 1) {
        button.parentElement.remove();
    } else {
        alert('At least one part entry is required');
    }
}

document.getElementById('serviceForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const messageDiv = document.getElementById('message');
    messageDiv.className = 'message';
    messageDiv.style.display = 'none';

    // Collect form data
    const formData = {
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        vehicle: document.getElementById('vehicle').value,
        plate: document.getElementById('plate').value,
        jobType: document.getElementById('jobType').value,
        workPerformed: document.getElementById('workPerformed').value,
        parts: [],
        totalCharged: document.getElementById('totalCharged').value,
        customerName: document.getElementById('customerName').value,
        location: document.getElementById('location').value,
        notes: document.getElementById('notes').value
    };

    // Collect parts
    const partEntries = document.querySelectorAll('.part-entry');
    partEntries.forEach(entry => {
        const name = entry.querySelector('.part-name').value;
        const cost = entry.querySelector('.part-cost').value;
        formData.parts.push({ name, cost: parseFloat(cost) });
    });

    // Create Discord embed
    const partsText = formData.parts.map(p => `${p.name}: $${p.cost.toFixed(2)}`).join('\n');
    const partsTotal = formData.parts.reduce((sum, p) => sum + p.cost, 0);

    const embed = {
        title: "🔧 Vehicle Service Report",
        color: 6722202,
        fields: [
            { name: "📅 Date", value: formData.date, inline: true },
            { name: "🕐 Time", value: formData.time, inline: true },
            { name: "🚗 Vehicle", value: formData.vehicle, inline: true },
            { name: "🔢 Plate #", value: formData.plate, inline: true },
            { name: "🛠️ Job Type", value: formData.jobType, inline: true },
            { name: "👤 Customer", value: formData.customerName, inline: true },
            { name: "📝 Work Performed", value: formData.workPerformed, inline: false },
            { name: "🔩 Parts Used / Costs", value: partsText || "None", inline: false },
            { name: "💰 Parts Total", value: `$${partsTotal.toFixed(2)}`, inline: true },
            { name: "💵 Total Charged", value: `$${parseFloat(formData.totalCharged).toFixed(2)}`, inline: true }
        ],
        timestamp: new Date().toISOString()
    };

    if (formData.location) {
        embed.fields.push({ name: "📍 Location (Tow)", value: formData.location, inline: false });
    }

    if (formData.notes) {
        embed.fields.push({ name: "📋 Notes", value: formData.notes, inline: false });
    }

    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                embeds: [embed]
            })
        });

        if (response.ok || response.status === 204) {
            messageDiv.textContent = '✅ Report submitted successfully!';
            messageDiv.className = 'message success';
            document.getElementById('serviceForm').reset();

            // Reset parts container to one entry
            const container = document.getElementById('partsContainer');
            container.innerHTML = `
                <div class="part-entry">
                    <input type="text" class="part-name" placeholder="Part name" required>
                    <input type="number" class="part-cost" placeholder="Cost" step="0.01" min="0" required>
                    <button type="button" class="remove-part" onclick="removePart(this)">Remove</button>
                </div>
            `;
        } else {
            throw new Error('Failed to send to Discord');
        }
    } catch (error) {
        messageDiv.textContent = '❌ Error submitting report. Please check your webhook URL.';
        messageDiv.className = 'message error';
    }
});

// Set default date and time
document.getElementById('date').valueAsDate = new Date();
const now = new Date();
document.getElementById('time').value = now.toTimeString().slice(0, 5);
</script>
</body>
</html>
