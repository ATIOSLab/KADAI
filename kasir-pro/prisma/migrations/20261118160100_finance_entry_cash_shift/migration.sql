-- Selisih kas harus terlihat di Buku Kas: uang hilang/lebih di laci adalah
-- kejadian finansial, bukan sekadar angka di laporan shift.
ALTER TABLE "finance_entries" ADD COLUMN "cashShiftId" TEXT;

CREATE UNIQUE INDEX "finance_entries_cashShiftId_key"
  ON "finance_entries"("cashShiftId");

ALTER TABLE "finance_entries"
  ADD CONSTRAINT "finance_entries_cashShiftId_fkey"
  FOREIGN KEY ("cashShiftId") REFERENCES "cash_shifts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;