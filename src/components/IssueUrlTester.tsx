import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, TestTube, Copy } from 'lucide-react';

const IssueUrlTester: React.FC = () => {
  const navigate = useNavigate();
  const [testUrl, setTestUrl] = useState('');
  const [projectPath, setProjectPath] = useState('devsel/eaglegpt-project-boards');
  const [issueIid, setIssueIid] = useState('371');

  // Common test cases
  const testCases = [
    {
      name: 'Original Issue',
      projectPath: 'devsel/l3-react-bebrave-app',
      issueIid: '82',
      description: 'The original issue that was working'
    },
    {
      name: 'EagleGPT Issue',
      projectPath: 'devsel/eaglegpt-project-boards',
      issueIid: '371',
      description: 'The issue that was failing with 404'
    },
    {
      name: 'Test with Special Chars',
      projectPath: 'devsel/test-project_name',
      issueIid: '1',
      description: 'Project with underscores and special characters'
    },
    {
      name: 'Nested Group',
      projectPath: 'group/subgroup/project',
      issueIid: '123',
      description: 'Deeply nested project path'
    }
  ];

  const generateUrl = (projectPath: string, issueIid: string) => {
    const encodedProject = encodeURIComponent(projectPath);
    return `/issue/${encodedProject}/${issueIid}?from=/`;
  };

  const testUrl_navigate = (projectPath: string, issueIid: string) => {
    const url = generateUrl(projectPath, issueIid);
    console.log('🧪 Testing URL:', {
      originalProject: projectPath,
      encodedProject: encodeURIComponent(projectPath),
      issueIid,
      generatedUrl: url,
      fullUrl: window.location.origin + url
    });
    navigate(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const parseCustomUrl = () => {
    try {
      const url = new URL(testUrl);
      const pathParts = url.pathname.split('/');
      const issueIndex = pathParts.findIndex(part => part === 'issue');
      
      if (issueIndex > -1 && pathParts.length > issueIndex + 2) {
        const encodedProject = pathParts[issueIndex + 1];
        const issueIid = pathParts[issueIndex + 2];
        const decodedProject = decodeURIComponent(encodedProject);
        
        console.log('🔍 Parsed custom URL:', {
          originalUrl: testUrl,
          encodedProject,
          decodedProject,
          issueIid,
          pathParts
        });
        
        navigate(`/issue/${encodedProject}/${issueIid}${url.search}`);
      }
    } catch (error) {
      console.error('❌ Failed to parse URL:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Issue URL Tester & Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Project Path</label>
              <Input
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                placeholder="devsel/project-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Issue IID</label>
              <Input
                value={issueIid}
                onChange={(e) => setIssueIid(e.target.value)}
                placeholder="123"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => testUrl_navigate(projectPath, issueIid)}>
              Test Issue URL
            </Button>
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard(window.location.origin + generateUrl(projectPath, issueIid))}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy URL
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p><strong>Generated URL:</strong> {generateUrl(projectPath, issueIid)}</p>
            <p><strong>Encoded Project:</strong> {encodeURIComponent(projectPath)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test External URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="https://navigator-wine.vercel.app/issue/devsel%2Feaglegpt-project-boards/371?from=/"
          />
          <Button onClick={parseCustomUrl} disabled={!testUrl}>
            Parse & Navigate
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Predefined Test Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testCases.map((testCase, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{testCase.name}</h3>
                  <Badge variant="outline">#{testCase.issueIid}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{testCase.description}</p>
                <div className="text-xs text-muted-foreground">
                  <p>Project: {testCase.projectPath}</p>
                  <p>URL: {generateUrl(testCase.projectPath, testCase.issueIid)}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => testUrl_navigate(testCase.projectPath, testCase.issueIid)}
                  >
                    Test
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setProjectPath(testCase.projectPath);
                      setIssueIid(testCase.issueIid);
                    }}
                  >
                    Load
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Current URL:</strong> {window.location.href}</p>
            <p><strong>Origin:</strong> {window.location.origin}</p>
            <p><strong>Pathname:</strong> {window.location.pathname}</p>
            <p><strong>Search:</strong> {window.location.search}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IssueUrlTester;
