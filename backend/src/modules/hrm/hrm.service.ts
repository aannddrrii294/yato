import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HrmService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // 1. DIVISIONS & ORG STRUCTURE
  // =========================================================================

  async listDivisions() {
    return this.prisma.division.findMany({
      include: {
        supervisor: { select: { id: true, fullName: true, email: true } },
        manager: { select: { id: true, fullName: true, email: true } },
        head: { select: { id: true, fullName: true, email: true } },
        _count: { select: { users: true } },
      },
    });
  }

  async createDivision(data: { name: string; description?: string; supervisorId?: string; managerId?: string; headId?: string }) {
    const cleanedData = {
      ...data,
      supervisorId: data.supervisorId === "" ? null : data.supervisorId || null,
      managerId: data.managerId === "" ? null : data.managerId || null,
      headId: data.headId === "" ? null : data.headId || null,
    };
    return this.prisma.division.create({ data: cleanedData });
  }

  async updateDivision(id: string, data: { name?: string; description?: string; supervisorId?: string; managerId?: string; headId?: string }) {
    const cleanedData = {
      ...data,
      supervisorId: data.supervisorId === "" ? null : data.supervisorId,
      managerId: data.managerId === "" ? null : data.managerId,
      headId: data.headId === "" ? null : data.headId,
    };
    return this.prisma.division.update({
      where: { id },
      data: cleanedData,
    });
  }

  // =========================================================================
  // 2. SHIFT CATEGORIES & ROSTER
  // =========================================================================

  async listShiftCategories() {
    return this.prisma.shiftCategory.findMany();
  }

  async createShiftCategory(data: {
    name: string;
    startTime: string;
    endTime: string;
    breakStart: string;
    breakEnd: string;
    colorCode?: string;
    description?: string;
  }) {
    return this.prisma.shiftCategory.create({ data });
  }

  async updateShiftCategory(id: string, data: {
    name?: string;
    startTime?: string;
    endTime?: string;
    breakStart?: string;
    breakEnd?: string;
    colorCode?: string;
    description?: string;
  }) {
    return this.prisma.shiftCategory.update({
      where: { id },
      data,
    });
  }

  async deleteShiftCategory(id: string) {
    // Delete all work shifts using this shift category
    await this.prisma.workShift.deleteMany({
      where: { shiftCategoryId: id },
    });
    return this.prisma.shiftCategory.delete({
      where: { id },
    });
  }

  async assignShift(data: { userId: string; shiftCategoryId: string; date: string; notes?: string }) {
    const shiftDate = new Date(data.date);
    // Set to midnight UTC/local to ensure date matching is consistent
    shiftDate.setUTCHours(0, 0, 0, 0);

    return this.prisma.workShift.upsert({
      where: {
        userId_date: {
          userId: data.userId,
          date: shiftDate,
        },
      },
      update: {
        shiftCategoryId: data.shiftCategoryId,
        notes: data.notes,
      },
      create: {
        userId: data.userId,
        shiftCategoryId: data.shiftCategoryId,
        date: shiftDate,
        notes: data.notes,
      },
    });
  }

  async getRoster(userId: string, start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return this.prisma.workShift.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        shiftCategory: true,
      },
      orderBy: { date: 'asc' },
    });
  }

  // =========================================================================
  // 3. CLOCK-IN / CLOCK-OUT & TIMESHEET
  // =========================================================================

  async clockIn(
    userId: string,
    ipAddress: string,
    device: string,
    latenessReason?: string,
    customTime?: Date // For flexible simulation or testing
  ) {
    const now = customTime || new Date();
    const todayMidnight = new Date(now);
    todayMidnight.setHours(0, 0, 0, 0);

    // 1. IP White-listing Check (Anti-Fraud)
    // Query corporate white-listed IP configs
    const whitelistConfigs = await this.prisma.systemSetting.findMany({
      where: { key: { in: ['office_ip_whitelist', 'office_ip_enabled'] } },
    });

    const isEnabled = whitelistConfigs.find(c => c.key === 'office_ip_enabled')?.value === 'true';
    const whitelistVal = whitelistConfigs.find(c => c.key === 'office_ip_whitelist')?.value;
    const allowedIps = typeof whitelistVal === 'string' ? whitelistVal.split(',').map(ip => ip.trim()) : [];

    if (isEnabled && allowedIps.length > 0 && !allowedIps.includes(ipAddress)) {
      throw new ForbiddenException(`Access Blocked: IP Address ${ipAddress} is not registered in corporate white-listing!`);
    }

    // 2. Create or fetch Timesheet for today (No Shift/Scheduler Dependency)
    let timesheet = await this.prisma.timesheet.findFirst({
      where: {
        userId,
        date: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
          lte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
        },
      },
    });

    if (!timesheet) {
      timesheet = await this.prisma.timesheet.create({
        data: {
          userId,
          date: now,
          status: 'PRESENT',
          latenessReason: null,
        },
      });
    }

    // 5. Append Clock-in log
    await this.prisma.timesheetLog.create({
      data: {
        timesheetId: timesheet.id,
        type: 'CHECK_IN',
        timestamp: now,
        ipAddress,
        device,
      },
    });

    return {
      message: 'Successfully clocked in!',
      status: timesheet.status,
      timestamp: now,
    };
  }

  async clockOut(userId: string, ipAddress: string, device: string, notes?: string, customTime?: Date) {
    const now = customTime || new Date();

    const timesheet = await this.prisma.timesheet.findFirst({
      where: {
        userId,
        date: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
          lte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
        },
      },
      include: { logs: true },
    });

    if (!timesheet) {
      throw new BadRequestException('Clock-out failed: You have not clocked in yet today.');
    }

    // Append Clock-out log
    await this.prisma.timesheetLog.create({
      data: {
        timesheetId: timesheet.id,
        type: 'CHECK_OUT',
        timestamp: now,
        ipAddress,
        device,
      },
    });

    // Re-fetch with the newly added check-out log to calculate total hours worked
    const updatedTimesheet = await this.prisma.timesheet.findUnique({
      where: { id: timesheet.id },
      include: { logs: { orderBy: { timestamp: 'asc' } } },
    });

    // Calculate accumulation of check-in and check-out pairs
    let totalMs = 0;
    let lastCheckIn: Date | null = null;

    for (const log of updatedTimesheet.logs) {
      if (log.type === 'CHECK_IN') {
        lastCheckIn = new Date(log.timestamp);
      } else if (log.type === 'CHECK_OUT' && lastCheckIn) {
        totalMs += new Date(log.timestamp).getTime() - lastCheckIn.getTime();
        lastCheckIn = null;
      }
    }

    const totalHours = Number((totalMs / (1000 * 60 * 60)).toFixed(2));

    await this.prisma.timesheet.update({
      where: { id: timesheet.id },
      data: {
        totalHours,
        notes: notes || timesheet.notes,
      },
    });

    return {
      message: 'Successfully clocked out!',
      totalHours,
      timestamp: now,
    };
  }

  async getMyTimesheets(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    return this.prisma.timesheet.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
      include: {
        logs: { orderBy: { timestamp: 'asc' } },
        overtimes: true,
      },
      orderBy: { date: 'asc' },
    });
  }

  async getAllTimesheets(dateStr: string) {
    const targetDate = new Date(dateStr);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        division: { select: { name: true } },
      },
      orderBy: { fullName: 'asc' },
    });

    const timesheets = await this.prisma.timesheet.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        logs: { orderBy: { timestamp: 'asc' } },
      },
    });

    return users.map(user => {
      const ts = timesheets.find(t => t.userId === user.id);
      return {
        user,
        timesheet: ts || null,
      };
    });
  }

  async getDivisionTimesheets(divisionId: string, dateStr: string) {
    const targetDate = new Date(dateStr);
    return this.prisma.timesheet.findMany({
      where: {
        user: { divisionId },
        date: {
          gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0),
          lte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59),
        },
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        logs: true,
      },
    });
  }

  // =========================================================================
  // 4. ADMIN ADJUSTMENTS
  // =========================================================================

  async adjustAttendance(data: {
    timesheetId: string;
    adminId: string;
    changedFrom: string;
    changedTo: string;
    reason: string;
    newTotalHours: number;
    newStatus?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Record the adjustment audit log
      await tx.attendanceAdjustmentLog.create({
        data: {
          timesheetId: data.timesheetId,
          adminId: data.adminId,
          changedFrom: data.changedFrom,
          changedTo: data.changedTo,
          reason: data.reason,
        },
      });

      // 2. Update the actual timesheet record
      return tx.timesheet.update({
        where: { id: data.timesheetId },
        data: {
          totalHours: data.newTotalHours,
          status: data.newStatus || undefined,
        },
      });
    });
  }

  // =========================================================================
  // 5. LEAVE REQUESTS (Multi-Level Approval & Auto-Deduct)
  // =========================================================================

  async getLeaveBalance(userId: string, year: number) {
    let balance = await this.prisma.leaveBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      balance = await this.prisma.leaveBalance.create({
        data: {
          userId,
          allocated: 12,
          used: 0,
          remaining: 12,
          year,
        },
      });
    }

    return balance;
  }

  async requestLeave(userId: string, data: { type: string; startDate: string; endDate: string; reason: string; attachments?: string[] }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // 1. Check leave balance for ANNUAL_LEAVE
    if (data.type === 'ANNUAL_LEAVE') {
      const balance = await this.getLeaveBalance(userId, start.getFullYear());
      if (balance.remaining < durationDays) {
        throw new BadRequestException(`Insufficient leave quota. Requested: ${durationDays} days, Available: ${balance.remaining} days.`);
      }
    }

    // 2. Fetch user's division hierarchy for routing approvals
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        division: true,
      },
    });

    if (!user.division) {
      throw new BadRequestException('Approval Routing Failed: You are not assigned to any Division.');
    }

    // 3. Create the Leave Request
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.create({
        data: {
          userId,
          type: data.type,
          startDate: start,
          endDate: end,
          reason: data.reason,
          attachments: data.attachments || [],
        },
      });

      // 4. Seed approval steps based on division managers/supervisors
      const approvalsToCreate = [];
      
      if (user.division.supervisorId) {
        approvalsToCreate.push({
          leaveRequestId: request.id,
          level: 1,
          roleName: 'SUPERVISOR',
          status: 'PENDING',
        });
      }

      if (user.division.managerId) {
        approvalsToCreate.push({
          leaveRequestId: request.id,
          level: 2,
          roleName: 'MANAGER',
          status: 'PENDING',
        });
      }

      if (user.division.headId) {
        approvalsToCreate.push({
          leaveRequestId: request.id,
          level: 3,
          roleName: 'DEPT_HEAD',
          status: 'PENDING',
        });
      }

      // If no supervisors/managers configured, auto-approve
      if (approvalsToCreate.length === 0) {
        await tx.leaveRequest.update({
          where: { id: request.id },
          data: { status: 'APPROVED' },
        });

        if (data.type === 'ANNUAL_LEAVE') {
          await tx.leaveBalance.update({
            where: { userId },
            data: {
              used: { increment: durationDays },
              remaining: { decrement: durationDays },
            },
          });
        }
      } else {
        await tx.leaveApproval.createMany({
          data: approvalsToCreate,
        });
      }

      return request;
    });
  }

  async getMyLeaves(userId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { userId },
      include: {
        user: {
          include: {
            division: true,
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }


  async getPendingApprovals(approverId: string) {
    // A user can approve if they are mapped as SPV, Manager, or Head in a division
    const divisions = await this.prisma.division.findMany({
      where: {
        OR: [
          { supervisorId: approverId },
          { managerId: approverId },
          { headId: approverId },
        ],
      },
    });

    const rolesMap: { [divId: string]: string[] } = {};
    divisions.forEach(d => {
      rolesMap[d.id] = [];
      if (d.supervisorId === approverId) rolesMap[d.id].push('SUPERVISOR');
      if (d.managerId === approverId) rolesMap[d.id].push('MANAGER');
      if (d.headId === approverId) rolesMap[d.id].push('DEPT_HEAD');
    });

    const divisionIds = Object.keys(rolesMap);

    // Find leave requests of users belonging to these divisions where approval is pending
    const leaves = await this.prisma.leaveRequest.findMany({
      where: {
        status: 'PENDING',
        user: {
          divisionId: { in: divisionIds },
        },
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, divisionId: true } },
        approvals: true,
      },
    });

    // Filter down leaves to only ones that are currently waiting for *this specific level*
    return leaves.filter(leave => {
      const uDivId = leave.user.divisionId;
      if (!uDivId) return false;
      const myRolesForThisDiv = rolesMap[uDivId] || [];

      // Find the current pending step (lowest level that is still PENDING)
      const sortedApprovals = [...leave.approvals].sort((a, b) => a.level - b.level);
      const activeStep = sortedApprovals.find(a => a.status === 'PENDING');

      if (!activeStep) return false;
      return myRolesForThisDiv.includes(activeStep.roleName);
    });
  }

  async actionLeaveApproval(approverId: string, approvalId: string, action: 'APPROVED' | 'REJECTED', notes?: string) {
    return this.prisma.$transaction(async (tx) => {
      const step = await tx.leaveApproval.findUnique({
        where: { id: approvalId },
        include: { leaveRequest: { include: { approvals: true } } },
      });

      if (!step) {
        throw new NotFoundException('Leave approval step not found.');
      }

      if (step.status !== 'PENDING') {
        throw new BadRequestException('This approval step has already been processed.');
      }

      // Check if previous levels are already approved (sequential routing)
      const priorSteps = step.leaveRequest.approvals.filter(a => a.level < step.level);
      const isPriorApproved = priorSteps.every(s => s.status === 'APPROVED');
      if (!isPriorApproved) {
        throw new BadRequestException('Prior levels of approval must be approved first.');
      }

      // 1. Update this specific approval step
      const updatedStep = await tx.leaveApproval.update({
        where: { id: approvalId },
        data: {
          status: action,
          approverId,
          notes,
          actionedAt: new Date(),
        },
      });

      const totalSteps = step.leaveRequest.approvals.length;
      const sortedSteps = [...step.leaveRequest.approvals].sort((a, b) => a.level - b.level);

      if (action === 'REJECTED') {
        // If rejected, entire request is rejected immediately
        await tx.leaveRequest.update({
          where: { id: step.leaveRequestId },
          data: { status: 'REJECTED' },
        });
      } else if (action === 'APPROVED') {
        // Check if this was the final level
        const isFinalStep = step.level === Math.max(...sortedSteps.map(s => s.level));

        if (isFinalStep) {
          // If approved by final level, mark the whole request as APPROVED
          await tx.leaveRequest.update({
            where: { id: step.leaveRequestId },
            data: { status: 'APPROVED' },
          });

          // Auto-deduct Leave Balance if ANNUAL_LEAVE
          if (step.leaveRequest.type === 'ANNUAL_LEAVE') {
            const start = new Date(step.leaveRequest.startDate);
            const end = new Date(step.leaveRequest.endDate);
            const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            await tx.leaveBalance.update({
              where: { userId: step.leaveRequest.userId },
              data: {
                used: { increment: durationDays },
                remaining: { decrement: durationDays },
              },
            });
          }
        }
      }

      return updatedStep;
    });
  }

  // =========================================================================
  // 6. SHIFT SWAP (Shift Trade / Tukar Shift)
  // =========================================================================

  async requestShiftSwap(requesterId: string, data: { targetUserId: string; requesterShiftId: string; targetShiftId: string }) {
    return this.prisma.shiftSwapRequest.create({
      data: {
        requesterId,
        targetUserId: data.targetUserId,
        requesterShiftId: data.requesterShiftId,
        targetShiftId: data.targetShiftId,
        status: 'PENDING',
      },
    });
  }

  async actionShiftSwap(userId: string, swapId: string, action: 'ACCEPT' | 'REJECT', notes?: string) {
    const swap = await this.prisma.shiftSwapRequest.findUnique({
      where: { id: swapId },
    });

    if (!swap) throw new NotFoundException('Shift swap request not found.');

    if (swap.targetUserId !== userId) {
      throw new ForbiddenException('You are not authorized to action this swap request.');
    }

    if (action === 'REJECT') {
      return this.prisma.shiftSwapRequest.update({
        where: { id: swapId },
        data: { status: 'REJECTED', rejectionNotes: notes },
      });
    }

    // If accepted by target, set to TARGET_ACCEPTED (ready for Supervisor/Manager approval)
    // For extreme productivity, let's auto-process swap directly if configured, or wait for admin.
    // In this proposal, we auto-swap shifts directly on Target Acceptance to optimize speed!
    return this.prisma.$transaction(async (tx) => {
      const updatedSwap = await tx.shiftSwapRequest.update({
        where: { id: swapId },
        data: { status: 'APPROVED' },
      });

      const rShift = await tx.workShift.findUnique({ where: { id: swap.requesterShiftId } });
      const tShift = await tx.workShift.findUnique({ where: { id: swap.targetShiftId } });

      // Swap shiftCategoryIds between requester and target
      await tx.workShift.update({
        where: { id: swap.requesterShiftId },
        data: { shiftCategoryId: tShift.shiftCategoryId },
      });

      await tx.workShift.update({
        where: { id: swap.targetShiftId },
        data: { shiftCategoryId: rShift.shiftCategoryId },
      });

      return updatedSwap;
    });
  }

  // =========================================================================
  // 7. OVERTIME (Klaim Lembur)
  // =========================================================================

  async requestOvertime(userId: string, data: { timesheetId: string; hoursClaimed: number; reason: string }) {
    return this.prisma.overtime.create({
      data: {
        timesheetId: data.timesheetId,
        hoursClaimed: data.hoursClaimed,
        reason: data.reason,
        status: 'PENDING',
      },
    });
  }

  async actionOvertime(adminId: string, overtimeId: string, status: 'APPROVED' | 'REJECTED', notes?: string) {
    return this.prisma.overtime.update({
      where: { id: overtimeId },
      data: {
        status,
        approvedBy: adminId,
        notes,
      },
    });
  }

  // =========================================================================
  // ADMIN LEAVE MANAGEMENT
  // =========================================================================

  async adminGetLeaveBalances() {
    const users = await this.prisma.user.findMany({
      include: {
        leaveBalance: true,
        division: true,
      },
    });

    const currentYear = new Date().getFullYear();

    return Promise.all(
      users.map(async (u) => {
        let balance = u.leaveBalance;
        if (!balance) {
          balance = await this.prisma.leaveBalance.create({
            data: {
              userId: u.id,
              allocated: 12,
              used: 0,
              remaining: 12,
              year: currentYear,
            },
          });
        }
        return {
          userId: u.id,
          fullName: u.fullName,
          email: u.email,
          divisionName: u.division?.name || "Unassigned",
          allocated: balance.allocated,
          used: balance.used,
          remaining: balance.remaining,
        };
      })
    );
  }

  async adminUpdateLeaveBalance(userId: string, data: { allocated?: number; used?: number }) {
    const balance = await this.prisma.leaveBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      throw new NotFoundException("Leave balance not found for this user");
    }

    const newAllocated = data.allocated !== undefined ? data.allocated : balance.allocated;
    const newUsed = data.used !== undefined ? data.used : balance.used;
    const newRemaining = newAllocated - newUsed;

    return this.prisma.leaveBalance.update({
      where: { userId },
      data: {
        allocated: newAllocated,
        used: newUsed,
        remaining: newRemaining,
      },
    });
  }

  async adminGetAllLeaveRequests() {
    return this.prisma.leaveRequest.findMany({
      include: {
        user: {
          include: {
            division: true,
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async adminOverrideLeaveRequest(requestId: string, data: { status: 'APPROVED' | 'REJECTED'; notes?: string }) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.findUnique({
        where: { id: requestId },
        include: { approvals: true },
      });

      if (!request) {
        throw new NotFoundException("Leave request not found");
      }

      if (request.status === data.status) {
        return request;
      }

      if (request.type === 'ANNUAL_LEAVE') {
        const start = new Date(request.startDate);
        const end = new Date(request.endDate);
        const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const balance = await tx.leaveBalance.findUnique({
          where: { userId: request.userId },
        });

        if (balance) {
          let newUsed = balance.used;
          if (data.status === 'APPROVED' && request.status !== 'APPROVED') {
            newUsed += durationDays;
          } else if (data.status !== 'APPROVED' && request.status === 'APPROVED') {
            newUsed = Math.max(0, newUsed - durationDays);
          }
          const newRemaining = balance.allocated - newUsed;

          await tx.leaveBalance.update({
            where: { userId: request.userId },
            data: {
              used: newUsed,
              remaining: newRemaining,
            },
          });
        }
      }

      const updatedRequest = await tx.leaveRequest.update({
        where: { id: requestId },
        data: { status: data.status },
      });

      await tx.leaveApproval.updateMany({
        where: { leaveRequestId: requestId },
        data: {
          status: data.status,
          notes: data.notes || "Admin override",
          actionedAt: new Date(),
        },
      });

      return updatedRequest;
    });
  }
}
