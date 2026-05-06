import { prisma } from "@/lib/prisma";
import type { CreateActivityLogDTO } from "@/types";

// ✅ AJOUTÉ : Queue en mémoire + batch inserts
let logQueue: CreateActivityLogDTO[] = [];
let isProcessing = false;

export async function logActivity(data: CreateActivityLogDTO): Promise<void> {
  logQueue.push(data);
  
  if (!isProcessing) {
    processQueue();
  }
}

async function processQueue(): Promise<void> {
  if (isProcessing || logQueue.length === 0) return;
  
  isProcessing = true;
  
  while (logQueue.length > 0) {
    const batch = logQueue.splice(0, 10);
    
    try {
      await prisma.activityLog.createMany({
        data: batch.map(log => ({
          userId:    log.userId    ?? null,
          action:    log.action,
          entity:    log.entity,
          entityId:  log.entityId  ?? null,
          changes:   log.changes   as any ?? undefined,
          metadata:  log.metadata  as any ?? undefined,
          ipAddress: log.ipAddress ?? null,
          userAgent: log.userAgent ?? null,
        })),
        skipDuplicates: true,
      });
    } catch (error) {
      console.error("[ActivityLog] Batch failed, re-queuing", error);
      logQueue.push(...batch);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  isProcessing = false;
}