// Configuration
const API_BASE_URL = 'https://chatbot-ai-vyff.onrender.com/api'
// 'http://localhost:8000/api';

// Global state
let currentSection = 'dashboard';
let agentsData = [];
let conversationsData = [];
let charts = {};

// DOM elements
const sidebar = document.querySelector('.admin-sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const navItems = document.querySelectorAll('.nav-item');
const pageTitle = document.getElementById('page-title');
const refreshBtn = document.getElementById('refresh-data');
const apiStatus = document.getElementById('api-status');
const apiStatusText = document.getElementById('api-status-text');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    initializeApp();
});

// Setup event listeners
function setupEventListeners() {
    // Navigation
    sidebarToggle.addEventListener('click', toggleSidebar);
    navItems.forEach(item => {
        item.addEventListener('click', () => switchSection(item.dataset.section));
    });

    // Refresh button
    refreshBtn.addEventListener('click', refreshData);

    // Agent management
    document.getElementById('add-agent-btn').addEventListener('click', () => openAgentModal());
    document.getElementById('test-agent-btn').addEventListener('click', openTestAgentModal);
    document.getElementById('close-agent-modal').addEventListener('click', closeAgentModal);
    document.getElementById('cancel-agent').addEventListener('click', closeAgentModal);
    document.getElementById('agent-form').addEventListener('submit', handleAgentSubmit);

    // Test agent modal
    document.getElementById('close-test-agent-modal').addEventListener('click', closeTestAgentModal);
    document.getElementById('test-send-button').addEventListener('click', sendTestMessage);
    document.getElementById('test-message-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendTestMessage();
        }
    });

    // Data source management
    document.getElementById('add-data-source-btn').addEventListener('click', () => openDataSourceModal());
    document.getElementById('close-data-source-modal').addEventListener('click', closeDataSourceModal);
    document.getElementById('cancel-data-source').addEventListener('click', closeDataSourceModal);
    document.getElementById('data-source-form').addEventListener('submit', handleDataSourceSubmit);

    // Agent data source assignment
    document.getElementById('close-agent-data-source-modal').addEventListener('click', closeAgentDataSourceModal);
    document.getElementById('save-assignments').addEventListener('click', saveDataSourceAssignments);
    document.getElementById('cancel-assignments').addEventListener('click', closeAgentDataSourceModal);

    // Conversation management
    document.getElementById('close-conversation-modal').addEventListener('click', closeConversationModal);

    // Delete confirmation
    document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);
    document.getElementById('confirm-delete').addEventListener('click', confirmDelete);

    // Filters
    document.getElementById('agent-filter').addEventListener('change', filterConversations);
    document.getElementById('date-filter').addEventListener('change', filterConversations);
    document.getElementById('search-filter').addEventListener('input', filterConversations);

    // Settings
    document.getElementById('test-api-connection').addEventListener('click', testApiConnection);

    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// Initialize the application
async function initializeApp() {
    checkApiStatus();
    await loadDashboardData();
    setupCharts();
}

// Navigation functions
function toggleSidebar() {
    sidebar.classList.toggle('open');
}

function switchSection(section) {
    // Update navigation
    navItems.forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(`${section}-section`).classList.add('active');

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'agents': 'Agent Management',
        'conversations': 'Conversation History',
        'analytics': 'Analytics',
        'settings': 'Settings'
    };
    pageTitle.textContent = titles[section] || 'Admin Panel';

    currentSection = section;

    // Load section-specific data
    switch (section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'agents':
            loadAgents();
            break;
        case 'data-sources':
            loadDataSources();
            break;
        case 'conversations':
            loadConversations();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
}

// API status check
async function checkApiStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, { timeout: 5000 });
        if (response.ok) {
            apiStatus.classList.add('connected');
            apiStatusText.textContent = 'API Connected';
        } else {
            throw new Error('API returned error');
        }
    } catch (error) {
        apiStatus.classList.add('error');
        apiStatusText.textContent = 'API Disconnected';
        console.error('API status check failed:', error);
    }
}

// API helper functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        showError(`Failed to connect to API: ${error.message}`);
        throw error;
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        // Load agents
        const agents = await apiRequest('/agents?active_only=false');
        document.getElementById('total-agents').textContent = agents.length;

        // Load conversations
        const conversations = await apiRequest('/conversations');
        document.getElementById('total-conversations').textContent = conversations.length;

        // Calculate total tokens
        const totalTokens = conversations.reduce((sum, conv) => sum + (conv.total_tokens || 0), 0);
        document.getElementById('total-tokens').textContent = totalTokens.toLocaleString();

        // Calculate active conversations (last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const activeConversations = conversations.filter(conv =>
            new Date(conv.updated_at) > yesterday
        ).length;
        document.getElementById('active-conversations').textContent = activeConversations;

        // Load recent conversations
        displayRecentConversations(conversations.slice(0, 5));

        // Load agent performance
        displayAgentPerformance(agents, conversations);

    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

function displayRecentConversations(conversations) {
    const container = document.getElementById('recent-conversations');
    container.innerHTML = '';

    if (conversations.length === 0) {
        container.innerHTML = '<p class="text-center">No conversations yet</p>';
        return;
    }

    conversations.forEach(conv => {
        const date = new Date(conv.created_at).toLocaleDateString();
        const convElement = document.createElement('div');
        convElement.className = 'recent-item';
        convElement.innerHTML = `
            <div>
                <div class="font-medium">${conv.title || `Conversation ${conv.id}`}</div>
                <div class="text-sm text-gray-500">${conv.message_count} messages • ${date}</div>
            </div>
            <button class="btn-sm btn-secondary" onclick="viewConversation(${conv.id})">View</button>
        `;
        container.appendChild(convElement);
    });
}

