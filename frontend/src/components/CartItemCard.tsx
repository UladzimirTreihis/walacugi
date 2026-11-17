import React from "react";
import { useTranslation } from "react-i18next";
import type { CheckoutItem } from "../types";
import formatDateEU from "../utils/formatDateEU";
import ProductCard from "./shared/ProductCard";
import {
  countRentalDays,
  getDailyRate,
  getLineTotal,
  resolvePriceTiers
} from "../utils/equipmentPricing";

interface CartItemCardProps {
  item: CheckoutItem;
  onRemove: () => void;
}

export default function CartItemCard({ item, onRemove }: CartItemCardProps) {
  const { t } = useTranslation();
  const dates = `${formatDateEU(item.startDate) ?? item.startDate} -> ${formatDateEU(item.endDate) ?? item.endDate}`;
  const currency = item.currency ?? "PLN";
  const totalDays = countRentalDays(item.startDate, item.endDate);
  const tiers = resolvePriceTiers(item.priceTiers, item.pricePerDay);
  const pricePerDay = tiers ? getDailyRate(tiers, totalDays) : Number(item.pricePerDay ?? 0);
  const totalPrice = tiers ? getLineTotal(tiers, totalDays) : pricePerDay * totalDays;
  const priceLabel = t("cart.price_with_total", {
    pricePerDay,
    currency,
    days: totalDays,
    totalPrice
  });

  return (
    <ProductCard
      image={item.modelImage || "/images/logo_white.jpg"}
      imageAlt={item.unitCode}
      overline={item.modelTitle}
      title={item.unitCode}
      description={dates}
      priceLabel={priceLabel}
      viewTo={`/equipment/${item.modelId}?startDate=${encodeURIComponent(item.startDate)}&endDate=${encodeURIComponent(item.endDate)}`}
      onRemove={onRemove}
    />
  );
}
