import { Router } from "express";

const router = Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === "admin@smartfood.local" && password === "123456") {
    return res.json({
      token: "demo-token-smartfood",
      user: {
        id: 1,
        name: "Administrador",
        email: "admin@smartfood.local",
        role: "ADMIN"
      }
    });
  }

  return res.status(401).json({
    message: "Login inválido"
  });
});

router.get("/me", (_req, res) => {
  return res.json({
    id: 1,
    name: "Administrador",
    email: "admin@smartfood.local",
    role: "ADMIN"
  });
});

export const authRouter = router;