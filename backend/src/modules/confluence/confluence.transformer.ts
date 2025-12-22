/* eslint-disable prettier/prettier */
import * as crypto from 'crypto';

function generateUUID(): string {
  return crypto.randomUUID();
}

// Status mapping - Türkçe ve İngilizce destekli
const STATUS_MAP: Record<string, string> = {
  'incelenecek': 'open',
  'İncelenecek': 'open',
  'INCELENECEK': 'open',
  'planlandi': 'in_progress',
  'planlandı': 'in_progress',
  'PLANLANDI': 'in_progress',
  'inprogress': 'in_progress',
  'INPROGRESS': 'in_progress',
  'in progress': 'in_progress',
  'IN PROGRESS': 'in_progress',
  'test': 'in_progress',
  'TEST': 'in_progress',
  'done': 'done',
  'DONE': 'done',
  'tamamlandı': 'done',
  'TAMAMLANDI': 'done',
  'not done': 'open',
  'NOT DONE': 'open',
  'notdone': 'open',
  'NOTDONE': 'open',
  'open': 'open',
  'OPEN': 'open',
};

// Priority mapping
const PRIORITY_MAP: Record<string, string> = {
  'low': 'low',
  'LOW': 'low',
  'düşük': 'low',
  'DÜŞÜK': 'low',
  'medium': 'medium',
  'MEDIUM': 'medium',
  'orta': 'medium',
  'ORTA': 'medium',
  'high': 'high',
  'HIGH': 'high',
  'yüksek': 'high',
  'YÜKSEK': 'high',
  'important': 'high',
  'IMPORTANT': 'high',
  'critical': 'critical',
  'CRITICAL': 'critical',
};

export interface ConfluenceTableRow {
  [key: string]: string;
}

export interface TransformedTask {
  projectName: string;
  projectStatus: string;
  source: string;
  taskId: string;
  taskName: string;
  progress: string;
  assignedTo: string;
  priority: string;
  description: string;
  createdDate: string;
  dueDate: string;
}

export interface PageInfo {
  title: string;
  projectStatus: string;
}


function mapStatus(status: string): string {
  if (!status) return 'open';
  const mapped = STATUS_MAP[status] || STATUS_MAP[status.toLowerCase()];
  if (mapped) return mapped;
  
  const s = status.toLowerCase();
  if (s.includes('done') || s.includes('complete') || s.includes('tamamlan')) return 'done';
  if (s.includes('progress') || s.includes('devam') || s.includes('planlan')) return 'in_progress';
  return 'open';
}

function mapPriority(priority: string): string {
  if (!priority) return 'medium';
  const mapped = PRIORITY_MAP[priority] || PRIORITY_MAP[priority.toLowerCase()];
  if (mapped) return mapped;
  
  const p = priority.toLowerCase();
  if (p.includes('critical') || p.includes('kritik')) return 'critical';
  if (p.includes('high') || p.includes('yüksek')) return 'high';
  if (p.includes('low') || p.includes('düşük')) return 'low';
  return 'medium';
}

function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Clean the input
  const cleaned = dateStr.trim();
  if (!cleaned) return '';
  
  // Try various date formats
  const formats = [
    // DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
    /(\d{1,2})[./-](\d{1,2})[./-](\d{4})/,
    // YYYY-MM-DD
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
  ];
  
  for (const format of formats) {
    const match = cleaned.match(format);
    if (match) {
      try {
        let year, month, day;
        if (match[1].length === 4) {
          // YYYY-MM-DD format
          [, year, month, day] = match;
        } else {
          // DD.MM.YYYY format
          [, day, month, year] = match;
        }
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch {
        continue;
      }
    }
  }
  
  // If no pattern matched, return empty string to avoid invalid dates
  return '';
}

export function transformTableData(
  rows: ConfluenceTableRow[],
  pageInfo: PageInfo,
): TransformedTask[] {
  const tasks: TransformedTask[] = [];
  const seenRows = new Set<string>();
  
  // Debug: Log first row to see column structure
  if (rows.length > 0) {
    console.log('\n=== CONFLUENCE TABLE DEBUG ===');
    console.log('First row columns:', Object.keys(rows[0]));
    console.log('First row data:', rows[0]);
    console.log('==============================\n');
  }
  
  for (const row of rows) {
    // Skip empty rows
    const values = Object.values(row).filter(v => v?.trim());
    if (values.length === 0) continue;
    
    // Skip duplicate rows
    const rowKey = JSON.stringify(row);
    if (seenRows.has(rowKey)) continue;
    seenRows.add(rowKey);
    
    // Handle tables with empty first column (Column_0)
    // If Column_0 exists, shift all data: Column_0 -> Bulgu, Bulgu -> Statü, etc.
    let taskName = '';
    let status = '';
    let priority = '';
    let assignedTo = '';
    let createdDate = '';
    let dueDate = '';
    let notes = '';
    let ticketLink = '';
    let externalId = '';
    
    if (row['Column_0']) {
      // Table has empty first column, data is shifted right
      taskName = row['Column_0']?.trim() || '';
      status = row['Bulgu']?.trim() || '';
      assignedTo = row['Statü']?.trim() || '';
      priority = row['Sorumlu']?.trim() || '';
      notes = row['Öncelik']?.trim() || '';
      createdDate = row['Notlar']?.trim() || '';
      dueDate = row['Bulgu İletilme Tarihi']?.trim() || '';
      ticketLink = row['Hedef Tarih']?.trim() || '';
    } else {
      // Normal table structure
      taskName = row['Bulgu']?.trim() || '';
      status = row['Statü']?.trim() || '';
      priority = row['Öncelik']?.trim() || '';
      assignedTo = row['Sorumlu']?.trim() || '';
      createdDate = row['Bulgu İletilme Tarihi']?.trim() || '';
      dueDate = row['Hedef Tarih']?.trim() || '';
      notes = row['Notlar']?.trim() || '';
      ticketLink = row['Ticket Linki']?.trim() || '';
      externalId = row['No']?.trim() || row['#']?.trim() || row['ID']?.trim() || '';
    }
    
    // Combine notes and ticket link for description
    let description = notes;
    if (ticketLink) {
      description = description ? `${description}\n\nTicket: ${ticketLink}` : `Ticket: ${ticketLink}`;
    }
    
    console.log('Parsed row:', { taskName, status, priority, assignedTo, createdDate, dueDate, notes, ticketLink });
    
    tasks.push({
      projectName: pageInfo.title,
      projectStatus: pageInfo.projectStatus,
      source: 'confluence',
      taskId: externalId || generateUUID(),
      taskName,
      progress: mapStatus(status),
      assignedTo,
      priority: mapPriority(priority),
      description,
      createdDate: parseDate(createdDate),
      dueDate: parseDate(dueDate),
    });
  }
  
  return tasks;
}

export function extractProjectStatus(pageText: string): string {
  const patterns = [
    /proje\s*stat[üu]s[üu]?\s*[:|-]?\s*(done|in\s*progress|tamamlandı|devam\s*ediyor)/i,
    /project\s*status\s*[:|-]?\s*(done|in\s*progress|completed|ongoing)/i,
  ];
  
  for (const pattern of patterns) {
    const match = pageText.match(pattern);
    if (match) {
      const status = match[1].toLowerCase();
      if (status.includes('done') || status.includes('tamamlan') || status.includes('complete')) {
        return 'done';
      }
      return 'in_progress';
    }
  }
  
  return 'in_progress';
}
