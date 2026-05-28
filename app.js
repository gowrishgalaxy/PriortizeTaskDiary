// State Management (persisted in local storage)
const FIELD_COLORS = ['#4361ee', '#e63946', '#2a9d8f', '#f4a261', '#e76f51', '#8338ec', '#ff006e', '#3a86ff', '#06d6a0', '#118ab2'];

let topics = JSON.parse(localStorage.getItem('topics')) || [];
let fields = JSON.parse(localStorage.getItem('fields')) || ['Personal', 'Work', 'Health'];
fields = fields.map((f, i) => {
    if (typeof f === 'string') {
        return { name: f, priorityNumber: i + 1, color: FIELD_COLORS[i % FIELD_COLORS.length] };
    }
    if (!f.color) {
        f.color = FIELD_COLORS[i % FIELD_COLORS.length];
    }
    return f;
});
let diaryEntries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
let recycleBin = JSON.parse(localStorage.getItem('recycleBin')) || [];

let currentTopicIdForField = null;
let currentSubtopicIdForField = null;
let currentFieldForNewTopic = null;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light-theme';
    document.body.className = savedTheme;
    reorderTopicPriorityNumbers(); // Assign priority numbers to any existing topics
    reorderFieldPriorityNumbers(); // Assign priority numbers to any existing fields
    saveState();
    
    renderToDo();
    renderPrioritize();
    renderDiary();
    
    document.getElementById('diary-date').valueAsDate = new Date();
});

function saveState() {
    localStorage.setItem('topics', JSON.stringify(topics));
    localStorage.setItem('fields', JSON.stringify(fields));
    localStorage.setItem('diaryEntries', JSON.stringify(diaryEntries));
    localStorage.setItem('recycleBin', JSON.stringify(recycleBin));
}

const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

// --- Navigation & Theme ---
function navigate(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`${pageId}-page`).classList.add('active');
    document.getElementById(`nav-${pageId}`).classList.add('active');
    
    if (pageId === 'todo') renderToDo();
    if (pageId === 'prioritize') renderPrioritize();
    if (pageId === 'diary') renderDiary();
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    document.body.className = isDark ? 'light-theme' : 'dark-theme';
    localStorage.setItem('theme', document.body.className);
}

// --- ToDo Page Logic ---
function addTopic() {
    const input = document.getElementById('new-topic-input');
    const name = input.value.trim();
    if (name) {
        const newTopic = { id: generateId(), name, subtopics: [], priorityNumber: 999999 };
        topics.push(newTopic);
        reorderTopicPriorityNumbers();
        input.value = '';
        saveState();
        renderToDo();
    }
}

function addSubtopic(topicId) {
    const input = document.getElementById(`new-subtopic-${topicId}`);
    const name = input.value.trim();
    if (name) {
        const topic = topics.find(t => t.id === topicId);
        
        const dateInput = document.getElementById(`new-subtopic-date-${topicId}`);
        const fieldInput = document.getElementById(`new-subtopic-field-${topicId}`);
        const priorityInput = document.getElementById(`new-subtopic-priority-${topicId}`);
        
        const dateVal = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
        const fieldVal = fieldInput ? fieldInput.value : (fields[0] ? fields[0].name : 'Personal');
        const priorityVal = priorityInput ? priorityInput.value : 'P5';
        
        topic.subtopics.push({
            id: generateId(),
            name,
            date: dateVal,
            field: fieldVal,
            priority: priorityVal,
            priorityNumber: 999999 // High number so it temporarily falls to the end
        });
        reorderPriorityNumbers(fieldVal); // Resequence cleanly
        input.value = '';
        saveState();
        renderToDo();
    }
}

function showSubtopicInput(topicId) {
    document.getElementById(`add-subtopic-btn-container-${topicId}`).style.display = 'none';
    const inputGroup = document.getElementById(`add-subtopic-input-group-${topicId}`);
    inputGroup.style.display = 'flex';
    document.getElementById(`new-subtopic-${topicId}`).focus();
}

function hideSubtopicInput(topicId) {
    document.getElementById(`add-subtopic-btn-container-${topicId}`).style.display = 'block';
    document.getElementById(`add-subtopic-input-group-${topicId}`).style.display = 'none';
    document.getElementById(`new-subtopic-${topicId}`).value = '';
}

function reorderTopicPriorityNumbers(activeTopicId = null, newPriorityNum = null) {
    let allTopics = [...topics];
    let activeTopic = null;
    let otherTopics = [];

    if (activeTopicId) {
        allTopics.forEach(t => {
            if (t.id === activeTopicId) activeTopic = t;
            else otherTopics.push(t);
        });
    } else {
        otherTopics = allTopics;
    }
    
    otherTopics.sort((a, b) => (a.priorityNumber || 999) - (b.priorityNumber || 999));
    
    if (activeTopic) {
        const insertIndex = (newPriorityNum !== null) 
            ? Math.max(0, Math.min(newPriorityNum - 1, otherTopics.length))
            : otherTopics.length;
        otherTopics.splice(insertIndex, 0, activeTopic);
    }
    
    otherTopics.forEach((t, index) => {
        t.priorityNumber = index + 1;
    });

    topics = otherTopics;
}

