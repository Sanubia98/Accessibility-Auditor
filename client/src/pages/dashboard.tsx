import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScannerForm } from "@/components/scanner-form";
import { ScanResults } from "@/components/scan-results";
import { IssueList } from "@/components/issue-list";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Scan, type Issue } from "@shared/schema";
import { Accessibility, RotateCcw, Share2 } from "lucide-react";

export default function Dashboard() {
  const [activeScanId, setActiveScanId] = useState<number | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | false>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current scan
  const { data: currentScan, isLoading: scanLoading } = useQuery({
    queryKey: ['/api/scans', activeScanId],
    enabled: !!activeScanId,
    refetchInterval: pollingInterval,
  });

  // Fetch issues for current scan
  const { data: issues = [], isLoading: issuesLoading } = useQuery({
    queryKey: ['/api/scans', activeScanId, 'issues'],
    enabled: !!activeScanId && currentScan?.status === 'completed',
  });

  // Create scan mutation
  const createScanMutation = useMutation({
    mutationFn: async (data: { url: string; scanLevels: string[] }) => {
      const response = await apiRequest('POST', '/api/scans', data);
      return response.json();
    },
    onSuccess: (scan: Scan) => {
      setActiveScanId(scan.id);
      setPollingInterval(2000); // Poll every 2 seconds
      toast({
        title: "Scan Started",
        description: `Scanning ${scan.url} for accessibility issues...`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start scan. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Export report mutation
  const exportReportMutation = useMutation({
    mutationFn: async (scanId: number) => {
      const response = await apiRequest('GET', `/api/scans/${scanId}/report`);
      return response.blob();
    },
    onSuccess: (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accessibility-report-${activeScanId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report Downloaded",
        description: "Your accessibility report has been downloaded.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Stop polling when scan is complete
  useEffect(() => {
    if (currentScan?.status === 'completed' || currentScan?.status === 'failed') {
      setPollingInterval(false);
      
      if (currentScan.status === 'completed') {
        queryClient.invalidateQueries({ queryKey: ['/api/scans', activeScanId, 'issues'] });
        toast({
          title: "Scan Complete",
          description: `Found ${currentScan.totalIssues} accessibility issues.`,
        });
      } else {
        toast({
          title: "Scan Failed",
          description: "The scan could not be completed. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [currentScan?.status, activeScanId, queryClient, toast]);

  // Calculate issue categories
  const issueCategories = issues.reduce((acc: any[], issue: Issue) => {
    const existing = acc.find(cat => cat.name === issue.category);
    if (existing) {
      existing.count++;
    } else {
      acc.push({
        name: issue.category,
        icon: getCategoryIcon(issue.category),
        count: 1,
        severity: issue.severity,
      });
    }
    return acc;
  }, []);

  function getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'Color Contrast': 'palette',
      'Missing Alt Text': 'image',
      'Keyboard Navigation': 'keyboard',
      'ARIA Attributes': 'code',
      'Heading Structure': 'heading',
      'Link Context': 'link',
      'Form Labels': 'wpforms',
      'Table Headers': 'table',
    };
    return iconMap[category] || 'exclamation-triangle';
  }

  const handleScanStart = (url: string, scanLevels: string[]) => {
    createScanMutation.mutate({ url, scanLevels });
  };

  const handleExportReport = () => {
    if (activeScanId) {
      exportReportMutation.mutate(activeScanId);
    }
  };

  const handleRescan = () => {
    if (currentScan) {
      createScanMutation.mutate({ 
        url: currentScan.url, 
        scanLevels: currentScan.scanLevels 
      });
    }
  };

  const isScanning = currentScan?.status === 'pending' || currentScan?.status === 'scanning';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/robonito-logo.svg" alt="Robonito" className="h-8 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Robonito Accessibility Scanner</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Reports
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Settings
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Scanner Form */}
        <ScannerForm 
          onScanStart={handleScanStart} 
          isScanning={createScanMutation.isPending || isScanning}
        />

        {/* Loading State */}
        {isScanning && (
          <Card className="mb-8">
            <CardContent className="flex items-center justify-center p-8">
              <LoadingSpinner className="mr-4" />
              <div>
                <p className="text-lg font-medium">Scanning website...</p>
                <p className="text-sm text-gray-600">
                  This may take a few moments while we analyze your site for accessibility issues.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scan Results */}
        {currentScan && currentScan.status === 'completed' && (
          <>
            <ScanResults scan={currentScan} issueCategories={issueCategories} />
            
            {/* Issue List */}
            <IssueList 
              issues={issues} 
              onExportReport={handleExportReport}
              isExporting={exportReportMutation.isPending}
            />

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button variant="outline" onClick={handleRescan} disabled={isScanning}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Rescan Website
              </Button>
              <Button 
                onClick={handleExportReport} 
                disabled={exportReportMutation.isPending}
                className="bg-success hover:bg-success/90"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share with Team
              </Button>
            </div>
          </>
        )}

        {/* Error State */}
        {currentScan && currentScan.status === 'failed' && (
          <Card className="mb-8">
            <CardContent className="text-center p-8">
              <p className="text-lg font-medium text-error mb-2">Scan Failed</p>
              <p className="text-gray-600 mb-4">
                We couldn't scan the website. Please check the URL and try again.
              </p>
              <Button onClick={handleRescan}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4">
              <img src="/robonito-logo.svg" alt="Robonito" className="h-5" />
              <p className="text-sm text-gray-500">
                © 2024 Robonito. Making the web accessible for everyone.
              </p>
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Terms of Service</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
