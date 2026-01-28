// Research Lab Tracker with GitHub Gist Sync
// Version 2.1 - Added Edit Functionality

// Configuration
const SYNC_INTERVAL = 30000; // 30 seconds
const GITHUB_API = 'https://api.github.com';

// Data Storage
const storage = {
    students: [],
    goals: [],
    activities: [],
    publications: []
};

// PI-only workspace (local only, never synced)
const privateStorage = {
    piGoals: [],
    piActivities: [],
    piTodos: []
};

// Sync Configuration
let syncConfig = {
    token: null,
    gistId: null,
    lastSync: null,
    syncEnabled: false,
    syncing: false
};

let syncIntervalId = null;
let editingItem = null; // Track which item is being edited
const privateEditing = {
    goal: null,
    activity: null,
    todo: null
};
let lastSyncError = null;

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    loadSyncConfig();
    loadData();
    loadPrivateData();
    initializeEventListeners();
    updateUI();
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('activityDate').value = today;
    document.getElementById('goalDeadline').valueAsDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const piActivityDate = document.getElementById('piActivityDate');
    if (piActivityDate) piActivityDate.value = today;
    const piTodoDueDate = document.getElementById('piTodoDueDate');
    if (piTodoDueDate) piTodoDueDate.value = '';

    // Start sync if configured
    if (syncConfig.syncEnabled) {
        startAutoSync();
        syncFromGist();
    }
});

// ===== SYNC FUNCTIONS =====

function loadSyncConfig() {
    const saved = localStorage.getItem('syncConfig');
    if (saved) {
        syncConfig = JSON.parse(saved);
    }
    updateSyncStatus();
}

function saveSyncConfig() {
    localStorage.setItem('syncConfig', JSON.stringify(syncConfig));
}

function updateSyncStatus() {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    if (syncConfig.syncing) {
        indicator.textContent = '🟡';
        statusText.textContent = 'Syncing...';
        indicator.classList.remove('connected');
    } else if (syncConfig.syncEnabled && syncConfig.token && syncConfig.gistId) {
        indicator.textContent = '🟢';
        indicator.classList.add('connected');
        const lastSync = syncConfig.lastSync ? new Date(syncConfig.lastSync).toLocaleTimeString() : 'Never';
        statusText.textContent = `Connected (${lastSync})`;
    } else {
        indicator.textContent = '⚪';
        statusText.textContent = 'Not Connected';
        indicator.classList.remove('connected');
    }
}

