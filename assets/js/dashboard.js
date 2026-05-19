// Check if user is authenticated
if (!localStorage.getItem('currentUser')) {
    window.location.href = 'Register.html';
}

function confirmLogout() {
    Swal.fire({
        title: 'Logout Confirmation',
        text: 'Are you sure you want to logout?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, Logout',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            logout();
        }
    });
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUsername');
    localStorage.removeItem('isAuthenticated');
    window.location.href = 'Register.html';
}

const profileName = document.getElementById('profile-name');
const currentUsername = localStorage.getItem('currentUsername') || 'User';
profileName.textContent = currentUsername;

// Handle profile picture upload
document.getElementById('profilePictureInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const imageData = event.target.result;
        localStorage.setItem('profilePicture', imageData);
        
        document.getElementById('profilePicture').src = imageData;
        const settingsPic = document.getElementById('settingsProfilePicture');
        if (settingsPic) settingsPic.src = imageData;
        
        Swal.fire('Success!', 'Profile picture updated', 'success');
    };
    reader.readAsDataURL(file);
});

// Load profile picture
function loadProfilePicture() {
    const savedPicture = localStorage.getItem('profilePicture');
    if (savedPicture && savedPicture.trim()) {
        document.getElementById('profilePicture').src = savedPicture;
        const settingsPic = document.getElementById('settingsProfilePicture');
        if (settingsPic) settingsPic.src = savedPicture;
    }
}

let transactions = JSON.parse(localStorage.getItem('spendwise_final')) || [];
let currentPeriod = 'daily';
let budgetLimits = JSON.parse(localStorage.getItem('budgetLimits')) || { daily: 60, weekly: 400, monthly: 1600 };

const donutChart = new Chart(document.getElementById('expenseDonut').getContext('2d'), {
    type: 'doughnut',
    data: {
        labels: ['Food & Drinks', 'Rent', 'Bills', 'Shopping', 'Travel', 'Other'],
        datasets: [{ backgroundColor: ['#3b82f6', '#10b981', '#6366f1', '#ef4444', '#f59e0b', '#94a3b8'], data: [0, 0, 0, 0, 0, 0] }]
    },
    options: { cutout: '70%', plugins: { legend: { position: 'bottom' } } }
});

const trendChart = new Chart(document.getElementById('trendChart').getContext('2d'), {
    type: 'bar',
    data: {
        labels: [], datasets: [
            { label: 'Income', backgroundColor: '#10b981', data: [], borderRadius: 5 },
            { label: 'Expense', backgroundColor: '#ef4444', data: [], borderRadius: 5 }
        ]
    },
    options: { responsive: true, scales: { x: { grid: { display: false } } } }
});

function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
    document.getElementById(pageId + '-page').classList.add('active');
    document.getElementById('nav-' + pageId).classList.add('active');
    updateUI();

    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('menu-toggle');
    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        toggleBtn.textContent = '☰';
    }
}

function updateUI() {
    const inc = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    document.getElementById('income').textContent = `$${inc.toFixed(2)}`;
    document.getElementById('expenses').textContent = `$${exp.toFixed(2)}`;
    document.getElementById('balance').textContent = `$${(inc - exp).toFixed(2)}`;

    const todayExp = transactions.filter(t => t.type === 'expense' && moment(t.date).isSame(moment(), 'day')).reduce((s, t) => s + t.amount, 0);
    const weekExp = transactions.filter(t => t.type === 'expense' && moment(t.date).isSame(moment(), 'week')).reduce((s, t) => s + t.amount, 0);
    const monthExp = transactions.filter(t => t.type === 'expense' && moment(t.date).isSame(moment(), 'month')).reduce((s, t) => s + t.amount, 0);

    let usage = (currentPeriod === 'daily') ? todayExp : (currentPeriod === 'weekly' ? weekExp : monthExp);
    let limit = budgetLimits[currentPeriod];
    let pct = Math.min(100, (usage / limit) * 100);

    document.getElementById('budgetLabel').textContent = `${currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1)} Progress`;
    document.getElementById('budgetUsed').textContent = Math.round(pct) + '%';
    document.getElementById('budgetBar').style.width = pct + '%';
    document.getElementById('budgetBar').style.background = pct > 90 ? 'var(--danger)' : 'var(--primary)';

    const cats = ['Food & Drinks', 'Rent', 'Bills', 'Shopping', 'Travel', 'Other'];
    const data = cats.map(c => transactions.filter(t => t.type === 'expense' && t.category === c).reduce((s, t) => s + t.amount, 0));
    donutChart.data.datasets[0].data = data;
    donutChart.update();

    updateTrend();
    renderTable();
}

