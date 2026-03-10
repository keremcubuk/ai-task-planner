export interface ParsedCategory {
  name: string;
  score: number;
  maxScore: number;
  status: string;
}

export interface ParsedCriticalIssue {
  title: string;
  severity: string;
  pointImpact: string;
  description: string;
}

export interface ParsedStrength {
  title: string;
  description: string;
}

export interface ParsedClosedIssue {
  number: number;
  rule: string;
  severity: string;
  description: string;
  status: string;
}

export interface ParsedRemainingIssue {
  number: number;
  title: string;
  rule: string;
  severity: string;
  pointImpact: string;
  description: string;
  solution: string;
}

export interface ParsedReviewScore {
  projectName: string;
  reportDate: string;
  reviewStandard: string;
  overallScore: number;
  maxScore: number;
  previousScore: number | null;
  status: string;
  statusEmoji: string;
  categories: ParsedCategory[];
  criticalIssues: ParsedCriticalIssue[];
  strengths: ParsedStrength[];
  closedIssues: ParsedClosedIssue[];
  remainingIssues: ParsedRemainingIssue[];
}

export function parseReviewMarkdown(markdown: string): ParsedReviewScore {
  const result: ParsedReviewScore = {
    projectName: '',
    reportDate: '',
    reviewStandard: '',
    overallScore: 0,
    maxScore: 100,
    previousScore: null,
    status: '',
    statusEmoji: '',
    categories: [],
    criticalIssues: [],
    strengths: [],
    closedIssues: [],
    remainingIssues: [],
  };

  // Extract project name: **Proje:** X
  const projectMatch = markdown.match(/\*\*Proje:\*\*\s*(.+)/);
  if (projectMatch) {
    result.projectName = projectMatch[1].trim();
  }

  // Extract date: **Tarih:** X
  const dateMatch = markdown.match(/\*\*Tarih:\*\*\s*(.+)/);
  if (dateMatch) {
    result.reportDate = dateMatch[1].trim();
  }

  // Extract review standard: **Review Standart:** X
  const standardMatch = markdown.match(
    /\*\*Review Standart:\*\*\s*(.+)/,
  );
  if (standardMatch) {
    result.reviewStandard = standardMatch[1].trim();
  }

  // Extract previous score: **Önceki Puan:** 76 / 100
  const prevScoreMatch = markdown.match(
    /\*\*Önceki Puan:\*\*\s*(\d+)\s*\/\s*\d+/,
  );
  if (prevScoreMatch) {
    result.previousScore = parseInt(prevScoreMatch[1], 10);
  }

  // Extract overall score: **63/100** or ## 91 / 100 — 🟢 Mükemmel
  const scoreMatch = markdown.match(/\*\*(\d+)\/(\d+)\*\*/);
  if (scoreMatch) {
    result.overallScore = parseInt(scoreMatch[1], 10);
    result.maxScore = parseInt(scoreMatch[2], 10);
  } else {
    // Alternative format: ## 91 / 100 — 🟢 Mükemmel
    const altScoreMatch = markdown.match(/##\s*(\d+)\s*\/\s*(\d+)\s*[—-]\s*([🔴🟡🟢⚠️✅])\s*(.+)/u);
    if (altScoreMatch) {
      result.overallScore = parseInt(altScoreMatch[1], 10);
      result.maxScore = parseInt(altScoreMatch[2], 10);
      result.statusEmoji = altScoreMatch[3].trim();
      result.status = altScoreMatch[4].trim();
    }
  }

  // Extract status: **Durum:** 🟡 İyileştirme Gerekli
  const statusMatch = markdown.match(/\*\*Durum:\*\*\s*([🔴🟡🟢⚠️✅])\s*(.+)/u);
  if (statusMatch) {
    result.statusEmoji = statusMatch[1].trim();
    result.status = statusMatch[2].trim();
  }

  // Extract categories from "Puan Dağılımı" table
  const categoryTableRegex =
    /## 📈 Puan Dağılımı[\s\S]*?\|[-\s|]+\|([\s\S]*?)(?=\n---|\n## )/;
  const categoryTableMatch = markdown.match(categoryTableRegex);
  if (categoryTableMatch) {
    const rows = categoryTableMatch[1].trim().split('\n').filter((r) => r.includes('|'));
    for (const row of rows) {
      const cols = row.split('|').map((c) => c.trim()).filter((c) => c.length > 0);
      
      // New format: | Kategori | Max | Önceki | Kesinti | Alınan | Durum |
      if (cols.length >= 6) {
        const name = cols[0].replace(/\*\*/g, '').trim();
        const maxScore = parseInt(cols[1], 10);
        const score = parseInt(cols[4], 10); // "Alınan" column
        const status = cols[5].trim();
        
        if (!isNaN(maxScore) && !isNaN(score)) {
          result.categories.push({
            name,
            score,
            maxScore,
            status,
          });
        }
      }
      // Old format: | Kategori | Score/Max | Status |
      else if (cols.length >= 3) {
        const name = cols[0].replace(/\*\*/g, '').trim();
        const scoreStr = cols[1].trim();
        const statusStr = cols[2].trim();

        const scoreParts = scoreStr.match(/(\d+)\/(\d+)/);
        if (scoreParts) {
          result.categories.push({
            name,
            score: parseInt(scoreParts[1], 10),
            maxScore: parseInt(scoreParts[2], 10),
            status: statusStr,
          });
        }
      }
    }
  }

  // Extract critical issues from "EN KRİTİK 3 SORUN" section
  const criticalSection = markdown.match(
    /## 🔴 EN KRİTİK \d+ SORUN([\s\S]*?)(?=\n## ✅|$)/,
  );
  if (criticalSection) {
    const issueBlocks = criticalSection[1].split(/### \d+\.\s+/).filter(Boolean);
    for (const block of issueBlocks) {
      const titleMatch = block.match(/^(.+?)(?:\n|$)/);
      const severityMatch = block.match(
        /\*\*Severity:\*\*\s*([\u{1F000}-\u{1FFFF}]|[🔴⚠️🟡])\s*(\w+)/u,
      );
      const pointMatch = block.match(/\*\*Puan Etkisi:\*\*\s*(.+)/);

      // Get description from "Sorun Kaynağı" section
      const descMatch = block.match(
        /\*\*Sorun Kaynağı:\*\*\s*\n([\s\S]*?)(?=\n\*\*Sorunun Yaşandığı|$)/,
      );

      result.criticalIssues.push({
        title: titleMatch ? titleMatch[1].trim() : '',
        severity: severityMatch
          ? `${severityMatch[1]} ${severityMatch[2]}`
          : '',
        pointImpact: pointMatch ? pointMatch[1].trim() : '',
        description: descMatch ? descMatch[1].trim() : '',
      });
    }
  }

  // Extract strengths from "PROJENİN GÜÇLÜ YÖNLERİ" section
  const strengthsSection = markdown.match(
    /## ✅ PROJENİN GÜÇLÜ YÖNLERİ([\s\S]*?)(?=\n---|\n## 📊)/,
  );
  if (strengthsSection) {
    const strengthBlocks = strengthsSection[1]
      .split(/### \d+\.\s+/)
      .filter(Boolean);
    for (const block of strengthBlocks) {
      const titleMatch = block.match(/^(.+?)(?:\n|$)/);
      const lines = block.split('\n').filter((l) => l.startsWith('- '));
      const description = lines.map((l) => l.replace(/^- /, '').trim()).join('; ');

      result.strengths.push({
        title: titleMatch
          ? titleMatch[1].replace(/[✅]/g, '').trim()
          : '',
        description,
      });
    }
  }

  // Extract closed issues from "ÖNCEKİ DÖNEMDEN KAPANAN SORUNLAR" section
  const closedSection = markdown.match(
    /## 🏆 ÖNCEKİ DÖNEMDEN KAPANAN SORUNLAR[\s\S]*?\|[\s-|]+\|([\s\S]*?)(?=\n---)/,
  );
  if (closedSection) {
    const rows = closedSection[1].trim().split('\n').filter((r) => r.includes('|'));
    for (const row of rows) {
      // Split by | and filter empty parts
      const cols = row.split('|').map((c) => c.trim()).filter((c) => c.length > 0);
      if (cols.length >= 4) {
        const numMatch = cols[0].match(/\d+/);
        const ruleMatch = cols[1].match(/`([^`]+)`/);
        const severityMatch = cols[1].match(/(🔴|⚠️|🟡|🔵)\s*(\w+)/u);
        result.closedIssues.push({
          number: numMatch ? parseInt(numMatch[0], 10) : 0,
          rule: ruleMatch ? ruleMatch[1] : '',
          severity: severityMatch ? `${severityMatch[1]} ${severityMatch[2]}` : '',
          description: cols[2].trim(),
          status: cols[3].trim(),
        });
      }
    }
  }

  // Extract remaining issues from "KALAN SORUNLAR" section
  const remainingSection = markdown.match(
    /## 🔴 KALAN SORUNLAR([\s\S]*?)(?=\n## ✅|\n## 📊|$)/,
  );
  if (remainingSection) {
    const issueBlocks = remainingSection[1].split(/### \d+\.\s+/).filter(Boolean);
    let issueNum = 0;
    for (const block of issueBlocks) {
      issueNum++;
      // Title line: "Dependency Güvenlik Açıkları — `dep-001`, `dep-002` · ⚠️ High (-4 puan)"
      const titleLine = block.split('\n')[0] || '';
      const titleMatch = titleLine.match(/^([^—]+)/);
      const ruleMatch = titleLine.match(/`([^`]+)`/g);
      const severityMatch = titleLine.match(/(🔴|⚠️|🟡|🔵)\s*(\w+)/u);
      const pointMatch = titleLine.match(/\(([^)]*puan[^)]*)\)/i);

      // Get description from "Sorun Kaynağı:" section
      const descMatch = block.match(
        /\*\*Sorun Kaynağı:\*\*\s*\n([\s\S]*?)(?=\n\*\*Çözüm|\n---|$)/,
      );

      // Get solution from "Çözüm Önerisi/Önerileri:" section
      const solMatch = block.match(
        /\*\*Çözüm Öneri(?:si|leri):\*\*\s*\n([\s\S]*?)(?=\n---|\n###|$)/,
      );

      result.remainingIssues.push({
        number: issueNum,
        title: titleMatch ? titleMatch[1].trim() : '',
        rule: ruleMatch ? ruleMatch.map((r) => r.replace(/`/g, '')).join(', ') : '',
        severity: severityMatch ? `${severityMatch[1]} ${severityMatch[2]}` : '',
        pointImpact: pointMatch ? pointMatch[1].trim() : '',
        description: descMatch ? descMatch[1].trim() : '',
        solution: solMatch ? solMatch[1].trim() : '',
      });
    }
  }

  return result;
}

/**
 * Determines the status category based on score
 */
export function getScoreStatus(score: number): string {
  if (score >= 85) return 'good';
  if (score >= 60) return 'warning';
  return 'critical';
}

/**
 * Parse Turkish date string like "26 Şubat 2026" to a Date object
 */
export function parseTurkishDate(dateStr: string): Date {
  const turkishMonths: Record<string, number> = {
    ocak: 0,
    şubat: 1,
    mart: 2,
    nisan: 3,
    mayıs: 4,
    haziran: 5,
    temmuz: 6,
    ağustos: 7,
    eylül: 8,
    ekim: 9,
    kasım: 10,
    aralık: 11,
  };

  const parts = dateStr.trim().split(/\s+/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = turkishMonths[parts[1].toLowerCase()];
    const year = parseInt(parts[2], 10);

    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  // Fallback: try native Date parsing
  const fallback = new Date(dateStr);
  if (!isNaN(fallback.getTime())) return fallback;

  return new Date();
}
