import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ScannerFormProps {
  onScanStart: (url: string, levels: string[]) => void;
  isScanning: boolean;
}

export function ScannerForm({ onScanStart, isScanning }: ScannerFormProps) {
  const [url, setUrl] = useState("");
  const [scanLevels, setScanLevels] = useState<string[]>(["A"]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && scanLevels.length > 0) {
      // console.log("Starting scan for:", url, "with levels:", scanLevels);
      onScanStart(url.trim(), scanLevels);
    }
  };

  const handleLevelChange = (level: string, checked: boolean) => {
    if (checked) {
      setScanLevels([...scanLevels, level]);
    } else {
      setScanLevels(scanLevels.filter((l) => l !== level));
    }
  };

  return (
    <Card  className="mb-8 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-transform duration-300">
      <CardHeader className="text-center">
        <CardTitle >
          {" "}
          <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Website Scanner
          </span>
        </CardTitle>
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
              <Button
                className="px-6 py-3 rounded-md text-white bg-robo-gradient hover:opacity-90 transition"
                type="submit"
                disabled={isScanning || !url.trim()}
              >
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

          <div>
            <Label className="text-sm font-medium mb-3 block">
              WCAG Compliance Levels
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="level-a"
                    checked={scanLevels.includes("A")}
                    onCheckedChange={(checked) =>
                      handleLevelChange("A", checked as boolean)
                    }
                  />
                  <Label htmlFor="level-a" className="text-sm">
                    Level A (Basic)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="level-aa"
                    checked={scanLevels.includes("AA")}
                    onCheckedChange={(checked) =>
                      handleLevelChange("AA", checked as boolean)
                    }
                  />
                  <Label htmlFor="level-aa" className="text-sm">
                    Level AA (Standard)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="level-aaa"
                    checked={scanLevels.includes("AAA")}
                    onCheckedChange={(checked) =>
                      handleLevelChange("AAA", checked as boolean)
                    }
                  />
                  <Label htmlFor="level-aaa" className="text-sm">
                    Level AAA (Enhanced)
                  </Label>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="level-aoda"
                    checked={scanLevels.includes("AODA")}
                    onCheckedChange={(checked) =>
                      handleLevelChange("AODA", checked as boolean)
                    }
                  />
                  <Label htmlFor="level-aoda" className="text-sm">
                    AODA Comprehensive
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="level-cognitive"
                    checked={scanLevels.includes("COGNITIVE")}
                    onCheckedChange={(checked) =>
                      handleLevelChange("COGNITIVE", checked as boolean)
                    }
                  />
                  <Label htmlFor="level-cognitive" className="text-sm">
                    Cognitive & Reading
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="level-multimedia"
                    checked={scanLevels.includes("MULTIMEDIA")}
                    onCheckedChange={(checked) =>
                      handleLevelChange("MULTIMEDIA", checked as boolean)
                    }
                  />
                  <Label htmlFor="level-multimedia" className="text-sm">
                    Multimedia Enhanced
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
