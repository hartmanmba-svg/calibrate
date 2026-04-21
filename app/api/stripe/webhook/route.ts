import { NextResponse } from "next/server";

export async function POST() {
  // TODO: handle checkout.session.completed, customer.subscription.updated,
  //       customer.subscription.deleted, invoice.payment_failed
  return NextResponse.json({ received: true });
}
