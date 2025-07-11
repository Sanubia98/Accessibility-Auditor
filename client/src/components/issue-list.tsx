import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, ChevronRight, AlertTriangle } from "lucide-react";
import { type Issue } from "@shared/schema";

interface IssueListProps {
  issues: Issue[];
  onExportReport: () => void;
  isExporting: boolean;
}

export function IssueList({ issues, onExportReport, isExporting }: IssueListProps) {
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filteredIssues = issues.filter(issue => 
    severityFilter === "all" || issue.severity === severityFilter
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'major': return 'bg-orange-100 text-orange-800';
      case 'minor': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIconColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-error';
      case 'major': return 'text-warning';
      case 'minor': return 'text-primary';
      default: return 'text-gray-500';
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100';
      case 'major': return 'bg-orange-100';
      case 'minor': return 'bg-blue-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Detailed Issues</CardTitle>
          <div className="flex items-center space-x-4">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={onExportReport} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Generating...' : 'Export Report'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {filteredIssues.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No issues found with the current filter.
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div key={issue.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 ${getSeverityBgColor(issue.severity)} rounded-full flex items-center justify-center`}>
                      <AlertTriangle className={`${getSeverityIconColor(issue.severity)} h-4 w-4`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge className={getSeverityColor(issue.severity)}>
                        {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                      </Badge>
                      <span className="text-sm text-gray-500">{issue.wcagCriteria}</span>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">{issue.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{issue.description}</p>
                    
                    {issue.element && (
                      <div className="bg-gray-50 rounded-md p-3 mb-3">
                        <p className="text-xs text-gray-700 mb-2"><strong>Element:</strong></p>
                        <code className="text-xs text-gray-600 bg-white px-2 py-1 rounded break-all">
                          {issue.element}
                        </code>
                      </div>
                    )}
                    
                    {issue.suggestedFix && (
                      <div className="bg-blue-50 rounded-md p-3">
                        <p className="text-xs text-gray-700 mb-2"><strong>Suggested Fix:</strong></p>
                        <p className="text-xs text-blue-800 bg-white px-2 py-1 rounded">
                          {issue.suggestedFix}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <Button variant="ghost" size="sm" className="p-2">
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