function updateTrend() {
    let labels = [], incD = [], expD = [];
    if (currentPeriod === 'daily') {
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const start = moment().startOf('isoWeek');
        for (let i = 0; i < 7; i++) {
            const d = start.clone().add(i, 'days');
            const dayT = transactions.filter(t => moment(t.date).isSame(d, 'day'));
            incD.push(dayT.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
            expD.push(dayT.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
        }
    } else if (currentPeriod === 'weekly') {
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        const start = moment().startOf('month');
        for (let i = 0; i < 4; i++) {
            const weekT = transactions.filter(t => moment(t.date).isBetween(start.clone().add(i, 'weeks'), start.clone().add(i + 1, 'weeks'), null, '[)'));
            incD.push(weekT.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
            expD.push(weekT.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
        }
    } else {
        labels = moment.monthsShort();
        for (let i = 0; i < 12; i++) {
            const monthT = transactions.filter(t => moment(t.date).month() === i);
            incD.push(monthT.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
            expD.push(monthT.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
        }
    }
    trendChart.data.labels = labels;
    trendChart.data.datasets[0].data = incD;
    trendChart.data.datasets[1].data = expD;
    trendChart.update();
}

function saveTransaction() {
    const desc = document.getElementById('desc').value;
    const amt = parseFloat(document.getElementById('amt').value);
    const idx = parseInt(document.getElementById('editIndex').value);
    const date = document.getElementById('transDate').value || moment().format('YYYY-MM-DD');

    if (!desc || isNaN(amt)) return Swal.fire('Error', 'Invalid details', 'error');

    const item = { name: desc, amount: amt, category: document.getElementById('cat').value, type: document.getElementById('type').value, date: date };
    if (idx === -1) transactions.push(item); else transactions[idx] = item;

    localStorage.setItem('spendwise_final', JSON.stringify(transactions));
    clearForm();
    updateUI();
    Swal.fire('Saved!', 'Transaction updated successfully', 'success');
}

function editT(idx) {
    const t = transactions[idx];
    document.getElementById('desc').value = t.name;
    document.getElementById('amt').value = t.amount;
    document.getElementById('cat').value = t.category;
    document.getElementById('type').value = t.type;
    document.getElementById('transDate').value = t.date;
    document.getElementById('editIndex').value = idx;

    document.getElementById('formTitle').textContent = "Edit Record";
    document.getElementById('saveBtn').textContent = "Update";
    document.getElementById('cancelBtn').style.display = "inline-block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearForm() {
    document.getElementById('desc').value = '';
    document.getElementById('amt').value = '';
    document.getElementById('editIndex').value = '-1';
    document.getElementById('transDate').value = '';
    document.getElementById('formTitle').textContent = "Add Record";
    document.getElementById('saveBtn').textContent = "Save";
    document.getElementById('cancelBtn').style.display = "none";
}

function deleteT(idx) {
    Swal.fire({
        title: 'Delete this record?',
        text: "You won't be able to recover this transaction.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Yes, delete it!'
    }).then((res) => {
        if (res.isConfirmed) {
            transactions.splice(idx, 1);
            localStorage.setItem('spendwise_final', JSON.stringify(transactions));
            updateUI();
            Swal.fire('Deleted', 'Transaction removed.', 'success');
        }
    });
}

function renderTable() {
    const list = document.getElementById('transactionList');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    const mappedData = transactions.map((t, i) => ({ ...t, originalIndex: i }));
    const filtered = mappedData.filter(t =>
        t.name.toLowerCase().includes(searchTerm) ||
        t.category.toLowerCase().includes(searchTerm)
    );

    list.innerHTML = filtered.slice().reverse().map((t) => {
        return `<tr>
                    <td>${t.date}</td>
                    <td style="font-weight:700">${t.name}</td>
                    <td><span class="badge ${t.type === 'income' ? 'badge-inc' : 'badge-exp'}">${t.category}</span></td>
                    <td style="font-weight:bold; color:${t.type === 'income' ? 'var(--success)' : 'var(--danger)'}">
                        ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}
                    </td>
                    <td>
                        <button class="btn-icon edit-btn" onclick="editT(${t.originalIndex})">✏️</button>
                        <button class="btn-icon del-btn" onclick="deleteT(${t.originalIndex})">🗑</button>
                    </td>
                </tr>`;
    }).join('');
}

function exportToCSV() {
    let csv = "Date,Item,Category,Type,Amount\n";
    transactions.forEach(t => csv += `${t.date},${t.name},${t.category},${t.type},${t.amount}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'SpendWise_History.csv'; a.click();
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("SpendWise Transaction History", 14, 15);
    doc.autoTable({
        startY: 20,
        head: [['Date', 'Item', 'Category', 'Type', 'Amount']],
        body: transactions.map(t => [t.date, t.name, t.category, t.type, `$${t.amount.toFixed(2)}`])
    });
    doc.save("SpendWise_History.pdf");
}

document.querySelectorAll('.period-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPeriod = btn.dataset.period;
        updateUI();
    };
});

function saveSettings() {
    const profileName = document.getElementById('profileName').value.trim();
    if (!profileName) {
        Swal.fire('Error', 'Please enter your name', 'error');
        return;
    }

    localStorage.setItem('currentUsername', profileName);
    document.getElementById('profile-name').textContent = profileName;
    document.getElementById('loggedInUser').textContent = profileName;
    Swal.fire('Success!', 'Profile settings saved', 'success');
}

function saveBudgetSettings() {
    const dailyBudget = parseFloat(document.getElementById('dailyBudget').value);
    const weeklyBudget = parseFloat(document.getElementById('weeklyBudget').value);
    const monthlyBudget = parseFloat(document.getElementById('monthlyBudget').value);

    if (isNaN(dailyBudget) || isNaN(weeklyBudget) || isNaN(monthlyBudget) || dailyBudget < 0 || weeklyBudget < 0 || monthlyBudget < 0) {
        Swal.fire('Error', 'Please enter valid budget amounts', 'error');
        return;
    }

    budgetLimits.daily = dailyBudget;
    budgetLimits.weekly = weeklyBudget;
    budgetLimits.monthly = monthlyBudget;
    localStorage.setItem('budgetLimits', JSON.stringify(budgetLimits));
    updateUI();
    Swal.fire('Success!', 'Budget settings saved', 'success');
}

// Rest of functions remain the same (generateReport, exportReportToPDF, etc.)

function generateReport() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    if (!startDate || !endDate) {
        Swal.fire('Error', 'Please select both start and end dates', 'error');
        return;
    }

    const start = moment(startDate);
    const end = moment(endDate);

    if (start.isAfter(end)) {
        Swal.fire('Error', 'Start date must be before end date', 'error');
        return;
    }

    const reportTrans = transactions.filter(t => moment(t.date).isBetween(start, end, null, '[]'));

    if (reportTrans.length === 0) {
        Swal.fire('No Data', 'No transactions found in the selected date range', 'info');
        return;
    }

    const cats = ['Food & Drinks', 'Rent', 'Bills', 'Shopping', 'Travel', 'Other'];
    const catData = cats.map(c => {
        const total = reportTrans.filter(t => t.type === 'expense' && t.category === c).reduce((s, t) => s + t.amount, 0);
        return { category: c, amount: total };
    }).filter(d => d.amount > 0);

    const totalExpense = catData.reduce((s, d) => s + d.amount, 0);
    const totalIncome = reportTrans.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalBalance = totalIncome - totalExpense;

    let reportHTML = `
        <div style="font-size: 14px; line-height: 1.6;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 12px; color: #666;">Total Income</div>
                    <div style="font-size: 20px; font-weight: bold; color: #10b981;">$${totalIncome.toFixed(2)}</div>
                </div>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 12px; color: #666;">Total Expenses</div>
                    <div style="font-size: 20px; font-weight: bold; color: #ef4444;">$${totalExpense.toFixed(2)}</div>
                </div>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 12px; color: #666;">Net Balance</div>
                    <div style="font-size: 20px; font-weight: bold; color: ${totalBalance >= 0 ? '#10b981' : '#ef4444'};">$${totalBalance.toFixed(2)}</div>
                </div>
            </div>
            <h4>Detailed Breakdown</h4>
    `;

    catData.forEach(item => {
        const percentage = ((item.amount / totalExpense) * 100).toFixed(0);
        reportHTML += `
            <div style="margin-bottom: 15px; padding: 12px; background: #fafafa; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <div style="display: flex; justify-content: space-between;">
                    <strong>${item.category}</strong>
                    <strong>$${item.amount.toFixed(2)} (${percentage}%)</strong>
                </div>
            </div>
        `;
    });

    reportHTML += `</div>`;

    document.getElementById('reportContent').innerHTML = reportHTML;
    document.getElementById('reportResult').style.display = 'block';
    Swal.fire('Success', 'Report generated successfully', 'success');
}

function exportReportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    doc.text("SpendWise - Financial Report", 14, 15);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 25);
    const content = document.getElementById('reportContent').innerText;
    doc.text(content, 14, 35);
    doc.save(`SpendWise_Report_${startDate}_to_${endDate}.pdf`);
}

document.addEventListener('DOMContentLoaded', () => {
    loadProfilePicture();
    const profileName = localStorage.getItem('currentUsername') || 'User';
    document.getElementById('profileName').value = profileName;
    document.getElementById('dailyBudget').value = budgetLimits.daily;
    document.getElementById('weeklyBudget').value = budgetLimits.weekly;
    document.getElementById('monthlyBudget').value = budgetLimits.monthly;
    document.getElementById('loggedInUser').textContent = profileName;

    updateUI();
    renderTable();
    showPage('dashboard');

    const toggleBtn = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('open');
        toggleBtn.textContent = sidebar.classList.contains('open') ? '×' : '☰';
    });

    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
            sidebar.classList.remove('open');
            toggleBtn.textContent = '☰';
        }
    });
});