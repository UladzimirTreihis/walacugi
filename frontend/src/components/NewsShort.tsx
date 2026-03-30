import React from "react";
import { Card, CardMedia, CardContent, Typography, Button, Box, Chip, Stack } from "@mui/material";
import { Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import { useSelector, useDispatch } from "react-redux";
import { deleteNews } from "../store/newsSlice";
import getExcerpt from "../utils/getExcerpt";
import type { RootState } from "../store/store";
import type { NewsItem } from "../types";
import formatDateEU from "../utils/formatDateEU";
import { COUNTRY_BY_CODE, getFlagEmoji } from "../constants/countries";

export default function NewsShort({ data }: { data: NewsItem }) {
  const { _id, images, title, description } = data;
  const adminToken = useSelector((state: RootState) => state.auth.token); 
  const isAdmin = !!adminToken;
  const dispatch = useDispatch();

  const { del } = useApi(); 

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
      to={`/news/${_id}`}
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
      {hasOverlayTags && (
        <Box sx={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 2 }}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ justifyContent: "center" }}>
            {data.location && (
              <Chip label={`📍 ${data.location}`} color="primary" variant="outlined" size="small" sx={{ bgcolor: "rgba(255,255,255,0.85)" }} />
            )}
            {data.countries?.map((code) => {
              const meta = COUNTRY_BY_CODE[code];
              const name = meta?.name ?? code.toUpperCase();
              return (
                <Chip
                  key={code}
                  label={`${getFlagEmoji(code)} ${name}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ bgcolor: "rgba(255,255,255,0.85)" }}
                />
              );
            })}
            {datedTag && (
              <Chip label={`🗓️ ${datedTag}`} color="secondary" variant="outlined" size="small" sx={{ bgcolor: "rgba(255,255,255,0.85)" }} />
            )}
          </Stack>
        </Box>
      )}
    </Box>
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography variant="body2" sx={{ flexGrow: 1}}>
          {getExcerpt(description)}
          {isAdmin && (
            <>
              <Button
                variant="outlined"
                color="primary"
                component={Link}
                to={`/admin/news/edit/${data._id}`}
                sx={{ mt: 1 }}
              >
                Edit
              </Button>
              <Button
              variant="outlined"
              color="error"
              sx={{ mt: 1, ml: 2 }}
              onClick={() => handleDeleteNews(data._id)}
              >
              Delete
            </Button>
          </>
          )}
        </Typography>
      </CardContent>
    </Card>
  );
}
