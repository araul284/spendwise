import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuditResult, LeadInfo, ToolSpend } from '../types';

export async function saveAudit(result: AuditResult, tools: ToolSpend[], teamSize: number, useCase: string) {
  try {
    const docRef = await addDoc(collection(db, 'audits'), {
      tools,
      teamSize,
      useCase,
      recommendations: result.recommendations,
      totalSavingsMonthly: result.totalSavingsMonthly,
      totalSavingsAnnual: result.totalSavingsAnnual,
      summary: result.summary,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving audit:', error);
    throw error;
  }
}

export async function getAudit(id: string) {
  try {
    const docRef = doc(db, 'audits', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AuditResult & { tools: ToolSpend[], teamSize: number, useCase: string };
    }
    return null;
  } catch (error) {
    console.error('Error fetching audit:', error);
    throw error;
  }
}

export async function saveLead(lead: LeadInfo) {
  try {
    await addDoc(collection(db, 'leads'), {
      ...lead,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving lead:', error);
    throw error;
  }
}
