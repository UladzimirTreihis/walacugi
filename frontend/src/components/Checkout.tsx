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
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { clearCheckout, hydrateCheckout, removeFromCheckout } from "../store/checkoutSlice";
import type { CheckoutItem } from "../types";
import type { AppDispatch, RootState } from "../store/store";
import useApi from "../hooks/useApi";
import formatDateEU from "../utils/formatDateEU";
import type { UiFeedback } from "../utils/feedback";

function encodeCheckout(items: CheckoutItem[]): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, items }))));
}

function decodeCheckout(raw: string): CheckoutItem[] {
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(raw))));
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.items)) return [];
    return parsed.items as CheckoutItem[];
  } catch {
    return [];
  }
}

export default function Checkout() {
  const dispatch = useDispatch<AppDispatch>();
  const { post, loading } = useApi();
  const items = useSelector((state: RootState) => state.checkout.items);
  const adminToken = useSelector((state: RootState) => state.auth.token);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmFeedback, setConfirmFeedback] = useState<UiFeedback | null>(null);
  const [checkoutLinkInput, setCheckoutLinkInput] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("checkout");
    if (!raw) return;
    const parsed = decodeCheckout(raw);
    if (parsed.length > 0) {
      dispatch(hydrateCheckout(parsed));
    }
  }, [dispatch]);

  const shareUrl = useMemo(() => {
    const payload = encodeCheckout(items);
    return `${window.location.origin}/checkout?checkout=${encodeURIComponent(payload)}`;
  }, [items]);

  const copyShare = async () => {
    await navigator.clipboard.writeText(shareUrl);
  };

  const checkCheckoutLink = () => {
    if (!checkoutLinkInput.trim()) return;
    let encoded = "";
    try {
      const maybeUrl = new URL(checkoutLinkInput.trim());
      encoded = maybeUrl.searchParams.get("checkout") ?? "";
    } catch {
      encoded = checkoutLinkInput.trim();
    }
    if (!encoded) {
      setConfirmFeedback({ severity: "error", message: "Could not find a valid checkout payload in the provided link." });
      return;
    }
    const parsed = decodeCheckout(decodeURIComponent(encoded));
    if (parsed.length === 0) {
      setConfirmFeedback({ severity: "error", message: "This checkout link is invalid or empty." });
      return;
    }
    dispatch(hydrateCheckout(parsed));
    setConfirmFeedback({ severity: "success", message: "Checkout link parsed successfully." });
  };

  const handleConfirm = async () => {
    setConfirmFeedback(null);
    const checkoutRef = `checkout-${Date.now()}`;
    const response = await post<{ results: Array<{ unitId: string; ok: boolean; reason?: string }> }>("/equipment/confirm-booking", {
      checkoutRef,
      items
    });
    if (!response) {
      setConfirmFeedback({
        severity: "error",
        message: "We could not confirm this booking right now. Please try again in a moment."
      });
      setConfirmOpen(false);
      return;
    }
    const failed = response.results.filter((r) => !r.ok);
    if (failed.length === 0) {
      setConfirmFeedback({
        severity: "success",
        message: "Booking confirmed successfully for all selected units."
      });
      dispatch(clearCheckout());
    } else {
      setConfirmFeedback({
        severity: "error",
        message: `Some units are no longer available: ${failed.map((f) => `${f.unitId}${f.reason ? ` (${f.reason})` : ""}`).join(", ")}`
      });
    }
    setConfirmOpen(false);
  };

  return (
    <Container sx={{ py: 8 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Checkout</Typography>
      <Stack spacing={1}>
        {items.map((item) => (
          <Box key={`${item.unitId}-${item.startDate}-${item.endDate}`} sx={{ border: "1px solid #ddd", p: 1.5, borderRadius: 1 }}>
            <Typography variant="subtitle1">{item.modelTitle} • {item.unitCode}</Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDateEU(item.startDate) ?? item.startDate} → {formatDateEU(item.endDate) ?? item.endDate}
            </Typography>
            <Button
              size="small"
              color="error"
              onClick={() => dispatch(removeFromCheckout({ unitId: item.unitId, startDate: item.startDate, endDate: item.endDate }))}
            >
              Remove
            </Button>
          </Box>
        ))}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button variant="outlined" onClick={copyShare} disabled={items.length === 0}>
          Copy share link
        </Button>
        <Button variant="outlined" onClick={() => dispatch(clearCheckout())} disabled={items.length === 0}>
          Clear
        </Button>
        {adminToken && (
          <Button variant="contained" color="success" onClick={() => setConfirmOpen(true)} disabled={items.length === 0}>
            Confirm booking (admin)
          </Button>
        )}
      </Stack>
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          Check my checkout link
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder="Paste checkout URL or encoded checkout payload"
            value={checkoutLinkInput}
            onChange={(e) => setCheckoutLinkInput(e.target.value)}
          />
          <Button variant="outlined" onClick={checkCheckoutLink}>
            Parse Link
          </Button>
        </Stack>
      </Box>

      {confirmFeedback && (
        <Alert severity={confirmFeedback.severity} sx={{ mt: 2 }}>
          {confirmFeedback.message}
        </Alert>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Confirm booking</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            You are about to confirm {items.length} unit bookings.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overlap and availability checks will run on submit.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirm} variant="contained" color="success" disabled={loading}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
