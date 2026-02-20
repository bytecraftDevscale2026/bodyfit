import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { prisma } from "../utils/prisma.js";

export const authMiddleware = createMiddleware(async (c, next) => {
	const token = c.req.header("token");
	if (!token) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}

	try {
		const jwtSecret = process.env.JWT_SECRET;
		if (!jwtSecret) {
			throw new HTTPException(500, { message: "JWT_SECRET not set" });
		}

		const payload = jwt.verify(token, jwtSecret) as JwtPayload;

		const user = await prisma.users.findUnique({
			where: { id: payload.sub },
			select: { id: true, email: true },
		});
		if (!user) {
			throw new HTTPException(401, { message: "User not found" });
		}

		c.set("user", user);

		await next();
	} catch (_err) {
		throw new HTTPException(401, { message: "Invalid token" });
	}
});
