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
using System.Windows.Forms;
public static class TemHoaPrinter {
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
    public static void Run(byte[] bytes, string printer, double width, double height, bool color, int copies, double inkX, double inkY, double inkWidth, double inkHeight) {
        using(MemoryStream stream=new MemoryStream(bytes))
        using(Image image=Image.FromStream(stream))
        using(PrintDocument doc=new PrintDocument()) {
            doc.DocumentName="Tem Hoa Minh Dien";
            doc.PrinterSettings.PrinterName=printer;
            if(!doc.PrinterSettings.IsValid) throw new Exception("May in khong kha dung.");
            SetPaper(doc,width,height);
            doc.DefaultPageSettings.Color=color && doc.PrinterSettings.SupportsColor;
            doc.PrinterSettings.Copies=(short)Math.Max(1,Math.Min(99,copies));
            doc.PrintController=new StandardPrintController();
            doc.PrintPage+=(sender,e)=> {
                e.Graphics.PageUnit=GraphicsUnit.Inch;
                e.Graphics.TranslateTransform(-e.PageSettings.HardMarginX/100f,-e.PageSettings.HardMarginY/100f);
                e.Graphics.InterpolationMode=InterpolationMode.HighQualityBicubic;
                float pageW=(float)(width/2.54), pageH=(float)(height/2.54);
                // PrintableArea includes the driver's physical limits and landscape orientation.
                RectangleF printable=e.PageSettings.PrintableArea;
                const float guard=0.03f/2.54f; // 0.3 mm for edge interpolation / paper feed tolerance.
                float left=Math.Max(0,printable.Left/100f)+guard;
                float top=Math.Max(0,printable.Top/100f)+guard;
                float right=Math.Min(pageW,printable.Right/100f)-guard;
                float bottom=Math.Min(pageH,printable.Bottom/100f)-guard;
                if(right<=left || bottom<=top) throw new Exception("Vung in cua may in khong hop le.");
                RectangleF source=new RectangleF(0,0,image.Width,image.Height);
                if(inkWidth>0 && inkHeight>0) {
                    if(Double.IsNaN(inkX+inkY+inkWidth+inkHeight) || Double.IsInfinity(inkX+inkY+inkWidth+inkHeight) || inkX<0 || inkY<0 || inkX+inkWidth>image.Width || inkY+inkHeight>image.Height)
                        throw new Exception("Khung vien ban in khong hop le.");
                    source=new RectangleF((float)inkX,(float)inkY,(float)inkWidth,(float)inkHeight);
                }
                float x=source.X/image.Width*pageW, y=source.Y/image.Height*pageH;
                float w=source.Width/image.Width*pageW, h=source.Height/image.Height*pageH;
                float scale=Math.Min(1,Math.Min((right-left)/w,(bottom-top)/h));
                w*=scale; h*=scale;
                x=Math.Max(left,Math.Min(x,right-w)); y=Math.Max(top,Math.Min(y,bottom-h));
                // Move the intact outline instead of allowing the hardware clipping region to cut it.
                e.Graphics.DrawImage(image,new RectangleF(x,y,w,h),source,GraphicsUnit.Pixel);
                e.HasMorePages=false;
            };
            doc.Print();
        }
    }
}
'@
    [TemHoaPrinter]::Run($bytes,[string]$job.printer,$width,$height,[bool]$job.color,[int]$job.copies,[double]$job.ink.x,[double]$job.ink.y,[double]$job.ink.width,[double]$job.ink.height)
} catch {
    try { [System.Windows.Forms.MessageBox]::Show($_.Exception.Message,'Tem Hoa - In') | Out-Null } catch { Write-Error $_ }
} finally {
    if (Test-Path -LiteralPath $JobPath) { Remove-Item -LiteralPath $JobPath -Force }
}
