-- CreateTable
CREATE TABLE "MembershipStore" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipStore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MembershipStore_membershipId_storeId_key" ON "MembershipStore"("membershipId", "storeId");

-- AddForeignKey
ALTER TABLE "MembershipStore" ADD CONSTRAINT "MembershipStore_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipStore" ADD CONSTRAINT "MembershipStore_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
