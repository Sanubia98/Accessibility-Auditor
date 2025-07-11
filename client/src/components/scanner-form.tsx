import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ScannerFormProps {
  onScanStart: (url: string, levels: string[]) => void;
  isScanning: boolean;
}

export function ScannerForm({ onScanStart, isScanning }: ScannerFormProps) {
  const [url, setUrl] = useState("");
  const [scanLevels, setScanLevels] = useState<string[]>(["A", "AA"]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && scanLevels.length > 0) {
      onScanStart(url.trim(), scanLevels);
    }
  };

  const handleLevelChange = (level: string, checked: boolean) => {
    if (checked) {
      setScanLevels([...scanLevels, level]);
    } else {
      setScanLevels(scanLevels.filter(l => l !== level));
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Website Scanner</CardTitle>
        <CardDescription>
          Enter a URL to scan for WCAG 2.1/2.2 compliance issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="url-input" className="text-sm font-medium">
              Website URL
            </Label>
            <div className="flex space-x-4 mt-2">
              <Input
                id="url-input"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" disabled={isScanning || !url.trim()}>
                {isScanning ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Scan Website
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="level-a"
                checked={scanLevels.includes("A")}
                onCheckedChange={(checked) => handleLevelChange("A", checked as boolean)}
              />
              <Label htmlFor="level-a" className="text-sm">Level A</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="level-aa"
                checked={scanLevels.includes("AA")}
                onCheckedChange={(checked) => handleLevelChange("AA", checked as boolean)}
              />
              <Label htmlFor="level-aa" className="text-sm">Level AA</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="level-aaa"
                checked={scanLevels.includes("AAA")}
                onCheckedChange={(checked) => handleLevelChange("AAA", checked as boolean)}
              />
              <Label htmlFor="level-aaa" className="text-sm">Level AAA</Label>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
