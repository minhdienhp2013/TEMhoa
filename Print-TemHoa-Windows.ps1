param([Parameter(Mandatory=$true)][string]$JobPath)
$ErrorActionPreference = 'Stop'
try {
    Add-Type -AssemblyName System.Drawing
    Add-Type -AssemblyName System.Windows.Forms
    $job = [System.IO.File]::ReadAllText($JobPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $width = [double]$job.widthCm; $height = [double]$job.heightCm
    if ($width -le 0 -or $height -le 0 -or $width -gt 42 -or $height -gt 42) { throw 'Invalid paper size.' }
    $bytes = [Convert]::FromBase64String([string]$job.png)
    if ($bytes.Length -gt 50000000) { throw 'Print image too large.' }
    Add-Type -ReferencedAssemblies System.Drawing,System.Windows.Forms -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Printing;
using System.IO;
using System.Runtime.InteropServices;
public static class TemHoaPrinter {
    public static float SafeTop=1f/25.4f, SafeRight=1f/25.4f, SafeBottom=.3f/25.4f, SafeLeft=.3f/25.4f;
    [DllImport("winspool.drv", EntryPoint="OpenPrinterW", CharSet=CharSet.Unicode, SetLastError=true)]
    private static extern bool OpenPrinter(string name,out IntPtr printer,IntPtr defaults);
    [DllImport("winspool.drv", SetLastError=true)] private static extern bool ClosePrinter(IntPtr printer);
    [DllImport("winspool.drv", EntryPoint="DocumentPropertiesW", CharSet=CharSet.Unicode)]
    private static extern int DocumentProperties(IntPtr window,IntPtr printer,string name,IntPtr output,IntPtr input,int mode);
    [DllImport("kernel32.dll")] private static extern IntPtr GlobalAlloc(uint flags,UIntPtr bytes);
    [DllImport("kernel32.dll")] private static extern IntPtr GlobalLock(IntPtr memory);
    [DllImport("kernel32.dll")] private static extern bool GlobalUnlock(IntPtr memory);
    [DllImport("kernel32.dll")] private static extern IntPtr GlobalFree(IntPtr memory);
    [DllImport("gdi32.dll")] private static extern int GetDeviceCaps(IntPtr dc,int index);
    private static void LoadDriverSettings(PrintDocument doc,string name) {
        IntPtr printer;
        if(!OpenPrinter(name,out printer,IntPtr.Zero)) throw new Exception("Khong doc duoc cau hinh may in.");
        IntPtr memory=IntPtr.Zero;
        try {
            int size=DocumentProperties(IntPtr.Zero,printer,name,IntPtr.Zero,IntPtr.Zero,0);
            if(size<=0) throw new Exception("Driver khong cung cap cau hinh in.");
            memory=GlobalAlloc(0x42,(UIntPtr)(uint)size);
            if(memory==IntPtr.Zero) throw new OutOfMemoryException();
            IntPtr data=GlobalLock(memory);
            if(data==IntPtr.Zero) throw new Exception("Khong doc duoc bo nho cau hinh in.");
            int result;
            try { result=DocumentProperties(IntPtr.Zero,printer,name,data,IntPtr.Zero,2); }
            finally { GlobalUnlock(memory); }
            if(result!=1) throw new Exception("Khong tai duoc thiet lap driver.");
            // Preserve the complete private driver data: Canon Borderless, extension, media and quality.
            doc.PrinterSettings.SetHdevmode(memory);
            doc.DefaultPageSettings=doc.PrinterSettings.DefaultPageSettings;
            doc.DefaultPageSettings.SetHdevmode(memory);
        } finally { if(memory!=IntPtr.Zero) GlobalFree(memory); ClosePrinter(printer); }
    }
    private static void ValidateDriverSettings(PrintDocument doc,string name) {
        IntPtr printer;
        if(!OpenPrinter(name,out printer,IntPtr.Zero)) throw new Exception("Khong truy cap duoc driver.");
        IntPtr memory=IntPtr.Zero;
        try {
            memory=doc.PrinterSettings.GetHdevmode(doc.DefaultPageSettings);
            IntPtr data=GlobalLock(memory);
            if(data==IntPtr.Zero) throw new Exception("Cau hinh in khong hop le.");
            int result;
            // Let the driver reconcile public paper/orientation fields with its private Borderless settings.
            try { result=DocumentProperties(IntPtr.Zero,printer,name,data,data,10); }
            finally { GlobalUnlock(memory); }
            if(result!=1) throw new Exception("Driver tu choi cau hinh kho giay.");
            doc.PrinterSettings.SetHdevmode(memory);
            doc.DefaultPageSettings.SetHdevmode(memory);
        } finally { if(memory!=IntPtr.Zero) GlobalFree(memory); ClosePrinter(printer); }
    }
    public static float[] CalculatePlacement(float pageW,float pageH,int dpiX,int dpiY,int offsetX,int offsetY,int printableW,int printableH,float imageW,float imageH,float inkX,float inkY,float inkW,float inkH) {
        if(dpiX<=0 || dpiY<=0 || printableW<=0 || printableH<=0) throw new Exception("Driver bao vung in khong hop le.");
        float left=Math.Max(0,(float)offsetX/dpiX)+SafeLeft,top=Math.Max(0,(float)offsetY/dpiY)+SafeTop;
        float right=Math.Min(pageW,(float)(offsetX+printableW)/dpiX)-SafeRight,bottom=Math.Min(pageH,(float)(offsetY+printableH)/dpiY)-SafeBottom;
        if(right<=left || bottom<=top) throw new Exception("Vung in khong du cho tem.");
        float x=inkX/imageW*pageW,y=inkY/imageH*pageH,w=inkW/imageW*pageW,h=inkH/imageH*pageH;
        float scale=Math.Min(1,Math.Min((right-left)/w,(bottom-top)/h));w*=scale;h*=scale;
        x=Math.Max(left,Math.Min(x,right-w));y=Math.Max(top,Math.Min(y,bottom-h));
        // Returned coordinates are relative to the actual HDC origin, not portrait HardMargin values.
        return new float[]{x-(float)offsetX/dpiX,y-(float)offsetY/dpiY,w,h,scale};
    }
    private static void SetPaper(PrintDocument doc, double width, double height) {
        bool landscape = width > height;
        int pw = (int)Math.Round(Math.Min(width,height) / 2.54 * 100);
        int ph = (int)Math.Round(Math.Max(width,height) / 2.54 * 100);
        PaperSize chosen = null;
        // Keep a matching driver paper (including its borderless variant).
        PaperSize current = doc.DefaultPageSettings.PaperSize;
        if (Math.Abs(current.Width-pw)<=2 && Math.Abs(current.Height-ph)<=2) chosen=current;
        if (chosen==null) foreach(PaperSize paper in doc.PrinterSettings.PaperSizes) {
            if(Math.Abs(paper.Width-pw)<=2 && Math.Abs(paper.Height-ph)<=2) { chosen=paper; break; }
        }
        if(chosen==null) chosen=new PaperSize("Tem Hoa",pw,ph);
        doc.DefaultPageSettings.PaperSize=chosen;
        doc.DefaultPageSettings.Landscape=landscape;
        doc.DefaultPageSettings.Margins=new Margins(0,0,0,0);
        doc.OriginAtMargins=false;
    }
    public static void Run(byte[] bytes, string printer, double width, double height, bool color, int copies, double inkX, double inkY, double inkWidth, double inkHeight, float topMm, float rightMm, float bottomMm, float leftMm) {
        SafeTop=topMm/25.4f; SafeRight=rightMm/25.4f; SafeBottom=bottomMm/25.4f; SafeLeft=leftMm/25.4f;
        using(MemoryStream stream=new MemoryStream(bytes))
        using(Image image=Image.FromStream(stream))
        using(PrintDocument doc=new PrintDocument()) {
            doc.DocumentName="Tem Hoa Minh Dien";
            doc.PrinterSettings.PrinterName=printer;
            if(!doc.PrinterSettings.IsValid) throw new Exception("May in khong kha dung.");
            LoadDriverSettings(doc,printer);
            SetPaper(doc,width,height);
            doc.DefaultPageSettings.Color=color && doc.PrinterSettings.SupportsColor;
            doc.PrinterSettings.Copies=(short)Math.Max(1,Math.Min(99,copies));
            ValidateDriverSettings(doc,printer);
            doc.PrintController=new StandardPrintController();
            doc.PrintPage+=(sender,e)=> {
                // Query the live landscape/portrait print DC after the Canon driver has applied DEVMODE.
                // HardMarginX/Y can describe a different coordinate frame; do not subtract them again.
                int dpiX,dpiY,offsetX,offsetY,printableW,printableH;
                IntPtr dc=e.Graphics.GetHdc();
                try {
                    dpiX=GetDeviceCaps(dc,88); dpiY=GetDeviceCaps(dc,90);
                    offsetX=GetDeviceCaps(dc,112); offsetY=GetDeviceCaps(dc,113);
                    printableW=GetDeviceCaps(dc,8); printableH=GetDeviceCaps(dc,10);
                } finally { e.Graphics.ReleaseHdc(dc); }
                e.Graphics.ResetTransform();
                e.Graphics.PageUnit=GraphicsUnit.Inch;
                e.Graphics.PageScale=1;
                e.Graphics.InterpolationMode=InterpolationMode.HighQualityBicubic;
                float pageW=(float)(width/2.54), pageH=(float)(height/2.54);
                RectangleF source=new RectangleF(0,0,image.Width,image.Height);
                if(inkWidth>0 && inkHeight>0) {
                    if(Double.IsNaN(inkX+inkY+inkWidth+inkHeight) || Double.IsInfinity(inkX+inkY+inkWidth+inkHeight) || inkX<0 || inkY<0 || inkX+inkWidth>image.Width || inkY+inkHeight>image.Height)
                        throw new Exception("Khung vien ban in khong hop le.");
                    source=new RectangleF((float)inkX,(float)inkY,(float)inkWidth,(float)inkHeight);
                }
                float[] placement=CalculatePlacement(pageW,pageH,dpiX,dpiY,offsetX,offsetY,printableW,printableH,image.Width,image.Height,source.X,source.Y,source.Width,source.Height);
                // Clamp sampling at the bitmap boundary so interpolation cannot erase the outer outline.
                using(System.Drawing.Imaging.ImageAttributes attributes=new System.Drawing.Imaging.ImageAttributes()) {
                    attributes.SetWrapMode(WrapMode.TileFlipXY);
                    RectangleF target=new RectangleF(placement[0],placement[1],placement[2],placement[3]);
                    PointF[] corners={new PointF(target.Left,target.Top),new PointF(target.Right,target.Top),new PointF(target.Left,target.Bottom)};
                    e.Graphics.DrawImage(image,corners,source,GraphicsUnit.Pixel,attributes);
                }
                e.HasMorePages=false;
            };
            doc.Print();
        }
    }
}
'@
    $safeEdges = @{ top = 1.0; right = 1.0; bottom = 0.3; left = 0.3 }
    foreach ($side in @('top','right','bottom','left')) {
        if ($null -ne $job.edges.$side) {
            $value = [double]$job.edges.$side
            if ([double]::IsNaN($value) -or [double]::IsInfinity($value) -or $value -lt 0 -or $value -gt 10) { throw 'Invalid print edge protection (0-10 mm).' }
            $safeEdges[$side] = $value
        }
    }
    [TemHoaPrinter]::Run($bytes,[string]$job.printer,$width,$height,[bool]$job.color,[int]$job.copies,[double]$job.ink.x,[double]$job.ink.y,[double]$job.ink.width,[double]$job.ink.height,[float]$safeEdges.top,[float]$safeEdges.right,[float]$safeEdges.bottom,[float]$safeEdges.left)
} catch {
    try { [System.Windows.Forms.MessageBox]::Show($_.Exception.Message,'Tem Hoa - In') | Out-Null } catch { Write-Error $_ }
} finally {
    if (Test-Path -LiteralPath $JobPath) { Remove-Item -LiteralPath $JobPath -Force }
}