async function syncToGist() {
    if (!syncConfig.syncEnabled || !syncConfig.token || !syncConfig.gistId || syncConfig.syncing) {
        return false;
    }

    syncConfig.syncing = true;
    lastSyncError = null;
    updateSyncStatus();

    try {
        const response = await fetch(`${GITHUB_API}/gists/${syncConfig.gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${syncConfig.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                files: {
                    'research-lab-data.json': {
                        content: JSON.stringify(storage, null, 2)
                    }
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
        }

        syncConfig.lastSync = new Date().toISOString();
        saveSyncConfig();
        syncConfig.syncing = false;
        updateSyncStatus();
        return true;
    } catch (error) {
        console.error('Sync to gist failed:', error);
        lastSyncError = error.message;
        syncConfig.syncing = false;
        updateSyncStatus();
        return false;
    }
}

async function syncFromGist() {
    if (!syncConfig.syncEnabled || !syncConfig.token || !syncConfig.gistId || syncConfig.syncing) {
        return false;
    }

    syncConfig.syncing = true;
    lastSyncError = null;
    updateSyncStatus();

    try {
        const response = await fetch(`${GITHUB_API}/gists/${syncConfig.gistId}`, {
            headers: {
                'Authorization': `token ${syncConfig.token}`,
            }
        });

        if (!response.ok) {
            throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
        }

        const gist = await response.json();
        const fileEntry = gist.files['research-lab-data.json'];
        if (!fileEntry) {
            console.warn('Gist missing research-lab-data.json. It will be created on the next sync.');
            syncConfig.lastSync = new Date().toISOString();
            saveSyncConfig();
            syncConfig.syncing = false;
            updateSyncStatus();
            return true;
        }
        const fileContent = fileEntry.content;
        const data = JSON.parse(fileContent);

        storage.students = data.students || [];
        storage.goals = data.goals || [];
        storage.activities = data.activities || [];
        storage.publications = data.publications || [];

        saveDataLocally();
        updateUI();

        syncConfig.lastSync = new Date().toISOString();
        saveSyncConfig();
        syncConfig.syncing = false;
        updateSyncStatus();
        return true;
    } catch (error) {
        console.error('Sync from gist failed:', error);
        lastSyncError = error.message;
        syncConfig.syncing = false;
        updateSyncStatus();
        return false;
    }
}

function startAutoSync() {
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
    }
    syncIntervalId = setInterval(() => {
        syncFromGist();
    }, SYNC_INTERVAL);
}

function stopAutoSync() {
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
        syncIntervalId = null;
    }
}

// ===== DATA FUNCTIONS =====

function loadData() {
    const saved = localStorage.getItem('researchLabData');
    if (saved) {
        const data = JSON.parse(saved);
        storage.students = data.students || [];
        storage.goals = data.goals || [];
        storage.activities = data.activities || [];
        storage.publications = data.publications || [];
    }
    
    if (storage.students.length === 0) {
        storage.students.push({
            id: generateId(),
            name: 'Principal Investigator',
            email: '',
            role: 'pi',
            createdAt: new Date().toISOString()
        });
        saveData();
    }
}

function loadPrivateData() {
    const saved = localStorage.getItem('researchLabPrivateData');
    if (saved) {
        const data = JSON.parse(saved);
        privateStorage.piGoals = data.piGoals || [];
        privateStorage.piActivities = data.piActivities || [];
        privateStorage.piTodos = data.piTodos || [];
    } else {
        savePrivateData();
    }
}

function saveDataLocally() {
    localStorage.setItem('researchLabData', JSON.stringify(storage));
}

function savePrivateData() {
    localStorage.setItem('researchLabPrivateData', JSON.stringify(privateStorage));
}

async function saveData() {
    saveDataLocally();
    if (syncConfig.syncEnabled) {
        await syncToGist();
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== EVENT LISTENERS =====

function initializeEventListeners() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Sync
    document.getElementById('setupSyncBtn').addEventListener('click', () => {
        document.getElementById('syncModal').style.display = 'flex';
        if (syncConfig.token) document.getElementById('githubToken').value = syncConfig.token;
        if (syncConfig.gistId) document.getElementById('gistId').value = syncConfig.gistId;
    });
    
    document.getElementById('closeSyncModal').addEventListener('click', () => {
        document.getElementById('syncModal').style.display = 'none';
    });
    
    document.getElementById('syncSetupForm').addEventListener('submit', handleSyncSetup);
    document.getElementById('disconnectBtn').addEventListener('click', disconnectSync);
    document.getElementById('syncNowBtn').addEventListener('click', () => syncFromGist());

    // Export/Import
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importData);

    // Students
    document.getElementById('addStudentBtn').addEventListener('click', () => {
        editingItem = null;
        toggleForm('studentForm', true);
    });
    document.getElementById('cancelStudentBtn').addEventListener('click', () => {
        editingItem = null;
        toggleForm('studentForm', false);
    });
    document.getElementById('studentFormElement').addEventListener('submit', handleStudentSubmit);

    // Goals
    document.getElementById('addGoalBtn').addEventListener('click', () => {
        editingItem = null;
        toggleForm('goalForm', true);
    });
    document.getElementById('cancelGoalBtn').addEventListener('click', () => {
        editingItem = null;
        toggleForm('goalForm', false);
    });
    document.getElementById('goalFormElement').addEventListener('submit', handleGoalSubmit);
    document.getElementById('filterGoalType').addEventListener('change', renderGoals);
    document.getElementById('filterGoalStudent').addEventListener('change', renderGoals);
    document.getElementById('filterGoalStatus').addEventListener('change', renderGoals);

    // Activities
    document.getElementById('addActivityBtn').addEventListener('click', () => {
        editingItem = null;
        toggleForm('activityForm', true);
    });
    document.getElementById('cancelActivityBtn').addEventListener('click', () => {
        editingItem = null;
        toggleForm('activityForm', false);
    });
    document.getElementById('activityFormElement').addEventListener('submit', handleActivitySubmit);
    document.getElementById('filterActivityStudent').addEventListener('change', renderActivities);
    document.getElementById('filterActivityDate').addEventListener('change', renderActivities);

    // Publications
    document.getElementById('addPublicationBtn').addEventListener('click', () => {
        editingItem = null;
        toggleForm('publicationForm', true);
    });
    document.getElementById('cancelPublicationBtn').addEventListener('click', () => {
        editingItem = null;
        toggleForm('publicationForm', false);
    });
    document.getElementById('publicationFormElement').addEventListener('submit', handlePublicationSubmit);
    document.getElementById('filterPublicationStatus').addEventListener('change', renderPublications);

    // PI Workspace
    const piGoalForm = document.getElementById('piGoalFormElement');
    if (piGoalForm) {
        piGoalForm.addEventListener('submit', handlePiGoalSubmit);
        document.getElementById('piGoalResetBtn').addEventListener('click', resetPiGoalForm);
    }

    const piActivityForm = document.getElementById('piActivityFormElement');
    if (piActivityForm) {
        piActivityForm.addEventListener('submit', handlePiActivitySubmit);
        document.getElementById('piActivityResetBtn').addEventListener('click', resetPiActivityForm);
    }

    const piTodoForm = document.getElementById('piTodoFormElement');
    if (piTodoForm) {
        piTodoForm.addEventListener('submit', handlePiTodoSubmit);
        document.getElementById('piTodoResetBtn').addEventListener('click', resetPiTodoForm);
    }

    const piImportBtn = document.getElementById('piImportBtn');
    const piImportFile = document.getElementById('piImportFile');
    if (piImportBtn && piImportFile) {
        piImportBtn.addEventListener('click', () => piImportFile.click());
        piImportFile.addEventListener('change', importPrivateData);
    }
    const piExportBtn = document.getElementById('piExportBtn');
    if (piExportBtn) {
        piExportBtn.addEventListener('click', exportPrivateData);
    }

    // Close modal on outside click
    document.getElementById('syncModal').addEventListener('click', (e) => {
        if (e.target.id === 'syncModal') {
            document.getElementById('syncModal').style.display = 'none';
        }
    });
}

async function handleSyncSetup(e) {
    e.preventDefault();
    
    const token = document.getElementById('githubToken').value.trim();
    const gistId = document.getElementById('gistId').value.trim();

    syncConfig.token = token;
    syncConfig.gistId = gistId;
    syncConfig.syncEnabled = true;
    saveSyncConfig();

    let success = await syncFromGist();

    if (!success) {
        const errorDetails = lastSyncError ? `\n\nGitHub responded with: ${lastSyncError}` : '';
        const shouldPush = confirm(`Could not load existing data from GitHub.${errorDetails}\n\nClick OK to overwrite the gist with the data currently on this device (initializes a new shared database). Click Cancel to double-check your token and gist ID.`);
        if (shouldPush) {
            success = await syncToGist();
        }
    }
    
    if (success) {
        alert('✅ Successfully connected! Data will now sync automatically.');
        document.getElementById('syncModal').style.display = 'none';
        startAutoSync();
        updateSyncStatus();
    } else {
        alert('❌ Connection failed. Please check your token and gist ID.');
        syncConfig.syncEnabled = false;
        saveSyncConfig();
        updateSyncStatus();
    }
}

function disconnectSync() {
    if (confirm('Disconnect from GitHub Gist? Your local data will be preserved.')) {
        syncConfig.token = null;
        syncConfig.gistId = null;
        syncConfig.syncEnabled = false;
        syncConfig.lastSync = null;
        saveSyncConfig();
        stopAutoSync();
        updateSyncStatus();
        document.getElementById('syncModal').style.display = 'none';
        document.getElementById('githubToken').value = '';
        document.getElementById('gistId').value = '';
        alert('Disconnected from sync.');
    }
}

// ===== UI FUNCTIONS =====

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });

    if (tabName === 'dashboard') updateDashboard();
    if (tabName === 'goals') renderGoals();
    if (tabName === 'activities') renderActivities();
    if (tabName === 'publications') renderPublications();
    if (tabName === 'students') renderStudents();
    if (tabName === 'pi-workspace') renderPiWorkspace();
}

function toggleForm(formId, show) {
    const form = document.getElementById(formId);
    form.style.display = show ? 'block' : 'none';
    
    if (!show) {
        form.querySelector('form').reset();
        editingItem = null;
    }
    
    if (show) {
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function updateUI() {
    updateStudentDropdowns();
    updateDashboard();
    renderGoals();
    renderActivities();
    renderPublications();
    renderStudents();
    renderPiWorkspace();
}

function updateStudentDropdowns() {
    const dropdowns = [
        'goalStudent',
        'activityStudent',
        'filterGoalStudent',
        'filterActivityStudent'
    ];

    dropdowns.forEach(id => {
        const select = document.getElementById(id);
        const currentValue = select.value;
        
        const isFilter = id.startsWith('filter');
        select.innerHTML = isFilter ? '<option value="all">All Students</option>' : '<option value="">Select Student</option>';
        
        storage.students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.name;
            select.appendChild(option);
        });
        
        if (currentValue) select.value = currentValue;
    });
}

// ===== DASHBOARD =====

function updateDashboard() {
    const activeGoals = storage.goals.filter(g => !g.completed).length;
    const completedGoals = storage.goals.filter(g => g.completed).length;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentActivities = storage.activities.filter(a => 
        new Date(a.date) >= oneWeekAgo
    ).length;
    
    document.getElementById('activeGoalsCount').textContent = activeGoals;
    document.getElementById('completedGoalsCount').textContent = completedGoals;
    document.getElementById('activitiesCount').textContent = recentActivities;
    document.getElementById('publicationsCount').textContent = storage.publications.length;

    const currentWeekGoals = storage.goals
        .filter(g => !g.completed && g.type === 'weekly')
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);

    const currentWeekGoalsEl = document.getElementById('currentWeekGoals');
    if (currentWeekGoals.length === 0) {
        currentWeekGoalsEl.innerHTML = '<p class="empty-state-text">No active weekly goals</p>';
    } else {
        currentWeekGoalsEl.innerHTML = currentWeekGoals.map(goal => {
            const student = storage.students.find(s => s.id === goal.studentId);
            const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            return `
                <div class="item-card" style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <strong>${goal.title}</strong>
                            <div style="font-size: 0.85rem; color: #6b7280; margin-top: 4px;">
                                ${student ? student.name : 'Unknown'} • ${daysLeft} days left
                            </div>
                        </div>
                        <button class="btn btn-success" style="padding: 5px 10px; font-size: 0.85rem;" onclick="completeGoal('${goal.id}')">✓</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    const recentActivitiesList = storage.activities
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    const recentActivitiesEl = document.getElementById('recentActivities');
    if (recentActivitiesList.length === 0) {
        recentActivitiesEl.innerHTML = '<p class="empty-state-text">No recent activities</p>';
    } else {
        recentActivitiesEl.innerHTML = recentActivitiesList.map(activity => {
            const student = storage.students.find(s => s.id === activity.studentId);
            const date = new Date(activity.date).toLocaleDateString();
            return `
                <div class="item-card" style="margin-bottom: 10px;">
                    <strong>${activity.title}</strong>
                    <div style="font-size: 0.85rem; color: #6b7280; margin-top: 4px;">
                        ${student ? student.name : 'Unknown'} • ${date}
                    </div>
                </div>
            `;
        }).join('');
    }
}

// ===== STUDENTS =====

async function handleStudentSubmit(e) {
    e.preventDefault();
    
    if (editingItem) {
        // Update existing student
        const student = storage.students.find(s => s.id === editingItem);
        if (student) {
            student.name = document.getElementById('studentName').value;
            student.email = document.getElementById('studentEmail').value;
            student.role = document.getElementById('studentRole').value;
            student.updatedAt = new Date().toISOString();
        }
    } else {
        // Create new student
        const student = {
            id: generateId(),
            name: document.getElementById('studentName').value,
            email: document.getElementById('studentEmail').value,
            role: document.getElementById('studentRole').value,
            createdAt: new Date().toISOString()
        };
        storage.students.push(student);
    }

    await saveData();
    updateUI();
    editingItem = null;
    toggleForm('studentForm', false);
}

function editStudent(id) {
    const student = storage.students.find(s => s.id === id);
    if (!student) return;

    editingItem = id;
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentEmail').value = student.email || '';
    document.getElementById('studentRole').value = student.role;
    
    toggleForm('studentForm', true);
    document.querySelector('#studentForm h3').textContent = 'Edit Lab Member';
}

function renderStudents() {
    const container = document.getElementById('studentsList');
    
    if (storage.students.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-text">No lab members yet</div></div>';
        return;
    }

    container.innerHTML = storage.students.map(student => {
        const initial = student.name.charAt(0).toUpperCase();
        const roleLabels = {
            'phd': 'PhD Student',
            'masters': "Master's Student",
            'undergraduate': 'Undergraduate',
            'postdoc': 'Postdoc',
            'pi': 'Principal Investigator'
        };

        return `
            <div class="student-card">
                <div class="student-avatar">${initial}</div>
                <div class="student-info">
                    <div class="student-name">${student.name}</div>
                    <div class="student-role">${roleLabels[student.role] || student.role}</div>
                    ${student.email ? `<div class="student-email">${student.email}</div>` : ''}
                </div>
                <div class="item-actions">
                    <button class="btn btn-secondary" onclick="editStudent('${student.id}')">✏️ Edit</button>
                    <button class="btn btn-danger" onclick="deleteStudent('${student.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

async function deleteStudent(id) {
    if (confirm('Delete this student? Their goals and activities will remain.')) {
        storage.students = storage.students.filter(s => s.id !== id);
        await saveData();
        updateUI();
    }
}

// ===== GOALS =====

async function handleGoalSubmit(e) {
    e.preventDefault();
    
    if (editingItem) {
        // Update existing goal
        const goal = storage.goals.find(g => g.id === editingItem);
        if (goal) {
            goal.title = document.getElementById('goalTitle').value;
            goal.description = document.getElementById('goalDescription').value;
            goal.type = document.getElementById('goalType').value;
            goal.studentId = document.getElementById('goalStudent').value;
            goal.deadline = document.getElementById('goalDeadline').value;
            goal.updatedAt = new Date().toISOString();
        }
    } else {
        // Create new goal
        const goal = {
            id: generateId(),
            title: document.getElementById('goalTitle').value,
            description: document.getElementById('goalDescription').value,
            type: document.getElementById('goalType').value,
            studentId: document.getElementById('goalStudent').value,
            deadline: document.getElementById('goalDeadline').value,
            completed: false,
            createdAt: new Date().toISOString()
        };
        storage.goals.push(goal);
    }

    await saveData();
    updateUI();
    editingItem = null;
    toggleForm('goalForm', false);
}

function editGoal(id) {
    const goal = storage.goals.find(g => g.id === id);
    if (!goal) return;

    editingItem = id;
    document.getElementById('goalTitle').value = goal.title;
    document.getElementById('goalDescription').value = goal.description || '';
    document.getElementById('goalType').value = goal.type;
    document.getElementById('goalStudent').value = goal.studentId;
    document.getElementById('goalDeadline').value = goal.deadline;
    
    toggleForm('goalForm', true);
    document.querySelector('#goalForm h3').textContent = 'Edit Goal';
}

function renderGoals() {
    const container = document.getElementById('goalsList');
    
    let filteredGoals = [...storage.goals];
    
    const typeFilter = document.getElementById('filterGoalType').value;
    if (typeFilter !== 'all') {
        filteredGoals = filteredGoals.filter(g => g.type === typeFilter);
    }
    
    const studentFilter = document.getElementById('filterGoalStudent').value;
    if (studentFilter !== 'all') {
        filteredGoals = filteredGoals.filter(g => g.studentId === studentFilter);
    }
    
    const statusFilter = document.getElementById('filterGoalStatus').value;
    if (statusFilter === 'active') {
        filteredGoals = filteredGoals.filter(g => !g.completed);
    } else if (statusFilter === 'completed') {
        filteredGoals = filteredGoals.filter(g => g.completed);
    }

    if (filteredGoals.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎯</div><div class="empty-state-text">No goals found</div></div>';
        return;
    }

    filteredGoals.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    container.innerHTML = filteredGoals.map(goal => {
        const student = storage.students.find(s => s.id === goal.studentId);
        const deadline = new Date(goal.deadline).toLocaleDateString();
        const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        
        return `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-title">${goal.title}</div>
                    <div class="item-actions">
                        ${!goal.completed ? `<button class="btn btn-success" onclick="completeGoal('${goal.id}')">✓ Complete</button>` : ''}
                        <button class="btn btn-secondary" onclick="editGoal('${goal.id}')">✏️ Edit</button>
                        <button class="btn btn-danger" onclick="deleteGoal('${goal.id}')">Delete</button>
                    </div>
                </div>
                <div class="item-meta">
                    <span>👤 ${student ? student.name : 'Unknown'}</span>
                    <span>📅 ${deadline}</span>
                    ${!goal.completed && daysLeft >= 0 ? `<span>⏰ ${daysLeft} days left</span>` : ''}
                    ${daysLeft < 0 && !goal.completed ? `<span style="color: var(--danger-color);">⚠️ ${Math.abs(daysLeft)} days overdue</span>` : ''}
                </div>
                ${goal.description ? `<div class="item-description">${goal.description}</div>` : ''}
                <div class="item-footer">
                    <span class="badge badge-${goal.type}">${goal.type}</span>
                    <span class="badge badge-${goal.completed ? 'completed' : 'active'}">${goal.completed ? 'Completed' : 'Active'}</span>
                </div>
            </div>
        `;
    }).join('');
}

async function completeGoal(id) {
    const goal = storage.goals.find(g => g.id === id);
    if (goal) {
        goal.completed = true;
        goal.completedAt = new Date().toISOString();
        await saveData();
        updateUI();
    }
}

async function deleteGoal(id) {
    if (confirm('Delete this goal?')) {
        storage.goals = storage.goals.filter(g => g.id !== id);
        await saveData();
        updateUI();
    }
}

// ===== ACTIVITIES =====

async function handleActivitySubmit(e) {
    e.preventDefault();
    
    if (editingItem) {
        // Update existing activity
        const activity = storage.activities.find(a => a.id === editingItem);
        if (activity) {
            activity.title = document.getElementById('activityTitle').value;
            activity.description = document.getElementById('activityDescription').value;
            activity.studentId = document.getElementById('activityStudent').value;
            activity.date = document.getElementById('activityDate').value;
            activity.hours = document.getElementById('activityHours').value || null;
            activity.updatedAt = new Date().toISOString();
        }
    } else {
        // Create new activity
        const activity = {
            id: generateId(),
            title: document.getElementById('activityTitle').value,
            description: document.getElementById('activityDescription').value,
            studentId: document.getElementById('activityStudent').value,
            date: document.getElementById('activityDate').value,
            hours: document.getElementById('activityHours').value || null,
            createdAt: new Date().toISOString()
        };
        storage.activities.push(activity);
    }

    await saveData();
    updateUI();
    editingItem = null;
    toggleForm('activityForm', false);
}

function editActivity(id) {
    const activity = storage.activities.find(a => a.id === id);
    if (!activity) return;

    editingItem = id;
    document.getElementById('activityTitle').value = activity.title;
    document.getElementById('activityDescription').value = activity.description;
    document.getElementById('activityStudent').value = activity.studentId;
    document.getElementById('activityDate').value = activity.date;
    document.getElementById('activityHours').value = activity.hours || '';
    
    toggleForm('activityForm', true);
    document.querySelector('#activityForm h3').textContent = 'Edit Activity';
}

function renderActivities() {
    const container = document.getElementById('activitiesList');
    
    let filteredActivities = [...storage.activities];
    
    const studentFilter = document.getElementById('filterActivityStudent').value;
    if (studentFilter !== 'all') {
        filteredActivities = filteredActivities.filter(a => a.studentId === studentFilter);
    }
    
    const dateFilter = document.getElementById('filterActivityDate').value;
    if (dateFilter) {
        filteredActivities = filteredActivities.filter(a => a.date === dateFilter);
    }

    if (filteredActivities.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">No activities found</div></div>';
        return;
    }

    filteredActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = filteredActivities.map(activity => {
        const student = storage.students.find(s => s.id === activity.studentId);
        const date = new Date(activity.date).toLocaleDateString();
        
        return `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-title">${activity.title}</div>
                    <div class="item-actions">
                        <button class="btn btn-secondary" onclick="editActivity('${activity.id}')">✏️ Edit</button>
                        <button class="btn btn-danger" onclick="deleteActivity('${activity.id}')">Delete</button>
                    </div>
                </div>
                <div class="item-meta">
                    <span>👤 ${student ? student.name : 'Unknown'}</span>
                    <span>📅 ${date}</span>
                    ${activity.hours ? `<span>⏱️ ${activity.hours} hours</span>` : ''}
                </div>
                <div class="item-description">${activity.description}</div>
            </div>
        `;
    }).join('');
}

async function deleteActivity(id) {
    if (confirm('Delete this activity?')) {
        storage.activities = storage.activities.filter(a => a.id !== id);
        await saveData();
        updateUI();
    }
}

// ===== PUBLICATIONS =====

async function handlePublicationSubmit(e) {
    e.preventDefault();
    
    if (editingItem) {
        // Update existing publication
        const publication = storage.publications.find(p => p.id === editingItem);
        if (publication) {
            publication.title = document.getElementById('publicationTitle').value;
            publication.authors = document.getElementById('publicationAuthors').value;
            publication.status = document.getElementById('publicationStatus').value;
            publication.year = document.getElementById('publicationYear').value || null;
            publication.venue = document.getElementById('publicationVenue').value;
            publication.doi = document.getElementById('publicationDOI').value;
            publication.notes = document.getElementById('publicationNotes').value;
            publication.updatedAt = new Date().toISOString();
        }
    } else {
        // Create new publication
        const publication = {
            id: generateId(),
            title: document.getElementById('publicationTitle').value,
            authors: document.getElementById('publicationAuthors').value,
            status: document.getElementById('publicationStatus').value,
            year: document.getElementById('publicationYear').value || null,
            venue: document.getElementById('publicationVenue').value,
            doi: document.getElementById('publicationDOI').value,
            notes: document.getElementById('publicationNotes').value,
            createdAt: new Date().toISOString()
        };
        storage.publications.push(publication);
    }

    await saveData();
    updateUI();
    editingItem = null;
    toggleForm('publicationForm', false);
}

function editPublication(id) {
    const publication = storage.publications.find(p => p.id === id);
    if (!publication) return;

    editingItem = id;
    document.getElementById('publicationTitle').value = publication.title;
    document.getElementById('publicationAuthors').value = publication.authors;
    document.getElementById('publicationStatus').value = publication.status;
    document.getElementById('publicationYear').value = publication.year || '';
    document.getElementById('publicationVenue').value = publication.venue || '';
    document.getElementById('publicationDOI').value = publication.doi || '';
    document.getElementById('publicationNotes').value = publication.notes || '';
    
    toggleForm('publicationForm', true);
    document.querySelector('#publicationForm h3').textContent = 'Edit Publication';
}

function renderPublications() {
    const container = document.getElementById('publicationsList');
    
    let filteredPublications = [...storage.publications];
    
    const statusFilter = document.getElementById('filterPublicationStatus').value;
    if (statusFilter !== 'all') {
        filteredPublications = filteredPublications.filter(p => p.status === statusFilter);
    }

    if (filteredPublications.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-text">No publications found</div></div>';
        return;
    }

    filteredPublications.sort((a, b) => (b.year || 0) - (a.year || 0));

    container.innerHTML = filteredPublications.map(pub => {
        const statusLabels = {
            'draft': 'Draft',
            'in-progress': 'In Progress',
            'submitted': 'Submitted',
            'under-review': 'Under Review',
            'accepted': 'Accepted',
            'published': 'Published'
        };

        return `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-title">${pub.title}</div>
                    <div class="item-actions">
                        <button class="btn btn-secondary" onclick="editPublication('${pub.id}')">✏️ Edit</button>
                        <button class="btn btn-danger" onclick="deletePublication('${pub.id}')">Delete</button>
                    </div>
                </div>
                <div class="item-meta">
                    <span>✍️ ${pub.authors}</span>
                    ${pub.year ? `<span>📅 ${pub.year}</span>` : ''}
                    ${pub.venue ? `<span>📰 ${pub.venue}</span>` : ''}
                </div>
                ${pub.doi ? `<div style="margin: 10px 0;"><a href="${pub.doi.startsWith('http') ? pub.doi : 'https://doi.org/' + pub.doi}" target="_blank" style="color: var(--primary-color);">🔗 ${pub.doi}</a></div>` : ''}
                ${pub.notes ? `<div class="item-description">${pub.notes}</div>` : ''}
                <div class="item-footer">
                    <span class="badge badge-${pub.status}">${statusLabels[pub.status]}</span>
                </div>
            </div>
        `;
    }).join('');
}

async function deletePublication(id) {
    if (confirm('Delete this publication?')) {
        storage.publications = storage.publications.filter(p => p.id !== id);
        await saveData();
        updateUI();
    }
}

// ===== EXPORT/IMPORT =====

function exportData() {
    const dataStr = JSON.stringify(storage, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `research-lab-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

async function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const data = JSON.parse(event.target.result);
            
            if (confirm('This will replace all current data. Continue?')) {
                storage.students = data.students || [];
                storage.goals = data.goals || [];
                storage.activities = data.activities || [];
                storage.publications = data.publications || [];
                await saveData();
                updateUI();
                alert('Data imported successfully!');
            }
        } catch (error) {
            alert('Error importing data. Check file format.');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
    
    e.target.value = '';
}

// ===== PI WORKSPACE =====

function renderPiWorkspace() {
    updatePiStats();
    renderPiGoals();
    renderPiActivities();
    renderPiTodos();
}

function updatePiStats() {
    const activeGoalsEl = document.getElementById('piActiveGoals');
    if (!activeGoalsEl) return;
    
    const activityEl = document.getElementById('piActivityCount');
    const todoEl = document.getElementById('piTodoCount');
    const activeGoals = privateStorage.piGoals.filter(goal => !goal.completed).length;
    const openTodos = privateStorage.piTodos.filter(todo => !todo.completed).length;
    
    activeGoalsEl.textContent = activeGoals;
    if (activityEl) activityEl.textContent = privateStorage.piActivities.length;
    if (todoEl) todoEl.textContent = openTodos;
}

// -- Goals --

function handlePiGoalSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('piGoalTitle').value.trim();
    if (!title) return;
    
    const goalData = {
        title,
        focus: document.getElementById('piGoalFocus').value,
        deadline: document.getElementById('piGoalDeadline').value || null,
        description: document.getElementById('piGoalDescription').value.trim(),
        updatedAt: new Date().toISOString()
    };

    if (privateEditing.goal) {
        const goal = privateStorage.piGoals.find(g => g.id === privateEditing.goal);
        if (goal) {
            Object.assign(goal, goalData);
        }
    } else {
        privateStorage.piGoals.push({
            id: generateId(),
            completed: false,
            createdAt: new Date().toISOString(),
            ...goalData
        });
    }

    savePrivateData();
    renderPiWorkspace();
    resetPiGoalForm();
}

function resetPiGoalForm() {
    const form = document.getElementById('piGoalFormElement');
    if (!form) return;
    form.reset();
    privateEditing.goal = null;
    document.getElementById('piGoalSubmitBtn').textContent = 'Save Goal';
}

function editPiGoal(id) {
    const goal = privateStorage.piGoals.find(g => g.id === id);
    if (!goal) return;
    privateEditing.goal = id;
    document.getElementById('piGoalTitle').value = goal.title;
    document.getElementById('piGoalFocus').value = goal.focus || 'other';
    document.getElementById('piGoalDeadline').value = goal.deadline || '';
    document.getElementById('piGoalDescription').value = goal.description || '';
    document.getElementById('piGoalSubmitBtn').textContent = 'Update Goal';
}

function completePiGoal(id) {
    const goal = privateStorage.piGoals.find(g => g.id === id);
    if (!goal) return;
    goal.completed = !goal.completed;
    goal.updatedAt = new Date().toISOString();
    savePrivateData();
    renderPiWorkspace();
}

function deletePiGoal(id) {
    if (!confirm('Remove this private goal?')) return;
    privateStorage.piGoals = privateStorage.piGoals.filter(g => g.id !== id);
    savePrivateData();
    renderPiWorkspace();
}

function renderPiGoals() {
    const container = document.getElementById('piGoalsList');
    if (!container) return;

    if (privateStorage.piGoals.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-text">No private goals yet</div></div>';
        return;
    }

    const focusLabels = {
        strategy: 'Strategy',
        publishing: 'Publishing',
        funding: 'Funding',
        team: 'Team Support',
        personal: 'Personal Development',
        other: 'Other'
    };

    const sorted = [...privateStorage.piGoals].sort((a, b) => {
        if (a.completed === b.completed) {
            return new Date(a.deadline || '9999-12-31') - new Date(b.deadline || '9999-12-31');
        }
        return a.completed ? 1 : -1;
    });

    container.innerHTML = sorted.map(goal => {
        const dueDate = goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline';
        const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;
        const focus = focusLabels[goal.focus] || 'Other';
        const statusClass = goal.completed ? 'badge-completed' : 'badge-active';
        const statusLabel = goal.completed ? 'Completed' : 'Active';
        const dueText = goal.completed ? `Completed on ${new Date(goal.updatedAt).toLocaleDateString()}` : dueDate;

        return `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-title">${goal.title}</div>
                    <div class="item-actions">
                        <button class="btn btn-secondary" onclick="editPiGoal('${goal.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deletePiGoal('${goal.id}')">Delete</button>
                    </div>
                </div>
                <div class="item-meta">
                    <span>${focus}</span>
                    <span>${dueText}</span>
                    ${(!goal.completed && daysLeft !== null) ? `<span>${daysLeft >= 0 ? `${daysLeft} days left` : `${Math.abs(daysLeft)} days overdue`}</span>` : ''}
                </div>
                ${goal.description ? `<div class="item-description">${goal.description}</div>` : ''}
                <div class="item-footer">
                    <span class="badge ${statusClass}">${statusLabel}</span>
                    <button class="btn btn-success" onclick="completePiGoal('${goal.id}')">${goal.completed ? 'Reopen' : 'Mark Complete'}</button>
                </div>
            </div>
        `;
    }).join('');
}

// -- Work Log --

function handlePiActivitySubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('piActivityTitle').value.trim();
    if (!title) return;

    const entryData = {
        title,
        date: document.getElementById('piActivityDate').value || new Date().toISOString().split('T')[0],
        mood: document.getElementById('piActivityMood').value,
        notes: document.getElementById('piActivityNotes').value.trim(),
        updatedAt: new Date().toISOString()
    };

    if (privateEditing.activity) {
        const entry = privateStorage.piActivities.find(a => a.id === privateEditing.activity);
        if (entry) {
            Object.assign(entry, entryData);
        }
    } else {
        privateStorage.piActivities.push({
            id: generateId(),
            createdAt: new Date().toISOString(),
            ...entryData
        });
    }

    savePrivateData();
    renderPiWorkspace();
    resetPiActivityForm();
}

function resetPiActivityForm() {
    const form = document.getElementById('piActivityFormElement');
    if (!form) return;
    form.reset();
    privateEditing.activity = null;
    document.getElementById('piActivitySubmitBtn').textContent = 'Log Entry';
    const piActivityDate = document.getElementById('piActivityDate');
    if (piActivityDate) piActivityDate.value = new Date().toISOString().split('T')[0];
}

function editPiActivity(id) {
    const entry = privateStorage.piActivities.find(a => a.id === id);
    if (!entry) return;
    privateEditing.activity = id;
    document.getElementById('piActivityTitle').value = entry.title;
    document.getElementById('piActivityDate').value = entry.date;
    document.getElementById('piActivityMood').value = entry.mood || 'focused';
    document.getElementById('piActivityNotes').value = entry.notes || '';
    document.getElementById('piActivitySubmitBtn').textContent = 'Update Entry';
}

function deletePiActivity(id) {
    if (!confirm('Delete this private work log entry?')) return;
    privateStorage.piActivities = privateStorage.piActivities.filter(a => a.id !== id);
    savePrivateData();
    renderPiWorkspace();
}

function renderPiActivities() {
    const container = document.getElementById('piActivitiesList');
    if (!container) return;

    if (privateStorage.piActivities.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-text">No private work logs yet</div></div>';
        return;
    }

    const moodLabels = {
        focused: 'Focused',
        creative: 'Creative',
        collaborative: 'Collaborative',
        reflective: 'Reflective',
        tired: 'Tired'
    };

    const sorted = [...privateStorage.piActivities].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sorted.map(entry => `
        <div class="item-card">
            <div class="item-header">
                <div class="item-title">${entry.title}</div>
                <div class="item-actions">
                    <button class="btn btn-secondary" onclick="editPiActivity('${entry.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deletePiActivity('${entry.id}')">Delete</button>
                </div>
            </div>
            <div class="item-meta">
                <span>${new Date(entry.date).toLocaleDateString()}</span>
                <span>${moodLabels[entry.mood] || entry.mood}</span>
            </div>
            ${entry.notes ? `<div class="item-description">${entry.notes}</div>` : ''}
        </div>
    `).join('');
}

// -- To-Do --

function handlePiTodoSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('piTodoTitle').value.trim();
    if (!title) return;

    const todoData = {
        title,
        priority: document.getElementById('piTodoPriority').value,
        dueDate: document.getElementById('piTodoDueDate').value || null,
        updatedAt: new Date().toISOString()
    };

    if (privateEditing.todo) {
        const todo = privateStorage.piTodos.find(t => t.id === privateEditing.todo);
        if (todo) {
            Object.assign(todo, todoData);
        }
    } else {
        privateStorage.piTodos.push({
            id: generateId(),
            completed: false,
            createdAt: new Date().toISOString(),
            ...todoData
        });
    }

    savePrivateData();
    renderPiWorkspace();
    resetPiTodoForm();
}

function resetPiTodoForm() {
    const form = document.getElementById('piTodoFormElement');
    if (!form) return;
    form.reset();
    privateEditing.todo = null;
    document.getElementById('piTodoSubmitBtn').textContent = 'Save Task';
}

function editPiTodo(id) {
    const todo = privateStorage.piTodos.find(t => t.id === id);
    if (!todo) return;
    privateEditing.todo = id;
    document.getElementById('piTodoTitle').value = todo.title;
    document.getElementById('piTodoPriority').value = todo.priority || 'medium';
    document.getElementById('piTodoDueDate').value = todo.dueDate || '';
    document.getElementById('piTodoSubmitBtn').textContent = 'Update Task';
}

function togglePiTodo(id) {
    const todo = privateStorage.piTodos.find(t => t.id === id);
    if (!todo) return;
    todo.completed = !todo.completed;
    todo.updatedAt = new Date().toISOString();
    savePrivateData();
    renderPiWorkspace();
}

function deletePiTodo(id) {
    if (!confirm('Delete this private task?')) return;
    privateStorage.piTodos = privateStorage.piTodos.filter(t => t.id !== id);
    savePrivateData();
    renderPiWorkspace();
}

function renderPiTodos() {
    const container = document.getElementById('piTodosList');
    if (!container) return;

    if (privateStorage.piTodos.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-text">No private tasks yet</div></div>';
        return;
    }

    const priorityLabels = {
        high: 'High',
        medium: 'Medium',
        low: 'Low'
    };

    const sorted = [...privateStorage.piTodos].sort((a, b) => {
        if (a.completed === b.completed) {
            return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
        }
        return a.completed ? 1 : -1;
    });

    container.innerHTML = sorted.map(todo => `
        <div class="item-card ${todo.completed ? 'item-completed' : ''}">
            <div class="item-header">
                <div class="item-title">${todo.title}</div>
                <div class="item-actions">
                    <button class="btn btn-secondary" onclick="editPiTodo('${todo.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deletePiTodo('${todo.id}')">Delete</button>
                </div>
            </div>
            <div class="item-meta">
                <span class="badge badge-${todo.priority}">${priorityLabels[todo.priority] || todo.priority}</span>
                ${todo.dueDate ? `<span>Due ${new Date(todo.dueDate).toLocaleDateString()}</span>` : '<span>No due date</span>'}
            </div>
            <div class="item-footer">
                <button class="btn btn-success" onclick="togglePiTodo('${todo.id}')">${todo.completed ? 'Mark Active' : 'Mark Done'}</button>
            </div>
        </div>
    `).join('');
}

// -- Private Export/Import --

function exportPrivateData() {
    const dataStr = JSON.stringify(privateStorage, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pi-workspace-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importPrivateData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            privateStorage.piGoals = data.piGoals || [];
            privateStorage.piActivities = data.piActivities || [];
            privateStorage.piTodos = data.piTodos || [];
            savePrivateData();
            renderPiWorkspace();
            alert('Private workspace restored successfully.');
        } catch (error) {
            alert('Unable to import private data. Please check the file.');
            console.error('Private import error:', error);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}
