import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  // Find all expired pending reservations
  const expiredReservations = await prisma.reservation.findMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: new Date() }
    }
  })

  // Release each one
  await Promise.all(
    expiredReservations.map(reservation =>
      prisma.$transaction([
        prisma.reservation.update({
          where: { id: reservation.id },
          data: { status: 'RELEASED' }
        }),
        prisma.stockLevel.update({
          where: {
            productId_warehouseId: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId
            }
          },
          data: { reservedUnits: { decrement: reservation.quantity } }
        })
      ])
    )
  )

  return NextResponse.json({
    released: expiredReservations.length
  })
}