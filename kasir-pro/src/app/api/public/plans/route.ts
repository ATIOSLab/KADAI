import { getPlans, pricesByCycle } from "@/lib/plan-catalog";
import { handleApiError, jsonOk } from "@/lib/api-response";

// GET /api/public/plans — katalog paket aktif untuk landing & /harga (tanpa auth)
export async function GET() {
  try {
    const plans = await getPlans();

    return jsonOk(
      plans.map((plan) => ({
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        badge: plan.badge,
        features: plan.features,
        limits: plan.limits,
        sortOrder: plan.sortOrder,
        prices: pricesByCycle(plan),
      }))
    );
  } catch (error) {
    return handleApiError(error, "GET /api/public/plans", "Gagal memuat daftar paket");
  }
}