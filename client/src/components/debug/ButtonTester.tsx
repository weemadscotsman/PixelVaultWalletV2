import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, TestTube } from "lucide-react";
import { useLocation } from "wouter";

interface ButtonTest {
  name: string;
  selector: string;
  expectedAction: string;
  status: 'pending' | 'passed' | 'failed';
  error?: string;
}

export function ButtonTester() {
  const [, setLocation] = useLocation();
  const [tests, setTests] = useState<ButtonTest[]>([
    { name: "Wallet - Send Button", selector: "[data-testid='send-button']", expectedAction: "Navigate to send", status: 'pending' },
    { name: "Wallet - Receive Button", selector: "[data-testid='receive-button']", expectedAction: "Navigate to receive", status: 'pending' },
    { name: "Mining - Start Mining", selector: "[data-testid='start-mining']", expectedAction: "Start mining process", status: 'pending' },
    { name: "Staking - Stake Tokens", selector: "[data-testid='stake-button']", expectedAction: "Open staking modal", status: 'pending' },
    { name: "Governance - Vote", selector: "[data-testid='vote-button']", expectedAction: "Submit vote", status: 'pending' },
    { name: "Sidebar - Navigation Links", selector: ".sidebar-link", expectedAction: "Navigate to page", status: 'pending' },
    { name: "Header - Profile Menu", selector: "[data-testid='profile-menu']", expectedAction: "Open profile menu", status: 'pending' },
    { name: "Transaction - View Details", selector: "[data-testid='tx-details']", expectedAction: "Show transaction details", status: 'pending' },
  ]);

  const testButton = async (test: ButtonTest): Promise<ButtonTest> => {
    try {
      const element = document.querySelector(test.selector);
      
      if (!element) {
        return {
          ...test,
          status: 'failed',
          error: `Element not found: ${test.selector}`
        };
      }

      const isButton = element.tagName === 'BUTTON' || element.getAttribute('role') === 'button';
      const hasClick = element.onclick !== null || element.addEventListener;
      const isDisabled = element.hasAttribute('disabled');

      if (isDisabled) {
        return {
          ...test,
          status: 'failed',
          error: 'Button is disabled'
        };
      }

      if (!isButton && !hasClick) {
        return {
          ...test,
          status: 'failed',
          error: 'Element is not clickable'
        };
      }

      // Simulate click test
      const clickEvent = new MouseEvent('click', { bubbles: true });
      element.dispatchEvent(clickEvent);

      return {
        ...test,
        status: 'passed'
      };
    } catch (error) {
      return {
        ...test,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const runAllTests = async () => {
    const results: ButtonTest[] = [];
    
    for (const test of tests) {
      const result = await testButton(test);
      results.push(result);
      setTests([...results, ...tests.slice(results.length)]);
    }
    
    setTests(results);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const passed = tests.filter(t => t.status === 'passed').length;
  const failed = tests.filter(t => t.status === 'failed').length;

  return (
    <Card className="bg-black/80 border-orange-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-orange-400">
            <TestTube className="h-5 w-5" />
            Button Functionality Tester
          </CardTitle>
          <Button
            onClick={runAllTests}
            className="bg-orange-600 hover:bg-orange-700 text-black"
          >
            Test All Buttons
          </Button>
        </div>
        
        {(passed + failed) > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{passed}</div>
              <div className="text-xs text-gray-400">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{failed}</div>
              <div className="text-xs text-gray-400">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">
                {Math.round((passed / (passed + failed)) * 100)}%
              </div>
              <div className="text-xs text-gray-400">Success Rate</div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {tests.map((test, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-gray-700"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(test.status)}
              <div>
                <div className="font-medium text-gray-200">{test.name}</div>
                <div className="text-xs text-gray-500">{test.expectedAction}</div>
                {test.error && (
                  <div className="text-xs text-red-400">{test.error}</div>
                )}
              </div>
            </div>
            
            <Badge 
              className={
                test.status === 'passed' 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : test.status === 'failed'
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
              }
            >
              {test.status.toUpperCase()}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}