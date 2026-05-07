import React from "react";
import { Card, CardMedia, CardContent, Typography, Box, Chip } from "@mui/material";
import { Link } from "react-router-dom";
import useApi from "../../hooks/useApi";
import { useSelector, useDispatch } from "react-redux";
import { deleteNews } from "../../store/newsSlice";
import getExcerpt from "../../utils/getExcerpt";
import type { RootState } from "../../store/store";
import type { NewsItem } from "../../types";
import formatDateEU from "../../utils/formatDateEU";
import { useTranslation } from "react-i18next";
import { addLangToPath } from "../../utils/langUrl";
import NewsOverlayTags from "../shared/news/NewsOverlayTags";
import NewsAdminActions from "../shared/news/NewsAdminActions";

export default function NewsShort({ data }: { data: NewsItem }) {
  const { i18n } = useTranslation();
  const { _id, images, title, description } = data;
  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);
  const dispatch = useDispatch();

  const { del } = useApi();

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
        display: "block",
        overflow: "hidden",
        transition: "box-shadow 0.3s ease, transform 0.2s ease",
        "&:hover": {
          boxShadow: 6,
          transform: "scale(1.02)",
          backgroundColor: "rgba(255, 255, 255, 0.2)"
        },
      }}
    >
      <Box sx={{ position: "relative" }}>
        <CardMedia component="img" image={images[0]} alt={title} sx={{ height: 300, objectFit: "cover" }} />
        {data.pinned && (
          <Box sx={{ position: "absolute", top: 12, right: 12, zIndex: 3 }}>
            <Chip
              label="📌 Pinned"
              color="warning"
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,0.92)", fontWeight: 700 }}
            />
          </Box>
        )}
        <NewsOverlayTags location={data.location} countries={data.countries} datedTag={datedTag} />
      </Box>
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography variant="body2" sx={{ flexGrow: 1}}>
          {getExcerpt(description)}
          {isAdmin && (
            <NewsAdminActions
              newsId={data._id}
              lang={i18n.language}
              onDelete={() => handleDeleteNews(data._id)}
            />
          )}
        </Typography>
      </CardContent>
    </Card>
  );
}
