import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import TelegramIcon from "@mui/icons-material/Telegram";
import EmailIcon from "@mui/icons-material/Email";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import { useDispatch, useSelector } from "react-redux";
import { clearCheckout, hydrateCheckout, removeFromCheckout } from "../store/checkoutSlice";
import type { CheckoutItem } from "../types";
import type { AppDispatch, RootState } from "../store/store";
import useApi from "../hooks/useApi";
import type { UiFeedback } from "../utils/feedback";
import CartItemCard from "./CartItemCard";
import { useTranslation } from "react-i18next";

function encodeCart(items: CheckoutItem[]): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, items }))));
}

function decodeCart(raw: string): CheckoutItem[] {
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(raw))));
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.items)) return [];
    return parsed.items as CheckoutItem[];
  } catch {
    return [];
  }
}

export default function Cart() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { post, loading } = useApi();
  const items = useSelector((state: RootState) => state.checkout.items);
  const adminToken = useSelector((state: RootState) => state.auth.token);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cartFeedback, setCartFeedback] = useState<UiFeedback | null>(null);
  const [cartLinkInput, setCartLinkInput] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("cart") ?? params.get("checkout");
    if (!raw) return;
    const parsed = decodeCart(raw);
    if (parsed.length > 0) {
      dispatch(hydrateCheckout(parsed));
    }
  }, [dispatch]);

  const shareUrl = useMemo(() => {
    const payload = encodeCart(items);
    return `${window.location.origin}/cart?cart=${encodeURIComponent(payload)}`;
  }, [items]);

  const copyShare = async () => {
    await navigator.clipboard.writeText(shareUrl);
  };

  const shareOnTelegram = () => {
    const text = t("cart.share_message");
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, "_blank", "noopener,noreferrer");
  };

  const shareViaEmail = () => {
    const subject = t("cart.email_subject");
    const body = `${t("cart.share_message")}\n\n${shareUrl}`;
    const mailto = `mailto:poznajswiatbialystok@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  const checkCartLink = () => {
    if (!cartLinkInput.trim()) return;
    let encoded = "";
    try {
      const maybeUrl = new URL(cartLinkInput.trim());
      encoded = maybeUrl.searchParams.get("cart") ?? maybeUrl.searchParams.get("checkout") ?? "";
    } catch {
      encoded = cartLinkInput.trim();
    }
    if (!encoded) {
      setCartFeedback({ severity: "error", message: t("cart.link_not_found") });
      return;
    }
    const parsed = decodeCart(decodeURIComponent(encoded));
    if (parsed.length === 0) {
      setCartFeedback({ severity: "error", message: t("cart.link_invalid") });
      return;
    }
    dispatch(hydrateCheckout(parsed));
    setCartFeedback({ severity: "success", message: t("cart.link_loaded") });
  };

  const handleConfirm = async () => {
    setCartFeedback(null);
    const checkoutRef = `checkout-${Date.now()}`;
    const response = await post<{ results: Array<{ unitId: string; ok: boolean; reason?: string }> }>("/equipment/confirm-booking", {
      checkoutRef,
      items
    });
    if (!response) {
      setCartFeedback({
        severity: "error",
        message: t("cart.confirm_request_failed")
      });
      setConfirmOpen(false);
      return;
    }
    const failed = response.results.filter((r) => !r.ok);
    if (failed.length === 0) {
      setCartFeedback({
        severity: "success",
        message: t("cart.confirm_success")
      });
      dispatch(clearCheckout());
    } else {
      setCartFeedback({
        severity: "error",
        message: t("cart.confirm_partial_fail", {
          units: failed.map((f) => `${f.unitId}${f.reason ? ` (${f.reason})` : ""}`).join(", ")
        })
      });
    }
    setConfirmOpen(false);
  };

  return (
    <Container sx={{ py: 10 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          {t("cart.check_link")}
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder={t("cart.link_placeholder")}
            value={cartLinkInput}
            onChange={(e) => setCartLinkInput(e.target.value)}
          />
          <Button variant="outlined" onClick={checkCartLink} sx={{ whiteSpace: "nowrap", minWidth: 150 }}>
            {t("cart.see_saved")}
          </Button>
        </Stack>
      </Box>

      <Typography variant="h4" sx={{ mb: 2 }}>{t("cart.title")}</Typography>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t("cart.note")}
        </Typography>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <Tooltip title={t("cart.copy_share")}>
            <span>
              <IconButton onClick={copyShare} disabled={items.length === 0} aria-label={t("cart.copy_share")}>
                <LinkIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={t("cart.share_telegram")}>
            <span>
              <IconButton onClick={shareOnTelegram} disabled={items.length === 0} aria-label={t("cart.share_telegram")}>
                <TelegramIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={t("cart.share_email")}>
            <span>
              <IconButton onClick={shareViaEmail} disabled={items.length === 0} aria-label={t("cart.share_email")}>
                <EmailIcon />
              </IconButton>
            </span>
          </Tooltip>
          {adminToken && (
            <Tooltip title={t("cart.confirm_admin")}>
              <span>
                <IconButton
                  color="success"
                  onClick={() => setConfirmOpen(true)}
                  disabled={items.length === 0}
                  aria-label={t("cart.confirm_admin")}
                >
                  <TaskAltIcon />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      </Box>

      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid key={`${item.unitId}-${item.startDate}-${item.endDate}`} size={{ xs: 12, md: 4 }}>
            <CartItemCard
              item={item}
              onRemove={() => dispatch(removeFromCheckout({ unitId: item.unitId, startDate: item.startDate, endDate: item.endDate }))}
            />
          </Grid>
        ))}
      </Grid>
      {items.length === 0 && (
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Typography color="text.secondary">{t("cart.empty")}</Typography>
        </Box>
      )}

      {cartFeedback && (
        <Alert severity={cartFeedback.severity} sx={{ mt: 2 }}>
          {cartFeedback.message}
        </Alert>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t("cart.confirm_dialog_title")}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            {t("cart.confirm_dialog_body", { count: items.length })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("cart.confirm_dialog_note")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t("common.cancel")}</Button>
          <Button onClick={handleConfirm} variant="contained" color="success" disabled={loading}>
            {t("common.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
