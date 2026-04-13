import React from "react";
import { useTranslation } from "react-i18next";
import type { CheckoutItem } from "../types";
import formatDateEU from "../utils/formatDateEU";
import ProductCard from "./shared/ProductCard";

interface CartItemCardProps {
  item: CheckoutItem;
  onRemove: () => void;
}

export default function CartItemCard({ item, onRemove }: CartItemCardProps) {
  const { t } = useTranslation();
  const dates = `${formatDateEU(item.startDate) ?? item.startDate} -> ${formatDateEU(item.endDate) ?? item.endDate}`;
  const currency = item.currency ?? "EUR";
  const pricePerDay = Number(item.pricePerDay ?? 0);
  const totalDays = Math.max(
    1,
    Math.floor((new Date(`${item.endDate}T00:00:00Z`).getTime() - new Date(`${item.startDate}T00:00:00Z`).getTime()) / 86400000)
  );
  const totalPrice = pricePerDay * totalDays;
  const priceLabel = t("cart.price_with_total", {
    pricePerDay,
    currency,
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
