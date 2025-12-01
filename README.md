# Chatbot Admin Dashboard

A comprehensive administrative interface for managing your AI chatbot platform. Built for business administrators and technical support teams.

## Features

- 📊 **Dashboard Overview** - Key metrics and recent activity
- 🤖 **Agent Management** - Full CRUD operations for AI agents
- 💬 **Conversation Monitoring** - View, search, and manage conversations
- 📈 **Analytics & Reporting** - Usage statistics and performance metrics
- ⚙️ **System Settings** - Configuration and API testing
- 🎨 **Modern UI** - Responsive design with dark/light themes

## Prerequisites

- A running instance of the [AI Chatbot API](../chatbot-ai)
- Modern web browser with JavaScript enabled

## Quick Start

1. **Start the API backend** (see main project README)

2. **Serve the admin interface**:
   ```bash
   cd chatbot-admin
   python3 server.py
   ```

3. **Open http://localhost:8081** in your browser

## Interface Overview

### Navigation
- **Dashboard** - Overview of system metrics and recent activity
- **Agents** - Manage AI agent configurations
- **Conversations** - Monitor and manage user interactions
- **Analytics** - View usage statistics and performance data
- **Settings** - System configuration and API connectivity

### Dashboard Features

#### Key Metrics
- Total number of agents
- Total conversations
- Token usage statistics
- Active conversations (last 24 hours)

#### Recent Activity
- Latest conversations with quick access
- Agent performance overview
- System status indicators

### Agent Management

#### View Agents
- Comprehensive agent list with status indicators
- Conversation counts per agent
- Model and configuration details
- Creation timestamps

#### Create/Edit Agents
- **Name**: Unique identifier (lowercase, no spaces)
- **Display Name**: Human-readable name
- **Description**: Agent purpose and capabilities
- **System Prompt**: Core personality and behavior instructions
- **Model Selection**: GPT-4o, GPT-4o-mini, GPT-4-turbo, etc.
- **Temperature**: Creativity level (0.0-2.0)
- **Max Tokens**: Response length limits
- **Theme Color**: Visual customization
- **Active Status**: Enable/disable agents

#### Agent Operations
- ✅ Create new agents
- ✏️ Edit existing configurations
- 🗑️ Delete unused agents
- 🔄 Toggle active/inactive status

### Conversation Monitoring

#### View Conversations
- Paginated conversation list
- Agent attribution
- Message counts and token usage
- Creation and update timestamps

#### Advanced Filtering
- **By Agent**: Filter conversations by specific agents
- **By Date**: Focus on specific time periods
- **Search**: Text search across conversation titles and content

#### Conversation Details
- Full message history
- Token usage breakdown
- Agent and model information
- Timestamps for all interactions

#### Management Actions
- 👁️ View detailed conversation logs
- 🗑️ Delete inappropriate or test conversations

### Analytics Dashboard

#### Usage Charts
- Token consumption over time
- Agent utilization distribution
- Performance metrics visualization

#### Data Export
- CSV export capabilities (future feature)
- API access for external reporting tools

### Settings & Configuration

#### API Configuration
- Backend API endpoint management
- Connection testing and diagnostics
- Error handling and troubleshooting

#### System Information
- API status monitoring
- Database connection health
- Version information and updates

## User Roles & Permissions

### Business Administrators
- Full access to all features
- Agent creation and management
- System configuration
- Analytics and reporting

### Technical Support
- Conversation monitoring and management
- Agent performance analysis
- System health monitoring
- Troubleshooting capabilities

## Security Features

- **API Key Protection** - Never exposes sensitive credentials
- **CORS Configuration** - Controlled cross-origin access
- **Input Validation** - Client-side and server-side validation
- **Error Handling** - Graceful failure management

## Browser Support

- ✅ **Chrome/Edge** (recommended)
- ✅ **Firefox**
- ✅ **Safari**
- ✅ **Modern mobile browsers**

## API Integration

The admin interface connects to these backend endpoints:

```
GET    /api/health              # System health check
GET    /api/agents              # List all agents
POST   /api/agents              # Create new agent
GET    /api/agents/{id}         # Get agent details
PUT    /api/agents/{id}         # Update agent
DELETE /api/agents/{id}         # Delete agent
GET    /api/conversations       # List conversations
GET    /api/conversations/{id}  # Get conversation details
DELETE /api/conversations/{id}  # Delete conversation
```

## Development

### Project Structure
```
chatbot-admin/
├── index.html          # Main HTML structure
├── styles.css          # Complete CSS styling
├── script.js           # JavaScript functionality
├── server.py           # Development server
├── README.md           # This documentation
└── package.json        # Project metadata
```

### Customization

#### Styling
Modify `styles.css` for:
- Color schemes and themes
- Layout adjustments
- Responsive breakpoints
- Animation timing

#### Functionality
Extend `script.js` for:
- New admin features
- Custom API integrations
- Enhanced data visualization
- Additional filtering options

#### API Configuration
Update `API_BASE_URL` in `script.js`:
```javascript
const API_BASE_URL = 'https://your-production-api.com/api';
```

### Adding New Features

#### Navigation Sections
1. Add new item to HTML navigation
2. Create corresponding content section
3. Add JavaScript handler in `switchSection()`
4. Implement data loading and display functions

#### API Integration
1. Add API call in `script.js`
2. Handle response data appropriately
3. Update UI components
4. Add error handling

## Troubleshooting

### Connection Issues
- **API Status**: Check red/green indicator in header
- **CORS Errors**: Ensure backend has CORS middleware enabled
- **Network**: Verify API server is running on correct port

### Data Loading Problems
- **Refresh Button**: Use the refresh button in the header
- **Browser Cache**: Hard refresh (Ctrl+F5) to clear cache
- **Console Errors**: Check browser developer tools for JavaScript errors

### Performance Issues
- **Large Datasets**: Use pagination for conversation lists
- **API Timeouts**: Increase timeout values in `script.js`
- **Memory Usage**: Clear unused data from global variables

## Deployment

### Production Setup
1. **Web Server**: Use Nginx or Apache to serve static files
2. **HTTPS**: Enable SSL certificates for secure connections
3. **Domain**: Configure proper domain name
4. **CDN**: Optional CDN for global performance

### Environment Variables
```javascript
// For production builds
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
```

### Build Optimization
- Minify CSS and JavaScript
- Optimize images and assets
- Enable compression (gzip)
- Implement caching headers

## Contributing

### Code Standards
- Use semantic HTML elements
- Follow BEM CSS methodology
- Implement proper error handling
- Add JSDoc comments for functions

### Testing
- Test all CRUD operations
- Verify responsive design on multiple devices
- Check accessibility features
- Validate API error handling

## Future Enhancements

- [ ] **Real-time Updates** - WebSocket connections for live data
- [ ] **Bulk Operations** - Multi-select actions for agents/conversations
- [ ] **Export Features** - CSV/PDF export capabilities
- [ ] **Advanced Analytics** - Custom reporting and dashboards
- [ ] **User Management** - Multi-user access control
- [ ] **Audit Logs** - Track all administrative actions
- [ ] **API Rate Limiting** - Monitor and control API usage
- [ ] **Backup/Restore** - Database backup and recovery tools

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify API backend is running correctly
4. Check network connectivity and firewall settings

---

**Built with ❤️ for AI chatbot platform administrators**
