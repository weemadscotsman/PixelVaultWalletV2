import { useState, useRef } from "react";
import { Copy, QrCode, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";

export function ReceiveAddressCard() {
  const { activeWallet, wallet } = useWallet();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // Copy wallet address to clipboard
  const copyToClipboard = () => {
    if (!wallet?.address) return;
    
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    });
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  // Generate QR code data
  const qrCodeData = wallet?.address ? `PVX:${wallet.address}` : "";
  
  // QR code reference for download
  const qrCodeRef = useRef<HTMLDivElement>(null);
  
  // Download QR code
  const downloadQRCode = () => {
    if (!qrCodeRef.current || !wallet?.address) return;
    
    const svgElement = qrCodeRef.current.querySelector('svg');
    if (!svgElement) return;
    
    // Create a canvas and draw the SVG on it
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    
    canvas.width = 300;
    canvas.height = 300;
    
    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `pvx-wallet-qr-${wallet.address.substring(4, 12)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "QR code downloaded",
        description: "QR code image has been downloaded",
      });
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Card className="bg-black/70 border-blue-900/50 w-full">
      <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
        <CardTitle className="text-blue-300 flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Receive PVX
        </CardTitle>
        <CardDescription className="text-gray-400">
          Share your wallet address to receive PVX tokens
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        {!activeWallet ? (
          <div className="text-center py-6">
            <p className="text-gray-400">Connect or create a wallet first</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-md" ref={qrCodeRef}>
                {/* QR Code */}
                <QRCodeSVG 
                  value={qrCodeData}
                  size={192}
                  bgColor={"#FFFFFF"}
                  fgColor={"#000000"}
                  level={"H"}
                  includeMargin={true}
                />
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-400 mb-2">Your Wallet Address</p>
              <div className="bg-gray-900/50 p-3 rounded font-mono text-xs text-blue-300 break-all border border-blue-900/30">
                {wallet?.address || "Loading..."}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={copyToClipboard}
                data-testid="receive-button"
                className="flex-1 border-blue-900/50 text-blue-300"
                variant="outline"
              >
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copied!" : "Copy Address"}
              </Button>
              
              <Button 
                onClick={downloadQRCode}
                className="flex-1 bg-blue-700 hover:bg-blue-600 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Download QR
              </Button>
            </div>
            
            <div className="text-center text-xs text-gray-500">
              <p>Only send PVX tokens to this address</p>
              <p>Sending other tokens may result in permanent loss</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}