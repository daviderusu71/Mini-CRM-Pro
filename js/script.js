// ======================
// INITIAL DATA
// ======================

let clients = JSON.parse(localStorage.getItem("clients")) || [];
let chart;

// DOM
const clientList = document.getElementById("clientList");
const clientName = document.getElementById("clientName");
const clientEmail = document.getElementById("clientEmail");
const clientStatus = document.getElementById("clientStatus");
const clientValue = document.getElementById("clientValue");
const clientTags = document.getElementById("clientTags");
const addClientBtn = document.getElementById("addClient");

const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const sortClients = document.getElementById("sortClients");

const totalClients = document.getElementById("totalClients");
const totalLeads = document.getElementById("totalLeads");
const totalActive = document.getElementById("totalActive");
const totalLost = document.getElementById("totalLost");
const totalRevenue = document.getElementById("totalRevenue");

const themeToggle = document.getElementById("themeToggle");
const exportBtn = document.getElementById("exportCSV");
const toast = document.getElementById("toast");

// ======================
// UTILS
// ======================

function saveClients() {
    localStorage.setItem("clients", JSON.stringify(clients));
}

function showToast(message) {
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}

// ======================
// RENDER
// ======================

function renderClients() {

    let filtered = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchInput.value.toLowerCase());
        const matchesFilter = filterStatus.value === "All" || client.status === filterStatus.value;
        return matchesSearch && matchesFilter;
    });

    // SORT
    if (sortClients.value === "az") {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortClients.value === "za") {
        filtered.sort((a, b) => b.name.localeCompare(a.name));
    }

    clientList.innerHTML = "";

    if (filtered.length === 0) {
        clientList.innerHTML = `
            <div class="empty-state">
                <h3>Niciun client încă</h3>
                <p>Adaugă primul client pentru a începe.</p>
            </div>
        `;
        updateStats();
        return;
    }

    filtered.forEach((client) => {

        const div = document.createElement("div");
        div.classList.add("client-card");

        div.innerHTML = `
            <div class="client-info">
                <strong>${client.name}</strong>
                <span>${client.email}</span>

                <div class="tags">
                    ${(client.tags || []).map(tag =>
                        `<span class="tag">${tag}</span>`
                    ).join("")}
                </div>

                <span class="status ${client.status}">${client.status}</span>
                <small>€${client.value || 0}</small>
            </div>

            <div class="client-actions">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Șterge</button>
            </div>
        `;

        div.querySelector(".edit-btn").addEventListener("click", () => {
            editClient(client.id);
        });

        div.querySelector(".delete-btn").addEventListener("click", () => {
            deleteClient(client.id);
        });

        clientList.appendChild(div);
    });

    updateStats();
}

// ======================
// ADD CLIENT
// ======================

addClientBtn.addEventListener("click", () => {

    if (!clientName.value || !clientEmail.value) return;

    clients.push({
        id: Date.now(),
        name: clientName.value,
        email: clientEmail.value,
        status: clientStatus.value,
        value: parseFloat(clientValue.value) || 0,
        tags: clientTags.value
            ? clientTags.value.split(",").map(tag => tag.trim())
            : []
    });

    saveClients();
    renderClients();

    clientName.value = "";
    clientEmail.value = "";
    clientValue.value = "";
    clientTags.value = "";

    showToast("Client adăugat cu succes!");
});

// ======================
// DELETE
// ======================

function deleteClient(id) {

    const confirmDelete = confirm("Sigur vrei să ștergi acest client?");
    if (!confirmDelete) return;

    clients = clients.filter(client => client.id !== id);

    saveClients();
    renderClients();
    showToast("Client șters!");
}

// ======================
// EDIT
// ======================

function editClient(id) {

    const client = clients.find(c => c.id === id);
    if (!client) return;

    clientName.value = client.name;
    clientEmail.value = client.email;
    clientStatus.value = client.status;
    clientValue.value = client.value || 0;
    clientTags.value = (client.tags || []).join(", ");

    clients = clients.filter(c => c.id !== id);

    saveClients();
    renderClients();
}

// ======================
// STATS + CHART
// ======================

function updateStats() {

    const leads = clients.filter(c => c.status === "Lead").length;
    const active = clients.filter(c => c.status === "Activ").length;
    const lost = clients.filter(c => c.status === "Pierdut").length;
    const revenue = clients.reduce((sum, c) => sum + (c.value || 0), 0);

    totalClients.innerText = clients.length;
    totalLeads.innerText = leads;
    totalActive.innerText = active;
    totalLost.innerText = lost;
    totalRevenue.innerText = "€" + revenue.toFixed(2);

    const ctx = document.getElementById("crmChart");
    if (!ctx) return;

    // CREATE ONLY ONCE
    if (!chart) {
        chart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Lead", "Activ", "Pierdut"],
                datasets: [{
                    data: [leads, active, lost],
                    backgroundColor: ["#f59e0b", "#22c55e", "#ef4444"],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "70%",
                animation: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: document.body.classList.contains("light") ? "#111" : "#fff"
                        }
                    }
                }
            },
            plugins: [{
                id: "centerText",
                beforeDraw(chart) {

                    const { width, height } = chart;
                    const ctx = chart.ctx;

                    const total = leads + active + lost;
                    const percent = total === 0 ? 0 : Math.round((active / total) * 100);

                    ctx.save();
                    ctx.font = "bold 28px Segoe UI";
                    ctx.fillStyle = document.body.classList.contains("light") ? "#111" : "#fff";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(percent + "%", width / 2, height / 2);
                    ctx.restore();
                }
            }]
        });

    } else {
        // UPDATE DATA ONLY
        chart.data.datasets[0].data = [leads, active, lost];
        chart.update();
    }
}

// ======================
// SEARCH + FILTER + SORT
// ======================

searchInput.addEventListener("input", renderClients);
filterStatus.addEventListener("change", renderClients);
sortClients.addEventListener("change", renderClients);

// ======================
// EXPORT CSV
// ======================

exportBtn.addEventListener("click", () => {

    if (clients.length === 0) return;

    let csv = "Nume,Email,Status,Valoare\n";

    clients.forEach(c => {
        csv += `${c.name},${c.email},${c.status},${c.value}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "clienti.csv";
    a.click();

    showToast("CSV exportat!");
});

// ======================
// THEME
// ======================

if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");

    if (document.body.classList.contains("light")) {
        localStorage.setItem("theme", "light");
    } else {
        localStorage.setItem("theme", "dark");
    }
});

// INIT
renderClients();