import { z } from "zod";

// Password policy diberlakukan saat PEMBUATAN/PERUBAHAN password, bukan saat
// login: membatasi panjang di login hanya mengunci akun lama tanpa menambah
// keamanan (keputusan tetap pada verifikasi hash).
export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi").max(72),
});

export const createUserSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter").max(72),
  supervisorPin: z.string().regex(/^\d{6,8}$/, "PIN harus 6-8 digit angka").optional().nullable(),
  role: z.enum(["ADMIN", "MANAGER", "CASHIER", "KITCHEN", "INVENTORY", "ACCOUNTANT"]).default("CASHIER"),
  avatar: z.string().optional().nullable(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8, "Password minimal 8 karakter").optional(),
  supervisorPin: z.string().regex(/^\d{6,8}$/, "PIN harus 6-8 digit angka").optional().nullable(),
  role: z.enum(["ADMIN", "MANAGER", "CASHIER", "KITCHEN", "INVENTORY", "ACCOUNTANT"]).optional(),
  isActive: z.boolean().optional(),
  avatar: z.string().optional().nullable(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
    confirmPassword: z
      .string()
      .min(8, "Konfirmasi password minimal 8 karakter"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password baru tidak cocok",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Password baru harus berbeda dari password saat ini",
    path: ["newPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
