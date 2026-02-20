import { serve }     from "@hono/node-server";
import { Hono }      from "hono";
import { authRoute } from "./modules/auth/route.js";

const app = new Hono()
	.get("/health", (c) => c.text("ok"))
	.route("/auth", authRoute)

serve(
	{
		fetch: app.fetch,
		port: 8000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