function displayAgentPerformance(agents, conversations) {
    const container = document.getElementById('agent-performance');
    container.innerHTML = '';

    const agentStats = {};

    // Calculate stats for each agent
    conversations.forEach(conv => {
        const agentId = conv.agent_id || 'no-agent';
        if (!agentStats[agentId]) {
            agentStats[agentId] = { conversations: 0, tokens: 0 };
        }
        agentStats[agentId].conversations++;
        agentStats[agentId].tokens += conv.total_tokens || 0;
    });

    // Display stats
    agents.forEach(agent => {
        const stats = agentStats[agent.id] || { conversations: 0, tokens: 0 };
        const perfElement = document.createElement('div');
        perfElement.className = 'performance-item';
        perfElement.innerHTML = `
            <div>
                <div class="font-medium">${agent.display_name}</div>
                <div class="text-sm text-gray-500">${stats.conversations} conversations • ${stats.tokens.toLocaleString()} tokens</div>
            </div>
            <div class="text-right">
                <div class="text-lg font-bold">${agent.is_active ? 'Active' : 'Inactive'}</div>
            </div>
        `;
        container.appendChild(perfElement);
    });
}

// Agent management functions
async function loadAgents() {
    try {
        showLoading(document.getElementById('agents-section'));
        agentsData = await apiRequest('/agents?active_only=false');
        displayAgents(agentsData);
    } catch (error) {
        console.error('Failed to load agents:', error);
    } finally {
        hideLoading(document.getElementById('agents-section'));
    }
}

