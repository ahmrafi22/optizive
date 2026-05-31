import { NextRequest, NextResponse } from "next/server";
import { updatePublicProduct } from "@/backend/inventory/public";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const body = await request.json();

    const { quantity, expiryDate, batchNumber, name, description, category } = body;

    if (quantity !== undefined && (typeof quantity !== "number" || quantity < 0)) {
      return NextResponse.json(
        { error: "Invalid quantity" },
        { status: 400 }
      );
    }

    const updated = await updatePublicProduct(productId, {
      quantity,
      expiryDate,
      batchNumber,
      name,
      description,
      category,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
