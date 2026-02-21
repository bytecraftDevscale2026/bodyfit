import { z } from "zod";

export const updateProfileSchema = z.object({
	gender: z.enum(["male", "female"]).optional(),
	dateOfBirth: z.coerce.date().optional(),
	heightCm: z.number().positive().optional(),
	activityLevel: z
		.enum(["sedentary", "light", "moderate", "active"])
		.optional(),
	dietGoal: z.enum(["fat_loss", "maintenance", "muscle_gain"]).optional(),
});