function updateTopic(topicId, key, value) {
    if (key === 'priorityNumber') {
        const newNum = parseInt(value, 10) || 1;
        reorderTopicPriorityNumbers(topicId, newNum);
        saveState();
        renderToDo();
        return;
    }
}

function updateTopicName(topicId, newName) {
    const trimmed = newName.trim();
    const topic = topics.find(t => t.id === topicId);
    if (topic && trimmed && topic.name !== trimmed) {
        topic.name = trimmed;
        saveState();
        renderToDo();
        renderPrioritize();
    } else if (topic && !trimmed) {
        renderToDo(); // Revert if left empty
    }
}

function reorderFieldPriorityNumbers(activeFieldName = null, newPriorityNum = null) {
    let allFields = [...fields];
    let activeField = null;
    let otherFields = [];

    if (activeFieldName) {
        allFields.forEach(f => {
            if (f.name === activeFieldName) activeField = f;
            else otherFields.push(f);
        });
    } else {
        otherFields = allFields;
    }
    
    otherFields.sort((a, b) => (a.priorityNumber || 999) - (b.priorityNumber || 999));
    
    if (activeField) {
        const insertIndex = (newPriorityNum !== null) 
            ? Math.max(0, Math.min(newPriorityNum - 1, otherFields.length))
            : otherFields.length;
        otherFields.splice(insertIndex, 0, activeField);
    }
    
    otherFields.forEach((f, index) => {
        f.priorityNumber = index + 1;
    });

    fields = otherFields;
}

function updateFieldPriority(fieldName, value) {
    const newNum = parseInt(value, 10) || 1;
    reorderFieldPriorityNumbers(fieldName, newNum);
    saveState();
    renderPrioritize();
}

function updateFieldName(oldName, newName) {
    const trimmed = newName.trim();
    if (trimmed && trimmed !== oldName && !fields.some(f => f.name === trimmed)) {
        const field = fields.find(f => f.name === oldName);
        if (field) field.name = trimmed;
        
        topics.forEach(t => t.subtopics.forEach(s => {
            if (s.field === oldName) s.field = trimmed;
        }));
        
        saveState();
    }
    renderToDo();
    renderPrioritize();
}

function deleteField(fieldName) {
    if (fields.length <= 1) {
        alert("You must have at least one prioritize field.");
        return;
    }
    
    const fallbackField = fields.find(f => f.name !== fieldName).name;
    
    const fieldToDelete = fields.find(f => f.name === fieldName);
    if (fieldToDelete) {
        // Send to recycle bin
        recycleBin.push({ id: generateId(), type: 'field', data: fieldToDelete, deletedAt: new Date().toISOString() });
        fields = fields.filter(f => f.name !== fieldName);
        
        // Safely move all existing tasks out of this field into the fallback field
        topics.forEach(t => t.subtopics.forEach(s => {
            if (s.field === fieldName) {
                s.field = fallbackField;
            }
        }));
        
        reorderFieldPriorityNumbers();
        saveState();
        renderToDo();
        renderPrioritize();
    }
}

function reorderPriorityNumbers(fieldName, activeSubtopicId = null, newPriorityNum = null) {
    let sameFieldTasks = [];
    let activeTask = null;
    
    topics.forEach(t => t.subtopics.forEach(s => {
        if (s.field === fieldName) {
            if (s.id === activeSubtopicId) activeTask = s;
            else sameFieldTasks.push(s);
        }
    }));
    
    // Sort tasks in that field by their current priority number
    sameFieldTasks.sort((a, b) => (parseInt(a.priorityNumber, 10) || 1) - (parseInt(b.priorityNumber, 10) || 1));
    
    // If we're updating a specific item's position, insert it at its new spot
    if (activeTask && newPriorityNum !== null) {
        const insertIndex = Math.max(0, Math.min(newPriorityNum - 1, sameFieldTasks.length));
        sameFieldTasks.splice(insertIndex, 0, activeTask);
    } else if (activeTask) {
        sameFieldTasks.push(activeTask);
    }
    
    // Re-assign them seamlessly from 1 to N
    sameFieldTasks.forEach((s, index) => {
        s.priorityNumber = index + 1;
    });
}

