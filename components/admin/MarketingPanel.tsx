
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Tag, BarChart, Globe, Search, Copy, CheckSquare } from "lucide-react";

export function MarketingPanel() {
  const promotions = [
    { code: "WELCOME20", discount: "20%", usage: 145, status: "Active", type: "Percentage" },
    { code: "SUMMER10", discount: "10%", usage: 89, status: "Active", type: "Percentage" },
    { code: "FREESHIP", discount: "Free Shipping", usage: 230, status: "Expired", type: "Shipping" },
  ];

  const seoStats = [
    { label: "Organic Traffic", value: "12.5k", change: "+15%", status: "good" },
    { label: "Avg. Position", value: "4.2", change: "+0.8", status: "good" },
    { label: "Click Rate (CTR)", value: "3.8%", change: "-0.2%", status: "bad" },
    { label: "Indexed Pages", value: "156", change: "+12", status: "neutral" },
  ];

  return (
    <div className="space-y-8">
      {/* SEO Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {seoStats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-card">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm text-text-secondary font-medium">{stat.label}</p>
                <Globe className="h-4 w-4 text-primary/50" />
              </div>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <span className={`text-xs font-medium mb-1 ${
                  stat.status === 'good' ? 'text-success' :
                  stat.status === 'bad' ? 'text-error' : 'text-warning'
                }`}>
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Promotions Manager */}
        <Card className="lg:col-span-2 border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Active Promotions
            </CardTitle>
            <Button size="sm" className="btn-primary">
              <Plus className="mr-2 h-4 w-4" /> Create Code
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {promotions.map((promo) => (
                <div key={promo.code} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border-light">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Tag className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold">{promo.code}</h4>
                        <Badge variant={promo.status === 'Active' ? 'success' : 'secondary'}>{promo.status}</Badge>
                      </div>
                      <p className="text-sm text-text-secondary">{promo.discount} • {promo.usage} uses</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick SEO Checklist */}
        <Card className="border-none shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-500" />
              SEO Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { task: "Sitemap.xml generated", done: true },
                { task: "Robots.txt configured", done: true },
                { task: "Meta tags optimized", done: true },
                { task: "Alt text on images", done: false },
                { task: "Broken links check", done: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                    item.done ? 'bg-success border-success text-white' : 'border-border-light'
                  }`}>
                    {item.done && <CheckSquare className="h-3 w-3" />}
                  </div>
                  <span className={`text-sm ${item.done ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {item.task}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-6">
              Run SEO Audit
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
