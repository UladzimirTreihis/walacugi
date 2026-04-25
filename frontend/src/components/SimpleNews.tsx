import React from "react";
import { Card, CardMedia, CardContent, Button, Box, Stack } from "@mui/material";
import { Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import { useSelector, useDispatch } from "react-redux";
import { deleteNews } from "../store/newsSlice";
import type { RootState } from "../store/store";
import type { NewsItem } from "../types";
import formatDateEU from "../utils/formatDateEU";
import ClampedTitle from "./shared/ClampedTitle";
import PinnedChip from "./shared/chips/PinnedChip";
import LocationPinChip from "./shared/chips/LocationPinChip";
import CountryFlagChip from "./shared/chips/CountryFlagChip";
import CalendarDateChip from "./shared/chips/CalendarDateChip";
import { useTranslation } from "react-i18next";
import { addLangToPath } from "../utils/langUrl";

export default function SimpleNews({ data }: { data: NewsItem }) {
  const { i18n } = useTranslation();
  const { _id, images, title } = data;
  const adminToken = useSelector((state: RootState) => state.auth.token); 
  const isAdmin = !!adminToken
  const { del } = useApi();
  const dispatch = useDispatch();

  const handleDeleteNews = async (newsId: string) => {
    if (!window.confirm("Are you sure you want to delete this news?")) return;

    const response = await del(`/news/${newsId}`, {
      "x-admin-token": adminToken ?? ""
    });

    if (response) {
      dispatch(deleteNews(newsId));
    }
  };
  const datedTag = formatDateEU(data.datedAt);
  const hasOverlayTags =
    !!data.location || (data.countries && data.countries.length > 0) || !!datedTag;

  return (
    <Card
      component={Link}
      to={addLangToPath(`/news/${_id}`, i18n.language)}
      sx={{
        textDecoration: "none",
        borderRadius: 2, 
        boxShadow: 2, 
        display: "flex",
        flexDirection: "column",
        // Fixed, stable height (matches the "event card" feel)
        height: 420,
        overflow: "hidden",
        transition: "box-shadow 0.3s ease, transform 0.2s ease",
        "&:hover": {
          boxShadow: 6,
          transform: "scale(1.02)",
          backgroundColor: "rgba(255, 255, 255, 0.2)"
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          // take all remaining space but allow the content area to stay visible
          flex: "1 1 0px",
          minHeight: 0
        }}
      >
        <CardMedia
          component="img"
          image={images?.[0] || "/images/logo_white.jpg"}
          alt={title}
          sx={{
            height: "100%",
            width: "100%",
            objectFit: "cover"
          }}
        />
        {data.pinned && (
          <Box sx={{ position: "absolute", top: 12, right: 12, zIndex: 3 }}>
            <PinnedChip />
          </Box>
        )}
        {hasOverlayTags && (
          <Box sx={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 2 }}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ justifyContent: "center" }}>
              {data.location && <LocationPinChip location={data.location} />}
              {data.countries?.map((code) => (
                <CountryFlagChip key={code} code={code} />
              ))}
              {datedTag && <CalendarDateChip datedLabel={datedTag} />}
            </Stack>
          </Box>
        )}
      </Box>
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          // lock a consistent title area (2 lines) like EventShort
          pt: 1.5,
          pb: 2,
          flexShrink: 0
        }}
      >
        <ClampedTitle text={title} lines={2} />
        {isAdmin && (
          <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
            <Button
              variant="outlined"
              color="primary"
              component={Link}
              to={addLangToPath(`/admin/news/edit/${data._id}`, i18n.language)}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleDeleteNews(data._id);
              }}
            >
              Delete
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