function updateSubtopic(topicId, subtopicId, key, value) {
    const topic = topics.find(t => t.id === topicId);
    const subtopic = topic.subtopics.find(s => s.id === subtopicId);
    
    if (key === 'field') {
        if (value === '__CREATE_NEW__') {
            currentTopicIdForField = topicId;
            currentSubtopicIdForField = subtopicId;
            document.getElementById('new-field-modal').showModal();
            renderToDo(); // Revert select briefly
            return;
        }
        const oldField = subtopic.field;
        subtopic.field = value;
        subtopic.priorityNumber = 999999;
        reorderPriorityNumbers(oldField);
        reorderPriorityNumbers(value);
        saveState();
        renderToDo();
        renderPrioritize();
        return;
    }
    
    if (key === 'priorityNumber') {
        const newNum = parseInt(value, 10) || 1;
        reorderPriorityNumbers(subtopic.field, subtopicId, newNum);
        
        // Automatically switch the Prioritize page sort to Priority Number so you instantly see the new sequence
        const prioritizeSortDropdown = document.getElementById('prioritize-sort');
        if (prioritizeSortDropdown && prioritizeSortDropdown.value !== 'priorityNumber') {
            prioritizeSortDropdown.value = 'priorityNumber';
        }
        
        saveState();
        renderToDo();
        renderPrioritize();
        return;
    }

    subtopic[key] = value;
    saveState();
    renderToDo();
    renderPrioritize();
}

function editSubtopicName(topicId, subtopicId, newName) {
    const trimmed = newName.trim();
    if (trimmed) {
        updateSubtopic(topicId, subtopicId, 'name', trimmed);
    } else {
        renderToDo(); // Revert if left empty
        renderPrioritize();
    }
}

function deleteSubtopic(topicId, subtopicId) {
    const topic = topics.find(t => t.id === topicId);
    const subtopic = topic.subtopics.find(s => s.id === subtopicId);
    const field = subtopic ? subtopic.field : null;
    
    if (subtopic) {
        recycleBin.push({ id: subtopicId, type: 'subtopic', data: subtopic, originalTopicId: topicId, deletedAt: new Date().toISOString() });
    }

    topic.subtopics = topic.subtopics.filter(s => s.id !== subtopicId);
    if (field) reorderPriorityNumbers(field); // Fill in the missing gap
    
    saveState();
    renderToDo();
    renderPrioritize();
}

function deleteTopic(topicId) {
    const topic = topics.find(t => t.id === topicId);
    const fieldsToResequence = new Set();
    if (topic) {
        topic.subtopics.forEach(s => fieldsToResequence.add(s.field));
        recycleBin.push({ id: topicId, type: 'topic', data: topic, deletedAt: new Date().toISOString() });
    }
    
    topics = topics.filter(t => t.id !== topicId);
    reorderTopicPriorityNumbers();
    fieldsToResequence.forEach(f => reorderPriorityNumbers(f)); // Fill any gaps from bulk delete
    
    saveState();
    renderToDo();
    renderPrioritize();
}

let draggedSubtopic = null;
let draggedFromTopicId = null;

function dragStart(event, topicId, subtopicId) {
    draggedSubtopic = topics.find(t => t.id === topicId).subtopics.find(s => s.id === subtopicId);
    draggedFromTopicId = topicId;
    event.target.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
}

function allowDrop(event) {
    event.preventDefault();
    const list = event.target.closest('.subtopics-list');
    if (list) {
        list.classList.add('drag-over');
    }
}

function dragLeave(event) {
    const list = event.target.closest('.subtopics-list');
    if (list && !list.contains(event.relatedTarget)) {
        list.classList.remove('drag-over');
    }
}