function displayAgents(agents) {
    const tbody = document.getElementById('agents-table-body');
    tbody.innerHTML = '';

    // Calculate conversation counts per agent
    const agentConversationCounts = {};
    if (conversationsData && conversationsData.length > 0) {
        conversationsData.forEach(conv => {
            const agentId = conv.agent_id || 'no-agent';
            agentConversationCounts[agentId] = (agentConversationCounts[agentId] || 0) + 1;
        });
    }

    agents.forEach(agent => {
        const row = document.createElement('tr');
        const statusBadge = agent.is_active ?
            '<span class="status-badge active">Active</span>' :
            '<span class="status-badge inactive">Inactive</span>';

        const conversationCount = agentConversationCounts[agent.id] || 0;

        row.innerHTML = `
            <td>${agent.id}</td>
            <td>${agent.name}</td>
            <td>${agent.display_name}</td>
            <td>${agent.model}</td>
            <td>${statusBadge}</td>
            <td>${conversationCount}</td>
            <td>${new Date(agent.created_at).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-sm btn-edit" onclick="editAgent(${agent.id})">Edit</button>
                    <button class="btn-sm btn-secondary" onclick="openAgentDataSourceModal(${agent.id})" style="font-size: 0.7rem;">Data Sources</button>
                    <button class="btn-sm btn-delete" onclick="deleteAgent(${agent.id}, '${agent.display_name}')">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Agent modal functions
function openAgentModal(agent = null) {
    const modal = document.getElementById('agent-modal');
    const form = document.getElementById('agent-form');
    const title = document.getElementById('agent-modal-title');

    if (agent) {
        title.textContent = 'Edit Agent';
        populateAgentForm(agent);
    } else {
        title.textContent = 'Add Agent';
        form.reset();
    }

    modal.classList.add('active');
}

function closeAgentModal() {
    document.getElementById('agent-modal').classList.remove('active');
}

function populateAgentForm(agent) {
    document.getElementById('agent-name').value = agent.name;
    document.getElementById('agent-display-name').value = agent.display_name;
    document.getElementById('agent-description').value = agent.description;
    document.getElementById('agent-model').value = agent.model;
    document.getElementById('agent-temperature').value = agent.temperature;
    document.getElementById('agent-max-tokens').value = agent.max_tokens || '';
    document.getElementById('agent-color').value = agent.color || '#3b82f6';
    document.getElementById('agent-active').checked = agent.is_active;
    document.getElementById('agent-system-prompt').value = agent.system_prompt;
}

async function handleAgentSubmit(event) {
    event.preventDefault();

    // Check if we're editing or creating
    const modalTitle = document.getElementById('agent-modal-title').textContent;
    const isEditing = modalTitle.includes('Edit');

    const agentData = {
        name: document.getElementById('agent-name').value,
        display_name: document.getElementById('agent-display-name').value,
        description: document.getElementById('agent-description').value,
        system_prompt: document.getElementById('agent-system-prompt').value,
        model: document.getElementById('agent-model').value,
        temperature: parseFloat(document.getElementById('agent-temperature').value),
        max_tokens: document.getElementById('agent-max-tokens').value ?
            parseInt(document.getElementById('agent-max-tokens').value) : null,
        is_active: document.getElementById('agent-active').checked,
        color: document.getElementById('agent-color').value
    };

    try {
        showLoading(event.target);

        let response;
        if (isEditing) {
            // Find the agent being edited
            const agentName = agentData.name;
            const agent = agentsData.find(a => a.name === agentName);
            if (!agent) {
                throw new Error('Agent not found for editing');
            }

            response = await apiRequest(`/agents/${agent.id}`, {
                method: 'PUT',
                body: JSON.stringify(agentData)
            });
            showSuccess(`Agent "${response.display_name}" updated successfully`);
        } else {
            response = await apiRequest('/agents', {
                method: 'POST',
                body: JSON.stringify(agentData)
            });
            showSuccess(`Agent "${response.display_name}" created successfully`);
        }

        closeAgentModal();
        loadAgents();
        loadDashboardData();

    } catch (error) {
        console.error('Failed to save agent:', error);
        showError('Failed to save agent');
    } finally {
        hideLoading(event.target);
    }
}

// Conversation management functions
async function loadConversations() {
    try {
        showLoading(document.getElementById('conversations-section'));
        conversationsData = await apiRequest('/conversations');

        // Load agents for filtering
        const agents = await apiRequest('/agents?active_only=false');
        populateAgentFilter(agents);

        displayConversations(conversationsData);
    } catch (error) {
        console.error('Failed to load conversations:', error);
    } finally {
        hideLoading(document.getElementById('conversations-section'));
    }
}

function populateAgentFilter(agents) {
    const filter = document.getElementById('agent-filter');
    filter.innerHTML = '<option value="">All Agents</option>';

    agents.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent.id;
        option.textContent = agent.display_name;
        filter.appendChild(option);
    });
}

function displayConversations(conversations) {
    const tbody = document.getElementById('conversations-table-body');
    tbody.innerHTML = '';

    conversations.forEach(conv => {
        const row = document.createElement('tr');
        const date = new Date(conv.created_at).toLocaleDateString();

        row.innerHTML = `
            <td>${conv.id}</td>
            <td>${conv.title || `Conversation ${conv.id}`}</td>
            <td>${conv.agent_name || 'No Agent'}</td>
            <td>${conv.message_count}</td>
            <td>${conv.total_tokens?.toLocaleString() || 0}</td>
            <td>${date}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-sm btn-secondary" onclick="viewConversation(${conv.id})">View</button>
                    <button class="btn-sm btn-delete" onclick="deleteConversation(${conv.id})">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterConversations() {
    const agentFilter = document.getElementById('agent-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    const searchFilter = document.getElementById('search-filter').value.toLowerCase();

    const filtered = conversationsData.filter(conv => {
        // Agent filter
        if (agentFilter && conv.agent_id != agentFilter) return false;

        // Date filter
        if (dateFilter) {
            const convDate = new Date(conv.created_at).toISOString().split('T')[0];
            if (convDate !== dateFilter) return false;
        }

        // Search filter
        if (searchFilter) {
            const searchableText = `${conv.title || ''} ${conv.agent_name || ''}`.toLowerCase();
            if (!searchableText.includes(searchFilter)) return false;
        }

        return true;
    });

    displayConversations(filtered);
}

// Modal functions
function viewConversation(conversationId) {
    // Find conversation data
    const conversation = conversationsData.find(c => c.id === conversationId);
    if (!conversation) {
        showError('Conversation not found');
        return;
    }

    const modal = document.getElementById('conversation-modal');
    const title = document.getElementById('conversation-modal-title');
    const details = document.getElementById('conversation-details');

    title.textContent = conversation.title || `Conversation ${conversation.id}`;

    // Load full conversation details
    Promise.all([
        apiRequest(`/conversations/${conversationId}`),
        apiRequest(`/conversations/${conversationId}/data-sources`)
    ])
        .then(([conversationData, usageData]) => {
            const hasDataSourceUsage = usageData && usageData.length > 0;

            details.innerHTML = `
                <div class="mb-4">
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div><strong>Agent:</strong> ${conversationData.agent_name || 'No Agent'}</div>
                        <div><strong>Model:</strong> ${conversationData.model}</div>
                        <div><strong>Total Tokens:</strong> ${conversationData.total_tokens?.toLocaleString() || 0}</div>
                        <div><strong>Created:</strong> ${new Date(conversationData.created_at).toLocaleString()}</div>
                    </div>

                    ${hasDataSourceUsage ? `
                        <div class="mb-4">
                            <h4 class="text-lg font-semibold mb-2">Data Source Usage</h4>
                            <div class="data-source-usage">
                                ${usageData.map(usage => `
                                    <div class="usage-item mb-2 p-3 border rounded ${usage.success ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}">
                                        <div class="flex justify-between items-center mb-1">
                                            <span class="font-medium">${usage.data_source_name}</span>
                                            <span class="text-sm ${usage.success ? 'text-green-600' : 'text-red-600'}">
                                                ${usage.success ? '✅ Success' : '❌ Failed'}
                                            </span>
                                        </div>
                                        <div class="text-sm text-gray-600">
                                            <span>Query: "${usage.query || 'N/A'}"</span>
                                            ${usage.data_count !== null ? `<span class="ml-4">Data items: ${usage.data_count}</span>` : ''}
                                        </div>
                                        ${usage.error_message ? `
                                            <div class="text-sm text-red-600 mt-1">
                                                Error: ${usage.error_message}
                                            </div>
                                        ` : ''}
                                        <div class="text-xs text-gray-500 mt-1">
                                            ${new Date(usage.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div class="mb-4">
                            <h4 class="text-lg font-semibold mb-2">Data Source Usage</h4>
                            <div class="text-gray-500 text-sm">
                                No data sources were used in this conversation. The agent responded using only its prompt.
                            </div>
                        </div>
                    `}

                    <div class="conversation-messages">
                        ${conversationData.messages.map(msg => `
                            <div class="message-item ${msg.role}">
                                <div class="message-role">${msg.role}</div>
                                <div class="message-content">${msg.content}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            modal.classList.add('active');
        })
        .catch(error => {
            console.error('Failed to load conversation details:', error);
            showError('Failed to load conversation details');
        });
}

function closeConversationModal() {
    document.getElementById('conversation-modal').classList.remove('active');
}

function deleteAgent(agentId, agentName) {
    openDeleteModal(`Are you sure you want to delete the agent "${agentName}"? This action cannot be undone.`, () => {
        apiRequest(`/agents/${agentId}`, { method: 'DELETE' })
            .then(() => {
                showSuccess(`Agent "${agentName}" deleted successfully`);
                loadAgents();
                loadDashboardData();
            })
            .catch(error => {
                console.error('Failed to delete agent:', error);
                showError('Failed to delete agent');
            });
    });
}

function deleteConversation(conversationId) {
    openDeleteModal('Are you sure you want to delete this conversation? This action cannot be undone.', () => {
        apiRequest(`/conversations/${conversationId}`, { method: 'DELETE' })
            .then(() => {
                showSuccess('Conversation deleted successfully');
                loadConversations();
                loadDashboardData();
            })
            .catch(error => {
                console.error('Failed to delete conversation:', error);
                showError('Failed to delete conversation');
            });
    });
}

function openDeleteModal(message, confirmCallback) {
    document.getElementById('delete-message').textContent = message;
    document.getElementById('confirm-delete').onclick = () => {
        confirmCallback();
        closeDeleteModal();
    };
    document.getElementById('delete-modal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
}

// Analytics functions
async function loadAnalytics() {
    // This would load chart data - for now, just initialize empty charts
    updateCharts();
}

function setupCharts() {
    // Initialize Chart.js if available
    if (typeof Chart !== 'undefined') {
        const usageCtx = document.getElementById('usage-chart').getContext('2d');
        const agentCtx = document.getElementById('agent-chart').getContext('2d');

        charts.usage = new Chart(usageCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Token Usage',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });

        charts.agent = new Chart(agentCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    }
}

function updateCharts() {
    // Update charts with real data
    if (charts.usage && conversationsData.length > 0) {
        // Group conversations by date
        const dateGroups = {};
        conversationsData.forEach(conv => {
            const date = new Date(conv.created_at).toLocaleDateString();
            dateGroups[date] = (dateGroups[date] || 0) + (conv.total_tokens || 0);
        });

        const dates = Object.keys(dateGroups).sort();
        const tokens = dates.map(date => dateGroups[date]);

        charts.usage.data.labels = dates;
        charts.usage.data.datasets[0].data = tokens;
        charts.usage.update();
    }

    if (charts.agent && agentsData.length > 0 && conversationsData.length > 0) {
        // Count conversations per agent
        const agentCounts = {};
        conversationsData.forEach(conv => {
            const agentId = conv.agent_id || 'no-agent';
            agentCounts[agentId] = (agentCounts[agentId] || 0) + 1;
        });

        const labels = agentsData.map(agent => agent.display_name);
        const data = agentsData.map(agent => agentCounts[agent.id] || 0);

        charts.agent.data.labels = labels;
        charts.agent.data.datasets[0].data = data;
        charts.agent.update();
    }
}

// Settings functions
async function testApiConnection() {
    const apiUrl = document.getElementById('api-url').value;
    const testBtn = document.getElementById('test-api-connection');

    try {
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';

        const response = await fetch(`${apiUrl}/health`);
        if (response.ok) {
            showSuccess('API connection successful!');
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        showError(`API connection failed: ${error.message}`);
    } finally {
        testBtn.disabled = false;
        testBtn.textContent = 'Test Connection';
    }
}

// Utility functions
function refreshData() {
    switch (currentSection) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'agents':
            loadAgents();
            break;
        case 'conversations':
            loadConversations();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
}

function showLoading(element) {
    element.classList.add('loading');
}

function hideLoading(element) {
    element.classList.remove('loading');
}

function showError(message) {
    // Simple error display - you could enhance this with toast notifications
    const statusText = document.getElementById('api-status-text');
    statusText.textContent = message;
    statusText.style.color = 'var(--error-color)';
    setTimeout(() => {
        statusText.textContent = 'Ready';
        statusText.style.color = 'var(--text-secondary)';
    }, 5000);
}

function showSuccess(message) {
    const statusText = document.getElementById('api-status-text');
    statusText.textContent = message;
    statusText.style.color = 'var(--success-color)';
    setTimeout(() => {
        statusText.textContent = 'Ready';
        statusText.style.color = 'var(--text-secondary)';
    }, 3000);
}

// Test Agent Functions
let testAgent = null;

function openTestAgentModal() {
    // Get selected agent from table or show agent selector
    const selectedRows = document.querySelectorAll('#agents-table tbody tr.selected');
    if (selectedRows.length === 0) {
        showError('Please select an agent from the table first');
        return;
    }

    const agentId = parseInt(selectedRows[0].dataset.agentId);
    testAgent = agentsData.find(a => a.id === agentId);

    if (!testAgent) {
        showError('Agent not found');
        return;
    }

    // Update modal content
    document.getElementById('test-agent-modal-title').textContent = `Test: ${testAgent.display_name}`;
    document.getElementById('test-agent-name').textContent = testAgent.display_name;
    document.getElementById('test-agent-description').textContent = testAgent.description || 'No description available';

    // Clear chat messages
    document.getElementById('test-chat-messages').innerHTML = `
        <div class="message-item assistant">
            <div class="message-role">System</div>
            <div class="message-content">Hello! I'm ${testAgent.display_name}. How can I help you today?</div>
        </div>
    `;

    // Clear input
    document.getElementById('test-message-input').value = '';

    // Show modal
    document.getElementById('test-agent-modal').classList.add('active');
}

function closeTestAgentModal() {
    document.getElementById('test-agent-modal').classList.remove('active');
    testAgent = null;
}

function sendTestMessage() {
    if (!testAgent) return;

    const input = document.getElementById('test-message-input');
    const message = input.value.trim();
    if (!message) return;

    // Add user message
    addTestMessage('user', message);
    input.value = '';

    // Show typing indicator
    addTestMessage('assistant', '...', true);

    // Send to API
    apiRequest('/chat/completion', {
        method: 'POST',
        body: JSON.stringify({
            agent_id: testAgent.id,
            prompt: message
        })
    })
    .then(response => {
        // Remove typing indicator
        removeTypingIndicator();

        // Add response
        addTestMessage('assistant', response.response);

        // Refresh conversations list
        loadConversations();
        loadDashboardData();
    })
    .catch(error => {
        removeTypingIndicator();
        addTestMessage('assistant', 'Error: ' + error.message);
        showError('Failed to get response from agent');
    });
}

function addTestMessage(role, content, isTyping = false) {
    const messagesContainer = document.getElementById('test-chat-messages');

    if (isTyping) {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message-item assistant typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-role">Assistant</div>
            <div class="message-content">...</div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message-item ${role}`;
    messageDiv.innerHTML = `
        <div class="message-role">${role === 'user' ? 'You' : 'Assistant'}</div>
        <div class="message-content">${content}</div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Table row selection for agents
document.addEventListener('DOMContentLoaded', function() {
    // Add click handlers for agent table rows
    document.getElementById('agents-table-body').addEventListener('click', function(e) {
        const row = e.target.closest('tr');
        if (row) {
            // Remove selection from all rows
            document.querySelectorAll('#agents-table tbody tr').forEach(r => r.classList.remove('selected'));
            // Add selection to clicked row
            row.classList.add('selected');
        }
    });
});

// Data Source Management Functions
let dataSourcesData = [];
let currentAgentAssignments = [];
let editingDataSourceId = null;
let currentAgentId = null;
let selectedDataSourceAssignment = null;

function openDataSourceModal(dataSource = null) {
    const modal = document.getElementById('data-source-modal');
    const form = document.getElementById('data-source-form');
    const title = document.getElementById('data-source-modal-title');

    if (dataSource) {
        title.textContent = 'Edit Data Source';
        editingDataSourceId = dataSource.id;
        // For editing, first populate basic fields, then handle config
        populateDataSourceForm(dataSource);
    } else {
        title.textContent = 'Add Data Source';
        editingDataSourceId = null;
        form.reset();
        // Make sure type field is enabled for new data sources
        const typeField = document.getElementById('data-source-type');
        if (typeField) {
            typeField.disabled = false;
        }

        // Hide the disabled note
        const typeNote = document.getElementById('type-disabled-note');
        if (typeNote) {
            typeNote.style.display = 'none';
        }
        updateDataSourceConfig();
    }

    modal.classList.add('active');
}

function closeDataSourceModal() {
    document.getElementById('data-source-modal').classList.remove('active');
    editingDataSourceId = null;

    // Re-enable type field
    const typeField = document.getElementById('data-source-type');
    if (typeField) {
        typeField.disabled = false;
    }

    // Hide the disabled note
    const typeNote = document.getElementById('type-disabled-note');
    if (typeNote) {
        typeNote.style.display = 'none';
    }
}

function updateDataSourceConfig() {
    const type = document.getElementById('data-source-type').value;
    const configContainer = document.getElementById('data-source-config');
    const sections = document.querySelectorAll('.config-section');

    // Hide all sections first
    sections.forEach(section => section.style.display = 'none');

    // Show the relevant section
    if (type) {
        const targetSection = document.getElementById(`${type}-config`);
        if (targetSection) {
            targetSection.style.display = 'block';

            // Add helpful descriptions
            const descriptions = {
                'google_sheets': 'Connect to Google Sheets to fetch data from spreadsheets. You\'ll need a Google API key and the spreadsheet ID.',
                'rest_api': 'Connect to REST APIs to fetch data from web services. Configure authentication and endpoints.',
                'database': 'Connect to databases for direct querying. Currently supports PostgreSQL, MySQL, and SQLite.'
            };

            // Add description if not already present
            const existingDesc = targetSection.querySelector('.config-description');
            if (!existingDesc && descriptions[type]) {
                const descElement = document.createElement('p');
                descElement.className = 'config-description';
                descElement.style.marginBottom = '1rem';
                descElement.style.color = 'var(--text-secondary)';
                descElement.style.fontSize = '0.875rem';
                descElement.textContent = descriptions[type];
                targetSection.insertBefore(descElement, targetSection.firstChild);
            }
        }
    }

    // Clear any existing form values when type changes (but not during editing)
    if (!editingDataSourceId) {
        // Clear Google Sheets fields
        const gsApiKey = document.getElementById('gs-api-key');
        const gsSpreadsheetId = document.getElementById('gs-spreadsheet-id');
        const gsSheetName = document.getElementById('gs-sheet-name');
        if (gsApiKey) gsApiKey.value = '';
        if (gsSpreadsheetId) gsSpreadsheetId.value = '';
        if (gsSheetName) gsSheetName.value = 'Sheet1';

        // Clear REST API fields
        const apiBaseUrl = document.getElementById('api-base-url');
        const apiEndpoint = document.getElementById('api-endpoint');
        const apiMethod = document.getElementById('api-method');
        const apiAuthType = document.getElementById('api-auth-type');
        if (apiBaseUrl) apiBaseUrl.value = '';
        if (apiEndpoint) apiEndpoint.value = '';
        if (apiMethod) apiMethod.value = 'GET';
        if (apiAuthType) apiAuthType.value = '';

        // Clear Database fields
        const dbType = document.getElementById('db-type');
        const dbConnectionString = document.getElementById('db-connection-string');
        const dbQueryTemplate = document.getElementById('db-query-template');
        if (dbType) dbType.value = 'postgresql';
        if (dbConnectionString) dbConnectionString.value = '';
        if (dbQueryTemplate) dbQueryTemplate.value = '';
    }

    // Update the modal height to accommodate content
    const modal = document.getElementById('data-source-modal');
    if (modal) {
        modal.style.height = 'auto';
    }
}

function updateAuthConfig() {
    const authType = document.getElementById('api-auth-type').value;
    const authConfig = document.getElementById('auth-config');

    if (!authType) {
        authConfig.style.display = 'none';
        return;
    }

    authConfig.style.display = 'block';
    authConfig.innerHTML = '';

    if (authType === 'bearer') {
        authConfig.innerHTML = `
            <div class="form-group">
                <label for="bearer-token">Bearer Token *</label>
                <input type="password" id="bearer-token" placeholder="Your bearer token" required>
                <small>Enter your API bearer token</small>
            </div>
        `;
    } else if (authType === 'basic') {
        authConfig.innerHTML = `
            <div class="form-grid">
                <div class="form-group">
                    <label for="basic-username">Username *</label>
                    <input type="text" id="basic-username" placeholder="API username" required>
                </div>
                <div class="form-group">
                    <label for="basic-password">Password *</label>
                    <input type="password" id="basic-password" placeholder="API password" required>
                </div>
            </div>
        `;
    } else if (authType === 'api_key') {
        authConfig.innerHTML = `
            <div class="form-grid">
                <div class="form-group">
                    <label for="api-key-name">Header Name</label>
                    <input type="text" id="api-key-name" value="X-API-Key" placeholder="X-API-Key">
                    <small>HTTP header name for the API key</small>
                </div>
                <div class="form-group">
                    <label for="api-key-value">API Key *</label>
                    <input type="password" id="api-key-value" placeholder="Your API key" required>
                </div>
            </div>
        `;
    }
}

function populateDataSourceForm(dataSource) {
    // First, populate basic fields
    document.getElementById('data-source-name').value = dataSource.name;
    const typeField = document.getElementById('data-source-type');
    typeField.value = dataSource.type;
    // Disable type field when editing to prevent accidental changes
    typeField.disabled = editingDataSourceId !== null;

    // Show note about disabled type field
    const typeNote = document.getElementById('type-disabled-note');
    if (typeNote) {
        typeNote.style.display = editingDataSourceId ? 'block' : 'none';
    }

    document.getElementById('data-source-description').value = dataSource.description || '';
    document.getElementById('data-source-active').checked = dataSource.is_active;

    // Update the config section to show the correct fields
    updateDataSourceConfig();

    // Then populate config fields after a short delay to ensure DOM is updated
    const config = dataSource.config || {};

    setTimeout(() => {
        if (dataSource.type === 'google_sheets') {
            const apiKeyField = document.getElementById('gs-api-key');
            const spreadsheetIdField = document.getElementById('gs-spreadsheet-id');
            const sheetNameField = document.getElementById('gs-sheet-name');

            if (apiKeyField) apiKeyField.value = config.api_key || '';
            if (spreadsheetIdField) spreadsheetIdField.value = config.spreadsheet_id || '';
            if (sheetNameField) sheetNameField.value = config.sheet_name || 'Sheet1';

        } else if (dataSource.type === 'rest_api') {
            const baseUrlField = document.getElementById('api-base-url');
            const endpointField = document.getElementById('api-endpoint');
            const methodField = document.getElementById('api-method');
            const authTypeField = document.getElementById('api-auth-type');

            if (baseUrlField) baseUrlField.value = config.base_url || '';
            if (endpointField) endpointField.value = config.endpoint || '';
            if (methodField) methodField.value = config.method || 'GET';
            if (authTypeField) authTypeField.value = config.auth_type || '';

            // Update auth config section
            updateAuthConfig();

            // Populate auth fields after another delay
            const authConfig = config.auth_config || {};
            setTimeout(() => {
                if (config.auth_type === 'bearer') {
                    const tokenField = document.getElementById('bearer-token');
                    if (tokenField) tokenField.value = authConfig.token || '';
                } else if (config.auth_type === 'basic') {
                    const usernameField = document.getElementById('basic-username');
                    const passwordField = document.getElementById('basic-password');
                    if (usernameField) usernameField.value = authConfig.username || '';
                    if (passwordField) passwordField.value = authConfig.password || '';
                } else if (config.auth_type === 'api_key') {
                    const keyNameField = document.getElementById('api-key-name');
                    const keyValueField = document.getElementById('api-key-value');
                    if (keyNameField) keyNameField.value = authConfig.key_name || 'X-API-Key';
                    if (keyValueField) keyValueField.value = authConfig.key_value || '';
                }
            }, 50);

        } else if (dataSource.type === 'database') {
            const dbTypeField = document.getElementById('db-type');
            const connectionStringField = document.getElementById('db-connection-string');
            const queryTemplateField = document.getElementById('db-query-template');

            if (dbTypeField) dbTypeField.value = config.db_type || 'postgresql';
            if (connectionStringField) connectionStringField.value = config.connection_string || '';
            if (queryTemplateField) queryTemplateField.value = config.query_template || '';
        }
    }, 100);
}

async function handleDataSourceSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const type = document.getElementById('data-source-type').value;

    // Build config based on type
    let config = {};

    if (type === 'google_sheets') {
        const apiKey = document.getElementById('gs-api-key').value;
        const spreadsheetId = document.getElementById('gs-spreadsheet-id').value;
        if (!apiKey || !spreadsheetId) {
            showError('API key and spreadsheet ID are required for Google Sheets');
            hideLoading(event.target);
            return;
        }
        config = {
            api_key: apiKey,
            spreadsheet_id: spreadsheetId,
            sheet_name: document.getElementById('gs-sheet-name').value || 'Sheet1'
        };
    } else if (type === 'rest_api') {
        const baseUrl = document.getElementById('api-base-url').value;
        if (!baseUrl) {
            showError('Base URL is required for REST API');
            hideLoading(event.target);
            return;
        }
        config = {
            base_url: baseUrl,
            endpoint: document.getElementById('api-endpoint').value,
            method: document.getElementById('api-method').value,
            auth_type: document.getElementById('api-auth-type').value
        };

        // Add auth config
        if (config.auth_type) {
            config.auth_config = {};
            if (config.auth_type === 'bearer') {
                const token = document.getElementById('bearer-token')?.value;
                if (!token) {
                    showError('Bearer token is required');
                    hideLoading(event.target);
                    return;
                }
                config.auth_config.token = token;
            } else if (config.auth_type === 'basic') {
                const username = document.getElementById('basic-username')?.value;
                const password = document.getElementById('basic-password')?.value;
                if (!username || !password) {
                    showError('Username and password are required for basic auth');
                    hideLoading(event.target);
                    return;
                }
                config.auth_config.username = username;
                config.auth_config.password = password;
            } else if (config.auth_type === 'api_key') {
                const keyName = document.getElementById('api-key-name')?.value || 'X-API-Key';
                const keyValue = document.getElementById('api-key-value')?.value;
                if (!keyValue) {
                    showError('API key value is required');
                    hideLoading(event.target);
                    return;
                }
                config.auth_config.key_name = keyName;
                config.auth_config.key_value = keyValue;
            }
        }
    } else if (type === 'database') {
        const connectionString = document.getElementById('db-connection-string').value;
        const queryTemplate = document.getElementById('db-query-template').value;
        if (!connectionString || !queryTemplate) {
            showError('Connection string and query template are required for database');
            hideLoading(event.target);
            return;
        }
        config = {
            db_type: document.getElementById('db-type').value,
            connection_string: connectionString,
            query_template: queryTemplate
        };
    }

    const dataSourceData = {
        name: document.getElementById('data-source-name').value,
        type: type,
        description: document.getElementById('data-source-description').value,
        config: config,
        is_active: document.getElementById('data-source-active').checked
    };

    try {
        showLoading(event.target);

        let response;
        if (editingDataSourceId) {
            // Update existing data source
            response = await apiRequest(`/data-sources/${editingDataSourceId}`, {
                method: 'PUT',
                body: JSON.stringify(dataSourceData)
            });
            showSuccess(`Data source "${response.name}" updated successfully`);
        } else {
            // Create new data source
            response = await apiRequest('/data-sources', {
                method: 'POST',
                body: JSON.stringify(dataSourceData)
            });
            showSuccess(`Data source "${response.name}" created successfully`);
        }

        closeDataSourceModal();
        loadDataSources();

    } catch (error) {
        console.error('Failed to save data source:', error);
        showError('Failed to save data source');
    } finally {
        hideLoading(event.target);
    }
}

async function loadDataSources() {
    try {
        showLoading(document.getElementById('data-sources-section'));
        dataSourcesData = await apiRequest('/data-sources');
        displayDataSources(dataSourcesData);
    } catch (error) {
        console.error('Failed to load data sources:', error);
        showError('Failed to load data sources');
    } finally {
        hideLoading(document.getElementById('data-sources-section'));
    }
}

function displayDataSources(dataSources) {
    const tbody = document.getElementById('data-sources-table-body');
    tbody.innerHTML = '';

    dataSources.forEach(dataSource => {
        const row = document.createElement('tr');
        const statusBadge = dataSource.is_active ?
            '<span class="status-badge active">Active</span>' :
            '<span class="status-badge inactive">Inactive</span>';

        row.innerHTML = `
            <td>${dataSource.id}</td>
            <td>${dataSource.name}</td>
            <td>${dataSource.type.replace('_', ' ').toUpperCase()}</td>
            <td>${dataSource.description || '-'}</td>
            <td>${statusBadge}</td>
            <td>${new Date(dataSource.created_at).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-sm btn-secondary" onclick="testDataSource(${dataSource.id})" title="Test data source connection">Test</button>
                    <button class="btn-sm btn-edit" onclick="editDataSource(${dataSource.id})">Edit</button>
                    <button class="btn-sm btn-delete" onclick="deleteDataSource(${dataSource.id}, '${dataSource.name}')">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editDataSource(dataSourceId) {
    const dataSource = dataSourcesData.find(ds => ds.id === dataSourceId);
    if (dataSource) {
        openDataSourceModal(dataSource);
    }
}

function testDataSource(dataSourceId) {
    // Show loading message
    showSuccess('Testing data source...');

    apiRequest(`/data-sources/${dataSourceId}/test`)
        .then(result => {
            if (result.success) {
                showSuccess(`✅ Data source test successful! Retrieved ${result.data_count || 0} items.`);
                if (result.sample_data) {
                    console.log('Sample data:', result.sample_data);
                }
            } else {
                showError(`❌ Data source test failed: ${result.error}`);
            }
        })
        .catch(error => {
            console.error('Error testing data source:', error);
            showError('Failed to test data source');
        });
}

function deleteDataSource(dataSourceId, dataSourceName) {
    openDeleteModal(`Are you sure you want to delete the data source "${dataSourceName}"? This action cannot be undone.`, async () => {
        try {
            await apiRequest(`/data-sources/${dataSourceId}`, { method: 'DELETE' });
            showSuccess(`Data source "${dataSourceName}" deleted successfully`);
            loadDataSources();
        } catch (error) {
            console.error('Failed to delete data source:', error);
            showError('Failed to delete data source');
        }
    });
}

// Agent Data Source Assignment Functions
function openAgentDataSourceModal(agentId) {
    const agent = agentsData.find(a => a.id === agentId);
    if (!agent) {
        showError('Agent not found');
        return;
    }

    currentAgentId = agentId; // Store the current agent ID

    document.getElementById('agent-data-source-modal-title').textContent = `Assign Data Sources: ${agent.display_name}`;
    document.getElementById('assignment-agent-name').textContent = agent.display_name;
    document.getElementById('assignment-agent-description').textContent = agent.description || 'No description';

    loadAgentDataSourceAssignments(agentId);
}

function selectDataSourceAssignment(assignment) {
    selectedDataSourceAssignment = assignment;

    // Update UI to show selected state
    document.querySelectorAll('#assigned-data-sources .data-source-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');

    // Show configuration panel
    const configPanel = document.getElementById('assignment-config');
    configPanel.style.display = 'block';

    // Populate configuration fields
    document.getElementById('assignment-query-trigger').value = assignment.query_trigger || '';
    document.getElementById('assignment-priority').value = assignment.priority || 0;
    document.getElementById('assignment-active').checked = assignment.is_active !== false;
}

function closeAgentDataSourceModal() {
    document.getElementById('agent-data-source-modal').classList.remove('active');
    currentAgentId = null; // Clear the current agent ID
    selectedDataSourceAssignment = null; // Clear selected assignment

    // Hide configuration panel
    document.getElementById('assignment-config').style.display = 'none';
}

async function loadAgentDataSourceAssignments(agentId) {
    try {
        // Load current assignments
        const assignments = await apiRequest(`/agents/${agentId}/data-sources`);

        // Load all available data sources
        const allDataSources = await apiRequest('/data-sources');

        // Separate assigned and available
        const assignedIds = new Set(assignments.map(a => a.data_source_id));
        const assigned = allDataSources.filter(ds => assignedIds.has(ds.id));
        const available = allDataSources.filter(ds => !assignedIds.has(ds.id));

        displayDataSourceAssignments(available, assigned, assignments);

        document.getElementById('agent-data-source-modal').classList.add('active');
    } catch (error) {
        console.error('Failed to load data source assignments:', error);
        showError('Failed to load data source assignments');
    }
}

function displayDataSourceAssignments(available, assigned, assignments) {
    const availableContainer = document.getElementById('available-data-sources');
    const assignedContainer = document.getElementById('assigned-data-sources');

    availableContainer.innerHTML = '';
    assignedContainer.innerHTML = '';

    // Available data sources
    available.forEach(dataSource => {
        const item = createDataSourceAssignmentItem(dataSource, false);
        availableContainer.appendChild(item);
    });

    // Assigned data sources with configuration
    assigned.forEach(dataSource => {
        const assignment = assignments.find(a => a.data_source_id === dataSource.id);
        const item = createDataSourceAssignmentItem(dataSource, true, assignment);
        item.addEventListener('click', () => selectDataSourceAssignment(assignment));
        assignedContainer.appendChild(item);
    });
}

function createDataSourceAssignmentItem(dataSource, isAssigned, assignment = null) {
    const item = document.createElement('div');
    item.className = `data-source-item ${isAssigned ? 'assigned' : ''}`;
    item.dataset.dataSourceId = dataSource.id;

    item.innerHTML = `
        <div class="item-info">
            <h5>${dataSource.name}</h5>
            <p>${dataSource.type.replace('_', ' ').toUpperCase()} - ${dataSource.description || 'No description'}</p>
        </div>
        ${isAssigned ?
            '<button class="remove-btn" onclick="removeDataSourceAssignment(' + dataSource.id + ')">Remove</button>' :
            '<button class="assign-btn" onclick="assignDataSource(' + dataSource.id + ')">Assign</button>'
        }
    `;

    return item;
}

function assignDataSource(dataSourceId) {
    // Move from available to assigned
    const availableContainer = document.getElementById('available-data-sources');
    const assignedContainer = document.getElementById('assigned-data-sources');
    const item = availableContainer.querySelector(`[data-data-source-id="${dataSourceId}"]`);

    if (item) {
        item.classList.add('assigned');
        item.querySelector('button').outerHTML = '<button class="remove-btn" onclick="removeDataSourceAssignment(' + dataSourceId + ')">Remove</button>';
        assignedContainer.appendChild(item);
    }
}

function removeDataSourceAssignment(dataSourceId) {
    // Move from assigned to available
    const availableContainer = document.getElementById('available-data-sources');
    const assignedContainer = document.getElementById('assigned-data-sources');
    const item = assignedContainer.querySelector(`[data-data-source-id="${dataSourceId}"]`);

    if (item) {
        item.classList.remove('assigned');
        item.querySelector('button').outerHTML = '<button class="assign-btn" onclick="assignDataSource(' + dataSourceId + ')">Assign</button>';
        availableContainer.appendChild(item);
    }
}

async function saveDataSourceAssignments() {
    if (!currentAgentId) {
        showError('No agent selected');
        return;
    }

    try {
        // Get current assignments from backend
        const currentAssignments = await apiRequest(`/agents/${currentAgentId}/data-sources`);
        const currentIds = new Set(currentAssignments.map(a => a.data_source_id));

        // Get assignments shown in UI (assigned items)
        const assignedItems = document.querySelectorAll('#assigned-data-sources .data-source-item');
        const newIds = new Set(Array.from(assignedItems).map(item => parseInt(item.dataset.dataSourceId)));

        // Find assignments to add (in UI but not in backend)
        const toAdd = Array.from(newIds).filter(id => !currentIds.has(id));

        // Find assignments to remove (in backend but not in UI)
        const toRemove = Array.from(currentIds).filter(id => !newIds.has(id));

        // Add new assignments
        for (const dataSourceId of toAdd) {
            await apiRequest(`/agents/${currentAgentId}/data-sources`, {
                method: 'POST',
                body: JSON.stringify({
                    data_source_id: dataSourceId,
                    is_active: true,
                    priority: 0,
                    query_trigger: null
                })
            });
        }

        // Update existing assignments if configuration changed
        if (selectedDataSourceAssignment) {
            const queryTrigger = document.getElementById('assignment-query-trigger').value.trim();
            const priority = parseInt(document.getElementById('assignment-priority').value) || 0;
            const isActive = document.getElementById('assignment-active').checked;

            // Check if configuration changed
            const configChanged =
                selectedDataSourceAssignment.query_trigger !== queryTrigger ||
                selectedDataSourceAssignment.priority !== priority ||
                selectedDataSourceAssignment.is_active !== isActive;

            if (configChanged) {
                // For now, we'll need to delete and recreate to update
                // (The API might need a PUT endpoint for updates)
                try {
                    await apiRequest(`/agents/${currentAgentId}/data-sources/${selectedDataSourceAssignment.data_source_id}`, {
                        method: 'DELETE'
                    });

                    await apiRequest(`/agents/${currentAgentId}/data-sources`, {
                        method: 'POST',
                        body: JSON.stringify({
                            data_source_id: selectedDataSourceAssignment.data_source_id,
                            is_active: isActive,
                            priority: priority,
                            query_trigger: queryTrigger || null
                        })
                    });
                } catch (error) {
                    console.error('Failed to update assignment configuration:', error);
                }
            }
        }

        // Remove old assignments
        for (const dataSourceId of toRemove) {
            await apiRequest(`/agents/${currentAgentId}/data-sources/${dataSourceId}`, {
                method: 'DELETE'
            });
        }

        showSuccess('Data source assignments updated successfully');
        closeAgentDataSourceModal();

        // Refresh data if needed
        loadAgents();
        loadDataSources();

    } catch (error) {
        console.error('Failed to save data source assignments:', error);
        showError('Failed to save data source assignments');
    }
}

// Global functions for onclick handlers
function editAgent(agentId) {
    const agent = agentsData.find(a => a.id === agentId);
    if (agent) {
        openAgentModal(agent);
    }
}

// Initialize theme
document.documentElement.setAttribute('data-theme', localStorage.getItem('admin-theme') || 'light');
