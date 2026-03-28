document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const themeSwitch = document.getElementById('theme_switch');
    const sidebarBtns = document.querySelectorAll('.sidebar_menu button');
    const viewTitle = document.getElementById('current_view');
    const taskModal = document.getElementById('task_modal');
    const addTaskBtn = document.getElementById('add-task-btn');
    const closeBtns = document.querySelectorAll('.close_btn');
    const taskForm = document.getElementById('task-form');
    const tasksList = document.getElementById('tasks_list');
    const modalTitle = document.getElementById('modal-title');
    const duplicateAlert = document.getElementById('duplicate-alert'); 
    
    const expandDescBtn = document.getElementById('expand_desc_btn'); 
    const taskDescription = document.getElementById('task_description');

    const priorityFilter = document.getElementById('priority_filter');
    const dateFilter = document.getElementById('date_filter');
    const statusFilter = document.getElementById('status_filter');
    const searchInput = document.getElementById('task-search');

    // --- NEW: SORTING ELEMENTS ---
    const sortModal = document.getElementById('sort_modal');
    const applySortBtn = document.getElementById('apply-sort-btn');
    const sortTriggerBtn = document.getElementById('sort-tasks-btn');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    const saveAndRender = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
    };

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeSwitch) themeSwitch.checked = (theme === 'dark');
    };

    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    if (themeSwitch) {
        themeSwitch.addEventListener('change', () => {
            const newTheme = themeSwitch.checked ? 'dark' : 'light';
            applyTheme(newTheme);
        });
    }

    // --- NEW: SORTING LOGIC FUNCTION ---
    const getSortedTasks = (tasksToSort) => {
        const criteria = document.querySelector('input[name="sort"]:checked').value;
        const order = document.querySelector('input[name="order"]:checked').value;

        return tasksToSort.sort((a, b) => {
            let valA = a[criteria];
            let valB = b[criteria];

            // Handle Date Comparison (Due Date or Creation Date)
            if (criteria === 'dueDate' || criteria === 'createdAt') {
                valA = new Date(valA || 0).getTime();
                valB = new Date(valB || 0).getTime();
            } else {
                // Handle Text Comparison (Title)
                valA = valA ? valA.toString().toLowerCase() : '';
                valB = valB ? valB.toString().toLowerCase() : '';
            }

            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            return 0;
        });
    };

    // --- NEW: SORT EVENT LISTENERS ---
    if (sortTriggerBtn) {
        sortTriggerBtn.addEventListener('click', () => {
            sortModal.classList.add('active');
        });
    }

    applySortBtn.addEventListener('click', () => {
        // We sort the global tasks array and then re-render
        tasks = getSortedTasks(tasks);
        sortModal.classList.remove('active');
        saveAndRender(); // Saves the sorted order to localStorage and refreshes list
    });

    // --- Description Fullscreen Toggle ---
    if (expandDescBtn && taskDescription) {
        expandDescBtn.addEventListener('click', () => {
            const isCurrentlyExpanded = taskDescription.classList.contains('is_expanded');
            
            if (!isCurrentlyExpanded) {
                document.body.style.overflow = 'hidden'; 
                taskDescription.classList.add('is_expanded');
                expandDescBtn.innerHTML = '<i class="fas fa-times"></i> Close Editor';
                taskDescription.focus();
            } else {
                taskDescription.classList.remove('is_expanded');
                expandDescBtn.innerHTML = '<i class="fas fa-expand-alt"></i> Expand';
                document.body.style.overflow = 'auto';
                expandDescBtn.focus();
            }
        });
    }

    sidebarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sidebarBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (viewTitle) {
                switch (btn.id) {
                    case 'all-tasks': viewTitle.innerText = "All Tasks"; break;
                    case 'today-tasks': viewTitle.innerText = "Today Tasks"; break;
                    case 'important-tasks': viewTitle.innerText = "Important Tasks"; break;
                    default: viewTitle.innerText = "All Tasks";
                }
            }
            renderTasks(); 
        });
    });

    const toggleModal = (show = true) => {
        if (show) {
            taskModal.classList.add('active');
        } else {
            taskModal.classList.remove('active');
            if (sortModal) sortModal.classList.remove('active'); 
            taskForm.reset();
            document.getElementById('task_id').value = ''; 
            modalTitle.innerText = "Add New Task";
            if (duplicateAlert) duplicateAlert.style.display = 'none';
            
            taskDescription.classList.remove('is_expanded');
            document.body.style.overflow = 'auto';
            if (expandDescBtn) {
                expandDescBtn.innerHTML = '<i class="fas fa-expand-alt"></i> Expand';
            }
        }
    };

    if (addTaskBtn) addTaskBtn.addEventListener('click', () => toggleModal(true));
    closeBtns.forEach(btn => btn.addEventListener('click', () => toggleModal(false)));

    window.addEventListener('click', (e) => {
        if (e.target === taskModal || e.target === sortModal) toggleModal(false);
    });

    const formatDate = (dateStr) => {
        if (!dateStr) return 'No date';
        const [year, month, day] = dateStr.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return 'No time'; 
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${minutes} ${ampm}`;
    };

    const calculatePriority = (dueDateStr) => {
        if (!dueDateStr) return 'low';
        const today = new Date().setHours(0, 0, 0, 0);
        const dueDate = new Date(dueDateStr).setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return 'high'; 
        if (diffDays <= 3) return 'medium'; 
        return 'low';
    };

    const getPriorityColor = (priority) => {
        const colors = { high: '#e74a3b', medium: '#ffc100', low: '#1cc88a' };
        return colors[priority] || '#858796';
    };

    const renderTasks = () => {
        if (!tasksList) return;
        const activeSidebarFilter = document.querySelector('.sidebar_menu button.active')?.id || 'all-tasks';
        const searchTerm = searchInput.value.toLowerCase();
        let filteredTasks = [...tasks];

        if (activeSidebarFilter === 'important-tasks') {
            filteredTasks = filteredTasks.filter(t => t.isImportant);
        } else if (activeSidebarFilter === 'today-tasks') {
            const todayStr = new Date().toISOString().split('T')[0];
            filteredTasks = filteredTasks.filter(t => t.dueDate === todayStr);
        }

        if (priorityFilter.value !== 'all') filteredTasks = filteredTasks.filter(t => t.priority === priorityFilter.value);
        if (statusFilter.value !== 'all') {
            const today = new Date().setHours(0, 0, 0, 0);
            if (statusFilter.value === 'completed') filteredTasks = filteredTasks.filter(t => t.completed);
            else if (statusFilter.value === 'pending') filteredTasks = filteredTasks.filter(t => !t.completed);
            else if (statusFilter.value === 'overdue') filteredTasks = filteredTasks.filter(t => !t.completed && new Date(t.dueDate) < today);
        }

        if (searchTerm) {
            filteredTasks = filteredTasks.filter(t => 
                t.title.toLowerCase().includes(searchTerm) || 
                t.description.toLowerCase().includes(searchTerm)
            );
        }

        if (filteredTasks.length === 0) {
            tasksList.classList.add('is-empty');
            tasksList.innerHTML = `<div class="empty_state"><i class="fas fa-clipboard-list"></i><p>No tasks found.</p></div>`;
            updateStats();
            return;
        }

        tasksList.classList.remove('is-empty');
        tasksList.innerHTML = filteredTasks.map((task) => `
            <div class="task_card ${task.completed ? 'completed' : ''}" data-id="${task.id}" style="border-left: 5px solid ${getPriorityColor(task.priority)}">
                <button class="close_expanded"><i class="fas fa-arrow-left"></i> Back</button>
                <div class="task_card_header">
                    <div class="title_section">
                        <input type="checkbox" class="task_checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                        <h4>${task.title}</h4>
                    </div>
                    <div class="task_actions">
                        <button class="task-action-btn important ${task.isImportant ? 'active' : ''}" data-id="${task.id}"><i class="fas fa-star"></i></button>
                        <button class="task-action-btn edit" data-id="${task.id}"><i class="fas fa-edit"></i></button>
                        <button class="task-action-btn delete" data-id="${task.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <p class="task_description">${task.description || 'No description'}</p>
                <div class="task_detail">
                    <span><i class="fa-regular fa-calendar-days"></i> ${formatDate(task.dueDate)}</span>
                    <span><i class="fa-regular fa-clock"></i> ${formatTime(task.dueTime)}</span>
                    <span class="priority_badge ${task.priority}">${task.priority}</span>
                </div>
            </div>
        `).join('');
        updateStats();
    };

    [priorityFilter, dateFilter, statusFilter].forEach(f => f.addEventListener('change', renderTasks));
    searchInput.addEventListener('input', renderTasks);

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const idInput = document.getElementById('task_id');
        const titleInput = document.getElementById('task_title');
        const dateInput = document.getElementById('task_due_date');
        const timeInput = document.getElementById('task_due_time');
        const descInput = document.getElementById('task_description');
        const duplicateMsg = document.getElementById('duplicate-msg'); 

        const newTitle = titleInput.value.trim();
        const newDesc = descInput.value.trim();
        const currentId = idInput.value ? parseInt(idInput.value) : null;

        const isDuplicateTitle = tasks.some(t => t.title.toLowerCase() === newTitle.toLowerCase() && t.id !== currentId);
        const isDuplicateDesc = tasks.some(t => t.description.trim().toLowerCase() === newDesc.toLowerCase() && t.description.trim() !== "" && t.id !== currentId);

        if (isDuplicateTitle) {
            duplicateMsg.innerText = "This title is already used!";
            duplicateAlert.style.display = 'flex';
            return;
        }

        if (isDuplicateDesc) {
            duplicateMsg.innerText = "This description is already used!";
            duplicateAlert.style.display = 'flex';
            return;
        }

        const taskData = {
            title: newTitle,
            dueDate: dateInput.value,
            dueTime: timeInput.value,
            description: newDesc,
            priority: calculatePriority(dateInput.value),
            createdAt: currentId ? undefined : new Date().toISOString() // Tracks creation time for sorting
        };

        if (currentId) {
            tasks = tasks.map(t => t.id === currentId ? { ...t, ...taskData } : t);
        } else {
            tasks.push({ id: Date.now(), ...taskData, completed: false, isImportant: false });
        }

        saveAndRender();
        toggleModal(false);
    });

    tasksList.addEventListener('click', (e) => {
        const id = parseInt(e.target.closest('[data-id]')?.dataset.id);
        if (!id) return;

        if (e.target.classList.contains('task_checkbox')) {
            tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
            saveAndRender();
        } else if (e.target.closest('.delete')) {
            if (confirm("Are you sure you want to delete this task?")) {
                tasks = tasks.filter(t => t.id !== id);
                saveAndRender();
            }
        } else if (e.target.closest('.important')) {
            tasks = tasks.map(t => t.id === id ? { ...t, isImportant: !t.isImportant } : t);
            saveAndRender();
        } else if (e.target.closest('.edit')) {
            const task = tasks.find(t => t.id === id);
            document.getElementById('task_id').value = task.id;
            document.getElementById('task_title').value = task.title;
            document.getElementById('task_due_date').value = task.dueDate;
            document.getElementById('task_due_time').value = task.dueTime || "";
            document.getElementById('task_description').value = task.description;
            modalTitle.innerText = "Edit Task";
            toggleModal(true);
        } else {
            const card = e.target.closest('.task_card');
            if (card && !e.target.closest('.task_actions')) {
                if (e.target.closest('.close_expanded')) {
                    card.classList.remove('expanded');
                    tasksList.classList.remove('has-expanded');
                } else {
                    card.classList.add('expanded');
                    tasksList.classList.add('has-expanded');
                }
            }
        }
    });

    const updateStats = () => {
        const today = new Date().setHours(0,0,0,0);
        document.getElementById('total-tasks-count').innerText = tasks.length;
        document.getElementById('completed-tasks-count').innerText = tasks.filter(t => t.completed).length;
        document.getElementById('pending-tasks-count').innerText = tasks.filter(t => !t.completed).length;
        document.getElementById('overdue-tasks-count').innerText = tasks.filter(t => !t.completed && new Date(t.dueDate) < today).length;
    };

    renderTasks();
});