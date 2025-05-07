import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AnimatedPageLayout } from "@/components/layout/AnimatedPageLayout";
import { useWallet } from "@/hooks/use-wallet";
import { Eye, EyeOff, Shield, AlertTriangle, RefreshCw, Save, Check, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { wallet } = useWallet();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  
  // Account settings
  const [username, setUsername] = useState("ZK_Hashlord");
  const [email, setEmail] = useState("user@example.com");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [passwordAutoLock, setPasswordAutoLock] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  
  // Display settings
  const [matrixIntensity, setMatrixIntensity] = useState(40);
  const [compactMode, setCompactMode] = useState(false);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  
  // Mock function to save settings
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Reset settings to default
  const resetSettings = () => {
    setMatrixIntensity(40);
    setCompactMode(false);
    setHighContrastMode(false);
    setAnimationsEnabled(true);
    setSessionTimeout(30);
    
    toast({
      title: "Settings reset",
      description: "Your settings have been reset to default values.",
    });
  };
  
  return (
    <AnimatedPageLayout isConnected={!!wallet} variant="pop">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent pb-1">
            User Settings
          </h1>
          <p className="text-muted-foreground">
            Configure your PVX wallet and application settings
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="account" className="data-[state=active]:bg-blue-600">
              Account
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-blue-600">
              Security
            </TabsTrigger>
            <TabsTrigger value="display" className="data-[state=active]:bg-blue-600">
              Display
            </TabsTrigger>
          </TabsList>
          
          {/* Account Settings */}
          <TabsContent value="account" className="space-y-4 mt-4">
            <Card className="bg-black/80 backdrop-blur-lg border-slate-800">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account details and manage your public presence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-slate-900/50 border-slate-700/50"
                  />
                  <p className="text-sm text-muted-foreground">
                    This is your public display name visible to other users.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-900/50 border-slate-700/50"
                  />
                  <p className="text-sm text-muted-foreground">
                    Used for notifications and account recovery.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wallet-address">Wallet Address</Label>
                  <div className="flex">
                    <Input
                      id="wallet-address"
                      value={wallet?.address || "Connect your wallet first"}
                      readOnly
                      className="bg-slate-900/50 border-slate-700/50 font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="ml-2"
                      onClick={() => {
                        if (wallet?.address) {
                          navigator.clipboard.writeText(wallet.address);
                          toast({
                            title: "Address copied",
                            description: "Wallet address copied to clipboard",
                          });
                        }
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="private-key">Private Key</Label>
                  <div className="flex">
                    <Input
                      id="private-key"
                      type={showPrivateKey ? "text" : "password"}
                      value={wallet ? "************************" : "Connect your wallet first"}
                      readOnly
                      className="bg-slate-900/50 border-slate-700/50 font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="ml-2"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                    >
                      {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-yellow-500 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Never share your private key with anyone.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUsername("ZK_Hashlord");
                    setEmail("user@example.com");
                  }}
                >
                  Reset
                </Button>
                <Button 
                  onClick={saveSettings} 
                  disabled={isSaving}
                  className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4 mt-4">
            <Card className="bg-black/80 backdrop-blur-lg border-slate-800">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and privacy preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Switch
                      checked={twoFactorEnabled}
                      onCheckedChange={setTwoFactorEnabled}
                    />
                    <Badge variant={twoFactorEnabled ? "default" : "outline"} className={`ml-2 ${twoFactorEnabled ? "bg-green-600" : ""}`}>
                      {twoFactorEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto-Lock Wallet</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically lock your wallet after a period of inactivity
                    </p>
                  </div>
                  <Switch
                    checked={passwordAutoLock}
                    onCheckedChange={setPasswordAutoLock}
                  />
                </div>
                
                {passwordAutoLock && (
                  <div className="space-y-3 pl-6 border-l-2 border-slate-800">
                    <Label className="text-sm">Session Timeout (minutes)</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        min={5}
                        max={60}
                        step={5}
                        value={[sessionTimeout]}
                        onValueChange={(values) => setSessionTimeout(values[0])}
                        className="w-[200px]"
                      />
                      <span className="w-12 text-center">{sessionTimeout}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Biometric Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Use fingerprint or face recognition to unlock your wallet
                    </p>
                  </div>
                  <Switch
                    checked={biometricsEnabled}
                    onCheckedChange={setBiometricsEnabled}
                  />
                </div>
                
                <div className="pt-2">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Reset security settings",
                        description: "Please confirm this action in your email",
                      });
                    }}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Reset Security Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Display Settings */}
          <TabsContent value="display" className="space-y-4 mt-4">
            <Card className="bg-black/80 backdrop-blur-lg border-slate-800">
              <CardHeader>
                <CardTitle>Display Settings</CardTitle>
                <CardDescription>
                  Customize how the PVX platform looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Matrix Effect Intensity</Label>
                    <span className="text-sm">{matrixIntensity}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    value={[matrixIntensity]}
                    onValueChange={(values) => setMatrixIntensity(values[0])}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Adjust the visibility of the background matrix effect
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Display more information with reduced spacing
                    </p>
                  </div>
                  <Switch
                    checked={compactMode}
                    onCheckedChange={setCompactMode}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">High Contrast</Label>
                    <p className="text-sm text-muted-foreground">
                      Increase contrast for better readability
                    </p>
                  </div>
                  <Switch
                    checked={highContrastMode}
                    onCheckedChange={setHighContrastMode}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">UI Animations</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable interface animations
                    </p>
                  </div>
                  <Switch
                    checked={animationsEnabled}
                    onCheckedChange={setAnimationsEnabled}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label className="text-base">Theme Selection</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className={`h-20 flex flex-col bg-black ${
                        theme === "dark" ? "ring-2 ring-blue-500" : "opacity-70"
                      }`}
                      onClick={() => setTheme("dark")}
                    >
                      <span className="text-xs mb-2">Dark</span>
                      {theme === "dark" && <Check className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      variant="outline"
                      className={`h-20 flex flex-col bg-white text-black ${
                        theme === "light" ? "ring-2 ring-blue-500" : "opacity-70"
                      }`}
                      onClick={() => setTheme("light")}
                    >
                      <span className="text-xs mb-2">Light</span>
                      {theme === "light" && <Check className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      variant="outline"
                      className={`h-20 flex flex-col bg-gradient-to-br from-blue-900 to-purple-900 ${
                        theme === "cyberpunk" ? "ring-2 ring-blue-500" : "opacity-70"
                      }`}
                      onClick={() => setTheme("cyberpunk")}
                    >
                      <span className="text-xs mb-2">Cyberpunk</span>
                      {theme === "cyberpunk" && <Check className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={resetSettings}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset to Default
                </Button>
                <Button 
                  onClick={saveSettings}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AnimatedPageLayout>
  );
}