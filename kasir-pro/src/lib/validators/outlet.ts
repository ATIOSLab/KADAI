import { z } from "zod";

export const createOutletSchema = z.object({
  name: z.string().trim().min(2, "Nama cabang minimal 2 karakter").max(100, "Nama cabang maksimal 100 karakter"),
  code: z.string().trim().min(2, "Kode cabang minimal 2 karakter").max(20, "Kode cabang maksimal 20 karakter").toUpperCase(),
  address: z.string().trim().max(255, "Alamat maksimal 255 karakter").optional().nullable(),
  phone: z.string().trim().max(30, "Nomor telepon maksimal 30 karakter").optional().nullable(),
  isMain: z.boolean().default(false),
  taxType: z.enum(["NONE", "PPN_11", "PB1_10"]).default("PB1_10"),
  taxRate: z.coerce.number().min(0, "Tarif pajak minimal 0%").max(50, "Tarif pajak maksimal 50%").default(10),
  serviceChargeRate: z.coerce.number().min(0, "Service charge minimal 0%").max(50, "Service charge maksimal 50%").default(5),
  outletType: z.enum(["CENTRAL_WAREHOUSE", "CENTRAL_KITCHEN", "RETAIL_BOOTH", "FULL_SERVICE_STORE"]).default("RETAIL_BOOTH"),
  kitchenWorkflow: z.enum(["DIRECT_SERVE", "KITCHEN_DISPATCH", "HYBRID"]).default("DIRECT_SERVE"),
  costingMethod: z.enum(["FIFO", "FEFO", "AVERAGE"]).default("FIFO"),
});

export const updateOutletSchema = createOutletSchema.partial().extend({
  id: z.string().min(1, "ID cabang wajib disertakan"),
});

export type CreateOutletInput = z.infer<typeof createOutletSchema>;
export type UpdateOutletInput = z.infer<typeof updateOutletSchema>;
