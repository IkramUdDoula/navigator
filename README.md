# Navigator

Navigator is a modern, enhanced UI for interacting with GitLab, providing powerful visualization tools for issues, sprint analytics, and customizable workflow management.

## Features

### Core Functionality
- **Enhanced Issue Tracking**: Advanced grouping, filtering, and search capabilities for GitLab issues
- **Customizable Kanban Boards**: Create multiple boards with custom lists based on status, labels, assignees, or state
- **Sprint Analytics**: Real-time metrics including velocity, completion rate, time tracking, and capacity planning
- **Dynamic Status Management**: Automatically fetches and displays issue statuses from your GitLab group
- **Issue Management**: Create, edit, and manage issues directly from the interface
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Dark/Light Theme**: Toggle between themes based on your preference

### Kanban Board Customization
- **Multiple Board Configurations**: Create and save multiple board layouts for different workflows
- **Flexible List Filters**: Configure lists to show issues by:
  - **Status**: Group by workflow status (To Do, Doing, Review, etc.)
  - **Label**: Filter by specific labels
  - **Assignee**: Show issues assigned to specific team members
  - **State**: Separate opened and closed issues
- **Board Management**: Switch between boards, edit configurations, and delete unused boards
- **Persistent Storage**: Board configurations are saved locally and persist across sessions

### Sprint Analytics
- **Accurate Time Tracking**: Fixed iteration time calculation to show correct remaining days
- **Velocity Metrics**: Track achieved vs. required velocity with real-time updates
- **Capacity Planning**: Team capacity breakdown with utilization percentages
- **Progress Tracking**: Monitor completion rates, estimated hours, and time spent
- **Visual Indicators**: Color-coded status indicators (good/poor/neutral) for quick assessment

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/IkramUdDoula/navigator.git

# Navigate to the project directory
cd Navigator

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── lib/            # Utility functions
├── pages/          # Page components
├── types/          # TypeScript type definitions
```

## Key Components

- **NewEnhancedIssuesList**: Advanced issue listing with grouping and filtering
- **CustomizableKanbanBoard**: Flexible Kanban board with user-defined list configurations
- **BoardConfigDialog**: UI for creating and managing custom board layouts
- **SprintAnalytics**: Real-time sprint metrics and performance indicators
- **CreateIssueForm**: Modern form for creating new GitLab issues
- **IssueDetailPage**: Detailed view for viewing and editing individual issues
- **GlobalFilterSection**: Powerful filtering across all issues by assignee, iteration, labels, and more

## Usage

### Configuring Custom Kanban Boards

1. Navigate to the **Iteration** tab
2. Click the board selector dropdown (with gear icon)
3. Select **"New Board"** or **"Edit Current Board"**
4. Configure your board:
   - Set a board name
   - Add lists by clicking **"Add List"**
   - For each list:
     - Choose a filter type (Status, Label, Assignee, or State)
     - Select the filter value from available options
     - Give the list a descriptive name
5. Click **"Save Board"** to apply changes

### Managing Multiple Boards

- **Switch Boards**: Use the board selector dropdown to switch between saved boards
- **Edit Board**: Select "Edit Current Board" from the dropdown
- **Delete Board**: Select "Delete Current Board" (requires at least 2 boards)
- **Default Board**: A default board with common statuses is provided out of the box

### Sprint Analytics

The Sprint Analytics section automatically displays:
- **Total Issues**: All issues in the current sprint/iteration
- **Completed Issues**: Number and percentage of completed work
- **Completion Rate**: Progress compared to time elapsed
- **Time Remaining**: Accurate calculation of days left in sprint
- **Velocity**: Issues completed per day vs. required velocity
- **Estimated Hours**: Total time estimates for all issues
- **Progress Hours**: Time spent with efficiency indicators

## Technologies

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Query
- React Router

