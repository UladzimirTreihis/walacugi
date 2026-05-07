import React from "react";
import { Card, CardMedia, CardContent, Box } from "@mui/material";
import { Link } from "react-router-dom";
import useApi from "../../hooks/useApi";
import { useSelector, useDispatch } from "react-redux";
import { deleteNews } from "../../store/newsSlice";
import type { RootState } from "../../store/store";
import type { NewsItem } from "../../types";
import formatDateEU from "../../utils/formatDateEU";
import ClampedTitle from "../shared/ClampedTitle";
import PinnedChip from "../shared/chips/PinnedChip";
import { useTranslation } from "react-i18next";
import { addLangToPath } from "../../utils/langUrl";
import NewsOverlayTags from "../shared/news/NewsOverlayTags";
import NewsAdminActions from "../shared/news/NewsAdminActions";

export default function SimpleNews({ data }: { data: NewsItem }) {
  const { i18n } = useTranslation();
  const { _id, images, title } = data;
  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);
  const { del } = useApi();
  const dispatch = useDispatch();

  const handleDeleteNews = async (newsId: string) => {
    if (!window.confirm("Are you sure you want to delete this news?")) return;

    const response = await del(`/news/${newsId}`);

    if (response) {
      dispatch(deleteNews(newsId));
    }
  };
  const datedTag = formatDateEU(data.datedAt);

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
        <NewsOverlayTags location={data.location} countries={data.countries} datedTag={datedTag} />
      </Box>
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          pt: 1.5,
          pb: 2,
          flexShrink: 0
        }}
      >
        <ClampedTitle text={title} lines={2} />
        {isAdmin && (
          <NewsAdminActions
            newsId={data._id}
            lang={i18n.language}
            compact
            onDelete={() => handleDeleteNews(data._id)}
          />
        )}
      </CardContent>
    </Card>
  );
}
