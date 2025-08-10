# Phoenix - Workspace & CRM Platform

A modern, unified platform that organizes your business into workspaces, manages projects with integrated CRM capabilities, and streamlines customer relationships.

## 🏗️ Application Structure

Phoenix follows a clear organizational hierarchy:

**Workspaces** → **Projects** → **CRM Integration**

### Workspaces
- Create separate environments for different business units, departments, or client groups
- Manage access control and permissions
- Organize all projects and CRM data within workspace boundaries

### Projects  
- Client work with integrated CRM data, milestones, tasks, and deadlines
- Each project connects directly to relevant contacts and companies
- Track project progress with built-in task management
- Collaborate with team members on project deliverables

### CRM Integration
- **Contacts**: Individual people associated with projects and companies
- **Companies**: Business entities that can have multiple contacts and projects
- **Deals**: Sales opportunities linked to contacts and companies
- **Communications**: Track all interactions and communication history

## ✨ Key Features

- **Workspace Organization**: Separate environments for different business areas
- **Project Management**: Comprehensive project tracking with milestones and tasks
- **Integrated CRM**: Contact and company management built into every project
- **Unified Platform**: All business activities in one cohesive system
- **Modern UI**: Clean, Apple-inspired design with intuitive navigation

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd phoenix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🏛️ Architecture

### Frontend Stack
- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **React Router**: Client-side routing and navigation

### Design System
- **Apple-inspired UI**: Clean, modern interface following Apple's design principles
- **Consistent Spacing**: 8pt grid system for perfect alignment
- **Typography**: SF Pro Display/Text font family with proper hierarchy
- **Color Palette**: Carefully chosen colors with WCAG accessibility compliance

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── Sidebar.jsx     # Main navigation
│   ├── Topbar.jsx      # Top navigation bar
│   └── ProtectedRoute.jsx
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication state
├── pages/              # Main application pages
│   ├── LandingPage.jsx # Marketing homepage
│   ├── Dashboard.jsx   # Main workspace overview
│   ├── Login.jsx       # User authentication
│   └── Signup.jsx      # User registration
├── lib/                # Utilities and configurations
│   └── supabase.js     # Database client
└── styles/             # CSS and design system
    └── styles.css      # Global styles and components
```

## 📊 Data Model

### Workspace Hierarchy
```
Workspace
├── Projects
│   ├── Milestones
│   ├── Tasks
│   └── CRM Associations
├── Contacts
├── Companies
└── Deals
```

### Key Relationships
- **Workspaces** contain multiple **Projects**
- **Projects** can be associated with **Contacts** and **Companies**
- **Contacts** belong to **Companies** 
- **Deals** connect **Contacts**, **Companies**, and **Projects**
- **Communications** track interactions across all entities

## 🎨 Design Guidelines

### Color System
- **Primary**: System Blue (#007AFF) for primary actions
- **Success**: System Green (#34C759) for positive states
- **Warning**: System Orange (#FF9500) for caution states
- **Danger**: System Red (#FF3B30) for destructive actions

### Typography Scale
- **Large Title**: 34px - Hero headings
- **Title 1**: 28px - Page titles
- **Title 2**: 22px - Section titles
- **Headline**: 17px - Component titles
- **Body**: 17px - Main content
- **Subheadline**: 15px - Secondary content

### Spacing System
- Based on 4px increments
- Consistent padding and margins
- Proper visual hierarchy

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- Use functional components with hooks
- Follow React best practices
- Implement proper TypeScript types (when applicable)
- Maintain consistent file naming conventions

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏢 Business Use Cases

### For Small Businesses
- Organize client projects in dedicated workspaces
- Track customer relationships and communication history
- Manage project deliverables and deadlines

### For Agencies
- Separate client workspaces for better organization
- Integrated CRM for proposal and project management
- Team collaboration on client projects

### For Enterprises
- Department-based workspaces with proper access control
- Cross-department project collaboration
- Comprehensive customer relationship management

---

**Phoenix** - Unifying workspace organization, project management, and customer relationships in one powerful platform.

