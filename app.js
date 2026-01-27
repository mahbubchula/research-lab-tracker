// Research Lab Tracker - Main Application
// Data Storage
const storage = {
    students: [],
    goals: [],
    activities: [],
    publications: []
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initializeEventListeners();
    updateUI();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('activityDate').value = today;
    document.getElementById('goalDeadline').valueAsDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
});

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('researchLabData');
    if (saved) {
        const data = JSON.parse(saved);
        storage.students = data.students || [];
        storage.goals = data.goals || [];
        storage.activities = data.activities || [];
        storage.publications = data.publications || [];
    }
    
    // Add default PI if no students exist
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

// Save data to localStorage
function saveData() {
    localStorage.setItem('researchLabData', JSON.stringify(storage));
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Initialize Event Listeners
function initializeEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Export/Import
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importData);

    // Students
    document.getElementById('addStudentBtn').addEventListener('click', () => toggleForm('studentForm', true));
    document.getElementById('cancelStudentBtn').addEventListener('click', () => toggleForm('studentForm', false));
    document.getElementById('studentFormElement').addEventListener('submit', handleStudentSubmit);

    // Goals
    document.getElementById('addGoalBtn').addEventListener('click', () => toggleForm('goalForm', true));
    document.getElementById('cancelGoalBtn').addEventListener('click', () => toggleForm('goalForm', false));
    document.getElementById('goalFormElement').addEventListener('submit', handleGoalSubmit);
    
    // Goal filters
    document.getElementById('filterGoalType').addEventListener('change', renderGoals);
    document.getElementById('filterGoalStudent').addEventListener('change', renderGoals);
    document.getElementById('filterGoalStatus').addEventListener('change', renderGoals);

    // Activities
    document.getElementById('addActivityBtn').addEventListener('click', () => toggleForm('activityForm', true));
    document.getElementById('cancelActivityBtn').addEventListener('click', () => toggleForm('activityForm', false));
    document.getElementById('activityFormElement').addEventListener('submit', handleActivitySubmit);
    
    // Activity filters
    document.getElementById('filterActivityStudent').addEventListener('change', renderActivities);
    document.getElementById('filterActivityDate').addEventListener('change', renderActivities);

    // Publications
    document.getElementById('addPublicationBtn').addEventListener('click', () => toggleForm('publicationForm', true));
    document.getElementById('cancelPublicationBtn').addEventListener('click', () => toggleForm('publicationForm', false));
    document.getElementById('publicationFormElement').addEventListener('submit', handlePublicationSubmit);
    
    // Publication filter
    document.getElementById('filterPublicationStatus').addEventListener('change', renderPublications);
}

// Switch Tab
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });

    // Update UI for current tab
    if (tabName === 'dashboard') updateDashboard();
    if (tabName === 'goals') renderGoals();
    if (tabName === 'activities') renderActivities();
    if (tabName === 'publications') renderPublications();
    if (tabName === 'students') renderStudents();
}

// Toggle Form Display
function toggleForm(formId, show) {
    const form = document.getElementById(formId);
    form.style.display = show ? 'block' : 'none';
    
    if (!show) {
        // Reset form
        form.querySelector('form').reset();
    }
    
    if (show) {
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Update all UI elements
function updateUI() {
    updateStudentDropdowns();
    updateDashboard();
    renderGoals();
    renderActivities();
    renderPublications();
    renderStudents();
}

// Update student dropdowns
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
        
        // Clear and repopulate
        const isFilter = id.startsWith('filter');
        select.innerHTML = isFilter ? '<option value="all">All Students</option>' : '<option value="">Select Student</option>';
        
        storage.students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.name;
            select.appendChild(option);
        });
        
        // Restore selection if still valid
        if (currentValue) select.value = currentValue;
    });
}

// Dashboard Functions
function updateDashboard() {
    // Update stats
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

    // Current week goals
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
                        <button class="btn btn-success btn-sm" onclick="completeGoal('${goal.id}')">✓</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Recent activities
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

// Student Functions
function handleStudentSubmit(e) {
    e.preventDefault();
    
    const student = {
        id: generateId(),
        name: document.getElementById('studentName').value,
        email: document.getElementById('studentEmail').value,
        role: document.getElementById('studentRole').value,
        createdAt: new Date().toISOString()
    };

    storage.students.push(student);
    saveData();
    updateUI();
    toggleForm('studentForm', false);
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
                    <button class="btn btn-danger" onclick="deleteStudent('${student.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student? This will NOT delete their goals and activities.')) {
        storage.students = storage.students.filter(s => s.id !== id);
        saveData();
        updateUI();
    }
}

// Goal Functions
function handleGoalSubmit(e) {
    e.preventDefault();
    
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
    saveData();
    updateUI();
    toggleForm('goalForm', false);
}

function renderGoals() {
    const container = document.getElementById('goalsList');
    
    // Apply filters
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

    // Sort by deadline
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

function completeGoal(id) {
    const goal = storage.goals.find(g => g.id === id);
    if (goal) {
        goal.completed = true;
        goal.completedAt = new Date().toISOString();
        saveData();
        updateUI();
    }
}

function deleteGoal(id) {
    if (confirm('Are you sure you want to delete this goal?')) {
        storage.goals = storage.goals.filter(g => g.id !== id);
        saveData();
        updateUI();
    }
}

// Activity Functions
function handleActivitySubmit(e) {
    e.preventDefault();
    
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
    saveData();
    updateUI();
    toggleForm('activityForm', false);
}

function renderActivities() {
    const container = document.getElementById('activitiesList');
    
    // Apply filters
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

    // Sort by date (newest first)
    filteredActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = filteredActivities.map(activity => {
        const student = storage.students.find(s => s.id === activity.studentId);
        const date = new Date(activity.date).toLocaleDateString();
        
        return `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-title">${activity.title}</div>
                    <div class="item-actions">
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

function deleteActivity(id) {
    if (confirm('Are you sure you want to delete this activity?')) {
        storage.activities = storage.activities.filter(a => a.id !== id);
        saveData();
        updateUI();
    }
}

// Publication Functions
function handlePublicationSubmit(e) {
    e.preventDefault();
    
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
    saveData();
    updateUI();
    toggleForm('publicationForm', false);
}

function renderPublications() {
    const container = document.getElementById('publicationsList');
    
    // Apply filter
    let filteredPublications = [...storage.publications];
    
    const statusFilter = document.getElementById('filterPublicationStatus').value;
    if (statusFilter !== 'all') {
        filteredPublications = filteredPublications.filter(p => p.status === statusFilter);
    }

    if (filteredPublications.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-text">No publications found</div></div>';
        return;
    }

    // Sort by year (newest first)
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

function deletePublication(id) {
    if (confirm('Are you sure you want to delete this publication?')) {
        storage.publications = storage.publications.filter(p => p.id !== id);
        saveData();
        updateUI();
    }
}

// Export/Import Functions
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

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            
            if (confirm('This will replace all current data. Are you sure?')) {
                storage.students = data.students || [];
                storage.goals = data.goals || [];
                storage.activities = data.activities || [];
                storage.publications = data.publications || [];
                saveData();
                updateUI();
                alert('Data imported successfully!');
            }
        } catch (error) {
            alert('Error importing data. Please check the file format.');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    e.target.value = '';
}
