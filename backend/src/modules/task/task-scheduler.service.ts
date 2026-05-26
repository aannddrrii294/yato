import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Run scheduler every hour to check and generate repeating tasks
  @Cron(CronExpression.EVERY_HOUR)
  async handleRepeatingTasks() {
    this.logger.log('⏰ Running repeating task scheduler check...');
    try {
      const templates = await this.prisma.taskTemplate.findMany({
        where: {
          repeatInterval: {
            in: ['DAILY', 'WEEKLY', 'MONTHLY'],
          },
        },
      });

      this.logger.log(`Found ${templates.length} active repeating blueprints/templates.`);

      const now = new Date();

      for (const template of templates) {
        let shouldGenerate = false;
        const lastGen = template.lastGeneratedAt ? new Date(template.lastGeneratedAt) : null;

        if (!lastGen) {
          shouldGenerate = true;
        } else {
          const diffTime = Math.abs(now.getTime() - lastGen.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (template.repeatInterval === 'DAILY') {
            // Check if it's a different calendar day
            const isSameDay =
              now.getFullYear() === lastGen.getFullYear() &&
              now.getMonth() === lastGen.getMonth() &&
              now.getDate() === lastGen.getDate();
            if (!isSameDay) {
              shouldGenerate = true;
            }
          } else if (template.repeatInterval === 'WEEKLY') {
            // At least 7 days passed or calendar week changed
            if (diffDays >= 7) {
              shouldGenerate = true;
            }
          } else if (template.repeatInterval === 'MONTHLY') {
            // At least 28-31 days passed or calendar month changed
            const isSameMonth =
              now.getFullYear() === lastGen.getFullYear() &&
              now.getMonth() === lastGen.getMonth();
            if (!isSameMonth && diffDays >= 28) {
              shouldGenerate = true;
            }
          }
        }

        if (shouldGenerate) {
          this.logger.log(
            `Generating automated task from template "${template.templateName}" (Interval: ${template.repeatInterval})`
          );

          // Create the Task
          await this.prisma.$transaction(async (tx) => {
            await tx.task.create({
              data: {
                title: template.title,
                description: template.description || '',
                status: 'NOT_STARTED',
                priority: template.priority,
                taskType: template.taskType,
                checklist: template.checklist || [],
                createdById: template.createdById,
              },
            });

            // Update template's lastGeneratedAt field
            await tx.taskTemplate.update({
              where: { id: template.id },
              data: { lastGeneratedAt: now },
            });
          });

          this.logger.log(`Successfully generated task for template ID: ${template.id}`);
        }
      }
    } catch (error) {
      this.logger.error('Error occurred in repeating task scheduler:', error.stack || error.message);
    }
  }

  // Also run on application startup to ensure any missed tasks are created
  async onApplicationBootstrap() {
    this.logger.log('🚀 Bootstrapping Repeating Task Scheduler...');
    await this.handleRepeatingTasks();
  }
}