function dragEnd(event) {
    event.target.classList.remove('dragging');
    document.querySelectorAll('.subtopics-list').forEach(list => list.classList.remove('drag-over'));
    draggedSubtopic = null;
    draggedFromTopicId = null;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.subtopic-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function drop(event) {
    event.preventDefault();
    const list = event.target.closest('.subtopics-list');
    
    if (list && draggedSubtopic && draggedFromTopicId) {
        list.classList.remove('drag-over');
        const targetTopicId = list.getAttribute('data-topic-id');
        const targetFieldName = list.getAttribute('data-field-name');
        
        if (targetTopicId) {
            const fromTopic = topics.find(t => t.id === draggedFromTopicId);
            const toTopic = topics.find(t => t.id === targetTopicId);
            
            if (fromTopic && toTopic) {
                fromTopic.subtopics = fromTopic.subtopics.filter(s => s.id !== draggedSubtopic.id);
                const afterElement = getDragAfterElement(list, event.clientY);
                
                if (afterElement == null) {
                    toTopic.subtopics.push(draggedSubtopic);
                } else {
                    const insertIndex = toTopic.subtopics.findIndex(s => s.id === afterElement.getAttribute('data-subtopic-id'));
                    toTopic.subtopics.splice(insertIndex, 0, draggedSubtopic);
                }
                
                // Auto-switch to default sort to accurately visualize the newly customized list order
                const todoSortDropdown = document.getElementById('todo-sort');
                if (todoSortDropdown && todoSortDropdown.value !== 'none') {
                    todoSortDropdown.value = 'none';
                }
                
                saveState();
                renderToDo();
                renderPrioritize();
            }
        } else if (targetFieldName) {
            const oldField = draggedSubtopic.field;
            draggedSubtopic.field = targetFieldName;
            
            let sameFieldTasks = [];
            topics.forEach(t => t.subtopics.forEach(s => {
                if (s.field === targetFieldName && s.id !== draggedSubtopic.id) {
                    sameFieldTasks.push(s);
                }
            }));
            
            sameFieldTasks.sort((a, b) => (parseInt(a.priorityNumber, 10) || 1) - (parseInt(b.priorityNumber, 10) || 1));
            
            const afterElement = getDragAfterElement(list, event.clientY);
            if (afterElement == null) {
                sameFieldTasks.push(draggedSubtopic);
            } else {
                const insertIndex = sameFieldTasks.findIndex(s => s.id === afterElement.getAttribute('data-subtopic-id'));
                sameFieldTasks.splice(insertIndex, 0, draggedSubtopic);
            }
            
            sameFieldTasks.forEach((s, index) => {
                s.priorityNumber = index + 1; // Auto recalculates sequence perfectly
            });
            
            if (oldField !== targetFieldName) {
                reorderPriorityNumbers(oldField); // Close the gap on the old field
            }
            
            // Force sort to Priority Number so we see the new drop order visually
            const prioritizeSortDropdown = document.getElementById('prioritize-sort');
            if (prioritizeSortDropdown && prioritizeSortDropdown.value !== 'priorityNumber') {
                prioritizeSortDropdown.value = 'priorityNumber';
            }
            
            saveState();
            renderToDo();
            renderPrioritize();
        }
    }
}

function renderToDo() {
    const container = document.getElementById('topics-container');
    const sortBy = document.getElementById('todo-sort').value;
    const activeElementId = document.activeElement ? document.activeElement.id : null;
    
    let topicsToRender = JSON.parse(JSON.stringify(topics));
    
    // Sort topics by priority number, unless overridden by the dropdown
    if (sortBy === 'name') {
        topicsToRender.sort((a, b) => a.name.localeCompare(b.name));
    } else {
        topicsToRender.sort((a, b) => (a.priorityNumber || 999) - (b.priorityNumber || 999));
    }
    
    topicsToRender.forEach(topic => {
        if (sortBy === 'name') topic.subtopics.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortBy === 'date') topic.subtopics.sort((a, b) => new Date(a.date || '9999-12-31') - new Date(b.date || '9999-12-31'));
        else if (sortBy === 'priority') {
            topic.subtopics.sort((a, b) => {
                const p = a.priority.localeCompare(b.priority);
                if (p !== 0) return p;
                return (parseInt(a.priorityNumber, 10) || 1) - (parseInt(b.priorityNumber, 10) || 1);
            });
        }
    });

    if (topicsToRender.length === 0) {
        container.innerHTML = '<div class="empty-state">No topics found. Add a new topic above to get started!</div>';
        return;
    }

    container.innerHTML = topicsToRender.map(topic => `
        <div class="topic-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="number" id="topic-num-${topic.id}" class="item-priority priority-number-input" min="1" value="${topic.priorityNumber || 1}" onchange="updateTopic('${topic.id}', 'priorityNumber', this.value)" title="Topic Priority">
                    <h3 class="editable-text" style="margin: 0; color: var(--primary-color); min-width: 50px; padding: 0.2rem;" contenteditable="true" onblur="updateTopicName('${topic.id}', this.innerText)" onkeydown="if(event.key === 'Enter') { event.preventDefault(); this.blur(); }" title="Click to edit topic name">${topic.name}</h3>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <div id="add-subtopic-btn-container-${topic.id}">
                        <button onclick="showSubtopicInput('${topic.id}')" style="background-color: transparent; color: var(--primary-color); border: 1px solid var(--primary-color); padding: 0.2rem 0.6rem; font-size: 0.85rem; border-radius: 6px;">+ Add Subtopic</button>
                    </div>
                    <button onclick="deleteTopic('${topic.id}')" style="background-color: var(--danger-color); padding: 0.2rem 0.6rem; font-size: 0.85rem;">Delete Topic</button>
                </div>
            </div>

            <div id="add-subtopic-input-group-${topic.id}" class="input-group" style="margin-bottom: 0.2rem; display: none; flex-wrap: wrap; align-items: center;">
                <input type="text" id="new-subtopic-${topic.id}" placeholder="New subtopic..." style="flex-grow: 1; min-width: 150px;" onkeypress="if(event.key === 'Enter') addSubtopic('${topic.id}')">
                <input type="date" id="new-subtopic-date-${topic.id}" value="${new Date().toISOString().split('T')[0]}">
                <select id="new-subtopic-field-${topic.id}">
                    ${fields.map(f => `<option value="${f.name}">${f.name}</option>`).join('')}
                </select>
                <select id="new-subtopic-priority-${topic.id}">
                    ${['P1', 'P2', 'P3', 'P4', 'P5'].map(p => `<option value="${p}" ${p === 'P5' ? 'selected' : ''}>${p}</option>`).join('')}
                </select>
                <button onclick="addSubtopic('${topic.id}')">Save</button>
                <button onclick="hideSubtopicInput('${topic.id}')" class="btn-cancel">Cancel</button>
            </div>
            
            <div class="subtopics-list" data-topic-id="${topic.id}" ondragover="allowDrop(event)" ondragleave="dragLeave(event)" ondrop="drop(event)">
                ${topic.subtopics.map(sub => `
                    <div class="subtopic-item draggable" draggable="true" ondragstart="dragStart(event, '${topic.id}', '${sub.id}')" ondragend="dragEnd(event)" data-subtopic-id="${sub.id}">
                        <div class="subtopic-left">
                            <span class="drag-handle" title="Drag to move or reorder">⋮⋮</span>
                            <strong class="editable-text" contenteditable="true" onblur="editSubtopicName('${topic.id}', '${sub.id}', this.innerText)" onkeydown="if(event.key === 'Enter') { event.preventDefault(); this.blur(); }" title="Click to edit task name" style="padding: 0.2rem;">${sub.name}</strong>
                        </div>
                        <div class="subtopic-right">
                            <input type="date" value="${sub.date}" onchange="updateSubtopic('${topic.id}', '${sub.id}', 'date', this.value)">
                            <select onchange="updateSubtopic('${topic.id}', '${sub.id}', 'field', this.value)">
                                ${fields.map(f => `<option value="${f.name}" ${sub.field === f.name ? 'selected' : ''}>${f.name}</option>`).join('')}
                                <option value="__CREATE_NEW__">+ Create New Field</option>
                            </select>
                            <select onchange="updateSubtopic('${topic.id}', '${sub.id}', 'priority', this.value)">
                                ${['P1', 'P2', 'P3', 'P4', 'P5'].map(p => `<option value="${p}" ${sub.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
                            </select>
                            <button onclick="deleteSubtopic('${topic.id}', '${sub.id}')" style="background-color: transparent; color: var(--danger-color); border: 1px solid var(--danger-color); padding: 0.2rem 0.4rem;">X</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    if (activeElementId) {
        const el = document.getElementById(activeElementId);
        if (el) el.focus();
    }
}

// --- Dynamic Fields Logic ---
function saveNewField() {
    const input = document.getElementById('new-field-input');
    const newField = input.value.trim();
    if (newField && !fields.some(f => f.name === newField)) {
        const color = FIELD_COLORS[fields.length % FIELD_COLORS.length];
        fields.push({ name: newField, priorityNumber: fields.length + 1, color });
        if (currentTopicIdForField && currentSubtopicIdForField) {
            updateSubtopic(currentTopicIdForField, currentSubtopicIdForField, 'field', newField);
        }
        saveState();
    }
    closeFieldModal();
}

function closeFieldModal() {
    document.getElementById('new-field-input').value = '';
    document.getElementById('new-field-modal').close();
    currentTopicIdForField = null;
    currentSubtopicIdForField = null;
    renderToDo();
    renderPrioritize();
}

// --- Prioritize Page Inline Task Creation ---
function handlePrioritizeTopicChange(fieldName, value) {
    if (value === '__CREATE_NEW_TOPIC__') {
        currentFieldForNewTopic = fieldName;
        document.getElementById('new-topic-modal').showModal();
    }
}

function saveNewTopicFromModal() {
    const input = document.getElementById('new-topic-modal-input');
    const name = input.value.trim();
    if (name) {
        const newTopic = { id: generateId(), name, subtopics: [], priorityNumber: 999999 };
        topics.push(newTopic);
        reorderTopicPriorityNumbers();
        saveState();
        
        renderPrioritize(); // Re-render to load new topic into dropdowns
        if (currentFieldForNewTopic) {
            showPrioritizeTaskInput(currentFieldForNewTopic);
            const safeFieldName = currentFieldForNewTopic.replace(/\s+/g, '-');
            const select = document.getElementById(`new-prioritize-topic-${safeFieldName}`);
            if (select) select.value = newTopic.id;
        }
        renderToDo();
    }
    closeTopicModal();
}

function closeTopicModal() {
    document.getElementById('new-topic-modal-input').value = '';
    document.getElementById('new-topic-modal').close();
    if (currentFieldForNewTopic) {
        const safeFieldName = currentFieldForNewTopic.replace(/\s+/g, '-');
        const select = document.getElementById(`new-prioritize-topic-${safeFieldName}`);
        if (select && select.value === '__CREATE_NEW_TOPIC__') {
            select.value = topics.length > 0 ? topics[0].id : '';
        }
    }
    currentFieldForNewTopic = null;
}

function showPrioritizeTaskInput(fieldName) {
    const safeFieldName = fieldName.replace(/\s+/g, '-');
    document.getElementById(`add-task-btn-container-${safeFieldName}`).style.display = 'none';
    document.getElementById(`add-task-input-group-${safeFieldName}`).style.display = 'flex';
    document.getElementById(`new-prioritize-task-${safeFieldName}`).focus();
}

function hidePrioritizeTaskInput(fieldName) {
    const safeFieldName = fieldName.replace(/\s+/g, '-');
    document.getElementById(`add-task-btn-container-${safeFieldName}`).style.display = 'block';
    document.getElementById(`add-task-input-group-${safeFieldName}`).style.display = 'none';
    document.getElementById(`new-prioritize-task-${safeFieldName}`).value = '';
}

function addPrioritizeTask(fieldName) {
    const safeFieldName = fieldName.replace(/\s+/g, '-');
    const input = document.getElementById(`new-prioritize-task-${safeFieldName}`);
    const select = document.getElementById(`new-prioritize-topic-${safeFieldName}`);
    const prioritySelect = document.getElementById(`new-prioritize-priority-${safeFieldName}`);
    const name = input.value.trim();
    const topicId = select ? select.value : null;
    const priorityVal = prioritySelect ? prioritySelect.value : 'P5';
    
    if (name && topicId && topicId !== '__CREATE_NEW_TOPIC__') {
        const topic = topics.find(t => t.id === topicId);
        if (topic) {
            topic.subtopics.push({ id: generateId(), name, date: new Date().toISOString().split('T')[0], field: fieldName, priority: priorityVal, priorityNumber: 999999 });
            reorderPriorityNumbers(fieldName);
            saveState();
            renderToDo();
            renderPrioritize();
            
            showPrioritizeTaskInput(fieldName); // Keeps it open for rapid multi-adding
            const newSelect = document.getElementById(`new-prioritize-topic-${safeFieldName}`);
            if (newSelect) newSelect.value = topicId;
        }
    }
}

// --- Prioritize Page Logic ---
function renderPrioritize() {
    const container = document.getElementById('prioritize-container');
    const sortBy = document.getElementById('prioritize-sort').value;
    const activeElementId = document.activeElement ? document.activeElement.id : null;
    
    let allTasks = [];
    topics.forEach(topic => topic.subtopics.forEach(sub => allTasks.push({ ...sub, topicName: topic.name, topicId: topic.id })));

    const grouped = {};
    fields.forEach(f => grouped[f.name] = []);
    allTasks.forEach(task => { if(grouped[task.field]) grouped[task.field].push(task); });

    Object.keys(grouped).forEach(field => {
        grouped[field].sort((a, b) => {
            if (sortBy === 'priority') {
                const p = a.priority.localeCompare(b.priority);
                if (p !== 0) return p;
                return (parseInt(a.priorityNumber, 10) || 1) - (parseInt(b.priorityNumber, 10) || 1);
            }
            if (sortBy === 'priorityNumber') {
                const n = (parseInt(a.priorityNumber, 10) || 1) - (parseInt(b.priorityNumber, 10) || 1);
                if (n !== 0) return n;
                return a.priority.localeCompare(b.priority);
            }
            return a.name.localeCompare(b.name);
        });
    });

    const sortedFields = [...fields].sort((a, b) => (a.priorityNumber || 999) - (b.priorityNumber || 999));

    let fieldsHtml = sortedFields.map(f => {
        const fieldName = f.name;
        const tasksForField = grouped[fieldName] || [];
        return `
            <div class="topic-card">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.6rem; padding-bottom: 0.4rem; border-bottom: 1px dashed var(--border-color);">
                    <input type="number" id="prioritize-field-num-${fieldName.replace(/\s+/g, '-')}" class="item-priority priority-number-input" min="1" value="${f.priorityNumber || 1}" onchange="updateFieldPriority('${fieldName}', this.value)" title="Field Priority">
                    <h3 class="editable-text" style="margin: 0; background-color: ${f.color || FIELD_COLORS[0]}; color: white; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 1rem; flex-grow: 1; min-width: 50px;" contenteditable="true" onblur="updateFieldName('${fieldName.replace(/'/g, "\\'")}', this.innerText)" onkeydown="if(event.key === 'Enter') { event.preventDefault(); this.blur(); }" title="Click to edit field name">${fieldName}</h3>
                    <div id="add-task-btn-container-${fieldName.replace(/\s+/g, '-')}" style="display: flex; gap: 0.2rem;">
                        <button onclick="showPrioritizeTaskInput('${fieldName.replace(/'/g, "\\'")}')" style="background-color: transparent; color: var(--primary-color); border: 1px solid var(--primary-color); padding: 0.2rem 0.6rem; font-size: 0.85rem; border-radius: 6px;">+ Add Task</button>
                        <button onclick="deleteField('${fieldName.replace(/'/g, "\\'")}')" style="background-color: transparent; color: var(--danger-color); border: 1px solid var(--danger-color); padding: 0.2rem 0.5rem; font-size: 0.85rem; border-radius: 6px;" title="Delete Field">🗑️</button>
                    </div>
                </div>
                
                <div id="add-task-input-group-${fieldName.replace(/\s+/g, '-')}" class="input-group" style="display: none; flex-direction: column; gap: 0.4rem; margin-bottom: 0.5rem; background: var(--bg-color); padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color);">
                    <input type="text" id="new-prioritize-task-${fieldName.replace(/\s+/g, '-')}" placeholder="New task..." onkeypress="if(event.key === 'Enter') addPrioritizeTask('${fieldName.replace(/'/g, "\\'")}')">
                    <div style="display: flex; gap: 0.2rem; align-items: center;">
                        <select id="new-prioritize-topic-${fieldName.replace(/\s+/g, '-')}" onchange="handlePrioritizeTopicChange('${fieldName.replace(/'/g, "\\'")}', this.value)" style="flex: 1; min-width: 0; padding: 0.2rem; font-size: 0.85rem;">
                            ${topics.length === 0 ? '<option value="" disabled selected>Topic...</option>' : ''}
                            ${topics.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                            <option value="__CREATE_NEW_TOPIC__">+ New Topic</option>
                        </select>
                        <select id="new-prioritize-priority-${fieldName.replace(/\s+/g, '-')}" style="padding: 0.2rem; font-size: 0.85rem;">
                            ${['P1', 'P2', 'P3', 'P4', 'P5'].map(p => `<option value="${p}" ${p === 'P5' ? 'selected' : ''}>${p}</option>`).join('')}
                        </select>
                        <button onclick="addPrioritizeTask('${fieldName.replace(/'/g, "\\'")}')" style="padding: 0.2rem 0.5rem; font-size: 0.85rem;">Save</button>
                        <button onclick="hidePrioritizeTaskInput('${fieldName.replace(/'/g, "\\'")}')" class="btn-cancel" style="padding: 0.2rem 0.5rem; font-size: 0.85rem;" title="Cancel">X</button>
                    </div>
                </div>

                <div class="subtopics-list" data-field-name="${fieldName}" ondragover="allowDrop(event)" ondragleave="dragLeave(event)" ondrop="drop(event)" style="min-height: 50px;">
                ${tasksForField.map(task => `
                    <div class="subtopic-item draggable" draggable="true" ondragstart="dragStart(event, '${task.topicId}', '${task.id}')" ondragend="dragEnd(event)" data-subtopic-id="${task.id}">
                        <div class="subtopic-left">
                            <span class="drag-handle" title="Drag to move or reorder">⋮⋮</span>
                            <input type="number" id="prioritize-num-${task.id}" class="item-priority priority-number-input" min="1" value="${task.priorityNumber || 1}" onchange="updateSubtopic('${task.topicId}', '${task.id}', 'priorityNumber', this.value)" title="Priority number">
                            <strong class="editable-text" contenteditable="true" onblur="editSubtopicName('${task.topicId}', '${task.id}', this.innerText)" onkeydown="if(event.key === 'Enter') { event.preventDefault(); this.blur(); }" title="Click to edit task name" style="padding: 0.2rem;">${task.name}</strong> 
                        </div>
                        <div class="subtopic-right">
                            <span class="field-badge" style="background-color: ${f.color || FIELD_COLORS[0]}20; color: ${f.color || FIELD_COLORS[0]}; border: 1px solid ${f.color || FIELD_COLORS[0]};">${task.field}</span>
                            <span class="priority-badge ${task.priority.toLowerCase()}">${task.priority}</span>
                        </div>
                    </div>
                `).join('')}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = fieldsHtml;

    if (activeElementId) {
        const el = document.getElementById(activeElementId);
        if (el) el.focus();
    }
}

