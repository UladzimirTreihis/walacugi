import React from "react";
import { useTranslation } from "react-i18next";
import type { EquipmentModelItem } from "../../types";
import ProductCard from "../shared/ProductCard";
import { getMinDailyRate, resolvePriceTiers } from "../../utils/equipmentPricing";

export default function EquipmentCard({ item }: { item: EquipmentModelItem }) {
  const { t } = useTranslation();
  const tiers = resolvePriceTiers(item.priceTiers, item.pricePerDay);
  const from = item.priceFrom ?? (tiers ? getMinDailyRate(tiers) : 0);
  const currency = item.currency ?? "PLN";

  return (
    <ProductCard
      image={item.images?.[0] || "/images/logo_white.jpg"}
      imageAlt={item.title}
      overline={item.categoryDisplay}
      title={item.title}
      description={item.description}
      priceLabel={t("equipment.priceFrom", { price: from, currency })}
      viewTo={`/equipment/${item._id}`}
    />
  );
}
