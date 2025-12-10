const WEBHOOK_URL = "https://discord.com/api/webhooks/1448101821804445886/HAOQ986Ft1L_nUkZSVb5EzcHWP70Mua-eq9zG-lMkkRJ8hIe-cF1d9ipJyNuHwQzDMDT";

/* Load available parts from items.json */
let partsData = [];

fetch("items.json")
    .then(res => res.json())
    .then(data => {
        partsData = data;
        populatePartsDropdown();
    })
    .catch(err => {
        console.error("Error loading items.json:", err);
        document.getElementById("partsDropdown").innerHTML =
            "<option>Error loading items</option>";
    });

function populatePartsDropdown() {
    const dropdown = document.getElementById("partsDropdown");
    dropdown.innerHTML = '<option value="">Select part...</option>';

    partsData.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.name} - $${p.price.toFixed(2)}`;
        opt.dataset.price = p.price;
        dropdown.appendChild(opt);
    });
}

const partsUsed = [];
const partsTableBody = document.querySelector("#partsTable tbody");
const subtotalEl = document.getElementById("partsSubtotal");

document.getElementById("addPartBtn").addEventListener("click", addPart);

function addPart() {
    const dropdown = document.getElementById("partsDropdown");
    const qty = parseInt(document.getElementById("partQty").value) || 1;

    if (!dropdown.value) return;

    const part = partsData.find(p => p.id === dropdown.value);
    const lineTotal = part.price * qty;

    partsUsed.push({
        name: part.name,
        price: part.price,
        qty,
        lineTotal
    });

    renderParts();
}

function renderParts() {
    partsTableBody.innerHTML = "";
    let subtotal = 0;

    partsUsed.forEach((p, index) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${p.name}</td>
            <td>$${p.price.toFixed(2)}</td>
            <td>${p.qty}</td>
            <td>$${p.lineTotal.toFixed(2)}</td>
            <td><button data-i="${index}" class="remove-btn">X</button></td>
        `;

        partsTableBody.appendChild(tr);
        subtotal += p.lineTotal;
    });

    subtotalEl.textContent = subtotal.toFixed(2);

    document.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            partsUsed.splice(btn.dataset.i, 1);
            renderParts();
        });
    });
}

/* Submit to Discord */
document.getElementById("serviceForm").addEventListener("submit", async e => {
    e.preventDefault();

    const payload = {
        embeds: [
            {
                title: "Vehicle Service Report",
                color: 3447003,
                fields: [
                    { name: "Date", value: date.value },
                    { name: "Time", value: time.value },
                    { name: "Vehicle", value: vehicle.value },
                    { name: "Plate #", value: plate.value },
                    { name: "Job Type", value: jobType.value },
                    { name: "Work Performed", value: workPerformed.value },
                    {
                        name: "Parts Used",
                        value:
                            partsUsed.length === 0
                                ? "None"
                                : partsUsed
                                      .map(p => `${p.name} x${p.qty} — $${p.lineTotal.toFixed(2)}`)
                                      .join("\n")
                    },
                    { name: "Total Charged", value: `$${Number(totalCharged.value).toFixed(2)}` },
                    { name: "Customer", value: customer.value },
                    { name: "Location", value: location.value || "N/A" },
                    { name: "Notes", value: notes.value || "None" }
                ]
            }
        ]
    };

    try {
        const res = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Webhook failed");

        showMessage("Report submitted!", "success");
    } catch (err) {
        console.error(err);
        showMessage("Error sending report.", "error");
    }
});

function showMessage(msg, type) {
    const box = document.getElementById("message");
    box.textContent = msg;
    box.className = `message ${type}`;
}
