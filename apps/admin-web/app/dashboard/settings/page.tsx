"use client";

import { Settings, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@anvaya/ui/card";
import { Button } from "@anvaya/ui/button";
import { Input } from "@anvaya/ui/input";
import { Label } from "@anvaya/ui/label";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Platform configuration and preferences.</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input defaultValue="ExportReady" />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input defaultValue="support@exportready.io" type="email" />
            </div>
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Input defaultValue="INR" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Billing Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Trial Period (days)</Label>
              <Input defaultValue="14" type="number" />
            </div>
            <div className="space-y-2">
              <Label>Grace Period (days)</Label>
              <Input defaultValue="3" type="number" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button className="gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
