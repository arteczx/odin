# ODIN Frontend - React TypeScript Dashboard

Production-ready React TypeScript frontend for the ODIN Firmware Intelligence Platform. Features a cyberpunk-themed interface with real-time firmware analysis visualization, project management, and comprehensive security reporting.

## 🚀 Features

- **Interactive Dashboard**: Real-time analysis status and system overview
- **Project Management**: Complete firmware project lifecycle management
- **Vulnerability Analysis**: CVE tracking with severity visualization
- **OSINT Intelligence**: Structured presentation of intelligence findings
- **Report Generation**: Multi-format report download and preview
- **Real-time Updates**: Live progress tracking and status monitoring
- **Cyberpunk UI**: Modern dark theme with neon accents
- **Responsive Design**: Optimized for desktop and mobile devices

## 🛠️ Technology Stack

- **React 18+** with TypeScript for type safety
- **Material-UI (MUI)** for comprehensive component library
- **Axios** for HTTP client with error handling
- **React Router** for navigation
- **Custom Hooks** for state management
- **CSS-in-JS** with Material-UI styling system

## 🚀 Quick Start

### Development Mode
```bash
# Install dependencies
npm install

# Start development server
npm start
```
Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Production Build
```bash
# Build for production
npm run build

# Serve production build
npm install -g serve
serve -s build -l 3000
```

### Environment Configuration
Create a `.env` file in the frontend directory:
```bash
REACT_APP_API_URL=http://localhost:8080
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Dashboard/      # Dashboard-specific components
│   ├── Upload/         # File upload components
│   └── Layout/         # Layout and navigation
├── pages/              # Main application pages
│   ├── Dashboard.tsx   # System overview dashboard
│   ├── Projects.tsx    # Project management
│   ├── Upload.tsx      # Firmware upload
│   ├── Vulnerabilities.tsx # CVE analysis
│   ├── OSINT.tsx       # Intelligence results
│   └── Reports.tsx     # Report generation
├── services/           # API integration
│   └── api.ts          # Backend API client
├── types/              # TypeScript definitions
│   └── index.ts        # Type definitions
└── App.tsx             # Main application component
```

## 🔌 API Integration

The frontend integrates with the Go backend through RESTful APIs:

- **Projects API**: `/api/projects/` - Project CRUD operations
- **Analysis API**: `/api/analysis/` - Firmware analysis results
- **Vulnerabilities API**: `/api/vulnerabilities/` - CVE data
- **OSINT API**: `/api/osint/` - Intelligence results
- **Reports API**: `/api/reports/` - Report generation
- **EMBA API**: `/api/emba/` - EMBA analysis integration

## 🎨 UI Components

### Key Pages
- **Dashboard**: System status, vulnerability distribution, recent activity
- **Projects**: Firmware project listing with filtering and management
- **Upload**: Drag-and-drop firmware upload with metadata input
- **Vulnerabilities**: CVE analysis with severity filtering
- **OSINT**: Intelligence results with expandable details
- **Reports**: Report generation and download management

### Design System
- **Color Scheme**: Dark cyberpunk theme with neon accents
- **Typography**: Fira Code monospace font for technical authenticity
- **Components**: Material-UI with custom styling
- **Responsive**: Mobile-first responsive design

## 🔧 Available Scripts

### `npm start`
Runs the development server with hot reloading.

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run build`
Builds the app for production with optimizations.

### `npm run lint`
Runs ESLint to check code quality.

### `npm run type-check`
Runs TypeScript compiler to check types.

## 🔄 Real-time Features

- **Live Status Updates**: Real-time analysis progress tracking
- **Error Handling**: Comprehensive error states with user feedback
- **Refresh Controls**: Manual data refresh capabilities
- **Loading States**: Smooth loading indicators and skeleton screens

## 🚀 Production Deployment

The frontend is production-ready with:
- Optimized build output
- Code splitting for performance
- Error boundaries for stability
- Comprehensive TypeScript coverage
- No placeholder or demo data

## 📚 Learn More

- [React Documentation](https://reactjs.org/)
- [Material-UI Documentation](https://mui.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Create React App Documentation](https://facebook.github.io/create-react-app/docs/getting-started)
