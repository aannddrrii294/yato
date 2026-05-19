import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NotificationService } from '../notification.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor('notifications', {
  concurrency: parseInt(process.env.NOTIFICATION_CONCURRENCY || '5', 10),
})
export class NotificationWorker extends WorkerHost {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(
    private notificationService: NotificationService,
    private eventEmitter: EventEmitter2
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { userId, type, title, message, recipient } = job.data;

    this.logger.log(`[NotificationWorker] Processing job ${job.id} for user ${userId}. Type: ${type}, Recipient: ${recipient}`);

    // Create database notification record first
    try {
      await this.notificationService.createNotification(userId, type, title, message);
    } catch (dbError) {
      this.logger.error(`[NotificationWorker] Failed to create database notification: ${dbError.message}`, dbError.stack);
    }

    // Verify user notification preferences for this channel type
    const isChannelEnabled = await this.notificationService.checkUserPreference(userId, type);
    if (!isChannelEnabled) {
      this.logger.log(`[NotificationWorker] Skipping ${type} notification dispatch for user ${userId} due to channel disabled in user settings.`);
      
      this.eventEmitter.emit('notification.finished', {
        userId,
        success: true,
        message: `Notification skipped: ${type} is disabled in user preferences.`,
        type
      });
      
      return { success: true };
    }

    let success = false;
    let errorDetail = '';

    try {
      let result;
      if (type === 'EMAIL') {
        this.logger.log(`[NotificationWorker] Attempting to send Email to ${recipient}...`);
        result = await this.notificationService.sendEmail(recipient, title, message);
      } else if (type === 'WHATSAPP') {
        this.logger.log(`[NotificationWorker] Attempting to send WhatsApp message to ${recipient}...`);
        result = await this.notificationService.sendWhatsApp(recipient, message);
      } else if (type === 'TELEGRAM') {
        this.logger.log(`[NotificationWorker] Attempting to send Telegram message to ${recipient}...`);
        result = await this.notificationService.sendTelegram(recipient, message);
      } else {
        throw new Error(`Unsupported notification type: ${type}`);
      }

      if (result && result.success) {
        success = true;
        this.logger.log(`[NotificationWorker] Job ${job.id} succeeded. Notification sent to ${recipient} via ${type}.`);
      } else {
        errorDetail = result?.message || 'Unknown error';
        this.logger.error(`[NotificationWorker] Job ${job.id} failed to send to ${recipient} via ${type}. Details: ${errorDetail}`);
      }
    } catch (error) {
      errorDetail = error.message;
      this.logger.error(`[NotificationWorker] Unexpected error in job ${job.id} while sending to ${recipient} via ${type}: ${error.message}`, error.stack);
    }

    // Emit finished event
    this.logger.log(`[NotificationWorker] Emitting notification.finished event for user ${userId}`);
    this.eventEmitter.emit('notification.finished', {
      userId,
      success,
      message: success 
        ? `Notification sent successfully to ${recipient} via ${type}`
        : `Failed to send notification to ${recipient} via ${type}. Error: ${errorDetail}`,
      type
    });

    if (!success) {
      throw new Error(`Notification delivery failed: ${errorDetail}`);
    }

    return { success: true };
  }
}
