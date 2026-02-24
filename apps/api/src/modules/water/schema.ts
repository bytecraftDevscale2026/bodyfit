import { z } from "zod";

export const createWaterLogSchema = z.object({
	amountL: z.number().positive(),
});

export const queryDateSchema = z.object({
	date: z.coerce.date().optional(),
});
