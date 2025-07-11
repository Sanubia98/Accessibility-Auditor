import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { type Scan } from "@shared/schema";

interface ScanResultsProps {
  scan: Scan;
  issueCategories: Array<{
    name: string;
    icon: string;
    count: number;
    severity: 'critical' | 'major' | 'minor';
  }>;
}

export function ScanResults({ scan, issueCategories }: ScanResultsProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-error';
      case 'major': return 'text-warning';
      case 'minor': return 'text-primary';
      default: return 'text-gray-500';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50';
      case 'major': return 'bg-orange-50';
      case 'minor': return 'bg-blue-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Score</p>
                <p className="text-2xl font-bold text-gray-900">{scan.overallScore}%</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <TrendingUp className="text-primary h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={scan.overallScore || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Issues Found</p>
                <p className="text-2xl font-bold text-gray-900">{scan.totalIssues}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <AlertTriangle className="text-error h-6 w-6" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-600">
                across {issueCategories.length} categories
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Level</p>
                <p className="text-2xl font-bold text-gray-900">
                  Level {scan.complianceLevel || 'None'}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <CheckCircle className="text-success h-6 w-6" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-600">
                {scan.complianceLevel === 'AAA' ? 'Full compliance' : 
                 scan.complianceLevel === 'AA' ? 'Good compliance' :
                 scan.complianceLevel === 'A' ? 'Basic compliance' : 'No compliance'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues by Severity */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues by Severity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-error rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Critical</p>
                    <p className="text-sm text-gray-600">Must fix immediately</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-error">{scan.criticalIssues}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-warning rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Major</p>
                    <p className="text-sm text-gray-600">Should fix soon</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-warning">{scan.majorIssues}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Minor</p>
                    <p className="text-sm text-gray-600">Good to fix</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-primary">{scan.minorIssues}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issue Categories */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue Categories</h3>
            <div className="space-y-4">
              {issueCategories.map((category) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <i className={`fas fa-${category.icon} text-gray-400`} />
                    <span className="text-sm font-medium text-gray-700">{category.name}</span>
                  </div>
                  <span className={`text-sm font-bold ${getSeverityColor(category.severity)}`}>
                    {category.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
