import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import jwt from "jsonwebtoken";
import { prisma } from "../../utils/prisma.js";
import { loginSchema, registerSchema } from "./schema.js";
import { comparePassword, hashPassword } from "./utils.js";

export const authRoute = new Hono()
	.post("/register", zValidator("json", registerSchema), async (c) => {
		const body = c.req.valid("json");
		const existingUser = await prisma.users.findUnique({
			where: { email: body.email },
		});
		if (existingUser) {
			throw new HTTPException(409, { message: "User already exist" });
		}
		const hashedPassword = await hashPassword(body.password);

		const newUser = await prisma.users.create({
			data: {
				name: body.name,
				email: body.email,
				password: hashedPassword,
			},
		});
		// Create an empty profile for the new user
		await prisma.profiles.create({
			data: {
				userId: newUser.id,
			},
		});

		// show user with profile
		const userWithProfile = await prisma.users.findUnique({
			where: { id: newUser.id },
			include: { profile: true },
		});

		return c.json({ message: "Register success", data: userWithProfile });
	})
	.post("/login", zValidator("json", loginSchema), async (c) => {
		const body = c.req.valid("json");

		const existingUser = await prisma.users.findUnique({
			where: { email: body.email },
		});
		if (!existingUser) {
			throw new HTTPException(404, { message: "User not found" });
		}

		const isPasswordValid = await comparePassword(
			body.password,
			existingUser.password,
		);
		if (!isPasswordValid) {
			throw new HTTPException(401, { message: "Invalid password" });
		}

		const jwtSecret = process.env.JWT_SECRET;
		if (!jwtSecret) {
			throw new HTTPException(500, { message: "JWT_SECRET not set" });
		}
		const token = jwt.sign(
			{
				sub: existingUser.id,
				email: existingUser.email,
				name: existingUser.name,
			},
			jwtSecret,
		);

		return c.json({ message: "Login successful", token });
	});
