import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { prisma } from "../../utils/prisma.js";
import { createWaterLogSchema, queryDateSchema } from "./schema.js";

type Variables = {
	user: {
		id: string;
		email: string;
		name: string;
	};
};

export const waterRoute = new Hono<{ Variables: Variables }>()
	.use(authMiddleware)

	.post("/", zValidator("json", createWaterLogSchema), async (c) => {
		const user = c.get("user");
		const body = c.req.valid("json");

		const newLog = await prisma.waterLogs.create({
			data: {
				userId: user.id,
				amountL: body.amountL,
			},
		});

		return c.json({ message: "Water log created", data: newLog });
	})

	.get("/", zValidator("query", queryDateSchema), async (c) => {
		const user = c.get("user");
		const query = c.req.valid("query");

		let start: Date | undefined;
		let end: Date | undefined;

		if (query.date) {
			start = new Date(query.date);
			start.setHours(0, 0, 0, 0);

			end = new Date(query.date);
			end.setHours(23, 59, 59, 999);
		}

		const logs = await prisma.waterLogs.findMany({
			where: {
				userId: user.id,
				...(start &&
					end && {
						loggedAt: {
							gte: start,
							lte: end,
						},
					}),
			},
			orderBy: { loggedAt: "desc" },
		});

		return c.json({ message: "Water logs retrieved", data: logs });
	})

	.get("/total", zValidator("query", queryDateSchema), async (c) => {
		const user = c.get("user");
		const query = c.req.valid("query");

		const targetDate = query.date ?? new Date();

		const start = new Date(targetDate);
		start.setHours(0, 0, 0, 0);

		const end = new Date(targetDate);
		end.setHours(23, 59, 59, 999);

		const total = await prisma.waterLogs.aggregate({
			_sum: {
				amountL: true,
			},
			where: {
				userId: user.id,
				loggedAt: {
					gte: start,
					lte: end,
				},
			},
		});

		return c.json({
			message: "Total water intake retrieved",
			data: {
				date: start,
				totalL: total._sum.amountL ?? 0,
			},
		});
	});
