import { zValidator }                                   from "@hono/zod-validator";
import { Hono }                                         from "hono";
import { loginSchema, registerSchema }                  from "./schema.js";
import { prisma }                                       from "../../utils/prisma.js";
import { HTTPException }                                from "hono/http-exception";
import { comparePassword, hashPassword }                from "./utils.js";
import jwt                                              from "jsonwebtoken";

export const authRoute = new Hono()
    .post("/register", zValidator("json", registerSchema), async (c) => {
        const body = c.req.valid("json");
        const existingUser = await prisma.users.findUnique({ 
            where: { email: body.email } 
        });
        if(existingUser){
            throw new HTTPException(409, { message: 'User already exist' });
        }
        const hashedPassword = await hashPassword(body.password);

        const newUser = await prisma.users.create({
            data: {
                name: body.name,
                email: body.email,
                password: hashedPassword
            }
        });

        return c.json({ message: 'Register success', data: newUser });
    })
    .post("/login", zValidator("json", loginSchema), async (c) => {
        const body = c.req.valid("json");
        
        const existingUser = await prisma.users.findUnique({ 
            where: { email: body.email } 
        });
        if (!existingUser) {
            throw new HTTPException(404, { message: 'User not found' });
        }

        const isPasswordValid = await comparePassword(body.password, existingUser.password);
        if (!isPasswordValid) {
            throw new HTTPException(401, { message: 'Invalid password' });
        }

        const token = jwt.sign(
            { sub: existingUser.id, email: existingUser.email },
            process.env.JWT_SECRET!,
        )
        
        return c.json({ message: "Login successful", token });
    });