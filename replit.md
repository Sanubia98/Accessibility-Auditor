# Robonito Accessibility Scanner Web Application

## Overview

This is a full-stack web application that scans websites for accessibility issues using WCAG (Web Content Accessibility Guidelines) standards. The application features a React frontend with a Node.js/Express backend, utilizing Puppeteer and Axe-core for automated accessibility testing. The platform is branded as "Robonito Accessibility Scanner" with custom logo and styling.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### July 11, 2024
- **Fixed Browser Launch Issues**: Resolved Chrome/Puppeteer dependency issues by installing required system libraries (glib, gtk3, nss, X11 libraries, alsa-lib)
- **Updated Branding**: Changed from "AccessiScan" to "Robonito Accessibility Scanner" with custom logo implementation
- **Enhanced Chrome Configuration**: Added comprehensive Chrome launch arguments for better compatibility in headless environment
- **Resolved TypeScript Errors**: Fixed storage interface type compatibility issues
- **Verified Scanning Functionality**: Successfully tested website scanning with real accessibility issue detection
- **Enhanced Testing Capabilities**: Added advanced WCAG AAA, AODA, cognitive, and multimedia testing levels
- **Advanced Scanner Implementation**: Created comprehensive advanced scanner with reading level analysis, cognitive load assessment, multimedia evaluation, and navigation testing
- **Enhanced User Interface**: Updated scanner form with new testing options and enhanced results display with detailed metrics
- **Browser Compatibility**: Configured Puppeteer to use system Chromium browser for reliable scanning operations

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and build processes
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI primitives with custom styled components

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL session store using connect-pg-simple

### Key Design Decisions
1. **Monorepo Structure**: Client, server, and shared code in a single repository for easier development and deployment
2. **Shared Schema**: Common TypeScript types and validation schemas using Zod for type safety across frontend and backend
3. **Memory Storage Fallback**: In-memory storage implementation for development/testing when database is unavailable
4. **Real-time Updates**: Polling mechanism for scan status updates during long-running accessibility scans

## Key Components

### Accessibility Scanning Engine
- **Scanner Service**: Uses Puppeteer to control headless Chrome browser
- **Axe Integration**: Leverages @axe-core/puppeteer for comprehensive accessibility testing
- **WCAG Compliance**: Supports WCAG 2.1/2.2 levels A, AA, and AAA
- **Issue Classification**: Categorizes issues by severity (critical, major, minor) and type

### Data Models
- **Scans**: Stores scan metadata, status, scores, and compliance levels
- **Issues**: Detailed accessibility violations with remediation suggestions
- **Relationships**: One-to-many relationship between scans and issues

### User Interface Components
- **Scanner Form**: Input form for URLs and WCAG level selection
- **Scan Results**: Overview cards showing scores and compliance metrics
- **Issue List**: Filterable list of accessibility issues with detailed information
- **Report Generation**: PDF export functionality for scan results

## Data Flow

1. **Scan Initiation**: User submits URL and WCAG levels through the frontend form
2. **Backend Processing**: Express server creates scan record and initiates Puppeteer-based scanning
3. **Accessibility Analysis**: Axe-core analyzes the webpage and identifies violations
4. **Data Storage**: Issues are processed, categorized, and stored in the database
5. **Real-time Updates**: Frontend polls for scan status updates until completion
6. **Results Display**: Completed scan results are displayed with filtering and export options

## External Dependencies

### Core Dependencies
- **@axe-core/puppeteer**: Accessibility testing automation
- **puppeteer**: Headless Chrome browser automation
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: TypeScript ORM for database operations
- **@tanstack/react-query**: Server state management and caching

### UI Dependencies
- **@radix-ui/***: Headless UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Dependencies
- **tsx**: TypeScript execution for development
- **vite**: Build tool and development server
- **esbuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

### Development Environment
- **Frontend**: Vite development server with HMR (Hot Module Replacement)
- **Backend**: tsx for TypeScript execution with file watching
- **Database**: Configured for Neon Database with environment variables

### Production Build
- **Frontend**: Vite builds static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database Migrations**: Drizzle Kit handles schema migrations
- **Environment**: Node.js production server serving both API and static files

### Configuration Requirements
- **DATABASE_URL**: PostgreSQL connection string for Neon Database
- **NODE_ENV**: Environment detection (development/production)
- **Session Configuration**: PostgreSQL session store setup

The application is designed to be deployed on platforms supporting Node.js with PostgreSQL database connectivity, with specific optimizations for Replit's environment including cartographer integration and runtime error handling.