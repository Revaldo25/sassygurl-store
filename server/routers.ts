import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import {
  PaymentService,
  AdminFeeCalculator,
  TransactionService,
  LoyaltyService,
  ProviderStatusService,
  ProductService,
  AdminFeeCalculationSchema,
} from "./services";

const transactionService = new TransactionService();
const loyaltyService = new LoyaltyService();
const providerStatusService = new ProviderStatusService();
const productService = new ProductService();

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============= PAYMENT METHODS ROUTER =============
  paymentMethods: router({
    getAll: publicProcedure
      .input(z.object({ categoryId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return PaymentService.getPaymentMethodsWithStatus(input?.categoryId);
      }),

    calculateFee: publicProcedure
      .input(AdminFeeCalculationSchema)
      .query(async ({ input }) => {
        const method = await PaymentService.getPaymentMethodsWithStatus();
        const found = method.methods.find((m: any) => m.id === input.paymentMethodId);

        if (!found) {
          throw new Error("Payment method not found");
        }

        const adminFee = Number(found.adminFee);
        const totalAmount = AdminFeeCalculator.calculateTotalAmount(
          input.productPrice,
          adminFee
        );

        return {
          productPrice: input.productPrice,
          adminFee,
          totalAmount,
          paymentMethod: found,
        };
      }),
  }),

  // ============= PRODUCTS ROUTER =============
  products: router({
    getAll: publicProcedure.query(async () => {
      return productService.getActiveProducts();
    }),

    getFlashSales: publicProcedure.query(async () => {
      return productService.getFlashSales();
    }),

    getWithFlashSale: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return productService.getProductWithFlashSale(input.productId);
      }),
  }),

  // ============= TRANSACTIONS ROUTER =============
  transactions: router({
    create: protectedProcedure
      .input(
        z.object({
          productId: z.number().int().positive(),
          paymentMethodId: z.number().int().positive(),
          sassyPointsRedeemed: z.number().int().nonnegative().default(0),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return transactionService.createTransaction({
          userId: ctx.user.id,
          productId: input.productId,
          paymentMethodId: input.paymentMethodId,
          sassyPointsRedeemed: input.sassyPointsRedeemed,
        });
      }),

    getHistory: protectedProcedure
      .input(
        z.object({
          limit: z.number().int().positive().default(50),
          offset: z.number().int().nonnegative().default(0),
        })
      )
      .query(async ({ input, ctx }) => {
        return transactionService.getUserTransactionHistory(
          ctx.user.id,
          input.limit,
          input.offset
        );
      }),

    confirm: protectedProcedure
      .input(z.object({ transactionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Admin-only check
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return transactionService.confirmTransaction(input.transactionId);
      }),

    fail: protectedProcedure
      .input(z.object({ transactionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return transactionService.failTransaction(input.transactionId);
      }),

    markWhatsappSent: protectedProcedure
      .input(z.object({ transactionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
        await transactionService.markWhatsappSent(input.transactionId);
        return { success: true };
      }),
  }),

  // ============= LOYALTY ROUTER =============
  loyalty: router({
    getBalance: protectedProcedure.query(async ({ ctx }) => {
      return loyaltyService.getUserPoints(ctx.user.id);
    }),

    getHistory: protectedProcedure
      .input(
        z.object({
          limit: z.number().int().positive().default(50),
          offset: z.number().int().nonnegative().default(0),
        })
      )
      .query(async ({ input, ctx }) => {
        return loyaltyService.getPointsHistory(
          ctx.user.id,
          input.limit,
          input.offset
        );
      }),

    redeem: protectedProcedure
      .input(z.object({ points: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const success = await loyaltyService.redeemPoints(
          ctx.user.id,
          input.points
        );
        if (!success) {
          throw new Error("Insufficient loyalty points");
        }
        return { success: true, remainingPoints: await loyaltyService.getUserPoints(ctx.user.id) };
      }),
  }),

  // ============= PROVIDER STATUS ROUTER =============
  providerStatus: router({
    getAll: publicProcedure.query(async () => {
      return providerStatusService.getAllProviderStatus();
    }),

    get: publicProcedure
      .input(z.object({ providerName: z.string() }))
      .query(async ({ input }) => {
        return providerStatusService.getProviderStatus(input.providerName);
      }),

    update: protectedProcedure
      .input(
        z.object({
          providerName: z.string(),
          isOnline: z.boolean(),
          statusMessage: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
        await providerStatusService.updateProviderStatus(
          input.providerName,
          input.isOnline,
          input.statusMessage
        );
        return { success: true };
      }),
  }),

  // ============= ADMIN ROUTER =============
  admin: router({
    getTransactionLogs: protectedProcedure
      .input(
        z.object({
          limit: z.number().int().positive().default(50),
          offset: z.number().int().nonnegative().default(0),
          status: z.enum(["PENDING", "CONFIRMED", "FAILED"]).optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
        // TODO: Implement filterable transaction logs
        return { logs: [], total: 0 };
      }),

    getRevenueStats: protectedProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
        // TODO: Implement revenue statistics
        return { revenue: 0, transactions: 0, topProducts: [] };
      }),

    toggleProductStatus: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          isActive: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
        // TODO: Implement product status toggle
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
