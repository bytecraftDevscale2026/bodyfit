import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { prisma } from "../../utils/prisma.js";
import { updateProfileSchema } from "./schema.js";

type Variables = {
	user: {
		id: string;
		email: string;
		name: string;
	};
};

export const profileRoute = new Hono<{ Variables: Variables }>()
	.use(authMiddleware)
	.get("/", async (c) => {
		const user = c.get("user");
		const profile = await prisma.profiles.findUnique({
			where: { userId: user.id },
			include: { user: { select: { id: true, email: true, name: true } } },
		});
		return c.json({ message: "Profile retrieved", data: profile });
	})
	.put("/", zValidator("json", updateProfileSchema), async (c) => {
		const user = c.get("user");
		const body = c.req.valid("json");
		const updatedProfile = await prisma.profiles.update({
			where: { userId: user.id },
			data: {
				gender: body.gender,
				dateOfBirth: body.dateOfBirth,
				heightCm: body.heightCm,
				activityLevel: body.activityLevel,
				dietGoal: body.dietGoal,
			},
			include: { user: { select: { id: true, email: true, name: true } } },
		});
		return c.json({ message: "Profile updated", data: updatedProfile });
	});
