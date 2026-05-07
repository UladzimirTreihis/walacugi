import React from "react";
import type { EquipmentModelItem } from "../../types";
import ProductCard from "../shared/ProductCard";

export default function EquipmentCard({ item }: { item: EquipmentModelItem }) {
  return (
    <ProductCard
      image={item.images?.[0] || "/images/logo_white.jpg"}
      imageAlt={item.title}
      overline={item.categoryDisplay}
      title={item.title}
      description={item.description}
      priceLabel={`${item.pricePerDay} ${item.currency}/day`}
      viewTo={`/equipment/${item._id}`}
    />
  );
}
