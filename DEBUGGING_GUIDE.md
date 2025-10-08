# Navigator App - Issue URL Debugging Guide

## Problem Statement
Issues from different projects are not opening properly in the app, resulting in 404 errors or authentication failures.

## Debugging Setup Implemented

### 1. Enhanced Console Logging
All major components now have comprehensive console logging with emojis for easy identification:

- 🔍 **IssueDetailPage Debug** - URL parsing and parameter extraction
- 🌐 **GitLab API Request** - API call details and authentication
- 📡 **GitLab API Response** - Response status and error details
- 🔗 **Issue Click Debug** - Navigation from issue lists
- 🎯 **Navigation Details** - URL construction and encoding

### 2. Debug Components Added

#### URL Tester Component
- **Location**: `/debug/url-tester`
- **Purpose**: Test different URL patterns and project paths
- **Features**:
  - Test predefined issue URLs
  - Parse external URLs
  - Generate and test custom URLs
  - Copy URLs to clipboard

### 3. Enhanced Error Handling

#### IssueDetailPage.tsx
- Better authentication error messages
- Detailed project path and issue IID display
- Comprehensive error information from API calls
- Redirect-after-login functionality

#### GitLab API Hook
- Detailed request/response logging
- Enhanced error messages with response body
- Retry logic with logging
- Token validation logging

### 4. Project Path Extraction

Two implementations for extracting project paths from GitLab URLs:

#### Index.tsx - `getProjectPathFromIssue`
```typescript
// Extracts: devsel/project-name from https://gitlab.com/devsel/project-name/-/issues/123
const pathParts = url.pathname.split('/');
const issueIndex = pathParts.findIndex(part => part === 'issues');
const projectPath = pathParts.slice(1, issueIndex - 1).join('/');
```

#### NewEnhancedIssuesList.tsx - `getProjectIdFromIssue`
```typescript
// Same logic but different function name
const projectPath = pathParts.slice(1, issueIndex - 1).join('/');
```

## Testing Workflow

### 1. Local Testing
1. Start development server: `npm run dev`
2. Navigate to `/debug/url-tester`
3. Test different project paths and issue IDs
4. Check console for detailed logging

### 2. Console Debugging
Open browser console and look for:
- 🔍 URL parsing logs
- 🌐 API request logs
- ❌ Error messages with details
- ✅ Success confirmations

### 3. Test Cases to Verify

#### Working Cases
- `devsel/l3-react-bebrave-app` issue #82
- Simple project paths without special characters

#### Failing Cases  
- `devsel/eaglegpt-project-boards` issue #371
- Projects with special characters
- Nested group projects

### 4. Common Issues to Check

#### Authentication
- GitLab credentials stored in localStorage
- Correct host URL and token
- Group ID matches the projects

#### URL Encoding
- Project paths with special characters
- Forward slashes in project names
- URL encoding/decoding consistency

#### API Endpoints
- Correct GitLab API base URL
- Project path encoding for API calls
- Issue IID vs Issue ID confusion

## Debug URLs for Testing

### Local Development
- Main app: `http://localhost:8080/`
- URL Tester: `http://localhost:8080/debug/url-tester`
- Test issue: `http://localhost:8080/issue/devsel%2Fl3-react-bebrave-app/82`

### Production Testing
- Replace localhost with your deployed URL
- Test the same URLs on production

## Expected Console Output

### Successful Issue Load
```
🔍 IssueDetailPage Debug: {
  rawParams: { projectId: "devsel%2Fl3-react-bebrave-app", issueIid: "82" },
  decodedProjectPath: "devsel/l3-react-bebrave-app",
  parsedIssueIid: 82,
  credentials: true
}

🌐 GitLab API Request: {
  method: "GET",
  endpoint: "/projects/devsel%2Fl3-react-bebrave-app/issues/82?with_time_stats=true"
}

✅ GitLab API Success: { endpoint: "/projects/...", dataType: "object" }
```

### Failed Issue Load
```
❌ GitLab API Error Body: {"message":"404 Project Not Found"}
❌ API request failed: {
  endpoint: "/projects/devsel%2Feaglegpt-project-boards/issues/371",
  error: "GitLab API Error: 404 Not Found - 404 Project Not Found"
}
```

## Next Steps

1. **Test Locally**: Use the URL tester to verify different project paths
2. **Check API Access**: Verify GitLab credentials can access the specific projects
3. **Deploy Changes**: Deploy the enhanced debugging to production
4. **Monitor Logs**: Check console logs on production for specific error patterns
5. **Fix Root Cause**: Based on debugging output, fix the underlying issue

## Troubleshooting Checklist

- [ ] GitLab credentials are valid and stored
- [ ] Project path extraction is working correctly
- [ ] URL encoding/decoding is consistent
- [ ] API endpoints are constructed properly
- [ ] GitLab server is accessible
- [ ] User has permission to access the specific project
- [ ] Issue IID exists in the project
- [ ] Network connectivity is working

## Files Modified

- `src/pages/IssueDetailPage.tsx` - Enhanced debugging and error handling
- `src/hooks/useGitLabAPI.ts` - Comprehensive API logging
- `src/components/NewEnhancedIssuesList.tsx` - Enhanced navigation debugging
- `src/pages/Index.tsx` - Issue click debugging
- `src/components/IssueUrlTester.tsx` - New debug component
- `src/App.tsx` - Added debug route
