import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { TrendAnalyticsResponse } from './api';
import { RobotoBase64 } from './fonts/roboto-base64';

interface PdfExportOptions {
  title?: string;
  subtitle?: string;
  filename?: string;
}

const COLORS = {
  primary: [59, 130, 246] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  gray: [107, 114, 128] as [number, number, number],
  dark: [31, 41, 55] as [number, number, number],
  light: [249, 250, 251] as [number, number, number],
};

// Helper functions for change percentage styling
const getChangeColor = (change: number | null) => {
  if (change === null) return COLORS.gray;
  if (change > 0) return COLORS.danger; // Red for increase
  if (change < 0) return COLORS.success; // Green for decrease
  return COLORS.gray;
};

const formatChangePercent = (change: number | null) => {
  if (change === null) return '-';
  const sign = change > 0 ? '+' : '';
  return `${sign}${change}%`;
};

export async function exportTrendsToPdf(
  data: TrendAnalyticsResponse,
  options: PdfExportOptions = {}
): Promise<void> {
  const {
    title = 'Trend Analizi Raporu',
    subtitle = `Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
    filename = `trend-analizi-${new Date().toISOString().split('T')[0]}.pdf`,
  } = options;

  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  // Add Roboto font with Turkish character support
  pdf.addFileToVFS('Roboto-Regular.ttf', RobotoBase64);
  pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'bold');
  pdf.setFont('Roboto');

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Helper functions
  const addHeader = () => {
    pdf.setFillColor(...COLORS.primary);
    pdf.rect(0, 0, pageWidth, 35, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont('Roboto', 'bold');
    pdf.text(title, margin, 20);

    pdf.setFontSize(10);
    pdf.setFont('Roboto', 'normal');
    pdf.text(subtitle, margin, 28);

    yPos = 45;
  };

  const addSectionTitle = (text: string) => {
    if (yPos > pageHeight - 40) {
      pdf.addPage();
      yPos = margin;
    }

    pdf.setFillColor(...COLORS.light);
    pdf.rect(margin, yPos - 5, pageWidth - margin * 2, 10, 'F');

    pdf.setTextColor(...COLORS.dark);
    pdf.setFontSize(14);
    pdf.setFont('Roboto', 'bold');
    pdf.text(text, margin + 3, yPos + 2);
    yPos += 15;
  };

  const addTable = (headers: string[], rows: (string | number)[][], changeColumnIndex?: number) => {
    autoTable(pdf, {
      startY: yPos,
      head: [headers],
      body: rows.map(row => row.map(cell => String(cell))),
      theme: 'striped',
      styles: {
        font: 'Roboto',
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        textColor: [31, 41, 55],
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: margin, right: margin },
      willDrawCell: (data: unknown) => {
        const cellData = data as {
          section: string;
          column: { index: number };
          cell: { raw: string | number | null };
        };
        if (
          changeColumnIndex !== undefined &&
          cellData.section === 'body' &&
          cellData.column.index === changeColumnIndex
        ) {
          const cellText = cellData.cell.raw;
          const change = parseFloat(
            String(cellText || '')
              .replace('%', '')
              .replace('+', '')
          );

          if (!isNaN(change)) {
            const color = getChangeColor(change);
            pdf.setTextColor(...color);
          }
        }
      },
    });

    // @ts-expect-error - jspdf-autotable adds lastAutoTable property
    yPos = pdf.lastAutoTable.finalY + 10;
  };

  const addStatBox = (
    label: string,
    value: string | number,
    color: [number, number, number] = COLORS.primary
  ) => {
    const boxWidth = 40;
    const boxHeight = 25;

    pdf.setFillColor(...color);
    pdf.roundedRect(margin + statBoxIndex * (boxWidth + 5), yPos, boxWidth, boxHeight, 3, 3, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('Roboto', 'normal');
    pdf.text(label, margin + statBoxIndex * (boxWidth + 5) + 3, yPos + 8);

    pdf.setFontSize(14);
    pdf.setFont('Roboto', 'bold');
    pdf.text(String(value), margin + statBoxIndex * (boxWidth + 5) + 3, yPos + 18);

    statBoxIndex++;
  };

  let statBoxIndex = 0;

  // Start building PDF
  addHeader();

  // Summary Statistics
  addSectionTitle('Özet İstatistikler');

  const totalTasks = data.yearly.reduce((sum, y) => sum + y.total, 0);
  const totalProjects = Math.max(...data.yearly.map(y => y.uniqueProjects));
  const avgMonthly =
    data.monthly.length > 0
      ? Math.round(data.monthly.reduce((sum, m) => sum + m.current.count, 0) / data.monthly.length)
      : 0;

  statBoxIndex = 0;
  addStatBox('Toplam Task', totalTasks, COLORS.primary);
  addStatBox('Proje Sayısı', totalProjects, COLORS.success);
  addStatBox('Aylık Ort.', avgMonthly, COLORS.warning);
  yPos += 35;

  // Yearly Summary
  addSectionTitle('Yıllık Özet');

  const yearlyHeaders = ['Yıl', 'Toplam Task', 'Proje Sayısı'];
  const yearlyRows = data.yearly.map(y => [y.year, y.total, y.uniqueProjects]);
  addTable(yearlyHeaders, yearlyRows);

  // Monthly Comparison
  addSectionTitle('Aylık Karşılaştırma (Son 12 Ay)');

  const monthlyHeaders = ['Dönem', 'Task', 'Günlük Ort.', 'Proje', 'Değişim'];
  const monthlyRows = data.monthly
    .slice(0, 12)
    .map(m => [
      m.current.period,
      m.current.count,
      m.current.dailyAverage,
      m.current.uniqueProjects,
      formatChangePercent(m.changePercent),
    ]);
  addTable(monthlyHeaders, monthlyRows, 4); // Change column is index 4

  // Weekly Summary
  addSectionTitle('Haftalık Özet (Son 8 Hafta)');

  const weeklyHeaders = ['Hafta', 'Task', 'Günlük Ort.', 'Proje', 'Değişim'];
  const weeklyRows = data.weekly
    .slice(0, 8)
    .map(w => [
      w.current.period,
      w.current.count,
      w.current.dailyAverage,
      w.current.uniqueProjects,
      formatChangePercent(w.changePercent),
    ]);
  addTable(weeklyHeaders, weeklyRows, 4); // Change column is index 4

  // Quarterly Summary
  if (data.quarterly.length > 0) {
    addSectionTitle('Çeyreklik Özet');

    const quarterlyHeaders = ['Dönem', 'Task Sayısı', 'Proje Sayısı'];
    const quarterlyRows = data.quarterly.map(q => [
      `${q.year} ${q.quarter}`,
      q.count,
      q.uniqueProjects,
    ]);
    addTable(quarterlyHeaders, quarterlyRows);
  }

  // Year-over-Year Comparison
  if (data.yearOverYear.monthComparisons.length > 0) {
    addSectionTitle('Yıl Bazlı Karşılaştırma');

    const years = [
      ...new Set(data.yearOverYear.monthComparisons.flatMap(m => m.years.map(y => y.year))),
    ].sort();
    const yoyHeaders = ['Ay', ...years.flatMap(y => [`${y} Task`, `${y} Proje`])];
    const yoyRows = data.yearOverYear.monthComparisons.map(m => {
      const row: (string | number)[] = [m.month];
      years.forEach(year => {
        const yearData = m.years.find(y => y.year === year);
        row.push(yearData?.count || '-');
        row.push(yearData?.uniqueProjects || '-');
      });
      return row;
    });

    addTable(yoyHeaders, yoyRows);
  }

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.gray);
    pdf.setFont('Roboto', 'normal');
    pdf.text(`Sayfa ${i} / ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
    pdf.text('AI Task Planner - Trend Analizi Raporu', margin, pageHeight - 10);
  }

  // Save PDF
  pdf.save(filename);
}

