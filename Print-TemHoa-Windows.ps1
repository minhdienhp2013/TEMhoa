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
    public static void Run(byte[] bytes, string printer, double width, double height, bool color) {
        using(MemoryStream stream=new MemoryStream(bytes))
        using(Image image=Image.FromStream(stream))
        using(PrintDocument doc=new PrintDocument()) {
            doc.DocumentName="Tem Hoa Minh Dien";
            doc.PrinterSettings.PrinterName=printer;
            if(!doc.PrinterSettings.IsValid) throw new Exception("May in khong kha dung.");
            SetPaper(doc,width,height);
            doc.DefaultPageSettings.Color=color && doc.PrinterSettings.SupportsColor;
            using(PrintDialog dialog=new PrintDialog()) {
                dialog.Document=doc;
                dialog.UseEXDialog=true;
                dialog.AllowSomePages=false;
                dialog.AllowSelection=false;
                if(dialog.ShowDialog()!=DialogResult.OK) return;
            }
            SetPaper(doc,width,height);
            doc.PrintPage+=(sender,e)=> {
                e.Graphics.PageUnit=GraphicsUnit.Inch;
                e.Graphics.TranslateTransform(-e.PageSettings.HardMarginX/100f,-e.PageSettings.HardMarginY/100f);
                e.Graphics.InterpolationMode=InterpolationMode.HighQualityBicubic;
                e.Graphics.DrawImage(image,new RectangleF(0,0,(float)(width/2.54),(float)(height/2.54)));
                e.HasMorePages=false;
            };
            doc.Print();
        }
    }
}
'@
    [TemHoaPrinter]::Run($bytes,[string]$job.printer,$width,$height,[bool]$job.color)
} catch {
    try { [System.Windows.Forms.MessageBox]::Show($_.Exception.Message,'Tem Hoa - In') | Out-Null } catch { Write-Error $_ }
} finally {
    if (Test-Path -LiteralPath $JobPath) { Remove-Item -LiteralPath $JobPath -Force }
}