// --- Diary Page Logic ---
function saveDiaryEntry() {
    const date = document.getElementById('diary-date').value;
    const text = document.getElementById('diary-text').value.trim();
    
    if (date && text) {
        diaryEntries.push({ id: generateId(), date, text });
        document.getElementById('diary-text').value = '';
        saveState();
        renderDiary();
    }
}

function renderDiary() {
    const container = document.getElementById('diary-entries-container');
    const sortBy = document.getElementById('diary-sort').value;
    
    let entries = [...diaryEntries];
    entries.sort((a, b) => sortBy === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date));

    if (entries.length === 0) {
        container.innerHTML = '<div class="empty-state">No diary entries found. Write your first entry above!</div>';
        return;
    }

    container.innerHTML = entries.map(entry => `
        <div class="topic-card" style="border-left: 4px solid var(--primary-color);">
            <div style="font-weight: 600; color: var(--text-muted); margin-bottom: 0.2rem;">
                ${new Date(entry.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div class="editable-text" style="white-space: pre-wrap; line-height: 1.6; padding: 0.4rem; min-height: 1.5em; border-radius: 4px;" contenteditable="true" onblur="updateDiaryEntryText('${entry.id}', this.innerText)" title="Click to edit diary entry">${entry.text}</div>
            <button onclick="deleteDiaryEntry('${entry.id}')" style="margin-top: 0.2rem; background-color: var(--danger-color); padding: 0.2rem 0.6rem; font-size: 0.85rem;">Delete Entry</button>
        </div>
    `).join('');
}