export async function exportTaskAnalyticsToPdf(
  data: {
    bucketDistribution: {
      solvedInComponent: { count: number; percent: number };
      solvedInProject: { count: number; percent: number };
      declined: { count: number; percent: number };
      design: { count: number; percent: number };
      other: { count: number; percent: number };
      none: { count: number; percent: number };
      total: number;
    };
    resolutionTime: {
      avgDays: number;
      minDays: number;
      maxDays: number;
      medianDays: number;
      totalResolved: number;
    };
    resolutionBySeverity: Array<{ severity: string; avgDays: number; count: number }>;
    resolutionByProject: Array<{ project: string; avgDays: number; count: number }>;
    monthlyOpenedClosed: Array<{
      month: string;
      year: number;
      opened: number;
      closed: number;
      netChange: number;
    }>;
  },
  options: PdfExportOptions = {}
): Promise<void> {
  const {
    title = 'Task Analizi Raporu',
    subtitle = `Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
    filename = `task-analizi-${new Date().toISOString().split('T')[0]}.pdf`,
  } = options;

  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  pdf.addFileToVFS('Roboto-Regular.ttf', RobotoBase64);
  pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'bold');
  pdf.setFont('Roboto');

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  const addHeader = () => {
    pdf.setFillColor(...COLORS.primary);
    pdf.rect(0, 0, pageWidth, 35, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont('Roboto', 'bold');
    pdf.text(title, margin, 20);

    pdf.setFontSize(10);
    pdf.setFont('Roboto', 'normal');
    pdf.text(subtitle, margin, 28);

    yPos = 45;
  };

  const addSectionTitle = (text: string) => {
    if (yPos > pageHeight - 40) {
      pdf.addPage();
      yPos = margin;
    }

    pdf.setFillColor(...COLORS.light);
    pdf.rect(margin, yPos - 5, pageWidth - margin * 2, 10, 'F');

    pdf.setTextColor(...COLORS.dark);
    pdf.setFontSize(14);
    pdf.setFont('Roboto', 'bold');
    pdf.text(text, margin + 3, yPos + 2);
    yPos += 15;
  };

  const addTable = (headers: string[], rows: (string | number)[][]) => {
    autoTable(pdf, {
      startY: yPos,
      head: [headers],
      body: rows.map(row => row.map(cell => String(cell))),
      theme: 'striped',
      styles: {
        font: 'Roboto',
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        textColor: [31, 41, 55],
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: margin, right: margin },
    });

    // @ts-expect-error - jspdf-autotable adds lastAutoTable property
    yPos = pdf.lastAutoTable.finalY + 10;
  };

  const addStatBox = (
    label: string,
    value: string | number,
    color: [number, number, number] = COLORS.primary,
    index: number
  ) => {
    const boxWidth = 40;
    const boxHeight = 25;

    pdf.setFillColor(...color);
    pdf.roundedRect(margin + index * (boxWidth + 5), yPos, boxWidth, boxHeight, 3, 3, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('Roboto', 'normal');
    pdf.text(label, margin + index * (boxWidth + 5) + 3, yPos + 8);

    pdf.setFontSize(14);
    pdf.setFont('Roboto', 'bold');
    pdf.text(String(value), margin + index * (boxWidth + 5) + 3, yPos + 18);
  };

  addHeader();

  // Bucket Distribution
  addSectionTitle('Bucket Dağılımı');

  const bucketHeaders = ['Kategori', 'Sayı', 'Yüzde'];
  const bucketRows = [
    [
      'Componentte Çözülen',
      data.bucketDistribution.solvedInComponent.count,
      `${data.bucketDistribution.solvedInComponent.percent}%`,
    ],
    [
      'Projede Çözülen',
      data.bucketDistribution.solvedInProject.count,
      `${data.bucketDistribution.solvedInProject.percent}%`,
    ],
    ['Tasarım', data.bucketDistribution.design.count, `${data.bucketDistribution.design.percent}%`],
    [
      'Declined',
      data.bucketDistribution.declined.count,
      `${data.bucketDistribution.declined.percent}%`,
    ],
    ['Diğer', data.bucketDistribution.other.count, `${data.bucketDistribution.other.percent}%`],
    ['Belirsiz', data.bucketDistribution.none.count, `${data.bucketDistribution.none.percent}%`],
    ['TOPLAM', data.bucketDistribution.total, '100%'],
  ];
  addTable(bucketHeaders, bucketRows);

  // Resolution Time Stats
  addSectionTitle('Çözüm Süresi İstatistikleri');

  pdf.setTextColor(...COLORS.gray);
  pdf.setFontSize(9);
  pdf.setFont('Roboto', 'normal');
  pdf.text(`${data.resolutionTime.totalResolved} task analiz edildi`, margin, yPos);
  yPos += 10;

  addStatBox('Ortalama', `${data.resolutionTime.avgDays} gün`, COLORS.primary, 0);
  addStatBox('Minimum', `${data.resolutionTime.minDays} gün`, COLORS.success, 1);
  addStatBox('Maksimum', `${data.resolutionTime.maxDays} gün`, COLORS.danger, 2);
  addStatBox('Medyan', `${data.resolutionTime.medianDays} gün`, COLORS.warning, 3);
  yPos += 35;

  // Resolution by Severity
  addSectionTitle('Severity Bazında Çözüm Süresi');

  const severityHeaders = ['Severity', 'Ortalama Süre (gün)', 'Çözülen Task'];
  const severityRows = data.resolutionBySeverity.map(s => [s.severity, s.avgDays, s.count]);
  addTable(severityHeaders, severityRows);

  // Resolution by Project
  addSectionTitle('Proje Bazında Çözüm Süresi (Top 10)');

  const projectHeaders = ['Proje', 'Ortalama Süre (gün)', 'Çözülen Task'];
  const projectRows = data.resolutionByProject.map(p => [p.project, p.avgDays, p.count]);
  addTable(projectHeaders, projectRows);

  // Monthly Opened vs Closed
  addSectionTitle('Aylık Açılan vs Kapanan Tasklar');

  const monthlyHeaders = ['Dönem', 'Açılan', 'Kapanan', 'Net Değişim'];
  const monthlyRows = data.monthlyOpenedClosed
    .slice(-12)
    .reverse()
    .map(m => [
      `${m.month} ${m.year}`,
      m.opened,
      m.closed,
      m.netChange > 0 ? `+${m.netChange}` : m.netChange,
    ]);
  addTable(monthlyHeaders, monthlyRows);

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.gray);
    pdf.setFont('Roboto', 'normal');
    pdf.text(`Sayfa ${i} / ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
    pdf.text('AI Task Planner - Task Analizi Raporu', margin, pageHeight - 10);
  }

  pdf.save(filename);
}

export async function exportElementToPdf(
  elementId: string,
  filename: string = 'export.pdf'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 10;

  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}