function deleteDiaryEntry(id) {
    const entry = diaryEntries.find(e => e.id === id);
    if (entry) {
        recycleBin.push({ id, type: 'diary', data: entry, deletedAt: new Date().toISOString() });
    }
    diaryEntries = diaryEntries.filter(e => e.id !== id);
    saveState();
    renderDiary();
}

function updateDiaryEntryText(id, newText) {
    const trimmed = newText.trim();
    const entry = diaryEntries.find(e => e.id === id);
    if (entry && trimmed && entry.text !== trimmed) {
        entry.text = trimmed;
        saveState();
    }
    renderDiary();
}

// --- Recycle Bin Logic ---
function openRecycleBin() {
    renderRecycleBin();
    document.getElementById('recycle-bin-modal').showModal();
}

function closeRecycleBin() {
    document.getElementById('recycle-bin-modal').close();
}

function renderRecycleBin() {
    const container = document.getElementById('recycle-bin-container');
    if (recycleBin.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding: 1rem;">Recycle bin is empty.</div>';
        return;
    }

    container.innerHTML = recycleBin.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)).map(item => {
        const title = item.type === 'diary' ? `Diary: ${item.data.date}` : item.data.name;
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid var(--border-color);">
                <div>
                    <strong>${title}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.5rem; text-transform: uppercase;">[${item.type}]</span>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">Deleted: ${new Date(item.deletedAt).toLocaleString()}</div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="restoreItem('${item.id}')" style="background-color: var(--primary-color); padding: 0.2rem 0.5rem; font-size: 0.85rem;">Restore</button>
                    <button onclick="permanentlyDelete('${item.id}')" style="background-color: transparent; color: var(--danger-color); border: 1px solid var(--danger-color); padding: 0.2rem 0.5rem; font-size: 0.85rem;">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function restoreItem(id) {
    const index = recycleBin.findIndex(item => item.id === id);
    if (index === -1) return;
    const item = recycleBin[index];

    if (item.type === 'topic') {
        topics.push(item.data);
        reorderTopicPriorityNumbers();
    } else if (item.type === 'subtopic') {
        const topic = topics.find(t => t.id === item.originalTopicId);
        if (topic) {
            topic.subtopics.push(item.data);
            reorderPriorityNumbers(item.data.field);
        } else {
            alert("Cannot restore task: Original topic has been deleted. Restore the topic first.");
            return;
        }
    } else if (item.type === 'diary') {
        diaryEntries.push(item.data);
    } else if (item.type === 'field') {
        fields.push(item.data);
        reorderFieldPriorityNumbers();
    }

    recycleBin.splice(index, 1);
    saveState();
    renderToDo();
    renderPrioritize();
    renderDiary();
    renderRecycleBin();
}

function permanentlyDelete(id) {
    if (confirm("Are you sure you want to permanently delete this item?")) {
        recycleBin = recycleBin.filter(item => item.id !== id);
        saveState();
        renderRecycleBin();
    }
}

// --- Export & Import Logic ---
function exportData() {
    const data = { topics, fields, diaryEntries, recycleBin };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "TaskDiary_Backup_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.topics && data.fields) {
                topics = data.topics;
                fields = data.fields;
                diaryEntries = data.diaryEntries || [];
                recycleBin = data.recycleBin || [];
                saveState();
                renderToDo();
                renderPrioritize();
                renderDiary();
                alert("Data imported successfully!");
            } else {
                alert("Invalid backup file format. Missing topics or fields.");
            }
        } catch (error) {
            alert("Error reading backup file. Make sure it is a valid JSON.");
            console.error(error);
        }
        event.target.value = ''; // Reset input so the same file can be imported again if needed
    };
    reader.readAsText(file);
}

function emptyRecycleBin() {
    if(confirm("Are you sure you want to permanently empty the recycle bin?")) {
        recycleBin = [];
        saveState();
        renderRecycleBin();
    }
}